import Link from "next/link";
import { Brand, SiteFooter, SkipLink, UtilityBar } from "@/components/Chrome";
import { Arrow, Chain, Check, Doc, Lock, Log, Pen, Phone, Route, Search, Shield, Transfer, Users } from "@/components/Icons";
import { config } from "@/lib/config";
import { dict, getLang } from "@/lib/i18n";

const serviceIcons = [Doc, Search, Route, Transfer];
const protectionIcons = [Users, Phone, Lock, Chain, Pen, Log];
const roleKeys = ["citizen", "surveyor", "registrar", "administrator"] as const;

export default async function LandingPage() {
  const lang = await getLang();
  const t = dict(lang);

  return (
    <>
      <SkipLink t={t} />
      <UtilityBar t={t} lang={lang} next="/" />
      <header className="site-header">
        <div className="container nav">
          <Brand t={t} lang={lang} />
          <nav aria-label="Main" className="nav-links">
            <a href="#services">{t.nav.services}</a>
            <a href="#how">{t.nav.how}</a>
            <a href="#protection">{t.nav.protection}</a>
            <a href="#help">{t.nav.help}</a>
            <Link href="/login" className="btn btn-amber">{t.nav.signIn}</Link>
          </nav>
        </div>

        <div className="container hero">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="lead">{t.hero.body}</p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-amber">{t.hero.signIn}</Link>
              <a href="#how" className="btn btn-outline-light">{t.hero.how}</a>
            </div>
          </div>

          <section id="services" className="services-panel" aria-labelledby="services-title">
            <h2 id="services-title">{t.servicesPanel.title}</h2>
            <ul>
              {t.servicesPanel.items.map(([title, body], i) => {
                const Icon = serviceIcons[i];
                return (
                  <li key={title}>
                    <Link href="/login" className="service-row">
                      <span className="service-icon"><Icon size={22} /></span>
                      <span className="service-text">
                        <strong>{title}</strong>
                        <span>{body}</span>
                      </span>
                      <span className="service-arrow"><Arrow size={18} /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="services-note"><Shield size={16} /> {t.servicesPanel.note}</p>
          </section>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="how" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">{t.how.eyebrow}</p>
              <h2>{t.how.title}</h2>
            </div>
            <ol className="steps">
              {t.how.steps.map(([title, body], i) => (
                <li key={title}>
                  <span className="n">{(i + 1).toLocaleString(lang === "ur" ? "ur-PK" : "en")}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="protection" className="section band-white">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">{t.protection.eyebrow}</p>
              <h2>{t.protection.title}</h2>
            </div>
            <div className="grid grid-3">
              {t.protection.items.map(([title, body], i) => {
                const Icon = protectionIcons[i];
                return (
                  <article className="card" key={title}>
                    <span className="card-icon"><Icon size={24} /></span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="roles" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">{t.roles.eyebrow}</p>
              <h2>{t.roles.title}</h2>
            </div>
            <div className="grid grid-4">
              {t.roles.items.map(([title, body], i) => (
                <div className="role" key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <Link href={`/login?role=${roleKeys[i]}`} className="role-link">
                    {t.roles.signInAs} <Arrow size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="help" className="section band-white">
          <div className="container grid grid-2">
            <div className="panel">
              <h2>{t.before.title}</h2>
              <ul className="checklist">
                {t.before.items.map((item) => (
                  <li key={item}><Check size={18} strokeWidth={2.5} /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="panel panel-dark">
              <h2>{t.help.title}</h2>
              <p>{t.help.body}</p>
              <dl className="contact">
                <div><dt>{t.helpline}</dt><dd><bdi className="mono">{config.helpline}</bdi></dd></div>
                <div><dt>{t.help.hours}</dt><dd>{config.officeHours}</dd></div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter t={t} lang={lang} />
    </>
  );
}
