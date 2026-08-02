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
      className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        <img
          src={image}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <VerifiedBadge status={listing.verification} />
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <WishlistButton listingId={listing.id} />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800 backdrop-blur-sm">
            {listing.purpose === "rent" ? "For rent" : "For sale"}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-lg font-semibold text-ink-900">
          {formatTZS(listing.price)}
          {listing.price_period !== "total" && (
            <span className="text-sm font-normal text-ink-400"> /{listing.price_period}</span>
          )}
        </p>
        <h3 className="mt-1 line-clamp-1 text-sm text-ink-600">{listing.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-400">
          <MapPin className="h-3 w-3" />
          {listing.ward}, {listing.district}
        </p>
        <div className="mt-auto flex items-center gap-3 border-t border-ink-100/60 pt-3 mt-3 text-xs text-ink-500">
          <span className="rounded-md bg-ink-50 px-2 py-0.5 font-medium">
            {PROPERTY_TYPE_LABEL[listing.property_type] ?? listing.property_type}
          </span>
          {isLand ? (
            listing.land_size_acres && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3" /> {listing.land_size_acres} ac
              </span>
            )
          ) : listing.property_type !== "shop" && listing.property_type !== "office" ? (
            <>
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" /> {listing.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" /> {listing.bathrooms}
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
