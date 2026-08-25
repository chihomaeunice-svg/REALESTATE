import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory cache to avoid await on hot paths (token checks).
const cache = new Map<string, string>();

export async function initStorage() {
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) cache.set(key, value);
  }
}

export function getCached(key: string): string | null {
  return cache.get(key) ?? null;
}

export async function setItem(key: string, value: string) {
  cache.set(key, value);
  await AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string) {
  cache.delete(key);
  await AsyncStorage.removeItem(key);
}

export async function getItem(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const value = await AsyncStorage.getItem(key);
  if (value !== null) cache.set(key, value);
  return value;
}
