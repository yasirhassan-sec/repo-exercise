import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { audit } from "./audit";
import { config } from "./config";
import { hit } from "./ratelimit";
import { deliverOtp } from "./sms";
import { ROLES, type Role, findUser, hashPassword } from "./users";

/**
 * Sign-in for the application layer: role-based access control, two factors
 * (password + one-time code sent by SMS), signed sessions and audit logging.
 */

export { ROLES, type Role };

export const SESSION_TTL_SECONDS = 30 * 60;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_PASSWORD_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;

/** Error codes returned by the API; the UI maps them to English or Urdu text. */
export type AuthError =
  | "invalid_input"
  | "bad_credentials"
  | "locked"
  | "rate_limited"
  | "sms_unavailable"
  | "otp_expired"
  | "otp_wrong"
  | "otp_too_many";

export type Session = { sub: string; name: string; role: Role; iat: number; exp: number; jti: string };

type Challenge = { cnic: string; otpHash: string; expiresAt: number; attempts: number };

type AuthState = {
  challenges: Map<string, Challenge>;
  failures: Map<string, { count: number; lockedUntil: number }>;
  revoked: Map<string, number>;
  secret: Buffer;
};

const g = globalThis as unknown as { __milkiyatAuth?: AuthState };

function store(): AuthState {
  if (!g.__milkiyatAuth) {
    const envSecret = process.env.SESSION_SECRET;
    if (config.isProduction && (!envSecret || envSecret.length < 32)) {
      throw new Error("SESSION_SECRET must be set to at least 32 characters in production");
    }
    g.__milkiyatAuth = {
      challenges: new Map(),
      failures: new Map(),
      revoked: new Map(),
      secret: envSecret ? Buffer.from(envSecret) : randomBytes(32),
    };
  }
  return g.__milkiyatAuth;
}

export function sessionCookieName(): string {
  // The __Host- prefix makes browsers refuse the cookie unless it is Secure, host-only and Path=/.
  return config.isProduction ? "__Host-milkiyat_session" : "milkiyat_session";
}

function hmac(data: string): string {
  return createHmac("sha256", store().secret).update(data).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function maskPhone(phone: string): string {
  return `${"*".repeat(Math.max(phone.length - 2, 0))}${phone.slice(-2)}`;
}

// Constant dummy salt so unknown CNICs cost the same scrypt work as real ones.
const DUMMY_SALT = "00000000000000000000000000000000";

export type PasswordStepResult =
  | { ok: true; challengeId: string; maskedPhone: string; demoOtp?: string }
  | { ok: false; status: number; error: AuthError };

/** Step 1: CNIC, password and role. On success, send a one-time code. */
export async function startLogin(cnic: string, password: string, role: string, ip: string): Promise<PasswordStepResult> {
  const s = store();

  if (!hit(`login-ip:${ip}`, 20, 15 * 60 * 1000)) {
    audit("login.rate_limited", cnic || "-", ip);
    return { ok: false, status: 429, error: "rate_limited" };
  }
  if (!CNIC_PATTERN.test(cnic) || !(ROLES as readonly string[]).includes(role) || !password || password.length > 256) {
    return { ok: false, status: 400, error: "invalid_input" };
  }

  const failure = s.failures.get(cnic);
  if (failure && failure.lockedUntil > Date.now()) {
    audit("login.locked", cnic, ip);
    return { ok: false, status: 429, error: "locked" };
  }

  const user = findUser(cnic);
  const passwordOk = safeEqualHex(hashPassword(password, user?.salt ?? DUMMY_SALT), user?.passwordHash ?? "00");
  // A wrong role gets the same answer as a wrong password, so the response never confirms a password.
  if (!user || !passwordOk || user.role !== role) {
    const count = (failure?.count ?? 0) + 1;
    const lock = count >= MAX_PASSWORD_FAILURES;
    s.failures.set(cnic, { count: lock ? 0 : count, lockedUntil: lock ? Date.now() + LOCKOUT_MS : 0 });
    audit(user && passwordOk ? "login.role_denied" : "login.password_failed", cnic, ip, `attempt ${count}${lock ? ", locked 15 min" : ""}`);
    return { ok: false, status: 401, error: "bad_credentials" };
  }

  if (!hit(`otp-send:${cnic}`, 5, 15 * 60 * 1000)) {
    audit("login.otp_rate_limited", cnic, ip);
    return { ok: false, status: 429, error: "rate_limited" };
  }

  s.failures.delete(cnic);
  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challengeId = randomBytes(24).toString("base64url");

  const delivery = await deliverOtp(user.phone, otp);
  if (!delivery.ok) {
    audit("login.sms_failed", cnic, ip);
    return { ok: false, status: 503, error: "sms_unavailable" };
  }

  // Expired challenges are dropped as new ones are created.
  const now = Date.now();
  for (const [id, c] of s.challenges) if (c.expiresAt < now) s.challenges.delete(id);
  s.challenges.set(challengeId, {
    cnic,
    otpHash: hmac(`${challengeId}:${otp}`),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
  });
  audit("login.otp_sent", cnic, ip, `to ${maskPhone(user.phone)}`);
  return { ok: true, challengeId, maskedPhone: maskPhone(user.phone), demoOtp: delivery.shownOnScreen };
}

export type OtpStepResult =
  | { ok: true; token: string; session: Session }
  | { ok: false; status: number; error: AuthError };

/** Step 2: the one-time code. Single use, 5 minutes, 5 attempts. */
export function completeLogin(challengeId: string, otp: string, ip: string): OtpStepResult {
  const s = store();
  if (!hit(`verify-ip:${ip}`, 30, 15 * 60 * 1000)) return { ok: false, status: 429, error: "rate_limited" };

  const challenge = s.challenges.get(challengeId);
  if (!challenge || challenge.expiresAt < Date.now()) {
    s.challenges.delete(challengeId);
    return { ok: false, status: 410, error: "otp_expired" };
  }
  if (!/^\d{6}$/.test(otp)) return { ok: false, status: 400, error: "invalid_input" };

  challenge.attempts += 1;
  if (!safeEqualHex(hmac(`${challengeId}:${otp}`), challenge.otpHash)) {
    audit("login.otp_failed", challenge.cnic, ip, `attempt ${challenge.attempts}`);
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      s.challenges.delete(challengeId);
      return { ok: false, status: 429, error: "otp_too_many" };
    }
    return { ok: false, status: 401, error: "otp_wrong" };
  }

  s.challenges.delete(challengeId);
  const user = findUser(challenge.cnic);
  if (!user) return { ok: false, status: 401, error: "bad_credentials" };

  const now = Math.floor(Date.now() / 1000);
  const session: Session = {
    sub: user.cnic,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: randomBytes(16).toString("base64url"),
  };
  audit("login.success", user.cnic, ip, `role ${user.role}`);
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { ok: true, token: `${payload}.${hmac(payload)}`, session };
}

export function verifySession(token: string | undefined): Session | null {
  if (!token || token.length > 2048) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined || !/^[0-9a-f]{64}$/.test(sig)) return null;
  if (!safeEqualHex(hmac(payload), sig)) return null;
  let session: Session;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof session.exp !== "number" || session.exp < now) return null;
  if (store().revoked.has(session.jti)) return null;
  if (!findUser(session.sub)) return null;
  return session;
}

/** Signs a session out on the server, so a copied cookie stops working too. */
export function revokeSession(session: Session) {
  const revoked = store().revoked;
  revoked.set(session.jti, session.exp);
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of revoked) if (exp < now) revoked.delete(jti);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: config.isProduction,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
