import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, Users, FileSignature, BarChart3, CreditCard } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { VerifiedBadge } from "../../components/VerifiedBadge";

const NAV = [
  { to: "/landlord", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/landlord/properties", label: "Properties & units", icon: Building2 },
  { to: "/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/landlord/leases", label: "Leases & rent", icon: FileSignature },
  { to: "/landlord/reports", label: "Reports & arrears", icon: BarChart3 },
  { to: "/landlord/subscription", label: "Subscription", icon: CreditCard },
];

export function LandlordLayout() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="card mb-4 p-4">
          <p className="truncate text-sm font-semibold text-ink-900">{user?.full_name}</p>
          <div className="mt-2">{user && <VerifiedBadge status={user.verification} />}</div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-[var(--color-surface)] hover:text-ink-900"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
