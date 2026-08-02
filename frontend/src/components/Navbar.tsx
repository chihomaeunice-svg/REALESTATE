import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useWishlist } from "../lib/wishlist-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const { ids } = useWishlist();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const dashboardPath =
    user?.role === "landlord" || user?.role === "agent"
      ? "/landlord"
      : user?.role === "tenant"
      ? "/tenant"
      : user?.role === "admin"
      ? "/admin"
      : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
            NY
          </span>
          <span className="font-display text-lg font-semibold text-ink-900">
            Nyumba Yangu
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/listings"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
          >
            Browse
          </Link>
          <Link
            to="/wishlist"
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
          >
            <Heart className="h-4 w-4" />
            Saved
            {ids.size > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {ids.size}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                Dashboard
              </Link>
              <div className="ml-2 h-6 w-px bg-ink-200" />
              <button onClick={handleLogout} className="ml-2 btn-secondary !px-3.5 !py-1.5 !text-xs">
                Log out
              </button>
            </>
          ) : (
            <>
              <div className="ml-2 h-6 w-px bg-ink-200" />
              <Link
                to="/login"
                className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
              >
                Sign in
              </Link>
              <Link to="/register" className="ml-1 btn-primary !px-4 !py-2 !text-xs">
                Get started
              </Link>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6 text-ink-700" /> : <Menu className="h-6 w-6 text-ink-700" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            <MobileLink to="/listings" onClick={() => setOpen(false)}>Browse</MobileLink>
            <MobileLink to="/wishlist" onClick={() => setOpen(false)}>
              Saved {ids.size > 0 && `(${ids.size})`}
            </MobileLink>
            {user ? (
              <>
                <MobileLink to={dashboardPath} onClick={() => setOpen(false)}>Dashboard</MobileLink>
                <button
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-600 hover:bg-ink-50"
                  onClick={() => { setOpen(false); handleLogout(); }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" onClick={() => setOpen(false)}>Sign in</MobileLink>
                <MobileLink to="/register" onClick={() => setOpen(false)}>Get started</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
    >
      {children}
    </Link>
  );
}
