import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, FileText, CalendarClock, Smartphone, ShieldCheck,
  Wrench, ListChecks, LayoutDashboard, Eye, Users, BadgePercent,
} from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { ArrowCarousel } from "../components/ArrowCarousel";
import { RecentlyViewedStrip } from "../components/RecentlyViewedStrip";
import { Reveal } from "../components/Reveal";
import { CountUp } from "../components/CountUp";
import { SpinBadge } from "../components/SpinBadge";
import { SquiggleLine } from "../components/SquiggleLine";
import SplitPhotoSlider, { type SplitSlide } from "../components/SplitPhotoSlider";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";

const TYPE_PHOTO: Record<string, string> = {
  apartment: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  house: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  room: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  land: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
};

// Every real landlord benefit the platform ships today — no placeholders for
// features that don't exist yet. Titles stay visible at all times; this is a
// feature list people need to read, not a photo showcase.
const LANDLORD_BENEFITS: { icon: typeof FileText; title: string; text: string }[] = [
  { icon: FileText, title: "Digital leases", text: "Swahili and English templates, signed online with a full audit trail." },
  { icon: CalendarClock, title: "Advance-rent schedules", text: "6 or 12-month advances modeled natively, with what's paid and due tracked automatically." },
  { icon: Smartphone, title: "M-Pesa collection", text: "Tenants pay from their phone. Payments reconcile without spreadsheets." },
  { icon: ShieldCheck, title: "Verified listings", text: "NIDA-linked identity badges so seekers know which listings are legitimate." },
  { icon: Wrench, title: "Maintenance requests", text: "Tenants submit issues, landlords track and close them out." },
  { icon: ListChecks, title: "Amenities checklist", text: "Set exactly what's included per unit, so listings stay accurate." },
  { icon: LayoutDashboard, title: "One dashboard", text: "Every property and unit you manage, in a single place." },
  { icon: Eye, title: "Listing view-counts", text: "See what's actually getting attention, not just what's listed." },
  { icon: Users, title: "Free tenant portal", text: "Tenants get their own portal for leases and payments, at no cost." },
  { icon: BadgePercent, title: "Free to start", text: "No charge for your first unit. Priced per unit after that." },
];

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

  const typeSlides: SplitSlide[] = useMemo(
    () =>
      PROPERTY_TYPES.map((p) => {
        const count = typeCounts[p.value] ?? 0;
        return {
          title: p.label,
          description: `${count} ${p.label.toLowerCase()} ${count === 1 ? "listing" : "listings"} available across Dar es Salaam right now.`,
          image: TYPE_PHOTO[p.value],
          cta: `Browse ${p.label.toLowerCase()}`,
        };
      }),
    [typeCounts]
  );

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
          <motion.img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80"
            alt=""
            className="h-full w-full object-cover"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-surface/55 backdrop-blur-[1px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
          {/* ambient floating shapes — constant idle motion, independent of scroll */}
          <motion.div
            className="pointer-events-none absolute -top-10 right-6 h-32 w-32 rounded-full bg-sun-400/30 blur-2xl sm:right-10"
            animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-6 left-2 h-24 w-24 rounded-full bg-brand-400/25 blur-2xl sm:left-6"
            animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          />
          {/* hand-drawn squiggle, draws itself in once the hero scrolls into view */}
          <SquiggleLine className="pointer-events-none absolute -left-8 top-6 hidden h-24 w-40 text-sun-500/70 sm:block" />

          <Reveal className="relative rounded-2xl bg-surface/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="absolute -right-4 -top-4 hidden sm:block">
              <SpinBadge />
            </div>
            <p className="text-sm font-medium text-brand-600">Dar es Salaam</p>
            <motion.h1
              className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl"
              initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              A home in Dar es Salaam, <span className="font-display italic font-normal text-brand-600">verified</span> before you call.
            </motion.h1>

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

      {/* Featured — autoplaying arrow carousel borrowed from Direction A, kept quiet/light.
          Always renders (even with an empty state) so the page never jumps straight
          from the hero into the slider below with nothing in between. */}
      <section className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-16">
        <motion.div
          className="pointer-events-none absolute -top-4 right-4 h-20 w-20 rounded-full bg-brand-300/25 blur-2xl sm:right-16"
          animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
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
        {featured.length > 0 ? (
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
        ) : (
          <Reveal delay={80} className="mt-6 rounded-2xl border border-dashed border-surface-border bg-surface-sunken px-6 py-10 text-center">
            <p className="text-sm text-ink-400">No listings yet. Be the first to list a property.</p>
          </Reveal>
        )}
      </section>

      {/* What you can find — scroll-pinned split slider per property type.
          loop=false: with a fixed set of 6 types this is a one-pass slider, not an
          endless carousel — looping would jump back to slide 1 before releasing the
          scroll, which reads as a glitch when the slider sits mid-page. */}
      <SplitPhotoSlider
        slides={typeSlides}
        brand={<>Nyumba <em style={{ fontStyle: "italic", color: "#f59e0b" }}>Yangu</em></>}
        accent="#f59e0b"
        height="85vh"
        scrollPerSlide={0.55}
        loop={false}
        onCta={(_, i) => navigate(`/listings?property_type=${PROPERTY_TYPES[i].value}`)}
      />

      {/* For landlords — every real benefit, as a plain readable grid.
          A 3D hover-to-reveal parallax version of this lived here first, but
          titles hidden until hover and a constant tilt made a feature list that
          people need to actually read hard to use — swapped for calm fade-ins
          with titles always visible. */}
      <section className="relative overflow-hidden bg-surface py-14 lg:py-20">
        <motion.div
          className="pointer-events-none absolute -left-10 top-1/4 h-28 w-28 rounded-full bg-sun-400/20 blur-2xl"
          animate={{ y: [0, 18, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">For landlords</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Everything you're <span className="font-display italic font-normal text-brand-600">eased</span> with
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-500">
              One place for leases, rent, and tenants — instead of spreadsheets, WhatsApp groups, and manual bank reconciliation.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {LANDLORD_BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 5) * 60}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink-900">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{b.text}</p>
              </Reveal>
            ))}
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

