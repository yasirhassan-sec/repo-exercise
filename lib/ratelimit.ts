type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __milkiyatRate?: Map<string, Bucket> };

/** Fixed-window limiter. Returns false once `limit` hits occur within `windowMs` for a key. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const buckets = (g.__milkiyatRate ??= new Map());
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 50_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function resetRateLimits() {
  g.__milkiyatRate?.clear();
}
