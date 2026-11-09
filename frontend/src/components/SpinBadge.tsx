import { ShieldCheck } from "lucide-react";

export function SpinBadge({
  text = "VERIFIED · DAR ES SALAAM · TRUSTED · ",
}: {
  text?: string;
}) {
  const pathId = "spin-badge-path";

  return (
    <div className="relative h-16 w-16 shrink-0 text-brand-600">
      <svg viewBox="0 0 100 100" className="h-full w-full animate-badge-spin">
        <path id={pathId} d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" fill="none" />
        <text fontSize="9" fontWeight="700" letterSpacing="1" fill="currentColor">
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 m-auto flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow">
        <ShieldCheck className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
