import { useEffect, useState } from "react";
import { api, type Listing } from "../lib/api";
import { getRecentlyViewedIds } from "../lib/recently-viewed";
import { ListingCard } from "./ListingCard";

export function RecentlyViewedStrip({ excludeId, title = "Recently viewed" }: { excludeId?: string; title?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const ids = getRecentlyViewedIds(excludeId);
    if (ids.length === 0) {
      setListings([]);
      return;
    }
    Promise.all(ids.map((id) => api.get<Listing>(`/listings/${id}`).catch(() => null))).then((results) => {
      setListings(results.filter((l): l is Listing => l !== null));
    });
  }, [excludeId]);

  if (listings.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {listings.map((l) => (
          <div key={l.id} className="w-64 shrink-0">
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
    </section>
  );
}
