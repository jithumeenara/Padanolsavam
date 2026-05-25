const store = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export function getCache<T>(key: string): T | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) { store.delete(key); return null; }
  return e.data as T;
}

export function setCache(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

export function bustCache(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

export function clearCache(): void {
  store.clear();
}
