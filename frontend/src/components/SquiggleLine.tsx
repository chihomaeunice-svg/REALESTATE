import { useInView } from "../lib/useInView";

export function SquiggleLine({ className = "" }: { className?: string }) {
  const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.3 });
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <svg ref={ref} viewBox="0 0 300 120" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 90 C 60 10, 110 110, 160 40 S 260 10, 296 60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: reduced ? 0 : inView ? 0 : 1,
          transition: reduced ? "none" : "stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)",
        }}
      />
    </svg>
  );
}
