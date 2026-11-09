import { useInView } from "../lib/useInView";

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${
        inView ? "translate-y-0 scale-100 opacity-100" : "translate-y-10 scale-95 opacity-0"
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
