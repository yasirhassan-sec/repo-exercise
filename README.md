# Milkiyat — Land Record Management System

Web front end for **A Secure and Privacy-Preserving Blockchain Framework for Land Record Management**
(Dept. of Computer Engineering, Bahria University Islamabad).

This repository contains the **public landing page** and the **secure sign-in** (application layer + security layer of the framework). Built with Next.js and React, as named in the paper.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Public landing page: online services, how the process works, data protection, roles, help and contact |
| `/login` | Two-step sign-in: role + CNIC + password, then a 6-digit SMS code. `/login?role=registrar` pre-selects a role |
| `/dashboard` | Signed-in page: session details, role permissions, and the account's recent activity from the audit log |

Every page is available in **English and Urdu** (right-to-left, Noto Nastaliq Urdu). The language button is in the top bar.

## Security controls

| Control | Implementation |
| --- | --- |
| Role-based access (RBAC) | The account must hold the role selected at sign-in |
| Multi-factor authentication | Password + 6-digit code sent by SMS; code valid 5 minutes, single use, 5 attempts |
| Password storage | scrypt (N=16384, r=8, p=1) with a per-user salt; constant-time comparison |
| Account enumeration | Wrong CNIC, wrong password and wrong role all return the same message and take the same time |
| Brute force | Account locks for 15 minutes after 5 wrong passwords; per-IP limit of 20 sign-in attempts / 15 min; 5 codes per account / 15 min |
| Sessions | HMAC-SHA256-signed token in a `__Host-` cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 30-minute lifetime; revoked on the server at sign-out |
| CSRF | Every POST must carry an `Origin` header matching the host |
| Content Security Policy | Per-request nonce, `strict-dynamic`, no third-party origins, `frame-ancestors 'none'` |
| Other headers | HSTS (production), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `no-store` on API responses |
| Audit log | Append-only, SHA-256 hash-chained log (`data/audit.log`); editing or deleting any line is detected |
| No third-party requests | Fonts are self-hosted; the site loads nothing from outside its own domain |
| Accessibility | Skip link, labelled fields, errors announced to screen readers, keyboard focus styles, 44px+ touch targets |

## Setup

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run build
npm start
```

### Create accounts

Accounts are stored in `data/users.json` (password hashes only). Create them with:

```bash
npm run create-user -- --cnic 12345-1234567-1 --name "Full Name" --role registrar --phone 03001234567
```

The password is typed at a hidden prompt (minimum 12 characters, letters and digits). Add `--deactivate` to disable an account.

### Demo mode (development and presentations only)

```bash
MILKIYAT_DEMO_MODE=true npm run dev
```

Adds four test accounts (shown on the login page) and displays the one-time code on screen instead of sending an SMS. A banner marks every page as demo. **Never enable this in production.**

| Role | CNIC | Password |
| --- | --- | --- |
| Citizen | 35202-1234567-1 | Citizen@123 |
| Surveyor | 35202-2345678-2 | Surveyor@123 |
| Registrar | 35202-3456789-3 | Registrar@123 |
| Administrator | 35202-4567890-4 | Admin@123 |

## Tests

```bash
npm test          # 15 tests: sign-in, lockout, codes, sessions, tamper detection of the audit log
npm run typecheck
```

## Before production use

This code is ready for pilot testing. It is not yet a complete production system. The following must be done by the deploying department:

1. **SMS gateway** — set `MILKIYAT_SMS_WEBHOOK_URL` to the department's approved SMS provider. Without it, sign-in is refused in production.
2. **Identity verification** — confirm CNIC ownership and mobile numbers against the national identity database before creating accounts.
3. **Persistent shared storage** — users, pending codes, lockouts and revoked sessions are in memory or local files. Running more than one server instance requires moving them to a database (e.g. PostgreSQL) and a shared cache (e.g. Redis).
4. **Branding** — set `MILKIYAT_ORG_NAME`, `MILKIYAT_ORG_NAME_UR`, `MILKIYAT_HELPLINE` and `MILKIYAT_OFFICE_HOURS`. Add the official emblem only as supplied by the department.
5. **Urdu review** — have the Urdu text reviewed by the department's translation staff.
6. **Hosting** — serve only over HTTPS behind a reverse proxy (set `MILKIYAT_TRUST_PROXY=true` there), on government-approved infrastructure, with `data/` backed up and kept outside the web root.
7. **Independent security review** — penetration testing and a review against the applicable government information-security guidelines before launch.
8. **Blockchain integration** — the land-record services (view, verify, track, transfer) connect to the blockchain network layer described in the paper; they are linked from the landing page but not part of this repository yet.
