import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ArrowCarousel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  }

  const arrowClass = dark
    ? "border-white/25 text-white hover:bg-white/10"
    : "border-ink-200 text-ink-600 hover:bg-ink-50";

  return (
    <div>
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
