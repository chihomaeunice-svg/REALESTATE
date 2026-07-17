import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api, type Subscription as SubscriptionType } from "../../lib/api";
import { formatTZS } from "../../lib/format";

const TIERS = [
  { key: "free", label: "Free", range: "1 unit", note: "Seed adoption with your first unit" },
  { key: "starter", label: "Starter", range: "1–5 units", note: "TZS 10,000 / unit / month" },
  { key: "growth", label: "Growth", range: "6–20 units", note: "TZS 8,000 / unit / month" },
  { key: "scale", label: "Scale", range: "21+ units", note: "TZS 6,000 / unit / month" },
];

export function Subscription() {
  const [sub, setSub] = useState<SubscriptionType | null>(null);

  useEffect(() => {
    api.get<SubscriptionType>("/subscription").then(setSub);
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ink-900">Subscription</h1>
      <p className="mb-6 text-ink-500">Listings stay free forever. The management suite is priced per unit, per month.</p>

      {sub && (
        <div className="card mb-8 flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Current plan</p>
            <p className="text-xl font-semibold capitalize text-ink-900">{sub.tier} · {sub.unit_count} units</p>
          </div>
          <p className="text-2xl font-semibold text-brand-700">{formatTZS(sub.price_tzs)}<span className="text-sm font-normal text-ink-400">/mo</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div key={t.key} className={`card p-5 ${sub?.tier === t.key ? "ring-2 ring-brand-500" : ""}`}>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-400">{t.range}</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{t.label}</p>
            <p className="mt-2 text-sm text-ink-500">{t.note}</p>
            {sub?.tier === t.key && (
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600">
                <CheckCircle2 className="h-4 w-4" /> Your current tier
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Your tier updates automatically as you add units. Billing integration is out of scope for this prototype.
      </p>
    </div>
  );
}
