import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

const STORAGE_KEY = "ny_wishlist";

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

interface WishlistContextValue {
  ids: Set<string>;
  has: (listingId: string) => boolean;
  toggle: (listingId: string) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => new Set(readLocal()));
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  // The moment a user logs in, merge whatever was saved anonymously into their
  // account so nothing gets lost across the login boundary, then treat the
  // backend as the source of truth going forward.
  useEffect(() => {
    if (authLoading || !user || synced) return;
    setLoading(true);
    const localIds = readLocal();
    api
      .post<string[]>("/favorites/sync", { listing_ids: localIds })
      .then((merged) => {
        setIds(new Set(merged));
        writeLocal(merged);
        setSynced(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, synced]);

  useEffect(() => {
    if (!user) setSynced(false);
  }, [user]);

  function has(listingId: string) {
    return ids.has(listingId);
  }

  function toggle(listingId: string) {
    const saving = !ids.has(listingId);
    setIds((prev) => {
      const next = new Set(prev);
      if (saving) next.add(listingId);
      else next.delete(listingId);
      if (!user) writeLocal([...next]);
      return next;
    });

    if (user) {
      if (saving) api.post("/favorites", { listing_id: listingId }).catch(() => {});
      else api.delete(`/favorites/${listingId}`).catch(() => {});
    }
  }

  return (
    <WishlistContext.Provider value={{ ids, has, toggle, loading }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
