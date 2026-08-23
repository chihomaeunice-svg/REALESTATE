import { getItem, setItem } from "./storage";

const STORAGE_KEY = "ny_recently_viewed";
const MAX_ENTRIES = 8;

async function readIds(): Promise<string[]> {
  try {
    const raw = await getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function recordView(listingId: string) {
  const ids = (await readIds()).filter((id) => id !== listingId);
  ids.unshift(listingId);
  await setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
}

export async function getRecentlyViewedIds(excludeId?: string): Promise<string[]> {
  const ids = await readIds();
  return ids.filter((id) => id !== excludeId);
}
