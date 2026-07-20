import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BedDouble, Bath, Ruler, MapPin, Phone, CheckCircle2, ShieldCheck, Calendar } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { formatTZS, formatDate } from "../lib/format";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { WishlistButton } from "../components/WishlistButton";
import { PROPERTY_TYPE_LABEL, NO_UNIT_TYPES } from "../lib/constants";

export function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({ seeker_name: "", seeker_phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) api.get<Listing>(`/listings/${id}`).then(setListing);
  }, [id]);

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/listings/${id}/inquiries`, form);
      setSent(true);
    } catch {
      setError("Could not send your inquiry. Please try again.");
    }
  }

  if (!listing) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-400">Loading listing…</div>;
  }

  const image = listing.images?.[0] ?? `https://picsum.photos/seed/${listing.id}/1200/800`;
  const isLand = NO_UNIT_TYPES.has(listing.property_type);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700">← Back to listings</Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-ink-100">
            <img src={image} alt={listing.title} className="aspect-video w-full object-cover" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink-900">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-ink-500">
                <MapPin className="h-4 w-4" /> {listing.ward}, {listing.district}, {listing.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <VerifiedBadge status={listing.verification} />
              <WishlistButton listingId={listing.id} variant="inline" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink-600">
            <span className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
              {PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type}
            </span>
            {isLand ? (
              <>
                {listing.land_size_acres && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
                    <Ruler className="h-4 w-4" /> {listing.land_size_acres} acres
                  </span>
                )}
                {listing.title_deed_status && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
                    <ShieldCheck className="h-4 w-4" /> {listing.title_deed_status}
                  </span>
                )}
              </>
            ) : (
              <>
                {listing.bedrooms > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
                    <BedDouble className="h-4 w-4" /> {listing.bedrooms} bed
                  </span>
                )}
                {listing.bathrooms > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
                    <Bath className="h-4 w-4" /> {listing.bathrooms} bath
                  </span>
                )}
              </>
            )}
            <span className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-ink-100">
              <Calendar className="h-4 w-4" /> Listed {formatDate(listing.created_at)}
            </span>
          </div>

          {listing.description && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold text-ink-900">Description</h2>
              <p className="whitespace-pre-line text-ink-600">{listing.description}</p>
            </div>
          )}
        </div>

        <aside className="card sticky top-24 h-fit p-6">
          <p className="text-3xl font-semibold text-ink-900">
            {formatTZS(listing.price)}
            {listing.price_period !== "total" && (
              <span className="text-base font-normal text-ink-400">/{listing.price_period}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {listing.purpose === "rent" ? "Available for rent" : "Available for sale"}
          </p>

          {!showContact ? (
            <button onClick={() => setShowContact(true)} className="btn-primary mt-6 w-full">
              <Phone className="h-4 w-4" /> Contact lister
            </button>
          ) : sent ? (
            <div className="mt-6 flex items-start gap-2 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Sent! The lister's phone number is <strong>{listing.contact_phone}</strong>. They'll reach out, or you can call directly.
              </span>
            </div>
          ) : (
            <form onSubmit={submitInquiry} className="mt-6 space-y-3">
              <div>
                <label className="label">Your name</label>
                <input required className="input" value={form.seeker_name} onChange={(e) => setForm({ ...form, seeker_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Your phone</label>
                <input required className="input" placeholder="+255…" value={form.seeker_phone} onChange={(e) => setForm({ ...form, seeker_phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Message (optional)</label>
                <textarea className="input" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full">Send inquiry</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
