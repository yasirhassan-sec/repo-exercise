import Link from "next/link";
import { config } from "@/lib/config";
import type { Dict, Lang } from "@/lib/i18n";
import { LogoMark } from "./Icons";

export function SkipLink({ t }: { t: Dict }) {
  return <a className="skip-link" href="#main">{t.skip}</a>;
}

export function LangSwitch({ t, lang, next }: { t: Dict; lang: Lang; next: string }) {
  return (
    <form action="/api/lang" method="post" className="lang-form">
      <input type="hidden" name="lang" value={lang === "ur" ? "en" : "ur"} />
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="lang-btn" aria-label={t.switchLangLabel} lang={lang === "ur" ? "en" : "ur"}>
        {t.switchLang}
      </button>
    </form>
  );
}

export function Brand({ t, lang }: { t: Dict; lang: Lang }) {
  return (
    <Link href="/" className="brand">
      <LogoMark size={40} />
      <span className="brand-text">
        <span className="brand-name">Milkiyat {lang === "ur" ? "· ملکیت" : ""}</span>
        <span className="brand-sub">{t.systemName}</span>
      </span>
    </Link>
  );
}

export function UtilityBar({ t, lang, next }: { t: Dict; lang: Lang; next: string }) {
  return (
    <div className="utility">
      <div className="container utility-inner">
        <span className="org">{lang === "ur" ? config.orgNameUr : config.orgName}</span>
        <div className="utility-right">
          <span>{t.helpline}: <bdi className="mono">{config.helpline}</bdi></span>
          <LangSwitch t={t} lang={lang} next={next} />
        </div>
      </div>
    </div>
  );
}

export function SiteFooter({ t, lang }: { t: Dict; lang: Lang }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-col">
          <strong className="footer-brand">Milkiyat</strong>
          <span>{t.systemName}</span>
          <span>{lang === "ur" ? config.orgNameUr : config.orgName}</span>
        </div>
        <nav aria-label="Footer" className="footer-col">
          <a href="/#services">{t.nav.services}</a>
          <a href="/#how">{t.nav.how}</a>
          <a href="/#protection">{t.nav.protection}</a>
          <a href="/#help">{t.nav.help}</a>
          <Link href="/login">{t.nav.signIn}</Link>
        </nav>
        <div className="footer-col">
          <span>{t.helpline}: <bdi className="mono">{config.helpline}</bdi></span>
          <span>{t.footer.security}</span>
        </div>
      </div>
      <div className="container footer-base">
        © {year} {lang === "ur" ? config.orgNameUr : config.orgName}. {t.footer.rights}
      </div>
    </footer>
  );
}
