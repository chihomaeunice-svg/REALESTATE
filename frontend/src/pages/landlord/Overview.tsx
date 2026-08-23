import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, Wallet, AlertTriangle, Wrench } from "lucide-react";
import { api, type IncomeSummary, type Inquiry, type MaintenanceRequest } from "../../lib/api";
import { StatTile } from "../../components/StatTile";
import { formatTZS, formatDate } from "../../lib/format";

export function Overview() {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [maintRequests, setMaintRequests] = useState<MaintenanceRequest[]>([]);

  function loadMaintRequests() {
    api.get<MaintenanceRequest[]>("/maintenance-requests").then(setMaintRequests).catch(() => {});
  }
  useEffect(() => {
    api.get<IncomeSummary>("/reports/summary").then(setSummary);
    api.get<Inquiry[]>("/inquiries").then((data) => setInquiries(data.slice(0, 6)));
    loadMaintRequests();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">Overview</h1>
        <Link to="/landlord/properties" className="btn-primary">Add property</Link>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Units (occupied / total)" value={`${summary.occupied_units} / ${summary.total_units}`} icon={Building2} />
          <StatTile label="Active leases" value={String(summary.active_leases)} icon={Users} />
          <StatTile label="Collected this year" value={formatTZS(summary.collected_ytd)} icon={Wallet} />
          <StatTile
            label="Overdue"
            value={`${formatTZS(summary.overdue_amount)} (${summary.overdue_count})`}
            icon={AlertTriangle}
            tone={summary.overdue_count > 0 ? "warning" : "default"}
          />
        </div>
      )}

      <div className="mt-8 card p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Recent inquiries</h2>
        {inquiries.length === 0 ? (
          <p className="text-sm text-ink-400">No inquiries yet. Once your listings go live, seeker messages will appear here.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {inquiries.map((inq) => (
              <li key={inq.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-800">{inq.seeker_name} · {inq.seeker_phone}</p>
                  <p className="text-ink-400">{inq.listing_title}</p>
                </div>
                <span className="text-ink-400">{formatDate(inq.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
          <Wrench className="h-5 w-5 text-ink-400" /> Maintenance requests
        </h2>
        {maintRequests.length === 0 ? (
          <p className="text-sm text-ink-400">No maintenance requests. When tenants report issues, they will appear here.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {maintRequests.map((mr) => (
              <li key={mr.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-800">{mr.title}</p>
                  <p className="text-ink-400">{mr.tenant_name} · {mr.unit_label} · {mr.property_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    mr.priority === "urgent" || mr.priority === "high" ? "bg-red-50 text-red-700" : "bg-ink-100 text-ink-500"
                  }`}>{mr.priority}</span>
                  <select
                    className="rounded-lg border border-ink-200 px-2 py-1 text-xs"
                    value={mr.status}
                    onChange={async (e) => {
                      await api.patch(`/maintenance-requests/${mr.id}`, { status: e.target.value });
                      loadMaintRequests();
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
