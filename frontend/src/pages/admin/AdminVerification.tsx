import { useEffect, useState } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import { api, type User, type Property } from "../../lib/api";
import { formatDate } from "../../lib/format";

export function AdminVerification() {
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  function load() {
    api.get<User[]>("/admin/pending-users").then(setUsers);
    api.get<Property[]>("/admin/pending-properties").then(setProperties);
  }
  useEffect(load, []);

  async function decideUser(id: string, approve: boolean) {
    await api.post(`/admin/users/${id}/decide`, { approve });
    load();
  }
  async function decideProperty(id: string, approve: boolean) {
    await api.post(`/admin/properties/${id}/decide`, { approve });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-semibold text-ink-900">
        <ShieldCheck className="h-6 w-6 text-brand-600" /> Verification queue
      </h1>
      <p className="mb-6 text-ink-500">
        Manual review of identity documents and property submissions — the trust layer the market is missing.
      </p>

      <section className="card mb-8 p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Landlords &amp; agents awaiting ID verification</h2>
        {users.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink-800">{u.full_name} · {u.phone}</p>
                  <p className="text-xs text-ink-400">
                    NIDA: {u.nida_number ?? "—"} · Business license: {u.business_license ?? "—"} · Registered {formatDate(u.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decideUser(u.id, true)} className="btn-primary !px-3 !py-1.5 text-xs"><Check className="h-3.5 w-3.5" /> Approve</button>
                  <button onClick={() => decideUser(u.id, false)} className="btn-secondary !px-3 !py-1.5 text-xs"><X className="h-3.5 w-3.5" /> Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Properties awaiting review</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-ink-400">Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {properties.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink-800">{p.title}</p>
                  <p className="text-xs text-ink-400">{p.ward}, {p.district} · {p.property_type} · Submitted {formatDate(p.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decideProperty(p.id, true)} className="btn-primary !px-3 !py-1.5 text-xs"><Check className="h-3.5 w-3.5" /> Approve</button>
                  <button onClick={() => decideProperty(p.id, false)} className="btn-secondary !px-3 !py-1.5 text-xs"><X className="h-3.5 w-3.5" /> Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
