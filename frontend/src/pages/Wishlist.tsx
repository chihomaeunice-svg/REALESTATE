import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { api, type Listing } from "../lib/api";
import { ListingCard } from "../components/ListingCard";
import { useWishlist } from "../lib/wishlist-context";
import { useAuth } from "../lib/auth-context";

export function Wishlist() {
  const { user } = useAuth();
  const { ids } = useWishlist();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (user) {
      api.get<Listing[]>("/favorites").then((data) => {
        setListings(data);
        setLoading(false);
      });
      return;
    }
    if (ids.size === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    Promise.all([...ids].map((id) => api.get<Listing>(`/listings/${id}`).catch(() => null)))
      .then((results) => setListings(results.filter((l): l is Listing => l !== null)))
      .finally(() => setLoading(false));
  }, [user, ids]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900">
        <Heart className="h-6 w-6 text-red-500" /> Your wishlist
      </h1>
      <p className="mt-1 text-ink-500">
        {user
          ? "Saved to your account — available on any device you log into."
          : "Saved on this device. Log in to keep your wishlist across devices."}
      </p>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink-400">Loading…</p>
        ) : listings.length === 0 ? (
          <p className="text-ink-400">Nothing saved yet — tap the heart on any listing to add it here.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
