import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NavBar, SiteFooter } from "@/components/SiteHeader";
import { Check } from "@/components/Icons";
import { ROLE_LABELS, SESSION_COOKIE, recentAudit, verifySession } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard — Milkiyat" };

const permissions: Record<string, string[]> = {
  citizen: ["View your own parcels and ownership history", "Request an ownership transfer", "Download verified records"],
  surveyor: ["Verify parcel boundaries", "Sign survey data on pending transactions"],
  registrar: ["Register new parcels", "Approve and sign ownership transfers", "Read decrypted owner details (logged)"],
  administrator: ["Manage users and roles", "Configure the system", "Review the full audit log"],
};

export default async function DashboardPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");

  const log = recentAudit(session.sub);

  return (
    <>
      <header className="site-header dark">
        <div className="container"><NavBar /></div>
      </header>
      <main className="container dash">
        <div className="dash-head">
          <div>
            <p className="eyebrow">{ROLE_LABELS[session.role]}</p>
            <h1>Welcome, {session.name}</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="btn btn-ghost" type="submit">Sign out</button>
          </form>
        </div>

        <div className="grid">
          <section className="card" aria-labelledby="session">
            <h3 id="session">Your session</h3>
            <span className="pill pill-ok" style={{ alignSelf: "flex-start" }}><Check size={14} strokeWidth={2.5} />MFA verified</span>
            <p>CNIC <span className="mono">{session.sub}</span></p>
            <p>Expires at {new Date(session.exp * 1000).toLocaleTimeString("en-PK")}</p>
          </section>
          <section className="card" aria-labelledby="perm">
            <h3 id="perm">What your role can do</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: "var(--muted)" }}>
              {permissions[session.role].map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
        </div>

        <section className="card" aria-labelledby="audit">
          <h3 id="audit">Recent activity on your account</h3>
          <ul className="audit">
            {log.map((e) => (
              <li key={`${e.at}-${e.event}`}>
                <time dateTime={e.at}>{new Date(e.at).toLocaleString("en-PK")}</time>
                <span>{e.event}</span>
                {e.detail && <span style={{ color: "var(--muted)" }}>{e.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
