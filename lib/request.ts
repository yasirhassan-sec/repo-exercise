import { config } from "./config";

/** Client IP for rate limiting and the audit log. */
export function clientIp(req: Request): string {
  if (config.trustProxy) {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
  }
  return "direct";
}

/**
 * Rejects cross-site POSTs (CSRF). Browsers send Origin on POST; it must match this host.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = (config.trustProxy && req.headers.get("x-forwarded-host")) || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
