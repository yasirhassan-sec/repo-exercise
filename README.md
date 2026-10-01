# Milkiyat — Secure land record management

Web front end for **A Secure and Privacy-Preserving Blockchain Framework for Land Record Management**
(Dept. of Computer Engineering, Bahria University Islamabad).

Built with Next.js and React, the stack named in the paper's implementation section.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page: the problem, the four threats and their defences, the 7-step workflow, roles (RBAC) and measured performance |
| `/login` | Two-step sign-in: role + CNIC + password, then a 6-digit one-time code (MFA). `/login?role=registrar` pre-selects a role |
| `/dashboard` | Protected page reached after sign-in: session, role permissions, and the account's audit trail |

## Security in the sign-in flow

- **RBAC**: the account must hold the role chosen at sign-in, or access is denied.
- **MFA**: a one-time code that expires after 5 minutes, works once, and allows 5 tries.
- **Passwords** hashed with scrypt and a per-user salt, compared in constant time.
- **Lockout** for 15 minutes after 5 wrong passwords.
- **Sessions**: HMAC-SHA256-signed token in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` in production) that lasts 30 minutes.
- **Audit log** of sign-ins, failures, lockouts and sign-outs.

Users, codes and the audit log live in memory for this prototype. Replace them with persistent storage and an SMS gateway before real use.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

In development the one-time code is shown on screen, because there is no SMS gateway, and the login page lists demo accounts:

| Role | CNIC | Password |
| --- | --- | --- |
| Citizen | 35202-1234567-1 | Citizen@123 |
| Surveyor | 35202-2345678-2 | Surveyor@123 |
| Registrar | 35202-3456789-3 | Registrar@123 |
| Administrator | 35202-4567890-4 | Admin@123 |

For production, set `SESSION_SECRET` (see `.env.example`), then `npm run build && npm start`.
