import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { api, type Property, type Unit } from "../../lib/api";
import { formatTZS } from "../../lib/format";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../../lib/constants";
import { useAuth } from "../../lib/auth-context";

export function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    api.get<Property[]>("/properties").then(setProperties);
  }

  useEffect(load, []);

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

            {expanded === p.id && <UnitsPanel property={p} landlordPhone={user?.phone ?? ""} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewPropertyForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: "", property_type: "apartment", district: DAR_DISTRICTS[0], ward: "", address_line: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/properties", form);
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
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Creating…" : "Create property"}</button>
      <p className="text-xs text-ink-400">New properties enter admin review before they can be listed publicly.</p>
    </form>
  );
}

function UnitsPanel({ property, landlordPhone }: { property: Property; landlordPhone: string }) {
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
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {units.map((u) => (
                <UnitRow key={u.id} unit={u} propertyId={property.id} landlordPhone={landlordPhone} onListed={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewUnitForm({ propertyId, onDone }: { propertyId: string; onDone: () => void }) {
  const [form, setForm] = useState({ unit_label: "", bedrooms: 1, bathrooms: 1, rent_amount: 0 });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/properties/${propertyId}/units`, form);
      onDone();
    } catch {
      setError("Could not create unit.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-4 sm:grid-cols-5">
      <input required placeholder="Label (e.g. A1)" className="input" value={form.unit_label} onChange={(e) => setForm({ ...form, unit_label: e.target.value })} />
      <input type="number" min={0} placeholder="Beds" className="input" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} />
      <input type="number" min={0} placeholder="Baths" className="input" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} />
      <input type="number" min={0} placeholder="Rent (TZS/mo)" className="input" value={form.rent_amount || ""} onChange={(e) => setForm({ ...form, rent_amount: Number(e.target.value) })} />
      <button type="submit" className="btn-primary !py-2">Add</button>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

function UnitRow({ unit, propertyId, landlordPhone, onListed }: { unit: Unit; propertyId: string; landlordPhone: string; onListed: () => void }) {
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

  return (
    <tr>
      <td className="py-2 font-medium text-ink-800">{unit.unit_label}</td>
      <td className="py-2 text-ink-500">{unit.bedrooms}bd / {unit.bathrooms}ba</td>
      <td className="py-2 text-ink-500">{formatTZS(unit.rent_amount)}</td>
      <td className="py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${unit.status === "occupied" ? "bg-brand-50 text-brand-700" : "bg-sun-50 text-sun-700"}`}>
          {unit.status}
        </span>
      </td>
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
