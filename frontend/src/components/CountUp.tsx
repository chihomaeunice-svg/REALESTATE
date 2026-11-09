import { useEffect, useState } from "react";
import { useInView } from "../lib/useInView";

export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const scrambleMax = Math.max(value * 4, 30);
    let start: number | null = null;
    let raf: number;
    function tick(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      if (progress < 0.72) {
        setDisplay(Math.floor(Math.random() * scrambleMax));
      } else {
        const settle = (progress - 0.72) / 0.28;
        setDisplay(Math.round(settle * value));
      }
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
