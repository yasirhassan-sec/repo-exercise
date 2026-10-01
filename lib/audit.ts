import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

/**
 * Append-only, hash-chained audit log (one JSON object per line).
 * Each entry stores the hash of the previous entry, so editing or deleting
 * any line breaks the chain and is detected by verifyAuditChain().
 */

export type AuditEntry = {
  seq: number;
  at: string;
  event: string;
  actor: string;
  ip: string;
  detail?: string;
  prevHash: string;
  hash: string;
};

const GENESIS = "0".repeat(64);

type AuditState = { file: string; seq: number; lastHash: string };
const g = globalThis as unknown as { __milkiyatAudit?: AuditState };

function logFile(): string {
  return path.join(config.dataDir, "audit.log");
}

function hashEntry(e: Omit<AuditEntry, "hash">): string {
  const canonical = JSON.stringify([e.seq, e.at, e.event, e.actor, e.ip, e.detail ?? null, e.prevHash]);
  return createHash("sha256").update(canonical).digest("hex");
}

function readEntries(file: string): AuditEntry[] {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AuditEntry);
}

function state(): AuditState {
  const file = logFile();
  if (!g.__milkiyatAudit || g.__milkiyatAudit.file !== file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const entries = readEntries(file);
    const last = entries[entries.length - 1];
    g.__milkiyatAudit = { file, seq: last?.seq ?? 0, lastHash: last?.hash ?? GENESIS };
  }
  return g.__milkiyatAudit;
}

export function audit(event: string, actor: string, ip: string, detail?: string): AuditEntry {
  const s = state();
  const base = {
    seq: s.seq + 1,
    at: new Date().toISOString(),
    event,
    actor,
    ip,
    ...(detail ? { detail } : {}),
    prevHash: s.lastHash,
  };
  const entry: AuditEntry = { ...base, hash: hashEntry(base) };
  fs.appendFileSync(s.file, JSON.stringify(entry) + "\n", { mode: 0o600 });
  s.seq = entry.seq;
  s.lastHash = entry.hash;
  return entry;
}

export function recentAudit(actor: string, limit = 10): AuditEntry[] {
  return readEntries(state().file)
    .filter((e) => e.actor === actor)
    .slice(-limit)
    .reverse();
}

/** Re-hashes the whole log. Returns the first broken sequence number, or null if intact. */
export function verifyAuditChain(): { ok: true; entries: number } | { ok: false; brokenAt: number } {
  const entries = readEntries(state().file);
  let prev = GENESIS;
  for (const e of entries) {
    const { hash, ...rest } = e;
    if (e.prevHash !== prev || hashEntry(rest) !== hash) return { ok: false, brokenAt: e.seq };
    prev = hash;
  }
  return { ok: true, entries: entries.length };
}
