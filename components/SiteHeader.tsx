import Link from "next/link";
import { LogoMark } from "./Icons";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Milkiyat home">
      <LogoMark />
      <span>Milkiyat</span>
    </Link>
  );
}

export function NavBar() {
  return (
    <nav className="nav" aria-label="Main">
      <Brand />
      <div className="nav-links">
        <a href="/#how">How it works</a>
        <a href="/#security">Security</a>
        <a href="/#roles">Roles</a>
        <a href="/#performance">Performance</a>
        <Link href="/login" className="btn btn-amber">Sign in</Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", fontSize: 18 }}>Milkiyat</span>
        <div className="links">
          <a href="/#how">How it works</a>
          <a href="/#security">Security</a>
          <Link href="/login">Sign in</Link>
        </div>
        <span>A research project · Dept. of Computer Engineering, Bahria University Islamabad</span>
      </div>
    </footer>
  );
}
