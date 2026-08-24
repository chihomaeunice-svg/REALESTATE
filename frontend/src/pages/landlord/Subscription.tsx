import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Phone } from "lucide-react";
import {
  api,
  type Subscription as SubscriptionType,
  type SubscriptionPayment,
  type SubscriptionResponse,
} from "../../lib/api";
import { formatTZS } from "../../lib/format";
import { formatDate } from "../../lib/format";

const TIERS = [
  { key: "free", label: "Free", range: "1 unit", note: "Free for the first month only" },
  { key: "starter", label: "Starter", range: "2–10 units", note: "TZS 20,000 / month" },
  { key: "growth", label: "Growth", range: "11–25 units", note: "TZS 35,000 / month" },
  { key: "professional", label: "Professional", range: "26–50 units", note: "TZS 50,000 / month" },
  { key: "enterprise", label: "Enterprise", range: "51+ units", note: "TZS 75,000 / month" },
];

function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function Subscription() {
  const [sub, setSub] = useState<SubscriptionType | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  useEffect(() => {
    api.get<SubscriptionResponse>("/subscription").then((res) => {
      setSub(res.subscription);
      setPayments(res.payments || []);
    });
  }, []);

  async function handlePay() {
    if (!phone || phone.length < 10) {
      setPayError("Enter a valid phone number (e.g. 255712345678)");
      return;
    }
    setPaying(true);
    setPayError("");
    setPaySuccess("");
    try {
      await api.post<SubscriptionPayment>("/subscription/pay", { phone_number: phone });
      setPaySuccess("Payment initiated! Check your phone for the M-Pesa/Airtel Money prompt.");
      // Refresh subscription data
      const res = await api.get<SubscriptionResponse>("/subscription");
      setSub(res.subscription);
      setPayments(res.payments || []);
    } catch (err: any) {
      setPayError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ink-900">Subscription</h1>
      <p className="mb-6 text-ink-500">
        Listings stay free forever. The management suite is priced per unit, per month.
      </p>

      {/* Status Banner */}
      {sub && <StatusBanner sub={sub} />}

      {/* Current Plan */}
      {sub && (
        <div className="card mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Current plan</p>
              <p className="text-xl font-semibold capitalize text-ink-900">
                {sub.tier} · {sub.unit_count} units
              </p>
              {sub.current_period_end && sub.status === "active" && (
                <p className="mt-1 text-sm text-ink-500">
                  Billing period ends {formatDate(sub.current_period_end)}
                </p>
              )}
            </div>
            <p className="text-2xl font-semibold text-brand-700">
              {formatTZS(sub.price_tzs)}
              <span className="text-sm font-normal text-ink-400">/mo</span>
            </p>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {sub && sub.price_tzs > 0 && sub.status !== "active" && (
        <div className="card mb-6 p-6">
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Make a Payment</h2>
          <p className="mb-4 text-sm text-ink-500">
            Pay via M-Pesa or Airtel Money. You will receive a push notification on your phone.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="tel"
                placeholder="255712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-ink-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {paying ? "Processing..." : `Pay ${formatTZS(sub.price_tzs)}`}
            </button>
          </div>
          {payError && <p className="mt-2 text-sm text-red-600">{payError}</p>}
          {paySuccess && <p className="mt-2 text-sm text-green-600">{paySuccess}</p>}
        </div>
      )}

      {/* Tier Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-ink-900">Payment History</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left">
                <th className="px-6 py-3 font-medium text-ink-500">Date</th>
                <th className="px-6 py-3 font-medium text-ink-500">Amount</th>
                <th className="px-6 py-3 font-medium text-ink-500">Phone</th>
                <th className="px-6 py-3 font-medium text-ink-500">Status</th>
                <th className="px-6 py-3 font-medium text-ink-500">Period</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-ink-50">
                  <td className="px-6 py-3 text-ink-700">{formatDate(p.created_at)}</td>
                  <td className="px-6 py-3 font-medium text-ink-900">{formatTZS(p.amount)}</td>
                  <td className="px-6 py-3 text-ink-600">{p.phone_number}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : p.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink-600">
                    {formatDate(p.period_start)} – {formatDate(p.period_end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-ink-400">
        Your tier updates automatically as you add units.
      </p>
    </div>
  );
}

function StatusBanner({ sub }: { sub: SubscriptionType }) {
  if (sub.status === "trial") {
    const days = daysUntil(sub.trial_ends_at);
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <Clock className="h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Free trial</p>
          <p className="text-sm text-blue-700">
            {days} day{days !== 1 ? "s" : ""} remaining in your free trial.
          </p>
        </div>
      </div>
    );
  }

  if (sub.status === "grace") {
    const days = daysUntil(sub.grace_ends_at);
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
        <div>
          <p className="text-sm font-semibold text-yellow-900">Grace period</p>
          <p className="text-sm text-yellow-700">
            Your subscription has expired. {days} day{days !== 1 ? "s" : ""} left before your
            account is restricted. Pay now to continue.
          </p>
        </div>
      </div>
    );
  }

  if (sub.status === "expired") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <XCircle className="h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-semibold text-red-900">Subscription expired</p>
          <p className="text-sm text-red-700">
            Your management features are restricted and listings are hidden. Pay now to reactivate.
          </p>
        </div>
      </div>
    );
  }

  if (sub.status === "active" && sub.current_period_end) {
    const days = daysUntil(sub.current_period_end);
    if (days <= 7) {
      return (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-900">Active</p>
            <p className="text-sm text-green-700">
              Your subscription renews in {days} day{days !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      );
    }
  }

  return null;
}
