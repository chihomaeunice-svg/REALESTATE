import { useEffect, useState } from "react";
import { useInView } from "../lib/useInView";

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    let raf: number;
    function tick(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration]);

  return <span ref={ref}>{display}</span>;
}
