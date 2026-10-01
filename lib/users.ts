import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

export const ROLES = ["citizen", "surveyor", "registrar", "administrator"] as const;
export type Role = (typeof ROLES)[number];

export type User = {
  cnic: string;
  name: string;
  role: Role;
  phone: string;
  salt: string;
  passwordHash: string;
  active: boolean;
};

// Must match scripts/create-user.mjs.
export const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

export function hashPassword(password: string, salt: string): string {
  const { N, r, p, keylen } = SCRYPT_PARAMS;
  return scryptSync(password, salt, keylen, { N, r, p }).toString("hex");
}

/** Test accounts, loaded only when MILKIYAT_DEMO_MODE=true. */
export const DEMO_ACCOUNTS: { cnic: string; password: string; role: Role; name: string; phone: string }[] = [
  { cnic: "35202-1234567-1", password: "Citizen@123", role: "citizen", name: "Ayesha Khan", phone: "03000000001" },
  { cnic: "35202-2345678-2", password: "Surveyor@123", role: "surveyor", name: "Bilal Ahmed", phone: "03000000002" },
  { cnic: "35202-3456789-3", password: "Registrar@123", role: "registrar", name: "Sana Malik", phone: "03000000003" },
  { cnic: "35202-4567890-4", password: "Admin@123", role: "administrator", name: "Usman Raza", phone: "03000000004" },
];

type UserState = { file: string; users: Map<string, User> };
const g = globalThis as unknown as { __milkiyatUsers?: UserState };

function load(): UserState {
  const file = path.join(config.dataDir, "users.json");
  if (g.__milkiyatUsers?.file === file) return g.__milkiyatUsers;

  const users = new Map<string, User>();
  if (fs.existsSync(file)) {
    const list = JSON.parse(fs.readFileSync(file, "utf8")) as User[];
    for (const u of list) users.set(u.cnic, u);
  }
  if (config.demoMode) {
    for (const a of DEMO_ACCOUNTS) {
      if (users.has(a.cnic)) continue;
      const salt = randomBytes(16).toString("hex");
      users.set(a.cnic, {
        cnic: a.cnic, name: a.name, role: a.role, phone: a.phone,
        salt, passwordHash: hashPassword(a.password, salt), active: true,
      });
    }
  }
  g.__milkiyatUsers = { file, users };
  return g.__milkiyatUsers;
}

export function findUser(cnic: string): User | undefined {
  const u = load().users.get(cnic);
  return u?.active ? u : undefined;
}
