package internal

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"realestate-backend/internal/email"
	"realestate-backend/internal/handlers"
	"realestate-backend/internal/httpx"
	appmw "realestate-backend/internal/middleware"
)

func NewRouter(db *pgxpool.Pool, jwtSecret, resendAPIKey string) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	var emailClient *email.Client
	if resendAPIKey != "" {
		emailClient = email.NewClient(resendAPIKey)
	}

	authH := &handlers.AuthHandler{DB: db, JWTSecret: jwtSecret, Email: emailClient}
	propH := &handlers.PropertyHandler{DB: db}
	listH := &handlers.ListingHandler{DB: db}
	uploadH := &handlers.UploadHandler{}
	tenantH := &handlers.TenantHandler{DB: db}
	leaseH := &handlers.LeaseHandler{DB: db}
	payH := &handlers.PaymentHandler{DB: db}
	reportH := &handlers.ReportHandler{DB: db}
	adminH := &handlers.AdminHandler{DB: db}
	subH := &handlers.SubscriptionHandler{DB: db}
	favH := &handlers.FavoriteHandler{DB: db}
	maintH := &handlers.MaintenanceHandler{DB: db}

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Serve uploaded files from the local ./uploads directory.
	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads")))
	r.Get("/uploads/*", func(w http.ResponseWriter, r *http.Request) {
		fileServer.ServeHTTP(w, r)
	})

	r.Route("/api", func(r chi.Router) {
		// --- Public: auth ---
		r.Post("/auth/register", authH.Register)
		r.Post("/auth/login", authH.Login)
		r.Post("/auth/otp/send", authH.SendOTP)
		r.Post("/auth/otp/verify", authH.VerifyOTP)

		// --- Public: Layer 1 marketplace ---
		r.Get("/listings", listH.Browse)
		r.Get("/listings/{id}", listH.Get)
		r.Post("/listings/{id}/inquiries", listH.CreateInquiry)
		r.Get("/properties/{id}", propH.Get)

		// --- Authenticated ---
		r.Group(func(r chi.Router) {
			r.Use(appmw.Auth(jwtSecret))

			r.Get("/me", func(w http.ResponseWriter, r *http.Request) {
				authH.Me(w, r, appmw.UserID(r))
			})

			// Landlord + agent: Layer 1 listing management
			r.Group(func(r chi.Router) {
				r.Use(appmw.RequireRole("landlord", "agent"))
				r.Post("/properties", propH.Create)
				r.Get("/properties", propH.ListMine)
				r.Post("/properties/{id}/units", propH.CreateUnit)
				r.Get("/properties/{id}/units", propH.ListUnits)
				r.Get("/units", propH.ListAllUnitsForLandlord)
				r.Post("/listings", listH.Create)
				r.Post("/uploads", uploadH.Upload)
				r.Get("/inquiries", listH.ListInquiriesForLandlord)

				// Layer 2: management suite
				r.Get("/tenants", tenantH.ListForLandlord)
				r.Get("/tenants/lookup", tenantH.LookupByPhone)
				r.Post("/leases", leaseH.Create)
				r.Get("/leases", leaseH.ListForLandlord)
				r.Post("/payments/manual", payH.LogManual)
				r.Get("/arrears", payH.ArrearsForLandlord)
				r.Get("/reports/summary", reportH.Summary)
				r.Get("/reports/by-building", reportH.ByBuilding)
				r.Get("/subscription", subH.GetMine)
				r.Get("/maintenance-requests", maintH.ListForLandlord)
				r.Patch("/maintenance-requests/{id}", maintH.UpdateStatus)
			})

			// Tenant: Layer 3 portal
			r.Group(func(r chi.Router) {
				r.Use(appmw.RequireRole("tenant"))
				r.Get("/tenant/me", tenantH.GetForTenantUser)
				r.Post("/tenant/profile", tenantH.UpsertMyProfile)
				r.Get("/tenant/leases", leaseH.ListForTenant)
				r.Post("/tenant/maintenance-requests", maintH.CreateForTenant)
				r.Get("/tenant/maintenance-requests", maintH.ListForTenant)
			})

			// Shared lease-scoped resources (ownership enforced inside handlers)
			r.Get("/leases/{id}/schedules", payH.ListSchedulesForLease)
			r.Get("/leases/{id}/payments", payH.ListPaymentsForLease)
			r.Get("/leases/{id}/document", leaseH.Document)
			r.Post("/leases/{id}/sign", leaseH.Sign)
			r.Post("/payments/mpesa/stk-push", payH.StkPush)

			// Wishlist/favorites: any authenticated role can save listings
			r.Get("/favorites", favH.List)
			r.Get("/favorites/ids", favH.IDs)
			r.Post("/favorites", favH.Add)
			r.Post("/favorites/sync", favH.Sync)
			r.Delete("/favorites/{listingID}", favH.Remove)

			// Admin: verification queue
			r.Group(func(r chi.Router) {
				r.Use(appmw.RequireRole("admin"))
				r.Get("/admin/pending-users", adminH.PendingUsers)
				r.Get("/admin/pending-properties", adminH.PendingProperties)
				r.Post("/admin/users/{id}/decide", adminH.DecideUser)
				r.Post("/admin/properties/{id}/decide", adminH.DecideProperty)
			})
		})
	})

	return r
}
