import { Link } from "react-router-dom";
import type { Listing } from "../lib/api";
import { useCurrency } from "../lib/currency-context";

export function FeaturedListingTile({ listing }: { listing: Listing }) {
  const { format } = useCurrency();
  const image = listing.images?.[0] ?? `https://picsum.photos/seed/${listing.id}/700/900`;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex w-56 shrink-0 flex-col sm:w-64"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-brand-900">
        <img
          src={image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-sun-500 px-2.5 py-1 text-xs font-semibold text-ink-950">
          {format(listing.price)}
          {listing.price_period !== "total" && <span className="font-normal">/{listing.price_period}</span>}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{listing.ward}, {listing.district}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-brand-300/80">{listing.title}</p>
    </Link>
  );
}
