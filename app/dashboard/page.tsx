import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Brand, SiteFooter, SkipLink, UtilityBar } from "@/components/Chrome";
import { Check } from "@/components/Icons";
import { recentAudit } from "@/lib/audit";
import { sessionCookieName, verifySession } from "@/lib/auth";
import { dict, getLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Dashboard — Milkiyat" };

export default async function DashboardPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(sessionCookieName())?.value);
  if (!session) redirect("/login");

  const lang = await getLang();
  const t = dict(lang);
  const locale = lang === "ur" ? "ur-PK" : "en-PK";
  const log = recentAudit(session.sub);

  return (
    <>
      <SkipLink t={t} />
      <UtilityBar t={t} lang={lang} next="/dashboard" />
      <header className="site-header">
        <div className="container nav">
          <Brand t={t} lang={lang} />
          <form action="/api/auth/logout" method="post">
            <button className="btn btn-outline-light" type="submit">{t.dash.signOut}</button>
          </form>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="container dash">
        <div>
          <p className="eyebrow">{t.roleNames[session.role]}</p>
          <h1>{t.dash.welcome}, {session.name}</h1>
        </div>

        <div className="grid grid-2">
          <section className="card" aria-labelledby="session-h">
            <h2 id="session-h">{t.dash.session}</h2>
            <span className="pill pill-ok"><Check size={14} strokeWidth={2.5} />{t.dash.mfa}</span>
            <p><bdi className="mono">{session.sub}</bdi></p>
            <p>{t.dash.expires}: {new Date(session.exp * 1000).toLocaleTimeString(locale)}</p>
          </section>
          <section className="card" aria-labelledby="perm-h">
            <h2 id="perm-h">{t.dash.permissions}</h2>
            <ul className="checklist">
              {t.dash.perms[session.role].map((p) => (
                <li key={p}><Check size={18} strokeWidth={2.5} /><span>{p}</span></li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card" aria-labelledby="audit-h">
          <h2 id="audit-h">{t.dash.activity}</h2>
          <p className="muted">{t.dash.activityNote}</p>
          <table className="audit">
            <tbody>
              {log.map((e) => (
                <tr key={e.seq}>
                  <td><time dateTime={e.at}>{new Date(e.at).toLocaleString(locale)}</time></td>
                  <td>{t.dash.events[e.event] ?? e.event}</td>
                  <td className="mono muted" dir="ltr">#{e.seq} · {e.hash.slice(0, 12)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
