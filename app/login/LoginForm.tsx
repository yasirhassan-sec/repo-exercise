"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";

type Props = {
  t: Dict["login"];
  roles: { value: string; label: string }[];
  initialRole: string;
};

type Challenge = { challengeId: string; maskedPhone: string; demoOtp?: string };
type ErrorKey = keyof Dict["login"]["errors"];

function formatCnic(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

async function post<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: ErrorKey }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data.error as ErrorKey) ?? "unknown" };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "network" };
  }
}

export default function LoginForm({ t, roles, initialRole }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const message = (e: ErrorKey) => t.errors[e] ?? t.errors.unknown;

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{5}-\d{7}-\d$/.test(cnic) || !password) {
      setError("invalid_input");
      return;
    }
    setBusy(true);
    const r = await post<Challenge>("/api/auth/login", { cnic, password, role });
    setBusy(false);
    setPassword("");
    if (!r.ok) return setError(r.error);
    setOtp("");
    setChallenge(r.data);
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setBusy(true);
    const r = await post<{ ok: true }>("/api/auth/verify", { challengeId: challenge.challengeId, otp });
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      if (r.error === "otp_expired" || r.error === "otp_too_many") setChallenge(null);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  function restart() {
    setChallenge(null);
    setOtp("");
    setError(null);
  }

  const step = challenge ? 2 : 1;

  return (
    <div className="login">
      <h2>{challenge ? t.otpTitle : t.title}</h2>
      <ol className="stepper">
        <li className={step === 1 ? "on" : "done"} aria-current={step === 1 ? "step" : undefined}>1 · {t.step1}</li>
        <li className={step === 2 ? "on" : ""} aria-current={step === 2 ? "step" : undefined}>2 · {t.step2}</li>
      </ol>

      <div aria-live="assertive">
        {error && (
          <div className="alert alert-error" role="alert" tabIndex={-1} ref={errorRef}>
            {message(error)}
          </div>
        )}
      </div>

      {!challenge ? (
        <form className="form" onSubmit={submitPassword} noValidate>
          <div className="form-field">
            <label htmlFor="role">{t.role}</label>
            <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="cnic">{t.cnic}</label>
            <input
              id="cnic"
              name="username"
              dir="ltr"
              inputMode="numeric"
              autoComplete="username"
              placeholder="00000-0000000-0"
              className="mono"
              aria-describedby="cnic-hint"
              aria-invalid={error === "invalid_input" || error === "bad_credentials" || undefined}
              value={cnic}
              onChange={(e) => setCnic(formatCnic(e.target.value))}
              required
            />
            <span id="cnic-hint" className="hint">{t.cnicHint} <bdi dir="ltr" className="mono">12345-1234567-1</bdi></span>
          </div>
          <div className="form-field">
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              maxLength={256}
              aria-invalid={error === "bad_credentials" || undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-green btn-block" type="submit" disabled={busy}>
            {busy ? t.checking : t.continue}
          </button>
        </form>
      ) : (
        <form className="form" onSubmit={submitOtp} noValidate>
          <div className="alert alert-info" role="status">
            {t.otpSent} <bdi className="mono">{challenge.maskedPhone}</bdi>. {t.otpExpiry}
            {challenge.demoOtp && (
              <span className="demo-code"> {t.demoCode}: <bdi className="mono">{challenge.demoOtp}</bdi></span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="otp">{t.otp}</label>
            <input
              id="otp"
              dir="ltr"
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-invalid={error === "otp_wrong" || undefined}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              required
            />
          </div>
          <button className="btn btn-green btn-block" type="submit" disabled={busy || otp.length !== 6}>
            {busy ? t.verifying : t.verify}
          </button>
          <button type="button" className="link-btn" onClick={restart}>{t.restart}</button>
        </form>
      )}
    </div>
  );
}
