import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";
import { getItem, setItem } from "./storage";

const STORAGE_KEY = "ny_wishlist";

async function readLocal(): Promise<string[]> {
  try {
    const raw = await getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLocal(ids: string[]) {
  await setItem(STORAGE_KEY, JSON.stringify(ids));
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
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load local wishlist on mount
  useEffect(() => {
    readLocal().then((localIds) => {
      setIds(new Set(localIds));
      setInitialized(true);
    });
  }, []);

  // Sync with backend when user logs in
  useEffect(() => {
    if (authLoading || !user || synced || !initialized) return;
    setLoading(true);
    readLocal()
      .then((localIds) => api.post<string[]>("/favorites/sync", { listing_ids: localIds }))
      .then((merged) => {
        setIds(new Set(merged));
        writeLocal(merged);
        setSynced(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, synced, initialized]);

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
    <WishlistContext.Provider value={{ ids, has, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
