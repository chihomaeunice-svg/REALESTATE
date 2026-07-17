import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Wallet, FileText, Smartphone } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";

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

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://picsum.photos/seed/daressalaam/1600/900"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-200">
            Dar es Salaam · Rentals &amp; Sales
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Find a verified home. Run your building without the chaos.
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Free listings for every seeker, and a full rent-collection toolkit for every landlord —
            leases, M-Pesa payments, and arrears tracking in one place.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-xl sm:flex-row sm:items-center"
          >
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="input !border-0 !ring-0 sm:w-48 text-ink-800"
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
              className="input !border-0 !ring-0 sm:w-48 text-ink-800"
            >
              <option value="">Any property type</option>
              {PROPERTY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <button type="submit" className="btn-accent w-full sm:w-auto">
              <Search className="h-4 w-4" /> Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-ink-900">Recently listed</h2>
          <a href="/listings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all →
          </a>
        </div>
        {featured.length === 0 ? (
          <p className="text-ink-400">No listings yet — be the first to list a property.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-ink-900">
            Landlords: the listing is just the beginning
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-ink-500">
            Once a tenant is placed, graduate into the management suite that runs the hard part —
            for a small monthly fee per unit.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={FileText} title="Digital leases" text="Swahili &amp; English templates with a signed audit trail." />
            <Feature icon={Wallet} title="Advance-rent schedules" text="6/12-month advances modeled natively, not bolted on." />
            <Feature icon={Smartphone} title="M-Pesa collection" text="Tenants pay by push; you reconcile automatically." />
            <Feature icon={ShieldCheck} title="Verified listings" text="NIDA-linked identity badges cut out fake listings." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return (
    <div className="card p-6">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mb-1 text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500">{text}</p>
    </div>
  );
}
