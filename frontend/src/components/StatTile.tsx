import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "warning";
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          tone === "warning" ? "bg-sun-50 text-sun-600" : "bg-brand-50 text-brand-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="truncate text-xl font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}
