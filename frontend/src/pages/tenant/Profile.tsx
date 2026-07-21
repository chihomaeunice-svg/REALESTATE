import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserCircle2, CheckCircle2 } from "lucide-react";
import { api, ApiError, type Tenant } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export function TenantProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", nida_number: "", emergency_contact: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Tenant>("/tenant/me")
      .then((t) => {
        setForm({
          full_name: t.full_name,
          phone: t.phone,
          email: t.email ?? "",
          nida_number: t.nida_number ?? "",
          emergency_contact: t.emergency_contact ?? "",
        });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setForm((f) => ({ ...f, full_name: user?.full_name ?? "", phone: user?.phone ?? "" }));
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setSaved(false);
    try {
      await api.post("/tenant/profile", {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || undefined,
        nida_number: form.nida_number || undefined,
        emergency_contact: form.emergency_contact || undefined,
      });
      setSaved(true);
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-ink-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link to="/tenant" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to my rental
      </Link>

      <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold text-ink-900">
        <UserCircle2 className="h-6 w-6 text-brand-600" /> My profile
      </h1>
      <p className="mt-1 text-ink-500">
        Fill this in before you view a property — landlords can find your details instantly when drafting a lease,
        instead of asking you to repeat everything.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">Full name</label>
          <input required className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input required className="input" placeholder="+255…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">NIDA number (optional)</label>
          <input className="input" value={form.nida_number} onChange={(e) => setForm({ ...form, nida_number: e.target.value })} />
        </div>
        <div>
          <label className="label">Emergency contact (optional)</label>
          <input className="input" placeholder="Name and phone number" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-brand-700">
            <CheckCircle2 className="h-4 w-4" /> Saved.
          </p>
        )}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
