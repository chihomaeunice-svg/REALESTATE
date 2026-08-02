import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useWishlist } from "../lib/wishlist-context";
import { THEME } from "../lib/theme";

const VARIANT = {
  meridian: {
    header: "sticky top-0 z-40 border-b border-ink-100/60 bg-white/80 backdrop-blur-xl",
    bar: "mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6",
    logoBadge: "flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm",
    logoText: "font-display text-lg font-semibold text-ink-900",
    link: "rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900",
  },
  terracotta: {
    header: "border-b border-ink-100 bg-white",
    bar: "mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3 sm:px-6",
    logoBadge: "flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] bg-brand-600 text-sm font-bold text-white",
    logoText: "font-display text-xl italic font-semibold text-ink-900",
    link: "px-3 py-1.5 text-sm font-medium text-ink-600 underline decoration-transparent decoration-2 underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500",
  },
  coastal: {
    header: "sticky top-0 z-40 bg-transparent px-3 pt-3 sm:px-6",
    bar: "mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full bg-white/90 px-5 shadow-[var(--shadow-card)] ring-1 ring-brand-100 backdrop-blur-xl",
    logoBadge: "flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white",
    logoText: "font-display text-base font-semibold text-ink-900",
    link: "rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-brand-50 hover:text-brand-700",
  },
  forest: {
    header: "border-b-2 border-brand-800/15 bg-brand-50/60",
    bar: "mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6",
    logoBadge: "flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] bg-brand-700 text-sm font-bold text-white",
    logoText: "font-display text-lg font-semibold text-brand-900",
    link: "border-l border-brand-800/10 px-3 py-2 text-sm font-medium text-brand-800/80 transition first:border-l-0 hover:text-brand-900",
  },
  monochrome: {
    header: "border-b border-ink-900 bg-white",
    bar: "mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6",
    logoBadge: "hidden",
    logoText: "font-display text-base font-bold uppercase tracking-[0.2em] text-ink-950",
    link: "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-700 transition hover:text-ink-950",
  },
}[THEME];

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

  const logo = (
    <Link to="/" className="flex items-center gap-2.5">
      {VARIANT.logoBadge !== "hidden" && <span className={VARIANT.logoBadge}>NY</span>}
      <span className={VARIANT.logoText}>Nyumba Yangu</span>
    </Link>
  );

  const links = (
    <>
      <Link to="/listings" className={VARIANT.link}>
        Browse
      </Link>
      <Link to="/wishlist" className={`relative flex items-center gap-1.5 ${VARIANT.link}`}>
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
          <Link to={dashboardPath} className={VARIANT.link}>
            Dashboard
          </Link>
          <button onClick={handleLogout} className="ml-2 btn-secondary !px-3.5 !py-1.5 !text-xs">
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className={VARIANT.link}>
            Sign in
          </Link>
          <Link to="/register" className="ml-1 btn-primary !px-4 !py-2 !text-xs">
            Get started
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className={VARIANT.header}>
      <div className={VARIANT.bar}>
        {logo}
        <nav className="hidden items-center gap-1 md:flex">{links}</nav>
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
