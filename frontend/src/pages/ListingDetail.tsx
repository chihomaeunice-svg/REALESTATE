import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BedDouble, Bath, Ruler, MapPin, Phone, CheckCircle2, ShieldCheck, Calendar, MessageCircle, ArrowLeft } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { formatDate } from "../lib/format";
import { useCurrency } from "../lib/currency-context";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { WishlistButton } from "../components/WishlistButton";
import { PROPERTY_TYPE_LABEL, NO_UNIT_TYPES } from "../lib/constants";
import { recordView } from "../lib/recently-viewed";
import { RecentlyViewedStrip } from "../components/RecentlyViewedStrip";
import { SimilarListings } from "../components/SimilarListings";

export function ListingDetail() {
  const { id } = useParams();
  const { format } = useCurrency();
  const [listing, setListing] = useState<Listing | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [form, setForm] = useState({ seeker_name: "", seeker_phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) api.get<Listing>(`/listings/${id}`).then((l) => { setListing(l); recordView(l.id); });
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
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-24 rounded bg-ink-100" />
          <div className="aspect-video rounded-2xl bg-ink-100" />
          <div className="h-8 w-64 rounded bg-ink-100" />
        </div>
      </div>
    );
  }

  const image = listing.images?.[0] ?? `https://picsum.photos/seed/${listing.id}/1200/800`;
  const isLand = NO_UNIT_TYPES.has(listing.property_type);

  // Build WhatsApp link
  const waPhone = listing.contact_phone.replace(/[^0-9]/g, "");
  const waMessage = encodeURIComponent(`Hi, I'm interested in "${listing.title}" listed on Nyumba Yangu.`);
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-ink-100">
            <img src={image} alt={listing.title} className="aspect-[16/10] w-full object-cover" />
          </div>

          <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{listing.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-ink-500">
                  <MapPin className="h-4 w-4" /> {listing.ward}, {listing.district}, {listing.city}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <VerifiedBadge status={listing.verification} />
                <WishlistButton listingId={listing.id} variant="inline" />
              </div>
            </div>
          </div>

          {/* Property details chips */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Chip>
              {PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type}
            </Chip>
            {isLand ? (
              <>
                {listing.land_size_acres && (
                  <Chip><Ruler className="h-4 w-4" /> {listing.land_size_acres} acres</Chip>
                )}
                {listing.title_deed_status && (
                  <Chip><ShieldCheck className="h-4 w-4" /> {listing.title_deed_status}</Chip>
                )}
              </>
            ) : (
              <>
                {listing.bedrooms > 0 && (
                  <Chip><BedDouble className="h-4 w-4" /> {listing.bedrooms} bed{listing.bedrooms > 1 ? "s" : ""}</Chip>
                )}
                {listing.bathrooms > 0 && (
                  <Chip><Bath className="h-4 w-4" /> {listing.bathrooms} bath</Chip>
                )}
              </>
            )}
            <Chip><Calendar className="h-4 w-4" /> Listed {formatDate(listing.created_at)}</Chip>
          </div>

          {listing.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">About this property</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-600">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <p className="text-3xl font-semibold text-ink-900">
              {format(listing.price)}
              {listing.price_period !== "total" && (
                <span className="text-base font-normal text-ink-400"> /{listing.price_period}</span>
              )}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {listing.purpose === "rent" ? "Available for rent" : "Available for sale"}
            </p>

            <div className="mt-6 space-y-3">
              {!showContact ? (
                <>
                  <button onClick={() => setShowContact(true)} className="btn-primary w-full">
                    <Phone className="h-4 w-4" /> Contact lister
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#20bd5a] active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                  </a>
                </>
              ) : sent ? (
                <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Inquiry sent</p>
                    <p className="mt-1">
                      The lister's number is <strong>{listing.contact_phone}</strong>. They'll reach out, or call directly.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitInquiry} className="space-y-3">
                  <div>
                    <label className="label">Your name</label>
                    <input required className="input" value={form.seeker_name} onChange={(e) => setForm({ ...form, seeker_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Your phone</label>
                    <input required className="input" placeholder="+255..." value={form.seeker_phone} onChange={(e) => setForm({ ...form, seeker_phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Message <span className="font-normal text-ink-400">(optional)</span></label>
                    <textarea className="input" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" className="btn-primary w-full">Send inquiry</button>
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>

      <SimilarListings listing={listing} />
    </div>
    <RecentlyViewedStrip excludeId={listing.id} />
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-sm text-ink-600 shadow-sm ring-1 ring-ink-100">
      {children}
    </span>
  );
}
