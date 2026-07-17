import { CheckCircle2, Banknote } from "lucide-react";
import type { Payment } from "../lib/api";
import { formatTZS, formatDateTime } from "../lib/format";

export function PaymentHistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return <p className="text-sm text-ink-400">No payments recorded yet.</p>;

  return (
    <ul className="divide-y divide-ink-100">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${p.method === "mpesa" ? "bg-brand-50 text-brand-600" : "bg-ink-100 text-ink-500"}`}>
              {p.method === "mpesa" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
            </span>
            <div>
              <p className="font-medium text-ink-800">{formatTZS(p.amount)} via {p.method.toUpperCase()}</p>
              <p className="text-xs text-ink-400">
                {p.mpesa_receipt ? `Receipt ${p.mpesa_receipt} · ` : ""}
                {p.paid_at ? formatDateTime(p.paid_at) : "Pending"}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold uppercase text-ink-400">{p.status}</span>
        </li>
      ))}
    </ul>
  );
}
