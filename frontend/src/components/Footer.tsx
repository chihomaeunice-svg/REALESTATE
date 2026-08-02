import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                NY
              </span>
              <span className="font-display text-base font-semibold text-ink-900">
                Nyumba Yangu
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              A rental marketplace and property management platform for Dar es Salaam.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-semibold text-ink-700">Platform</p>
              <div className="mt-3 flex flex-col gap-2 text-ink-500">
                <Link to="/listings" className="hover:text-ink-700">Browse listings</Link>
                <Link to="/register" className="hover:text-ink-700">List a property</Link>
                <Link to="/login" className="hover:text-ink-700">Sign in</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-ink-700">Landlords</p>
              <div className="mt-3 flex flex-col gap-2 text-ink-500">
                <Link to="/landlord" className="hover:text-ink-700">Dashboard</Link>
                <Link to="/landlord/properties" className="hover:text-ink-700">Properties</Link>
                <Link to="/landlord/leases" className="hover:text-ink-700">Leases</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-400">
          Nyumba Yangu &middot; Dar es Salaam, Tanzania
        </div>
      </div>
    </footer>
  );
}
