const STORAGE_KEY = "ny_recently_viewed";
const MAX_ENTRIES = 8;

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordView(listingId: string) {
  const ids = readIds().filter((id) => id !== listingId);
  ids.unshift(listingId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
}

export function getRecentlyViewedIds(excludeId?: string): string[] {
  return readIds().filter((id) => id !== excludeId);
}
