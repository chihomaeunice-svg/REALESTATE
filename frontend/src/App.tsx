import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { WishlistProvider } from "./lib/wishlist-context";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Home } from "./pages/Home";
import { Listings } from "./pages/Listings";
import { ListingDetail } from "./pages/ListingDetail";
import { Wishlist } from "./pages/Wishlist";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

import { LandlordLayout } from "./pages/landlord/LandlordLayout";
import { Overview } from "./pages/landlord/Overview";
import { Properties } from "./pages/landlord/Properties";
import { Tenants } from "./pages/landlord/Tenants";
import { Leases } from "./pages/landlord/Leases";
import { LeaseDetail as LandlordLeaseDetail } from "./pages/landlord/LeaseDetail";
import { Reports } from "./pages/landlord/Reports";
import { Subscription } from "./pages/landlord/Subscription";

import { TenantPortal } from "./pages/tenant/TenantPortal";
import { TenantProfile } from "./pages/tenant/Profile";
import { AdminVerification } from "./pages/admin/AdminVerification";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
        <div className="flex min-h-screen flex-col bg-ink-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/landlord"
                element={
                  <ProtectedRoute roles={["landlord", "agent"]}>
                    <LandlordLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="properties" element={<Properties />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="leases" element={<Leases />} />
                <Route path="leases/:id" element={<LandlordLeaseDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>

              <Route
                path="/tenant"
                element={
                  <ProtectedRoute roles={["tenant"]}>
                    <TenantPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenant/profile"
                element={
                  <ProtectedRoute roles={["tenant"]}>
                    <TenantProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminVerification />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
