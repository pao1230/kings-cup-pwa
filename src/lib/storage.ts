import { get, set, del, entries } from 'idb-keyval';
import type { AppSettings, GameSession, RuleSet, CardRule, Rank } from '../types';
import { RANKS, SCHEMA_VERSION } from '../types';
import { createDefaultRuleSet } from '../data/defaultRuleSet';

// --- Keys -------------------------------------------------------------------
const LS_SETTINGS = 'kc.settings.v1';
const LS_SESSION = 'kc.session.v1';
const LS_ACTIVE_RULESET = 'kc.activeRuleSetId.v1';
const IDB_PREFIX = 'ruleset:';

// --- AppSettings (localStorage, synchronous — read before first paint) ------
export const DEFAULT_SETTINGS: AppSettings = {
  language: 'th',
  theme: 'system',
  soundEnabled: true,
  animationEnabled: true,
  hapticEnabled: true,
  alcoholFreeMode: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {
    /* storage full / disabled — ignore */
  }
}

// --- GameSession (localStorage — resume after app close, FR-1.8 / NFR-8) ----
export function loadSession(): GameSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: GameSession | null): void {
  try {
    if (session) localStorage.setItem(LS_SESSION, JSON.stringify(session));
    else localStorage.removeItem(LS_SESSION);
  } catch {
    /* ignore */
  }
}

// --- Active rule set id ------------------------------------------------------
export function loadActiveRuleSetId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_RULESET);
  } catch {
    return null;
  }
}

export function saveActiveRuleSetId(id: string): void {
  try {
    localStorage.setItem(LS_ACTIVE_RULESET, id);
  } catch {
    /* ignore */
  }
}

// --- RuleSets (IndexedDB via idb-keyval) ------------------------------------
export async function getAllRuleSets(): Promise<RuleSet[]> {
  const all = await entries<string, RuleSet>();
  return all
    .filter(([k]) => typeof k === 'string' && k.startsWith(IDB_PREFIX))
    .map(([, v]) => v)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt - b.createdAt);
}

export async function getRuleSet(id: string): Promise<RuleSet | undefined> {
  return get<RuleSet>(IDB_PREFIX + id);
}

export async function putRuleSet(rs: RuleSet): Promise<void> {
  await set(IDB_PREFIX + rs.id, rs);
}

export async function deleteRuleSet(id: string): Promise<void> {
  await del(IDB_PREFIX + id);
}

// Ensure the default rule set exists (first run / after reset).
export async function ensureDefaultRuleSet(): Promise<RuleSet> {
  const existing = await getAllRuleSets();
  const def = existing.find((r) => r.isDefault);
  if (def) return def;
  const created = createDefaultRuleSet();
  await putRuleSet(created);
  return created;
}

export async function clearAllRuleSets(): Promise<void> {
  const all = await getAllRuleSets();
  await Promise.all(all.map((r) => deleteRuleSet(r.id)));
}

// --- Reset everything (FR-4.5) ----------------------------------------------
export async function resetAllData(): Promise<void> {
  try {
    localStorage.removeItem(LS_SETTINGS);
    localStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_ACTIVE_RULESET);
  } catch {
    /* ignore */
  }
  await clearAllRuleSets();
}

// --- Import validation & sanitize (FR-3.5, XSS consideration) ---------------
// Strip angle brackets and ASCII control chars to avoid any HTML/script
// injection when rendering imported text.
const CONTROL_CHARS = new RegExp('[\u0000-\u001f\u007f]', 'g');

function sanitizeText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[<>]/g, '').replace(CONTROL_CHARS, '').trim().slice(0, max);
}

export class ImportError extends Error {}

// Validate an untrusted object into a safe RuleSet. Throws ImportError on
// anything malformed. Always assigns a fresh id so imports never overwrite.
export function validateAndNormalizeRuleSet(
  data: unknown,
  newId: string,
  now: number = Date.now(),
): RuleSet {
  if (typeof data !== 'object' || data === null) {
    throw new ImportError('รูปแบบข้อมูลไม่ถูกต้อง');
  }
  const obj = data as Record<string, unknown>;
  const rawRules = obj.rules;
  if (!Array.isArray(rawRules)) {
    throw new ImportError('ไม่พบรายการกติกา (rules)');
  }

  // Map by rank so we can guarantee exactly 13 valid entries.
  const byRank = new Map<Rank, CardRule>();
  for (const r of rawRules) {
    if (typeof r !== 'object' || r === null) continue;
    const rr = r as Record<string, unknown>;
    const rank = rr.rank as Rank;
    if (!RANKS.includes(rank)) continue;
    byRank.set(rank, {
      rank,
      title: sanitizeText(rr.title, 30) || rank,
      description: sanitizeText(rr.description, 300),
      icon: sanitizeText(rr.icon, 8) || undefined,
      isSpecial: rr.isSpecial === true,
    });
  }

  if (byRank.size < RANKS.length) {
    const missing = RANKS.filter((r) => !byRank.has(r));
    throw new ImportError(`กติกาไม่ครบ 13 ใบ (ขาด: ${missing.join(', ')})`);
  }

  const rules = RANKS.map((rank) => byRank.get(rank)!);
  const name = sanitizeText(obj.name, 40) || 'ชุดกติกาที่นำเข้า';

  return {
    id: newId,
    name,
    isDefault: false,
    rules,
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}

// --- Export helpers ---------------------------------------------------------
export function ruleSetToJSON(rs: RuleSet): string {
  const { name, rules, schemaVersion } = rs;
  return JSON.stringify({ name, rules, schemaVersion }, null, 2);
}

// Base64url payload embedded in a shareable link (FR-3.4).
export function ruleSetToShareCode(rs: RuleSet): string {
  const json = JSON.stringify({ name: rs.name, rules: rs.rules, schemaVersion: rs.schemaVersion });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function shareCodeToObject(code: string): unknown {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}
