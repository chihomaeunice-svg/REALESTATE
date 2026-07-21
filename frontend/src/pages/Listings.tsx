import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { DAR_DISTRICTS, PROPERTY_TYPES } from "../lib/constants";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink-900">Browse listings</h1>
      <p className="mt-1 text-ink-500">Every listing is free to post and shows a verification badge.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink-100">
        <SlidersHorizontal className="h-4 w-4 text-ink-400" />
        <select value={district} onChange={(e) => update("district", e.target.value)} className="input !w-auto">
          <option value="">All districts</option>
          {DAR_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={propertyType} onChange={(e) => update("property_type", e.target.value)} className="input !w-auto">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={purpose} onChange={(e) => update("purpose", e.target.value)} className="input !w-auto">
          <option value="">Rent or sale</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
        <input
          type="number"
          placeholder="Max price (TZS)"
          value={maxPrice}
          onChange={(e) => update("max_price", e.target.value)}
          className="input !w-auto"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink-400">Loading listings…</p>
        ) : listings.length === 0 ? (
          <p className="text-ink-400">No listings match those filters yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
