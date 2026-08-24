import { Link } from "react-router-dom";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import type { Subscription } from "../lib/api";

function daysUntil(iso?: string): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionBanner({ sub }: { sub: Subscription }) {
  if (sub.status === "trial") {
    const days = daysUntil(sub.trial_ends_at);
    return (
      <Link
        to="/landlord/subscription"
        className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 transition hover:bg-blue-100"
      >
        <Clock className="h-4 w-4 shrink-0" />
        Free trial: {days} day{days !== 1 ? "s" : ""} remaining
      </Link>
    );
  }

  if (sub.status === "grace") {
    const days = daysUntil(sub.grace_ends_at);
    return (
      <Link
        to="/landlord/subscription"
        className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-800 transition hover:bg-yellow-100"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Subscription expired — {days} day{days !== 1 ? "s" : ""} left in grace period. Pay now.
      </Link>
    );
  }

  if (sub.status === "expired") {
    return (
      <Link
        to="/landlord/subscription"
        className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 transition hover:bg-red-100"
      >
        <XCircle className="h-4 w-4 shrink-0" />
        Subscription expired — features restricted. Pay to reactivate.
      </Link>
    );
  }

  return null;
}
