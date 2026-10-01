import {
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/**
 * Authentication for Milkiyat's application layer: role-based access control,
 * a two-factor sign-in (password + one-time code), signed session tokens and an
 * audit log, as described in the framework's security layer.
 *
 * Storage is in memory for this prototype. Swap the `users`, `challenges` and
 * `auditLog` stores for persistent ones before deploying.
 */

export const ROLES = ["citizen", "surveyor", "registrar", "administrator"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  citizen: "Citizen / landowner",
  surveyor: "Surveyor",
  registrar: "Registrar",
  administrator: "Administrator",
};

export const SESSION_COOKIE = "milkiyat_session";
export const SESSION_TTL_SECONDS = 30 * 60;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_PASSWORD_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;

type User = {
  cnic: string;
  name: string;
  role: Role;
  phone: string;
  salt: string;
  passwordHash: string;
};

type Challenge = {
  cnic: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
};

export type AuditEntry = {
  at: string;
  event: string;
  cnic: string;
  detail?: string;
};

export type Session = {
  sub: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
  jti: string;
};

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function makeUser(cnic: string, name: string, role: Role, phone: string, password: string): User {
  const salt = randomBytes(16).toString("hex");
  return { cnic, name, role, phone, salt, passwordHash: hashPassword(password, salt) };
}

// Demo accounts, one per role. Passwords are hashed at start-up and never stored in plain text.
export const DEMO_ACCOUNTS: { cnic: string; password: string; role: Role }[] = [
  { cnic: "35202-1234567-1", password: "Citizen@123", role: "citizen" },
  { cnic: "35202-2345678-2", password: "Surveyor@123", role: "surveyor" },
  { cnic: "35202-3456789-3", password: "Registrar@123", role: "registrar" },
  { cnic: "35202-4567890-4", password: "Admin@123", role: "administrator" },
];

type Store = {
  users: Map<string, User>;
  challenges: Map<string, Challenge>;
  failures: Map<string, { count: number; lockedUntil: number }>;
  auditLog: AuditEntry[];
  secret: Buffer;
};

const globalStore = globalThis as unknown as { __milkiyatAuth?: Store };

function store(): Store {
  if (!globalStore.__milkiyatAuth) {
    const names: Record<Role, string> = {
      citizen: "Ayesha Khan",
      surveyor: "Bilal Ahmed",
      registrar: "Sana Malik",
      administrator: "Usman Raza",
    };
    const users = new Map<string, User>();
    DEMO_ACCOUNTS.forEach((a, i) => {
      users.set(a.cnic, makeUser(a.cnic, names[a.role], a.role, `0300-00000${i}${i + 1}`, a.password));
    });
    const envSecret = process.env.SESSION_SECRET;
    if (!envSecret && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    globalStore.__milkiyatAuth = {
      users,
      challenges: new Map(),
      failures: new Map(),
      auditLog: [],
      secret: envSecret ? Buffer.from(envSecret) : randomBytes(32),
    };
  }
  return globalStore.__milkiyatAuth;
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function sha256Hmac(data: string): string {
  return createHmac("sha256", store().secret).update(data).digest("hex");
}

export function audit(event: string, cnic: string, detail?: string) {
  const log = store().auditLog;
  log.push({ at: new Date().toISOString(), event, cnic, detail });
  if (log.length > 1000) log.shift();
}

export function recentAudit(cnic: string, limit = 8): AuditEntry[] {
  return store()
    .auditLog.filter((e) => e.cnic === cnic)
    .slice(-limit)
    .reverse();
}

function maskPhone(phone: string): string {
  return `****-***${phone.slice(-2)}`;
}

export type PasswordStepResult =
  | { ok: true; challengeId: string; maskedPhone: string; devOtp?: string }
  | { ok: false; status: number; error: string };

/** Step 1: check CNIC, password and role (RBAC). On success, issue a one-time code. */
export function startLogin(cnic: string, password: string, role: string): PasswordStepResult {
  const s = store();
  const generic = { ok: false as const, status: 401, error: "CNIC, password or role is incorrect." };

  if (!CNIC_PATTERN.test(cnic) || !(ROLES as readonly string[]).includes(role) || !password) {
    return { ok: false, status: 400, error: "Enter a valid CNIC (XXXXX-XXXXXXX-X), password and role." };
  }

  const failure = s.failures.get(cnic);
  if (failure && failure.lockedUntil > Date.now()) {
    audit("login.blocked", cnic, "account temporarily locked");
    return { ok: false, status: 429, error: "Too many failed attempts. Try again in 15 minutes." };
  }

  const user = s.users.get(cnic);
  // Hash even when the user is unknown so response time doesn't reveal which CNICs exist.
  const candidate = hashPassword(password, user?.salt ?? "0".repeat(32));
  const passwordOk = !!user && safeEqualHex(candidate, user.passwordHash);

  if (!passwordOk) {
    const count = (failure?.count ?? 0) + 1;
    s.failures.set(cnic, {
      count: count >= MAX_PASSWORD_FAILURES ? 0 : count,
      lockedUntil: count >= MAX_PASSWORD_FAILURES ? Date.now() + LOCKOUT_MS : 0,
    });
    audit("login.password_failed", cnic, `attempt ${count}`);
    return generic;
  }

  if (user.role !== role) {
    audit("login.role_denied", cnic, `requested ${role}, holds ${user.role}`);
    return { ok: false, status: 403, error: "Access denied: this account does not hold the selected role." };
  }

  s.failures.delete(cnic);
  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challengeId = randomBytes(24).toString("base64url");
  s.challenges.set(challengeId, {
    cnic,
    otpHash: sha256Hmac(`${challengeId}:${otp}`),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  audit("login.otp_sent", cnic, `to ${maskPhone(user.phone)}`);

  // There is no SMS gateway in this prototype; outside production the code is returned so it can be shown on screen.
  const devOtp = process.env.NODE_ENV !== "production" ? otp : undefined;
  return { ok: true, challengeId, maskedPhone: maskPhone(user.phone), devOtp };
}

export type OtpStepResult =
  | { ok: true; token: string; session: Session }
  | { ok: false; status: number; error: string };

/** Step 2: check the one-time code. Each code works once, expires in 5 minutes, and allows 5 tries. */
export function completeLogin(challengeId: string, otp: string): OtpStepResult {
  const s = store();
  const challenge = s.challenges.get(challengeId);
  if (!challenge || challenge.expiresAt < Date.now()) {
    s.challenges.delete(challengeId);
    return { ok: false, status: 410, error: "This code has expired. Sign in again to get a new one." };
  }
  if (!/^\d{6}$/.test(otp)) {
    return { ok: false, status: 400, error: "Enter the 6-digit code." };
  }

  challenge.attempts += 1;
  if (!safeEqualHex(sha256Hmac(`${challengeId}:${otp}`), challenge.otpHash)) {
    audit("login.otp_failed", challenge.cnic, `attempt ${challenge.attempts}`);
    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      s.challenges.delete(challengeId);
      return { ok: false, status: 429, error: "Too many wrong codes. Sign in again." };
    }
    return { ok: false, status: 401, error: "That code is not correct." };
  }

  s.challenges.delete(challengeId);
  const user = s.users.get(challenge.cnic)!;
  const now = Math.floor(Date.now() / 1000);
  const session: Session = {
    sub: user.cnic,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: randomBytes(12).toString("base64url"),
  };
  audit("login.success", user.cnic, `role ${user.role}`);
  return { ok: true, token: signSession(session), session };
}

function signSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sha256Hmac(payload)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !/^[0-9a-f]{64}$/.test(sig)) return null;
  if (!safeEqualHex(sha256Hmac(payload), sig)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
