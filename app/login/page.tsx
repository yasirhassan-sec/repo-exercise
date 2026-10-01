import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand, LangSwitch, SkipLink } from "@/components/Chrome";
import { Shield } from "@/components/Icons";
import { ROLES, sessionCookieName, verifySession } from "@/lib/auth";
import { config } from "@/lib/config";
import { dict, getLang } from "@/lib/i18n";
import { DEMO_ACCOUNTS } from "@/lib/users";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Milkiyat" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const jar = await cookies();
  if (verifySession(jar.get(sessionCookieName())?.value)) redirect("/dashboard");

  const lang = await getLang();
  const t = dict(lang);
  const { role } = await searchParams;
  const initialRole = role && (ROLES as readonly string[]).includes(role) ? role : "citizen";

  return (
    <>
      <SkipLink t={t} />
      {config.demoMode && <div className="demo-banner" role="note">{t.login.demoBanner}</div>}
      <div className="auth">
        <aside className="auth-side">
          <Brand t={t} lang={lang} />
          <div className="auth-side-body">
            <h1>{t.login.sideTitle}</h1>
            <p>{t.login.sideBody}</p>
            <ul className="auth-points">
              {t.login.sidePoints.map((p) => (
                <li key={p}><Shield size={20} color="#E0A33A" /><span>{p}</span></li>
              ))}
            </ul>
          </div>
          <p className="auth-foot">
            {lang === "ur" ? config.orgNameUr : config.orgName} · {t.helpline}: <bdi className="mono">{config.helpline}</bdi>
          </p>
        </aside>

        <main id="main" tabIndex={-1} className="auth-main">
          <div className="auth-panel">
            <div className="auth-top">
              <a href="/" className="back-link">{lang === "ur" ? "→" : "←"} {t.login.back}</a>
              <LangSwitch t={t} lang={lang} next="/login" />
            </div>
            <LoginForm
              t={t.login}
              roles={ROLES.map((value) => ({ value, label: t.roleNames[value] }))}
              initialRole={initialRole}
            />
            <p className="forgot">{t.login.forgot}</p>
            {config.demoMode && (
              <div className="demo">
                <strong>{t.login.demoAccounts}</strong>
                <table>
                  <tbody>
                    {DEMO_ACCOUNTS.map((a) => (
                      <tr key={a.cnic}>
                        <td>{t.roleNames[a.role]}</td>
                        <td className="mono" dir="ltr">{a.cnic}</td>
                        <td className="mono" dir="ltr">{a.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
