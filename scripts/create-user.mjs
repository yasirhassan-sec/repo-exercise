#!/usr/bin/env node
// Creates or updates an account in <data dir>/users.json.
// Usage: npm run create-user -- --cnic 12345-1234567-1 --name "Full Name" --role registrar --phone 03001234567
// The password is read from the terminal (never pass it on the command line, where it lands in shell history).
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { parseArgs } from "node:util";

const ROLES = ["citizen", "surveyor", "registrar", "administrator"];
const SCRYPT = { N: 16384, r: 8, p: 1 }; // must match lib/users.ts

const { values } = parseArgs({
  options: {
    cnic: { type: "string" },
    name: { type: "string" },
    role: { type: "string" },
    phone: { type: "string" },
    deactivate: { type: "boolean", default: false },
  },
});

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

if (!/^\d{5}-\d{7}-\d$/.test(values.cnic ?? "")) fail("--cnic must look like 12345-1234567-1");

const dataDir = process.env.MILKIYAT_DATA_DIR || path.join(process.cwd(), "data");
const file = path.join(dataDir, "users.json");
fs.mkdirSync(dataDir, { recursive: true });
const users = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const idx = users.findIndex((u) => u.cnic === values.cnic);

if (values.deactivate) {
  if (idx < 0) fail("no such user");
  users[idx].active = false;
  fs.writeFileSync(file, JSON.stringify(users, null, 2), { mode: 0o600 });
  console.log(`Deactivated ${values.cnic}`);
  process.exit(0);
}

if (!values.name) fail("--name is required");
if (!ROLES.includes(values.role ?? "")) fail(`--role must be one of ${ROLES.join(", ")}`);
if (!/^03\d{9}$/.test(values.phone ?? "")) fail("--phone must be a Pakistani mobile number like 03001234567");

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}

const password = await askHidden("Password (min 12 chars, letters + digits): ");
if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  fail("password must be at least 12 characters and contain letters and digits");
}
const confirm = await askHidden("Confirm password: ");
if (confirm !== password) fail("passwords do not match");

const salt = randomBytes(16).toString("hex");
const passwordHash = scryptSync(password, salt, 64, SCRYPT).toString("hex");
const user = { cnic: values.cnic, name: values.name, role: values.role, phone: values.phone, salt, passwordHash, active: true };
if (idx >= 0) users[idx] = user; else users.push(user);
fs.writeFileSync(file, JSON.stringify(users, null, 2), { mode: 0o600 });
console.log(`${idx >= 0 ? "Updated" : "Created"} ${values.role} account for ${values.cnic} in ${file}`);
