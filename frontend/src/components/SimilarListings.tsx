import { useEffect, useState } from "react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "./ListingCard";

export function SimilarListings({ listing }: { listing: Listing }) {
  const [similar, setSimilar] = useState<Listing[]>([]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set("district", listing.district);
    query.set("property_type", listing.property_type);
    query.set("purpose", listing.purpose);
    query.set("min_price", String(Math.round(listing.price * 0.7)));
    query.set("max_price", String(Math.round(listing.price * 1.3)));

    api
      .get<Listing[]>(`/listings?${query.toString()}`)
      .then((results) => setSimilar(results.filter((l) => l.id !== listing.id).slice(0, 4)))
      .catch(() => setSimilar([]));
  }, [listing.id, listing.district, listing.property_type, listing.purpose, listing.price]);

  if (similar.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-ink-900">Similar listings</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {similar.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
