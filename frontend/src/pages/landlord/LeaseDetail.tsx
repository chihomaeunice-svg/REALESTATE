import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Banknote } from "lucide-react";
import { api, type Lease, type PaymentSchedule, type Payment } from "../../lib/api";
import { formatTZS, formatDate, formatDateTime } from "../../lib/format";
import { ScheduleTable } from "../../components/ScheduleTable";
import { PaymentHistoryList } from "../../components/PaymentHistoryList";

export function LeaseDetail() {
  const { id } = useParams();
  const [lease, setLease] = useState<Lease | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logging, setLogging] = useState<PaymentSchedule | null>(null);

  function load() {
    if (!id) return;
    api.get<Lease[]>("/leases").then((all) => setLease(all.find((l) => l.id === id) ?? null));
    api.get<PaymentSchedule[]>(`/leases/${id}/schedules`).then(setSchedules);
    api.get<Payment[]>(`/leases/${id}/payments`).then(setPayments);
  }
  useEffect(load, [id]);

  if (!lease) return <div className="text-ink-400">Loading lease…</div>;

  return (
    <div>
      <Link to="/landlord/leases" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to leases
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{lease.tenant_name}</h1>
          <p className="text-ink-500">{lease.property_title} · {lease.unit_label}</p>
        </div>
        <a href={`/api/leases/${lease.id}/document`} target="_blank" rel="noreferrer" className="btn-secondary">
          <FileText className="h-4 w-4" /> View lease document
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="Rent" value={`${formatTZS(lease.rent_amount)}/mo`} />
        <Fact label="Advance block" value={`${lease.advance_months} months`} />
        <Fact label="Term" value={`${formatDate(lease.start_date)} – ${formatDate(lease.end_date)}`} />
        <Fact label="Status" value={lease.status} />
      </div>

      <div className="mt-4 card p-4 text-sm">
        {lease.tenant_signed_at ? (
          <p className="text-brand-700">
            Signed by {lease.tenant_signature_name} on {formatDateTime(lease.tenant_signed_at)} (IP {lease.tenant_signature_ip})
          </p>
        ) : (
          <p className="text-sun-700">Awaiting tenant e-signature. Ask them to log in and sign from their portal.</p>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment schedule</h2>
        <ScheduleTable schedules={schedules} onPay={(s) => setLogging(s)} />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment history</h2>
        <PaymentHistoryList payments={payments} />
      </div>

      {logging && (
        <LogPaymentModal
          leaseId={lease.id}
          schedule={logging}
          onClose={() => setLogging(null)}
          onDone={() => { setLogging(null); load(); }}
        />
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function LogPaymentModal({
  leaseId,
  schedule,
  onClose,
  onDone,
}: {
  leaseId: string;
  schedule: PaymentSchedule;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(schedule.amount_due);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/payments/manual", { lease_id: leaseId, schedule_id: schedule.id, amount });
      onDone();
    } catch {
      setError("Could not log payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
          <Banknote className="h-5 w-5 text-brand-600" /> Log cash/bank payment
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Period {formatDate(schedule.period_start)} – {formatDate(schedule.period_end)}
        </p>
        <div className="mt-4">
          <label className="label">Amount received (TZS)</label>
          <input type="number" required className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? "Logging…" : "Log payment"}</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
