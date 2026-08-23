import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronDown, ChevronUp, MapPin, X, Eye } from "lucide-react";
import { api, type Property, type Unit, type Listing } from "../../lib/api";
import { formatTZS } from "../../lib/format";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { DAR_DISTRICTS, PROPERTY_TYPES, NO_UNIT_TYPES } from "../../lib/constants";
import { useAuth } from "../../lib/auth-context";

export function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    api.get<Property[]>("/properties").then(setProperties);
    // The public browse endpoint carries view_count; cross-reference by
    // property/unit id to show sellers how their own listings are performing.
    api.get<Listing[]>("/listings").then(setListings).catch(() => {});
  }

  useEffect(load, []);

  const listingsByPropertyId = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings) if (!l.unit_id) map.set(l.property_id, l);
    return map;
  }, [listings]);

  const listingsByUnitId = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings) if (l.unit_id) map.set(l.unit_id, l);
    return map;
  }, [listings]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">Properties &amp; units</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add property
        </button>
      </div>

      {showForm && <NewPropertyForm onDone={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      <div className="space-y-4">
        {properties.length === 0 && (
          <p className="text-ink-400">No properties yet. Add your first building or house above.</p>
        )}
        {properties.map((p) => (
          <div key={p.id} className="card p-5">
            <button className="flex w-full items-center justify-between text-left" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{p.title}</h3>
                  <VerifiedBadge status={p.verification} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                  <MapPin className="h-3.5 w-3.5" /> {p.ward}, {p.district}
                </p>
              </div>
              {expanded === p.id ? <ChevronUp className="h-5 w-5 text-ink-400" /> : <ChevronDown className="h-5 w-5 text-ink-400" />}
            </button>

            {expanded === p.id && (
              NO_UNIT_TYPES.has(p.property_type)
                ? <LandListingPanel property={p} landlordPhone={user?.phone ?? ""} listing={listingsByPropertyId.get(p.id)} />
                : <UnitsPanel property={p} landlordPhone={user?.phone ?? ""} listingsByUnitId={listingsByUnitId} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewPropertyForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: "",
    property_type: "apartment",
    district: DAR_DISTRICTS[0],
    ward: "",
    address_line: "",
    land_size_acres: "",
    title_deed_status: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLand = NO_UNIT_TYPES.has(form.property_type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/properties", {
        title: form.title,
        property_type: form.property_type,
        district: form.district,
        ward: form.ward,
        address_line: form.address_line || undefined,
        land_size_acres: isLand && form.land_size_acres ? Number(form.land_size_acres) : undefined,
        title_deed_status: isLand && form.title_deed_status ? form.title_deed_status : undefined,
      });
      onDone();
    } catch {
      setError("Could not create property.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">New property</h3>
        <button type="button" onClick={onCancel} className="text-ink-400 hover:text-ink-700"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Property name</label>
          <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">District</label>
          <select className="input" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
            {DAR_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ward</label>
          <input required className="input" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address (optional)</label>
          <input className="input" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
        </div>
        {isLand && (
          <>
            <div>
              <label className="label">Plot size (acres)</label>
              <input type="number" step="0.01" min={0} className="input" value={form.land_size_acres} onChange={(e) => setForm({ ...form, land_size_acres: e.target.value })} />
            </div>
            <div>
              <label className="label">Title deed status</label>
              <input className="input" placeholder="e.g. Full title deed, Letter of offer" value={form.title_deed_status} onChange={(e) => setForm({ ...form, title_deed_status: e.target.value })} />
            </div>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Creating…" : "Create property"}</button>
      <p className="text-xs text-ink-400">New properties enter admin review before they can be listed publicly.</p>
    </form>
  );
}

function ViewCountBadge({ listing }: { listing?: Listing }) {
  if (!listing) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-500">
      <Eye className="h-3 w-3" /> {listing.view_count} view{listing.view_count === 1 ? "" : "s"}
    </span>
  );
}

function LandListingPanel({ property, landlordPhone, listing }: { property: Property; landlordPhone: string; listing?: Listing }) {
  const [form, setForm] = useState({ price: 0, price_period: "total", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/listings", {
        property_id: property.id,
        purpose: form.price_period === "total" ? "sale" : "rent",
        title: property.title,
        description: form.description || undefined,
        price: form.price,
        price_period: form.price_period,
        contact_phone: landlordPhone,
        images: [`https://picsum.photos/seed/${property.id}/900/600`],
      });
      setPublished(true);
    } catch {
      setError("Could not publish listing.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-ink-100 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-ink-500">
        {property.land_size_acres && <span>{property.land_size_acres} acres</span>}
        {property.title_deed_status && <span>· {property.title_deed_status}</span>}
        <ViewCountBadge listing={listing} />
      </div>
      {published ? (
        <p className="text-sm font-medium text-brand-700">Listing published — it's now live on the public marketplace.</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select className="input" value={form.price_period} onChange={(e) => setForm({ ...form, price_period: e.target.value })}>
            <option value="total">For sale (total price)</option>
            <option value="month">For rent (per month)</option>
            <option value="year">For rent (per year)</option>
          </select>
          <input required type="number" min={0} placeholder="Price (TZS)" className="input" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <input placeholder="Short description (optional)" className="input sm:col-span-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Publishing…" : "Publish listing"}</button>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}

function UnitsPanel({ property, landlordPhone, listingsByUnitId }: { property: Property; landlordPhone: string; listingsByUnitId: Map<string, Listing> }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get<Unit[]>(`/properties/${property.id}/units`).then(setUnits);
  }
  useEffect(load, [property.id]);

  return (
    <div className="mt-4 border-t border-ink-100 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-700">Units</h4>
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" /> Add unit
        </button>
      </div>

      {showForm && <NewUnitForm propertyId={property.id} onDone={() => { setShowForm(false); load(); }} />}

      {units.length === 0 ? (
        <p className="text-sm text-ink-400">No units yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2">Unit</th>
                <th className="pb-2">Beds/Baths</th>
                <th className="pb-2">Rent</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Views</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {units.map((u) => (
                <UnitRow key={u.id} unit={u} propertyId={property.id} landlordPhone={landlordPhone} onListed={load} listing={listingsByUnitId.get(u.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewUnitForm({ propertyId, onDone }: { propertyId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    unit_label: "", bedrooms: 1, bathrooms: 1, rent_amount: 0,
    master_bedrooms: 0, meter_type: "", water_source: "",
    has_fence: false, has_security_gate: false, has_balcony: false, has_parking: false,
  });
  const [error, setError] = useState("");
  const [showAmenities, setShowAmenities] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/properties/${propertyId}/units`, {
        ...form,
        meter_type: form.meter_type || undefined,
        water_source: form.water_source || undefined,
      });
      onDone();
    } catch {
      setError("Could not create unit.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-xl bg-ink-50 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <input required placeholder="Label (e.g. A1)" className="input" value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} />
        <input type="number" min={0} placeholder="Beds" className="input" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} />
        <input type="number" min={0} placeholder="Baths" className="input" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} />
        <input type="number" min={0} placeholder="Rent (TZS/mo)" className="input" value={form.rent_amount || ""} onChange={(e) => setForm({ ...form, rent_amount: Number(e.target.value) })} />
        <input type="number" min={0} placeholder="Master beds" className="input" value={form.master_bedrooms} onChange={(e) => setForm({ ...form, master_bedrooms: Number(e.target.value) })} />
      </div>
      <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700" onClick={() => setShowAmenities(!showAmenities)}>
        {showAmenities ? "Hide amenities" : "Add amenities (electricity, water, parking...)"}
      </button>
      {showAmenities && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Electricity</label>
            <select className="input" value={form.meter_type} onChange={(e) => setForm({ ...form, meter_type: e.target.value })}>
              <option value="">Not specified</option>
              <option value="LUKU">LUKU (prepaid)</option>
              <option value="shared">Shared meter</option>
              <option value="prepaid">Other prepaid</option>
            </select>
          </div>
          <div>
            <label className="label">Water</label>
            <select className="input" value={form.water_source} onChange={(e) => setForm({ ...form, water_source: e.target.value })}>
              <option value="">Not specified</option>
              <option value="DAWASA">DAWASA</option>
              <option value="borehole">Borehole</option>
              <option value="well">Well</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.has_fence} onChange={(e) => setForm({ ...form, has_fence: e.target.checked })} /> Fenced compound</label>
          <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.has_security_gate} onChange={(e) => setForm({ ...form, has_security_gate: e.target.checked })} /> Security gate</label>
          <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.has_balcony} onChange={(e) => setForm({ ...form, has_balcony: e.target.checked })} /> Balcony</label>
          <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.has_parking} onChange={(e) => setForm({ ...form, has_parking: e.target.checked })} /> Paved parking</label>
        </div>
      )}
      <button type="submit" className="btn-primary !py-2">Add unit</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function UnitRow({ unit, propertyId, landlordPhone, onListed, listing }: { unit: Unit; propertyId: string; landlordPhone: string; onListed: () => void; listing?: Listing }) {
  const [publishing, setPublishing] = useState(false);

  async function publishListing() {
    setPublishing(true);
    try {
      await api.post("/listings", {
        property_id: propertyId,
        unit_id: unit.id,
        title: `${unit.unit_label} — ${formatTZS(unit.rent_amount)}/month`,
        price: unit.rent_amount,
        contact_phone: landlordPhone,
        images: [`https://picsum.photos/seed/${unit.id}/900/600`],
      });
      onListed();
    } finally {
      setPublishing(false);
    }
  }

  const amenities: string[] = [];
  if (unit.meter_type) amenities.push(unit.meter_type);
  if (unit.water_source) amenities.push(unit.water_source);
  if (unit.has_balcony) amenities.push("Balcony");
  if (unit.has_fence) amenities.push("Fenced");
  if (unit.has_security_gate) amenities.push("Gate");
  if (unit.has_parking) amenities.push("Parking");
  if (unit.master_bedrooms > 0) amenities.push(`${unit.master_bedrooms} master`);

  const statusColor = unit.status === "occupied" ? "bg-brand-50 text-brand-700"
    : unit.status === "under_renovation" ? "bg-red-50 text-red-700"
    : "bg-sun-50 text-sun-700";

  return (
    <tr>
      <td className="py-2 font-medium text-ink-800">
        {unit.unit_label}
        {amenities.length > 0 && (
          <span className="ml-2 text-xs text-ink-400">{amenities.join(" · ")}</span>
        )}
      </td>
      <td className="py-2 text-ink-500">{unit.bedrooms}bd / {unit.bathrooms}ba</td>
      <td className="py-2 text-ink-500">{formatTZS(unit.rent_amount)}</td>
      <td className="py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {unit.status === "under_renovation" ? "renovating" : unit.status}
        </span>
      </td>
      <td className="py-2"><ViewCountBadge listing={listing} /></td>
      <td className="py-2 text-right">
        {unit.status === "vacant" && (
          <button onClick={publishListing} disabled={publishing} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            {publishing ? "Publishing…" : "Publish listing"}
          </button>
        )}
      </td>
    </tr>
  );
}
