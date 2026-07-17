import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle } from "lucide-react";
import { api, type BuildingIncome, type PaymentSchedule } from "../../lib/api";
import { formatTZS, formatDate } from "../../lib/format";

const GOOD = "#22685a"; // brand-600: collected rent
const WARNING = "#dd6602"; // sun-600: overdue rent

export function Reports() {
  const [byBuilding, setByBuilding] = useState<BuildingIncome[]>([]);
  const [arrears, setArrears] = useState<PaymentSchedule[]>([]);

  useEffect(() => {
    api.get<BuildingIncome[]>("/reports/by-building").then(setByBuilding);
    api.get<PaymentSchedule[]>("/arrears").then(setArrears);
  }, []);

  const chartData = byBuilding.map((b) => ({
    name: b.property_name.length > 18 ? b.property_name.slice(0, 16) + "…" : b.property_name,
    Collected: b.collected,
    Overdue: b.overdue,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-900">Reports &amp; arrears</h1>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Income by building</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-ink-400">No data yet.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e5e5" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5b6565" }} axisLine={{ stroke: "#c5cbcb" }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5b6565" }} axisLine={false} tickLine={false} tickFormatter={(v) => new Intl.NumberFormat("en", { notation: "compact" }).format(v)} />
                <Tooltip formatter={(v) => formatTZS(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e5e5", fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="Collected" fill={GOOD} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Overdue" fill={WARNING} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
          <AlertTriangle className="h-5 w-5 text-sun-600" /> Tenants in arrears
        </h2>
        {arrears.length === 0 ? (
          <p className="text-sm text-ink-400">No overdue rent right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2">Tenant</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Due date</th>
                  <th className="py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {arrears.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 font-medium text-ink-800">{a.tenant_name} · {a.tenant_phone}</td>
                    <td className="py-2 text-ink-500">{a.property_title} ({a.unit_label})</td>
                    <td className="py-2 text-red-600">{formatDate(a.due_date)}</td>
                    <td className="py-2 font-medium text-ink-800">{formatTZS(a.amount_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
