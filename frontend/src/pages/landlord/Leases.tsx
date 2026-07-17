import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api, type Lease } from "../../lib/api";
import { formatTZS, formatDate } from "../../lib/format";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-ink-100 text-ink-600",
  active: "bg-brand-50 text-brand-700",
  terminated: "bg-red-50 text-red-700",
  expired: "bg-ink-100 text-ink-500",
};

export function Leases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get<Lease[]>("/leases").then(setLeases);
  }
  useEffect(load, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">Leases &amp; rent</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> New lease
        </button>
      </div>

      {showForm && <NewLeaseForm onDone={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      {leases.length === 0 ? (
        <p className="text-ink-400">No leases yet. Create one once you've placed a tenant.</p>
      ) : (
        <div className="space-y-3">
          {leases.map((l) => (
            <Link key={l.id} to={`/landlord/leases/${l.id}`} className="card flex items-center justify-between p-4 transition hover:shadow-md">
              <div>
                <p className="font-semibold text-ink-900">{l.tenant_name} · {l.property_title} ({l.unit_label})</p>
                <p className="text-sm text-ink-500">
                  {formatTZS(l.rent_amount)}/mo · {formatDate(l.start_date)} – {formatDate(l.end_date)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[l.status]}`}>{l.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewLeaseForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [units, setUnits] = useState<{ id: string; unit_label: string; property_title: string; rent_amount: number; status: string }[]>([]);
  const [form, setForm] = useState({
    unit_id: "",
    tenant_full_name: "",
    tenant_phone: "",
    language: "sw",
    start_date: new Date().toISOString().slice(0, 10),
    rent_amount: 0,
    advance_months: 6,
    deposit_amount: 0,
    term_months: 12,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<typeof units>("/units").then((all) => setUnits(all.filter((u) => u.status === "vacant")));
  }, []);

  function selectUnit(unitId: string) {
    const unit = units.find((u) => u.id === unitId);
    setForm((f) => ({ ...f, unit_id: unitId, rent_amount: unit?.rent_amount ?? 0, deposit_amount: unit?.rent_amount ?? 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/leases", {
        unit_id: form.unit_id,
        tenant: { full_name: form.tenant_full_name, phone: form.tenant_phone },
        language: form.language,
        start_date: form.start_date,
        rent_amount: form.rent_amount,
        advance_months: form.advance_months,
        deposit_amount: form.deposit_amount,
        term_months: form.term_months,
      });
      onDone();
    } catch {
      setError("Could not create lease. Check the unit and tenant details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
      <h3 className="font-semibold text-ink-900">New lease</h3>

      <div>
        <label className="label">Vacant unit</label>
        <select required className="input" value={form.unit_id} onChange={(e) => selectUnit(e.target.value)}>
          <option value="">Select a unit…</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.property_title} — {u.unit_label}</option>
          ))}
        </select>
        {units.length === 0 && <p className="mt-1 text-xs text-ink-400">No vacant units. Add a property/unit first.</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tenant full name</label>
          <input required className="input" value={form.tenant_full_name} onChange={(e) => setForm({ ...form, tenant_full_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Tenant phone</label>
          <input required className="input" placeholder="+255…" value={form.tenant_phone} onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Lease language</label>
          <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="sw">Swahili</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="label">Start date</label>
          <input required type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className="label">Monthly rent (TZS)</label>
          <input required type="number" className="input" value={form.rent_amount || ""} onChange={(e) => setForm({ ...form, rent_amount: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Deposit (TZS)</label>
          <input type="number" className="input" value={form.deposit_amount || ""} onChange={(e) => setForm({ ...form, deposit_amount: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Advance-payment block (months)</label>
          <select className="input" value={form.advance_months} onChange={(e) => setForm({ ...form, advance_months: Number(e.target.value) })}>
            <option value={1}>1 (monthly)</option>
            <option value={3}>3</option>
            <option value={6}>6 (typical)</option>
            <option value={12}>12</option>
          </select>
        </div>
        <div>
          <label className="label">Lease term (months)</label>
          <input type="number" className="input" value={form.term_months} onChange={(e) => setForm({ ...form, term_months: Number(e.target.value) })} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Creating…" : "Create lease"}</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
