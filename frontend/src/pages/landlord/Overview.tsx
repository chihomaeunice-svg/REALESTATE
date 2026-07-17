import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, Wallet, AlertTriangle } from "lucide-react";
import { api, type IncomeSummary, type Inquiry } from "../../lib/api";
import { StatTile } from "../../components/StatTile";
import { formatTZS, formatDate } from "../../lib/format";

export function Overview() {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    api.get<IncomeSummary>("/reports/summary").then(setSummary);
    api.get<Inquiry[]>("/inquiries").then((data) => setInquiries(data.slice(0, 6)));
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
    </div>
  );
}
