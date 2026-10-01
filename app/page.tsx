import Link from "next/link";
import { NavBar, SiteFooter } from "@/components/SiteHeader";
import { Chain, Check, Lock, Pen, Replay } from "@/components/Icons";

const problemStats = [
  { value: "151 / 190", label: "Pakistan’s rank for registering property (World Bank, Doing Business 2020)" },
  { value: "6 steps", label: "of paperwork in a typical registration, taking about two months" },
  { value: "1 point", label: "of failure in a centralized database: one breach exposes every record" },
];

const threats = [
  { icon: Lock, title: "Unauthorized access", body: "Every request passes role-based access control and multi-factor authentication before it reaches the ledger.", tag: "RBAC + MFA" },
  { icon: Pen, title: "Transaction forgery", body: "Each transaction carries an RSA or ECDSA signature. Unsigned or invalid ones are rejected before consensus.", tag: "Digital signatures" },
  { icon: Chain, title: "Data manipulation", body: "Changing any stored record breaks the SHA-256 hash chain, and sensitive fields are encrypted at rest.", tag: "Hash chain + AES-256" },
  { icon: Replay, title: "Replay attack", body: "A unique nonce and timestamp on each transaction stop an old, valid request from being submitted again.", tag: "Nonce + timestamp · in progress", warn: true },
];

const steps = [
  ["User request", "A citizen, registrar or surveyor starts a request."],
  ["Authenticate", "Identity checked with MFA; role checked against the action."],
  ["Encrypt & sign", "Sensitive data encrypted and signed by the originator."],
  ["Submit", "The signed, encrypted transaction goes to the network."],
  ["Validate", "Nodes validate it and reach consensus."],
  ["Store", "Appended as a new block, chained to the last."],
  ["Query", "Authorized users view history; every access is logged."],
];

const roles = [
  ["Citizen", "Views their own parcels and history, requests transfers, downloads verified records."],
  ["Surveyor", "Verifies boundaries in the field and signs survey data attached to a transaction."],
  ["Registrar", "Registers new records and approves ownership transfers with a digital signature."],
  ["Administrator", "Configures the system, manages users and roles, and reviews the audit log."],
];

const metrics = [
  { value: "<1 ms", label: "to hash a block, at any chain length", note: "Measured · baseline prototype", kind: "measured" },
  { value: "28 ms", label: "to verify the full chain at 100 blocks", note: "Measured · baseline prototype", kind: "measured" },
  { value: "290 ms", label: "to verify the full chain at 1,000 blocks", note: "Measured · baseline prototype", kind: "measured" },
  { value: "≈3–6 ms", label: "added per transaction by the security layer", note: "Estimated · not yet benchmarked", kind: "estimated" },
];

export default function LandingPage() {
  return (
    <>
      <header className="site-header dark">
        <div className="container">
          <NavBar />
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Secure &amp; privacy-preserving blockchain land records</p>
              <h1>Land records no one can forge, with data only the right people can see.</h1>
              <p>
                Milkiyat puts a security layer on top of a SHA-256 blockchain core: role-based access,
                multi-factor authentication, AES-256 encryption, digital signatures and audit logging.
                Ownership history stays tamper-proof and confidential.
              </p>
              <div className="hero-actions">
                <Link href="/login" className="btn btn-amber">Sign in to Milkiyat</Link>
                <a href="#how" className="btn btn-outline-light">See how it works</a>
              </div>
            </div>

            <div className="record-card" aria-label="Example land record">
              <div className="top">
                <span className="mono meta">BLOCK 1042 · PARCEL 1142/7</span>
                <span className="pill pill-ok"><Check size={14} strokeWidth={2.5} />Chain verified</span>
              </div>
              <div className="fields">
                <div><div className="field-label">Transaction</div><div className="field-value">Ownership transfer</div></div>
                <div><div className="field-label">Mauza</div><div className="field-value">Example mauza</div></div>
                <div><div className="field-label">Area</div><div className="field-value">10 Marla</div></div>
                <div><div className="field-label">Signatures</div><div className="field-value">3 of 3 valid</div></div>
              </div>
              <div className="sealed">
                <Lock size={22} color="#0B5D44" />
                <div>
                  <strong>Owner name &amp; CNIC encrypted</strong>
                  <small>AES-256 · readable only by authorized roles</small>
                </div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 8 }}>Digitally signed by</div>
                <div className="chips">
                  <span className="chip">Seller · ECDSA</span>
                  <span className="chip">Surveyor · ECDSA</span>
                  <span className="chip">Registrar · ECDSA</span>
                </div>
              </div>
              <div className="hashes mono">
                <span>hash&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sha256:7c21…e90a</span>
                <span>prev_hash sha256:0b7e…41f9</span>
              </div>
            </div>
          </section>
        </div>
      </header>

      <main>
        <section className="problem" aria-labelledby="why">
          <div className="container grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p className="eyebrow">Why it matters</p>
              <h2 id="why" style={{ fontSize: 26, lineHeight: 1.2 }}>
                Paper registers and central databases leave land records exposed.
              </h2>
            </div>
            {problemStats.map((s) => (
              <div className="stat" key={s.value}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Security</p>
              <h2>Four threats, each with a defence</h2>
            </div>
            <div className="grid">
              {threats.map(({ icon: Icon, title, body, tag, warn }) => (
                <article className="card" key={title}>
                  <Icon size={28} color="#0B5D44" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <span className={warn ? "tag warn" : "tag"}>{tag}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">How it works</p>
              <h2>From request to permanent record in seven steps</h2>
            </div>
            <ol className="steps">
              {steps.map(([title, body], i) => (
                <li key={title}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="roles" className="section band-white">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Role-based access</p>
              <h2>Each role sees and does only what it should</h2>
            </div>
            <div className="grid">
              {roles.map(([title, body]) => (
                <div className="role" key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <Link href={`/login?role=${title.toLowerCase()}`} style={{ fontWeight: 600, padding: "8px 0" }}>Sign in as {title.toLowerCase()} →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="performance" className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Performance</p>
              <h2>Security that barely adds latency</h2>
            </div>
            <div className="grid">
              {metrics.map((m) => (
                <div className={`metric ${m.kind}`} key={m.value}>
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                  <small>{m.note}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container">
          <section className="cta" aria-labelledby="cta">
            <div>
              <h2 id="cta">Check your land records securely</h2>
              <p>Sign in with your CNIC, password and a one-time code. Every access to your record is logged.</p>
            </div>
            <Link href="/login" className="btn" style={{ background: "#fff", color: "#082E23" }}>Sign in</Link>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
