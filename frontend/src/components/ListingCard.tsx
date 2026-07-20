import { Link } from "react-router-dom";
import { BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import type { Listing } from "../lib/api";
import { formatTZS } from "../lib/format";
import { VerifiedBadge } from "./VerifiedBadge";
import { WishlistButton } from "./WishlistButton";
import { PROPERTY_TYPE_LABEL, NO_UNIT_TYPES } from "../lib/constants";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0] ?? placeholderFor(listing.id);
  const isLand = NO_UNIT_TYPES.has(listing.property_type);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        <img
          src={image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <VerifiedBadge status={listing.verification} />
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <WishlistButton listingId={listing.id} />
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-white">
          {listing.purpose === "rent" ? "For rent" : "For sale"}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-lg font-semibold text-ink-900">
          {formatTZS(listing.price)}
          {listing.price_period !== "total" && (
            <span className="text-sm font-normal text-ink-400">/{listing.price_period}</span>
          )}
        </p>
        <h3 className="line-clamp-1 text-sm font-medium text-ink-700">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-ink-400">
          <MapPin className="h-3.5 w-3.5" />
          {listing.ward}, {listing.district}
        </p>
        <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-ink-500">
          <span className="rounded-md bg-ink-50 px-2 py-1 font-medium">
            {PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type}
          </span>
          {isLand ? (
            listing.land_size_acres && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" /> {listing.land_size_acres} acres
              </span>
            )
          ) : listing.property_type !== "shop" && listing.property_type !== "office" ? (
            <>
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" /> {listing.bathrooms}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function placeholderFor(seed: string) {
  return `https://picsum.photos/seed/${seed}/900/600`;
}
