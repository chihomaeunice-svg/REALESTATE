import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api, type Tenant } from "../../lib/api";
import { formatDate } from "../../lib/format";

export function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    api.get<Tenant[]>("/tenants").then(setTenants);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-900">Tenants</h1>
      {tenants.length === 0 ? (
        <p className="text-ink-400">No tenants yet — they're created automatically when you draft a lease.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50">
              <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3">Tenant</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">NIDA</th>
                <th className="px-5 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="flex items-center gap-2 px-5 py-3 font-medium text-ink-800">
                    <Users className="h-4 w-4 text-ink-300" /> {t.full_name}
                  </td>
                  <td className="px-5 py-3 text-ink-500">{t.phone}</td>
                  <td className="px-5 py-3 text-ink-500">{t.nida_number ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
