import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/SiteHeader";
import { Chain, Lock, Log, Shield } from "@/components/Icons";
import { DEMO_ACCOUNTS, ROLE_LABELS, SESSION_COOKIE, verifySession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Milkiyat" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const jar = await cookies();
  if (verifySession(jar.get(SESSION_COOKIE)?.value)) redirect("/dashboard");

  const showDemo = process.env.NODE_ENV !== "production";

  return (
    <div className="auth">
      <aside className="auth-side dark">
        <Brand />
        <h1>Sign in to your land records</h1>
        <p>Two-step sign-in keeps your records safe even if your password is stolen.</p>
        <ul className="auth-points">
          <li><Shield size={20} color="#E0A33A" /><span>Your role decides what you can see and do</span></li>
          <li><Lock size={20} color="#E0A33A" /><span>Names, CNICs and documents are encrypted with AES-256</span></li>
          <li><Chain size={20} color="#E0A33A" /><span>Every change is signed and chained on the blockchain</span></li>
          <li><Log size={20} color="#E0A33A" /><span>Every sign-in and record view is written to the audit log</span></li>
        </ul>
        <p className="foot">A research project · Dept. of Computer Engineering, Bahria University Islamabad</p>
      </aside>

      <main className="auth-main">
        <div className="auth-panel">
          <LoginForm
            roles={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            initialRole={role && role in ROLE_LABELS ? role : undefined}
          />
          {showDemo && (
            <div className="demo">
              <strong>Demo accounts</strong> (development only)
              <table>
                <tbody>
                  {DEMO_ACCOUNTS.map((a) => (
                    <tr key={a.cnic}>
                      <td>{ROLE_LABELS[a.role]}</td>
                      <td className="mono">{a.cnic}</td>
                      <td className="mono">{a.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
