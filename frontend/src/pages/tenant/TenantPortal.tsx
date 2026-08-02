import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, MapPin, Smartphone, UserCircle2 } from "lucide-react";
import { api, type Lease, type PaymentSchedule, type Payment } from "../../lib/api";
import { formatTZS, formatDate, formatDateTime } from "../../lib/format";
import { ScheduleTable } from "../../components/ScheduleTable";
import { PaymentHistoryList } from "../../components/PaymentHistoryList";
import { useAuth } from "../../lib/auth-context";

export function TenantPortal() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [activeLeaseId, setActiveLeaseId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paying, setPaying] = useState<PaymentSchedule | null>(null);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState(user?.full_name ?? "");

  function loadLeases() {
    api.get<Lease[]>("/tenant/leases").then((data) => {
      setLeases(data);
      if (data.length > 0 && !activeLeaseId) setActiveLeaseId(data[0].id);
    });
  }
  useEffect(loadLeases, []);

  function loadDetail(leaseId: string) {
    api.get<PaymentSchedule[]>(`/leases/${leaseId}/schedules`).then(setSchedules);
    api.get<Payment[]>(`/leases/${leaseId}/payments`).then(setPayments);
  }
  useEffect(() => {
    if (activeLeaseId) loadDetail(activeLeaseId);
  }, [activeLeaseId]);

  const lease = leases.find((l) => l.id === activeLeaseId);

  async function handleSign() {
    if (!lease) return;
    setSigning(true);
    try {
      await api.post(`/leases/${lease.id}/sign`, { signature_name: signatureName });
      loadLeases();
    } finally {
      setSigning(false);
    }
  }

  if (leases.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">No lease yet</h1>
        <p className="mt-2 text-ink-500">
          Once your landlord creates a lease for you using this phone number, it will show up here.
        </p>
        <Link to="/tenant/profile" className="btn-primary mt-6 inline-flex">
          <UserCircle2 className="h-4 w-4" /> Set up your profile now
        </Link>
        <p className="mt-2 text-xs text-ink-400">
          Landlords can find your details instantly when drafting a lease if you fill this in ahead of time.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">My rental</h1>
        <Link to="/tenant/profile" className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <UserCircle2 className="h-4 w-4" /> My profile
        </Link>
      </div>

      {leases.length > 1 && (
        <select className="input mb-6 !w-auto" value={activeLeaseId ?? ""} onChange={(e) => setActiveLeaseId(e.target.value)}>
          {leases.map((l) => (
            <option key={l.id} value={l.id}>{l.property_title} — {l.unit_label}</option>
          ))}
        </select>
      )}

      {lease && (
        <>
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{lease.property_title} · {lease.unit_label}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                  <MapPin className="h-3.5 w-3.5" /> {lease.ward}, {lease.district}
                </p>
              </div>
              <a href={`/api/leases/${lease.id}/document`} target="_blank" rel="noreferrer" className="btn-secondary">
                <FileText className="h-4 w-4" /> View lease document
              </a>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact label="Rent" value={`${formatTZS(lease.rent_amount)}/mo`} />
              <Fact label="Advance block" value={`${lease.advance_months} months`} />
              <Fact label="Term" value={`${formatDate(lease.start_date)} – ${formatDate(lease.end_date)}`} />
              <Fact label="Status" value={lease.status} />
            </div>

            <div className="mt-4 rounded-xl bg-ink-50 p-4 text-sm">
              {lease.tenant_signed_at ? (
                <p className="text-brand-700">
                  You signed this lease on {formatDateTime(lease.tenant_signed_at)}.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sun-700">Please review the lease document, then sign electronically:</p>
                  <input className="input !w-auto" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Type your full name" />
                  <button onClick={handleSign} disabled={signing || !signatureName} className="btn-primary">
                    {signing ? "Signing…" : "Sign lease"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 card p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment schedule</h2>
            <ScheduleTable schedules={schedules} onPay={(s) => setPaying(s)} />
          </div>

          <div className="mt-6 card p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment history</h2>
            <PaymentHistoryList payments={payments} />
          </div>
        </>
      )}

      {paying && lease && (
        <PayModal
          leaseId={lease.id}
          schedule={paying}
          onClose={() => setPaying(null)}
          onDone={() => { setPaying(null); loadDetail(lease.id); }}
        />
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function PayModal({
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
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [stage, setStage] = useState<"form" | "pushing" | "done">("form");
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStage("pushing");
    try {
      const res = await api.post<{ mpesa_receipt: string }>("/payments/mpesa/stk-push", {
        lease_id: leaseId,
        schedule_id: schedule.id,
        amount: schedule.amount_due,
        phone_number: phone,
      });
      setReceipt(res.mpesa_receipt);
      setStage("done");
    } catch {
      setError("Payment failed. Please try again.");
      setStage("form");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
        {stage === "done" ? (
          <div className="text-center">
            <p className="mb-2 text-4xl">✅</p>
            <h3 className="text-lg font-semibold text-ink-900">Payment confirmed</h3>
            <p className="mt-1 text-sm text-ink-500">M-Pesa receipt: <span className="font-mono">{receipt}</span></p>
            <p className="mt-1 text-sm text-ink-500">An SMS receipt has been sent to your phone.</p>
            <button onClick={onDone} className="btn-primary mt-5 w-full">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Smartphone className="h-5 w-5 text-brand-600" /> Pay with M-Pesa
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Amount due: <span className="font-semibold">{formatTZS(schedule.amount_due)}</span>
            </p>
            <div className="mt-4">
              <label className="label">M-Pesa phone number</label>
              <input required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={stage === "pushing"} className="btn-primary flex-1">
                {stage === "pushing" ? "Confirming on your phone…" : "Send STK push"}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Sandbox mode: this simulates the M-Pesa PIN prompt and confirms instantly.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
