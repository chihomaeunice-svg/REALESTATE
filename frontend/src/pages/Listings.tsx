import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";
import { LISTING_GRID_CLASS } from "../lib/theme";

export function Listings() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const district = params.get("district") ?? "";
  const propertyType = params.get("property_type") ?? "";
  const purpose = params.get("purpose") ?? "";
  const maxPrice = params.get("max_price") ?? "";

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (district) query.set("district", district);
    if (propertyType) query.set("property_type", propertyType);
    if (purpose) query.set("purpose", purpose);
    if (maxPrice) query.set("max_price", maxPrice);
    api
      .get<Listing[]>(`/listings?${query.toString()}`)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [district, propertyType, purpose, maxPrice]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const activeFilters = [district, propertyType, purpose, maxPrice].filter(Boolean).length;

  function clearAll() {
    setParams(new URLSearchParams());
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Browse listings</h1>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? "Searching..." : `${listings.length} propert${listings.length === 1 ? "y" : "ies"} found`}
          </p>
        </div>
        {activeFilters > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SlidersHorizontal className="h-4 w-4 text-ink-400" />
        <select value={district} onChange={(e) => update("district", e.target.value)} className="input !w-auto !py-2">
          <option value="">All districts</option>
          {DAR_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={propertyType} onChange={(e) => update("property_type", e.target.value)} className="input !w-auto !py-2">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={purpose} onChange={(e) => update("purpose", e.target.value)} className="input !w-auto !py-2">
          <option value="">Rent or sale</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => update("max_price", e.target.value)}
          className="input !w-32 !py-2"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className={LISTING_GRID_CLASS}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-ink-100" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-24 rounded bg-ink-100" />
                  <div className="h-4 w-40 rounded bg-ink-100" />
                  <div className="h-3 w-32 rounded bg-ink-100" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-ink-400">No listings match those filters.</p>
            <p className="mt-1 text-sm text-ink-400">Try broadening your search or clearing filters.</p>
          </div>
        ) : (
          <div className={LISTING_GRID_CLASS}>
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
