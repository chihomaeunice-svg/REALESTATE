import { BadgeCheck, Clock, ShieldQuestion } from "lucide-react";
import type { Verification } from "../lib/api";

export function VerifiedBadge({ status }: { status: Verification }) {
  if (status === "verified") {
    return (
      <span className="badge-verified">
        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
        Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sun-50 px-2.5 py-1 text-xs font-semibold text-sun-700 ring-1 ring-inset ring-sun-200">
        <Clock className="h-3.5 w-3.5" />
        Pending review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-500 ring-1 ring-inset ring-ink-200">
      <ShieldQuestion className="h-3.5 w-3.5" />
      Unverified
    </span>
  );
}
