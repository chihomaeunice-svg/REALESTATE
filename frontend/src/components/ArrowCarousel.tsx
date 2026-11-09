import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ArrowCarousel({
  children,
  dark = false,
  autoPlay = true,
  interval = 3800,
}: {
  children: React.ReactNode;
  dark?: boolean;
  autoPlay?: boolean;
  interval?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  }

  useEffect(() => {
    if (!autoPlay || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => scroll(1), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, paused, interval]);

  const arrowClass = dark
    ? "border-white/25 text-white hover:bg-white/10"
    : "border-ink-200 text-ink-600 hover:bg-ink-50";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${arrowClass}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${arrowClass}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
