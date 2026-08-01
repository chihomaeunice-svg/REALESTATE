package models

import "time"

type User struct {
	ID                 string    `json:"id"`
	Email              *string   `json:"email,omitempty"`
	Phone              string    `json:"phone"`
	PasswordHash       string    `json:"-"`
	FullName           string    `json:"full_name"`
	Role               string    `json:"role"`
	NidaNumber         *string   `json:"nida_number,omitempty"`
	BusinessLicense    *string   `json:"business_license,omitempty"`
	Verification       string    `json:"verification"`
	VerificationNote   *string   `json:"verification_note,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type Property struct {
	ID           string    `json:"id"`
	OwnerID      string    `json:"owner_id"`
	Title        string    `json:"title"`
	Description  *string   `json:"description,omitempty"`
	PropertyType string    `json:"property_type"`
	District     string    `json:"district"`
	Ward         string    `json:"ward"`
	AddressLine  *string   `json:"address_line,omitempty"`
	City         string    `json:"city"`
	Latitude     *float64  `json:"latitude,omitempty"`
	Longitude    *float64  `json:"longitude,omitempty"`
	LandSizeAcres *float64 `json:"land_size_acres,omitempty"`
	TitleDeedStatus *string `json:"title_deed_status,omitempty"`
	Verification string    `json:"verification"`
	CreatedAt    time.Time `json:"created_at"`
}

type Unit struct {
	ID         string    `json:"id"`
	PropertyID string    `json:"property_id"`
	UnitLabel  string    `json:"unit_label"`
	Bedrooms   int       `json:"bedrooms"`
	Bathrooms  int       `json:"bathrooms"`
	SizeSqm    *float64  `json:"size_sqm,omitempty"`
	RentAmount float64   `json:"rent_amount"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Listing struct {
	ID          string    `json:"id"`
	PropertyID  string    `json:"property_id"`
	UnitID      *string   `json:"unit_id,omitempty"`
	Purpose     string    `json:"purpose"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Price       float64   `json:"price"`
	PricePeriod string    `json:"price_period"`
	Status      string    `json:"status"`
	ContactPhone        string `json:"contact_phone"`
	AcceptsMonthlyRent  bool   `json:"accepts_monthly_rent"`
	ViewCount           int    `json:"view_count"`
	CreatedAt           time.Time `json:"created_at"`

	// Joined fields for API responses
	District     string   `json:"district,omitempty"`
	Ward         string   `json:"ward,omitempty"`
	City         string   `json:"city,omitempty"`
	PropertyType string   `json:"property_type,omitempty"`
	Verification string   `json:"verification,omitempty"`
	Images       []string `json:"images,omitempty"`
	Bedrooms     int      `json:"bedrooms"`
	Bathrooms    int      `json:"bathrooms"`
	LandSizeAcres   *float64 `json:"land_size_acres,omitempty"`
	TitleDeedStatus *string  `json:"title_deed_status,omitempty"`
}

type Favorite struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ListingID string    `json:"listing_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Inquiry struct {
	ID          string    `json:"id"`
	ListingID   string    `json:"listing_id"`
	SeekerName  string    `json:"seeker_name"`
	SeekerPhone string    `json:"seeker_phone"`
	Message     *string   `json:"message,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type Tenant struct {
	ID               string    `json:"id"`
	UserID           *string   `json:"user_id,omitempty"`
	FullName         string    `json:"full_name"`
	Phone            string    `json:"phone"`
	Email            *string   `json:"email,omitempty"`
	NidaNumber       *string   `json:"nida_number,omitempty"`
	EmergencyContact *string   `json:"emergency_contact,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

type Lease struct {
	ID                  string     `json:"id"`
	UnitID              string     `json:"unit_id"`
	TenantID            string     `json:"tenant_id"`
	LandlordID          string     `json:"landlord_id"`
	Language            string     `json:"language"`
	StartDate           time.Time  `json:"start_date"`
	EndDate             time.Time  `json:"end_date"`
	RentAmount          float64    `json:"rent_amount"`
	AdvanceMonths       int        `json:"advance_months"`
	DepositAmount       float64    `json:"deposit_amount"`
	Status              string     `json:"status"`
	TenantSignatureName *string    `json:"tenant_signature_name,omitempty"`
	TenantSignedAt      *time.Time `json:"tenant_signed_at,omitempty"`
	TenantSignatureIP   *string    `json:"tenant_signature_ip,omitempty"`
	LandlordSignedAt    *time.Time `json:"landlord_signed_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

type PaymentSchedule struct {
	ID          string    `json:"id"`
	LeaseID     string    `json:"lease_id"`
	PeriodStart time.Time `json:"period_start"`
	PeriodEnd   time.Time `json:"period_end"`
	AmountDue   float64   `json:"amount_due"`
	DueDate     time.Time `json:"due_date"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type Payment struct {
	ID           string     `json:"id"`
	LeaseID      string     `json:"lease_id"`
	ScheduleID   *string    `json:"schedule_id,omitempty"`
	Amount       float64    `json:"amount"`
	Method       string     `json:"method"`
	MpesaReceipt *string    `json:"mpesa_receipt,omitempty"`
	PhoneNumber  *string    `json:"phone_number,omitempty"`
	Status       string     `json:"status"`
	PaidAt       *time.Time `json:"paid_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Subscription struct {
	ID         string    `json:"id"`
	LandlordID string    `json:"landlord_id"`
	Tier       string    `json:"tier"`
	UnitCount  int       `json:"unit_count"`
	PriceTZS   float64   `json:"price_tzs"`
	CreatedAt  time.Time `json:"created_at"`
}
