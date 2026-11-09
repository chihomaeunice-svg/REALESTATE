import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, ShieldCheck, Wallet, Smartphone, ArrowRight,
  Building2, Home as HomeIcon, DoorOpen, Briefcase, Store, Trees,
} from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { ArrowCarousel } from "../components/ArrowCarousel";
import { RecentlyViewedStrip } from "../components/RecentlyViewedStrip";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { SpinBadge } from "../components/SpinBadge";
import { SquiggleLine } from "../components/SquiggleLine";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";

const TYPE_ICON: Record<string, typeof HomeIcon> = {
  apartment: Building2,
  house: HomeIcon,
  room: DoorOpen,
  office: Briefcase,
  shop: Store,
  land: Trees,
};

export function Home() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    api.get<Listing[]>("/listings").then(setListings);
  }, []);

  const featured = listings.slice(0, 8);
  const districtsCovered = new Set(listings.map((l) => l.district)).size || DAR_DISTRICTS.length;
  const verifiedCount = listings.filter((l) => l.verification === "verified").length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of listings) counts[l.property_type] = (counts[l.property_type] ?? 0) + 1;
    return counts;
  }, [listings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (propertyType) params.set("property_type", propertyType);
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero — quiet, photo-backed, floating search card (Direction B) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80"
            alt=""
            className="h-full w-full object-cover animate-kenburns"
          />
          <div className="absolute inset-0 bg-surface/55 backdrop-blur-[1px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
          {/* ambient floating shapes — constant idle motion, independent of scroll */}
          <div className="pointer-events-none absolute -top-10 right-6 h-32 w-32 rounded-full bg-sun-400/30 blur-2xl animate-float-slow sm:right-10" />
          <div
            className="pointer-events-none absolute -bottom-6 left-2 h-24 w-24 rounded-full bg-brand-400/25 blur-2xl animate-float-slow sm:left-6"
            style={{ animationDelay: "1.4s" }}
          />
          {/* hand-drawn squiggle, draws itself in once the hero scrolls into view */}
          <SquiggleLine className="pointer-events-none absolute -left-8 top-6 hidden h-24 w-40 text-sun-500/70 sm:block" />

          <Reveal className="relative rounded-2xl bg-surface/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="absolute -right-4 -top-4 hidden sm:block">
              <SpinBadge />
            </div>
            <p className="text-sm font-medium text-brand-600">Dar es Salaam</p>
            <h1 className="mt-2 animate-text-whoosh text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
              A home in Dar es Salaam, <span className="font-display italic font-normal text-brand-600">verified</span> before you call.
            </h1>

            <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-2 rounded-xl border border-surface-border bg-surface-sunken p-2 sm:flex-row sm:items-center">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="flex-1 rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:ring-0"
              >
                <option value="">All districts</option>
                {DAR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <div className="hidden h-6 w-px bg-ink-200 sm:block" />
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="flex-1 rounded-lg border-0 bg-transparent px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:ring-0"
              >
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <button type="submit" className="btn-primary justify-center rounded-lg px-5 py-2.5">
                <Search className="h-4 w-4" /> Search
              </button>
            </form>

            <div className="mt-5 grid grid-cols-3 divide-x divide-surface-border border-t border-surface-border pt-4 text-center">
              <Stat value={listings.length} label="active listings" />
              <Stat value={districtsCovered} label="districts covered" />
              <Stat value={verifiedCount} label="verified listings" />
            </div>
          </Reveal>
        </div>
      </section>

      <RecentlyViewedStrip />

      {/* Featured — autoplaying arrow carousel borrowed from Direction A, kept quiet/light */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-16">
          <Reveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Featured</p>
                <h2 className="mt-1 text-xl font-semibold text-ink-900 sm:text-2xl">This week's picks</h2>
              </div>
              <Link
                to="/listings"
                className="hidden items-center gap-1 text-sm font-semibold text-brand-600 transition hover:gap-2 sm:flex"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-6">
            <ArrowCarousel>
              {featured.map((l, i) => (
                <div
                  key={l.id}
                  className={`w-64 shrink-0 transition-transform duration-300 hover:rotate-0 hover:scale-[1.03] sm:w-72 ${
                    i % 2 === 0 ? "-rotate-2" : "rotate-2"
                  }`}
                >
                  <ListingCard listing={l} />
                </div>
              ))}
            </ArrowCarousel>
          </div>
        </section>
      )}

      {/* Property types — icon tile row, borrowed from Direction A */}
      <section className="border-y border-surface-border bg-surface-sunken py-14 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Browse by type</p>
          </Reveal>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {PROPERTY_TYPES.map((p, i) => {
              const Icon = TYPE_ICON[p.value] ?? Building2;
              const count = typeCounts[p.value] ?? 0;
              return (
                <Reveal key={p.value} delay={i * 50}>
                  <Link
                    to={`/listings?property_type=${p.value}`}
                    className="card group flex flex-col items-center gap-2 px-2 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold text-ink-900">{p.label}</span>
                    <span className="text-[11px] text-ink-400"><CountUp value={count} /></span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features — minimal inline row, no boxes (Direction B) */}
      <section className="bg-surface py-14 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-brand-600">For landlords</p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:divide-x sm:divide-surface-border">
            <Reveal delay={0}>
              <MinimalFeature
                icon={ShieldCheck}
                title="Verified listings"
                text="NIDA-linked identity badges so seekers know which listings are legitimate."
              />
            </Reveal>
            <Reveal delay={90} className="sm:pl-8">
              <MinimalFeature
                icon={Wallet}
                title="Leases & rent, handled"
                text="Digital leases and advance-rent schedules, tracked automatically."
              />
            </Reveal>
            <Reveal delay={180} className="sm:pl-8">
              <MinimalFeature
                icon={Smartphone}
                title="M-Pesa collection"
                text="Tenants pay from their phone. Payments reconcile without spreadsheets."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA — slim bar */}
      <section className="border-t border-surface-border bg-surface-sunken py-10">
        <Reveal className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6">
          <p className="text-sm text-ink-600">
            Free to list, free to browse. Landlord tools are priced per unit, starting free for your first property.
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/register" className="btn-primary px-5 py-2.5">Create free account</Link>
            <Link to="/listings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Browse listings</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-2">
      <p className="text-lg font-semibold text-ink-900"><CountUp value={value} /></p>
      <p className="mt-0.5 text-xs text-ink-400">{label}</p>
    </div>
  );
}

function MinimalFeature({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div>
      <Icon className="h-5 w-5 text-brand-600" />
      <h3 className="mt-3 text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
    </div>
  );
}
