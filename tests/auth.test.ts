import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const IP = "203.0.113.7";
const CITIZEN = { cnic: "35202-1234567-1", password: "Citizen@123" };

async function freshModules() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "milkiyat-test-"));
  vi.stubEnv("MILKIYAT_DATA_DIR", dir);
  vi.stubEnv("MILKIYAT_DEMO_MODE", "true");
  const g = globalThis as Record<string, unknown>;
  for (const k of ["__milkiyatAuth", "__milkiyatUsers", "__milkiyatAudit", "__milkiyatRate"]) delete g[k];
  vi.resetModules();
  const auth = await import("@/lib/auth");
  const audit = await import("@/lib/audit");
  return { auth, audit, dir };
}

async function signIn(auth: Awaited<ReturnType<typeof freshModules>>["auth"]) {
  const step1 = await auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
  if (!step1.ok) throw new Error(step1.error);
  const step2 = auth.completeLogin(step1.challengeId, step1.demoOtp!, IP);
  if (!step2.ok) throw new Error(step2.error);
  return step2;
}

describe("sign-in", () => {
  let m: Awaited<ReturnType<typeof freshModules>>;
  beforeEach(async () => { m = await freshModules(); });

  it("rejects malformed input", async () => {
    const r = await m.auth.startLogin("123", "x", "citizen", IP);
    expect(r).toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("gives the same answer for a wrong password, an unknown CNIC and a wrong role", async () => {
    const wrongPw = await m.auth.startLogin(CITIZEN.cnic, "nope", "citizen", IP);
    const unknown = await m.auth.startLogin("11111-1111111-1", "whatever", "citizen", IP);
    const wrongRole = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "registrar", IP);
    for (const r of [wrongPw, unknown, wrongRole]) expect(r).toMatchObject({ ok: false, status: 401, error: "bad_credentials" });
  });

  it("locks the account after 5 wrong passwords", async () => {
    for (let i = 0; i < 5; i++) await m.auth.startLogin(CITIZEN.cnic, "wrong", "citizen", IP);
    const r = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
    expect(r).toMatchObject({ ok: false, error: "locked" });
  });

  it("issues a session only after the correct one-time code", async () => {
    const s1 = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;
    const wrong = s1.demoOtp === "000000" ? "111111" : "000000";
    expect(m.auth.completeLogin(s1.challengeId, wrong, IP)).toMatchObject({ ok: false, error: "otp_wrong" });
    const ok = m.auth.completeLogin(s1.challengeId, s1.demoOtp!, IP);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(m.auth.verifySession(ok.token)?.role).toBe("citizen");
  });

  it("does not accept a one-time code twice", async () => {
    const s1 = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
    if (!s1.ok) throw new Error();
    expect(m.auth.completeLogin(s1.challengeId, s1.demoOtp!, IP).ok).toBe(true);
    expect(m.auth.completeLogin(s1.challengeId, s1.demoOtp!, IP)).toMatchObject({ ok: false, error: "otp_expired" });
  });

  it("cancels the code after 5 wrong attempts", async () => {
    const s1 = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
    if (!s1.ok) throw new Error();
    const wrong = s1.demoOtp === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i++) m.auth.completeLogin(s1.challengeId, wrong, IP);
    expect(m.auth.completeLogin(s1.challengeId, wrong, IP)).toMatchObject({ error: "otp_too_many" });
    expect(m.auth.completeLogin(s1.challengeId, s1.demoOtp!, IP)).toMatchObject({ error: "otp_expired" });
  });

  it("rejects a code after it expires", async () => {
    vi.useFakeTimers();
    try {
      const s1 = await m.auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
      if (!s1.ok) throw new Error();
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      expect(m.auth.completeLogin(s1.challengeId, s1.demoOtp!, IP)).toMatchObject({ error: "otp_expired" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rate-limits sign-in attempts per IP", async () => {
    let last;
    for (let i = 0; i < 21; i++) last = await m.auth.startLogin("11111-1111111-1", "x", "citizen", IP);
    expect(last).toMatchObject({ error: "rate_limited" });
  });
});

describe("sessions", () => {
  let m: Awaited<ReturnType<typeof freshModules>>;
  beforeEach(async () => { m = await freshModules(); });

  it("rejects a tampered token", async () => {
    const { token } = await signIn(m.auth);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), role: "administrator" })).toString("base64url");
    expect(m.auth.verifySession(`${forged}.${sig}`)).toBeNull();
    expect(m.auth.verifySession(`${payload}.${"0".repeat(64)}`)).toBeNull();
    expect(m.auth.verifySession("garbage")).toBeNull();
  });

  it("stops accepting a token after sign-out", async () => {
    const { token, session } = await signIn(m.auth);
    expect(m.auth.verifySession(token)).not.toBeNull();
    m.auth.revokeSession(session);
    expect(m.auth.verifySession(token)).toBeNull();
  });

  it("expires after 30 minutes", async () => {
    vi.useFakeTimers();
    try {
      const { token } = await signIn(m.auth);
      vi.advanceTimersByTime(30 * 60 * 1000 + 1000);
      expect(m.auth.verifySession(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("audit log", () => {
  let m: Awaited<ReturnType<typeof freshModules>>;
  beforeEach(async () => { m = await freshModules(); });

  it("records sign-in events in an intact hash chain", async () => {
    await m.auth.startLogin(CITIZEN.cnic, "wrong", "citizen", IP);
    await signIn(m.auth);
    const events = m.audit.recentAudit(CITIZEN.cnic).map((e) => e.event);
    expect(events).toEqual(["login.success", "login.otp_sent", "login.password_failed"]);
    expect(m.audit.verifyAuditChain()).toMatchObject({ ok: true, entries: 3 });
  });

  it("detects an edited entry", async () => {
    await signIn(m.auth);
    const file = path.join(m.dir, "audit.log");
    const lines = fs.readFileSync(file, "utf8").trim().split("\n");
    lines[0] = lines[0].replace("login.otp_sent", "login.success");
    fs.writeFileSync(file, lines.join("\n") + "\n");
    expect(m.audit.verifyAuditChain()).toMatchObject({ ok: false, brokenAt: 1 });
  });

  it("detects a deleted entry", async () => {
    await signIn(m.auth);
    const file = path.join(m.dir, "audit.log");
    const lines = fs.readFileSync(file, "utf8").trim().split("\n");
    fs.writeFileSync(file, lines.slice(1).join("\n") + "\n");
    expect(m.audit.verifyAuditChain().ok).toBe(false);
  });
});

describe("demo mode off", () => {
  it("has no built-in accounts", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "milkiyat-test-"));
    vi.stubEnv("MILKIYAT_DATA_DIR", dir);
    vi.stubEnv("MILKIYAT_DEMO_MODE", "false");
    for (const k of ["__milkiyatAuth", "__milkiyatUsers", "__milkiyatAudit", "__milkiyatRate"]) delete (globalThis as Record<string, unknown>)[k];
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const r = await auth.startLogin(CITIZEN.cnic, CITIZEN.password, "citizen", IP);
    expect(r).toMatchObject({ ok: false, error: "bad_credentials" });
  });
});
