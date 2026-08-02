import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ShieldCheck, Wallet, FileText, Smartphone, ArrowRight, MapPin } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";
import { LISTING_GRID_CLASS, THEME } from "../lib/theme";

const HERO_LAYOUT = {
  meridian: "immersive",
  forest: "immersive",
  terracotta: "split",
  coastal: "centered",
  monochrome: "centered",
}[THEME] as "immersive" | "split" | "centered";

const HERO_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80";

const POPULAR = ["Mikocheni", "Msasani", "Upanga", "Kigamboni"];
function districtFor(w: string) {
  return w.includes("Mikocheni") || w.includes("Msasani") ? "Kinondoni" : w.includes("Upanga") ? "Ilala" : "Kigamboni";
}

export function Home() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [featured, setFeatured] = useState<Listing[]>([]);

  useEffect(() => {
    api.get<Listing[]>("/listings").then((data) => setFeatured(data.slice(0, 6)));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (propertyType) params.set("property_type", propertyType);
    navigate(`/listings?${params.toString()}`);
  }

  const searchFields = (
    <>
      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
        className="flex-1 rounded-[var(--radius-btn)] border-0 bg-transparent px-4 py-3 text-sm text-ink-700 focus:outline-none focus:ring-0"
      >
        <option value="">All districts</option>
        {DAR_DISTRICTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <div className="hidden h-8 w-px bg-ink-200 sm:block" />
      <select
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        className="flex-1 rounded-[var(--radius-btn)] border-0 bg-transparent px-4 py-3 text-sm text-ink-700 focus:outline-none focus:ring-0"
      >
        <option value="">Any property type</option>
        {PROPERTY_TYPES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <button type="submit" className="btn-accent rounded-[var(--radius-btn)] px-6 py-3">
        <Search className="h-4 w-4" /> Search
      </button>
    </>
  );

  return (
    <div>
      {HERO_LAYOUT === "immersive" && (
        <section className="relative overflow-hidden bg-brand-950">
          <div className="absolute inset-0">
            <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 to-brand-950/60" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-36">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
              <MapPin className="h-4 w-4" />
              Dar es Salaam
            </div>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Find your next home, verified and ready.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-200/90">
              Browse verified rentals and listings across Dar es Salaam.
              Landlords get leases, M-Pesa collection, and tenant management — all in one place.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-10 flex flex-col gap-3 rounded-[var(--radius-card)] bg-white/95 p-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:flex-row sm:items-center"
            >
              {searchFields}
            </form>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-300/80">
              <span>Popular: </span>
              {POPULAR.map((w) => (
                <Link
                  key={w}
                  to={`/listings?district=${districtFor(w)}`}
                  className="underline decoration-brand-400/40 underline-offset-2 transition hover:text-white hover:decoration-white"
                >
                  {w}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {HERO_LAYOUT === "split" && (
        <section className="bg-brand-50/40">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
                <MapPin className="h-4 w-4" />
                Dar es Salaam
              </div>
              <h1 className="mt-4 font-display text-4xl italic font-semibold leading-[1.15] text-ink-950 sm:text-5xl">
                Find your next home, verified and ready.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600">
                Browse verified rentals and listings across Dar es Salaam.
                Landlords get leases, M-Pesa collection, and tenant management — all in one place.
              </p>
              <form
                onSubmit={handleSearch}
                className="mt-8 flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-3 shadow-[var(--shadow-card)] ring-1 ring-ink-100 sm:flex-row sm:items-center"
              >
                {searchFields}
              </form>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
                <span>Popular: </span>
                {POPULAR.map((w) => (
                  <Link
                    key={w}
                    to={`/listings?district=${districtFor(w)}`}
                    className="underline decoration-brand-300 underline-offset-2 transition hover:text-brand-700"
                  >
                    {w}
                  </Link>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
              <img src={HERO_IMAGE} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>
      )}

      {HERO_LAYOUT === "centered" && (
        <section className="border-b border-ink-100 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-28">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-brand-600">
              <MapPin className="h-4 w-4" />
              Dar es Salaam
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink-950 sm:text-5xl">
              Find your next home, verified and ready.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-600">
              Browse verified rentals and listings across Dar es Salaam.
              Landlords get leases, M-Pesa collection, and tenant management — all in one place.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-10 flex max-w-xl flex-col gap-3 rounded-[var(--radius-card)] bg-ink-50 p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
            >
              {searchFields}
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <span>Popular: </span>
              {POPULAR.map((w) => (
                <Link
                  key={w}
                  to={`/listings?district=${districtFor(w)}`}
                  className="underline decoration-ink-300 underline-offset-2 transition hover:text-ink-900"
                >
                  {w}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured listings */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Recently listed</h2>
            <p className="mt-1 text-ink-500">Fresh properties across the city.</p>
          </div>
          <Link
            to="/listings"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-8 text-ink-400">No listings yet. Be the first to list a property.</p>
        ) : (
          <div className={`mt-8 ${LISTING_GRID_CLASS}`}>
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
        <Link
          to="/listings"
          className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-brand-600 sm:hidden"
        >
          View all listings <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Features */}
      <section className="border-t border-ink-100 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">For landlords</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              The listing is just the beginning
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-500">
              Once a tenant is placed, manage everything from leases to rent collection
              without spreadsheets, WhatsApp groups, or manual bank reconciliation.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={FileText}
              title="Digital leases"
              text="Swahili and English templates with a signed audit trail. Both parties sign online."
            />
            <Feature
              icon={Wallet}
              title="Advance-rent schedules"
              text="6 or 12-month advances modeled natively. Track what's paid and what's due."
            />
            <Feature
              icon={Smartphone}
              title="M-Pesa collection"
              text="Tenants pay from their phone. Payments reconcile to schedules automatically."
            />
            <Feature
              icon={ShieldCheck}
              title="Verified listings"
              text="NIDA-linked identity badges so seekers know which listings are legitimate."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-950 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Start managing your properties today
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-200/80">
            Free to list, free to browse. Landlord management tools are priced per unit,
            starting free for your first property.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-accent px-8 py-3 text-base">
              Create free account
            </Link>
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] px-8 py-3 text-sm font-semibold text-brand-200 transition hover:text-white"
            >
              Browse listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return (
    <div className="group">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-btn)] bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
    </div>
  );
}
