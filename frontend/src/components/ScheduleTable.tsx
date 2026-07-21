import type { PaymentSchedule } from "../lib/api";
import { formatTZS, formatDate } from "../lib/format";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-ink-100 text-ink-600",
  paid: "bg-brand-50 text-brand-700",
  partial: "bg-sun-50 text-sun-700",
  overdue: "bg-red-50 text-red-700",
};

export function ScheduleTable({
  schedules,
  onPay,
}: {
  schedules: PaymentSchedule[];
  onPay?: (schedule: PaymentSchedule) => void;
}) {
  if (schedules.length === 0) return <p className="text-sm text-ink-400">No schedule generated yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="py-2">Period</th>
            <th className="py-2">Due date</th>
            <th className="py-2">Amount</th>
            <th className="py-2">Status</th>
            {onPay && <th className="py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {schedules.map((s) => (
            <tr key={s.id}>
              <td className="py-2 text-ink-700">{formatDate(s.period_start)} – {formatDate(s.period_end)}</td>
              <td className="py-2 text-ink-500">{formatDate(s.due_date)}</td>
              <td className="py-2 font-medium text-ink-800">{formatTZS(s.amount_due)}</td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>{s.status}</span>
              </td>
              {onPay && (
                <td className="py-2 text-right">
                  {s.status !== "paid" && (
                    <button onClick={() => onPay(s)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Pay now
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
