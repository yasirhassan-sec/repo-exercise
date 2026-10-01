"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { roles: { value: string; label: string }[]; initialRole?: string };

type Challenge = { challengeId: string; maskedPhone: string; devOtp?: string };

function formatCnic(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

async function post<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Something went wrong. Try again." };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Can't reach the server. Check your connection." };
  }
}

export default function LoginForm({ roles, initialRole }: Props) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole ?? roles[0]?.value ?? "citizen");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{5}-\d{7}-\d$/.test(cnic)) {
      setError("Enter your CNIC as XXXXX-XXXXXXX-X.");
      return;
    }
    setBusy(true);
    const r = await post<Challenge>("/api/auth/login", { cnic, password, role });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setPassword("");
    setOtp("");
    setChallenge(r.data);
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    setBusy(true);
    const r = await post<{ role: string }>("/api/auth/verify", { challengeId: challenge.challengeId, otp });
    if (!r.ok) {
      setBusy(false);
      setError(r.error);
      if (/again/i.test(r.error)) setChallenge(null);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  function startOver() {
    setChallenge(null);
    setOtp("");
    setError(null);
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2>{challenge ? "Enter your one-time code" : "Sign in"}</h2>
        <div className="stepper" aria-label={`Step ${challenge ? 2 : 1} of 2`}>
          <span className={challenge ? "" : "on"}>1 · Password</span>
          <span className={challenge ? "on" : ""}>2 · One-time code</span>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!challenge ? (
        <form className="form" onSubmit={submitPassword} noValidate>
          <div className="form-field">
            <label htmlFor="role">I am signing in as</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="cnic">CNIC number</label>
            <input
              id="cnic"
              name="username"
              inputMode="numeric"
              autoComplete="username"
              placeholder="XXXXX-XXXXXXX-X"
              className="mono"
              value={cnic}
              onChange={(e) => setCnic(formatCnic(e.target.value))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-green" type="submit" disabled={busy || !cnic || !password}>
            {busy ? "Checking…" : "Continue"}
          </button>
          <Link href="/" style={{ fontSize: 14 }}>← Back to home</Link>
        </form>
      ) : (
        <form className="form" onSubmit={submitOtp} noValidate>
          <div className="alert alert-info" role="status">
            We sent a 6-digit code to <strong>{challenge.maskedPhone}</strong>. It expires in 5 minutes.
            {challenge.devOtp && (
              <> Development code: <strong className="mono">{challenge.devOtp}</strong></>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="otp">One-time code</label>
            <input
              id="otp"
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              required
            />
          </div>
          <button className="btn btn-green" type="submit" disabled={busy || otp.length !== 6}>
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button type="button" className="link-btn" onClick={startOver}>Use a different account or resend code</button>
        </form>
      )}
    </>
  );
}
