import { Link, useNavigate } from "react-router-dom";
import { Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-brand-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Home className="h-5 w-5" />
          </span>
          Nyumba Yangu
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 md:flex">
          <Link to="/listings" className="hover:text-brand-700">Browse listings</Link>
          {user ? (
            <>
              <Link to={dashboardPath} className="hover:text-brand-700">Dashboard</Link>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-700">Log in</Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">List your property</Link>
            </>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-ink-600">
            <Link to="/listings" onClick={() => setOpen(false)}>Browse listings</Link>
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)}>Dashboard</Link>
                <button className="text-left" onClick={() => { setOpen(false); handleLogout(); }}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)}>List your property</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
