import { create } from 'zustand';
import type { CardRule, Rank, RuleSet } from '../types';
import { SCHEMA_VERSION } from '../types';
import {
  getAllRuleSets,
  putRuleSet,
  deleteRuleSet,
  ensureDefaultRuleSet,
  loadActiveRuleSetId,
  saveActiveRuleSetId,
} from '../lib/storage';
import { uuid } from '../lib/util';

interface RuleSetState {
  ruleSets: RuleSet[];
  activeRuleSetId: string | null;
  loaded: boolean;

  init: () => Promise<void>;
  setActive: (id: string) => void;
  getActive: () => RuleSet | undefined;

  createNew: (name: string, fromRuleSetId?: string) => Promise<RuleSet>;
  duplicate: (id: string) => Promise<RuleSet | undefined>;
  rename: (id: string, name: string) => Promise<void>;
  updateRule: (ruleSetId: string, rank: Rank, patch: Partial<CardRule>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addImported: (rs: RuleSet) => Promise<void>;
}

export const useRuleSets = create<RuleSetState>((set, get) => ({
  ruleSets: [],
  activeRuleSetId: null,
  loaded: false,

  init: async () => {
    await ensureDefaultRuleSet();
    const ruleSets = await getAllRuleSets();
    let activeId = loadActiveRuleSetId();
    if (!activeId || !ruleSets.some((r) => r.id === activeId)) {
      activeId = ruleSets.find((r) => r.isDefault)?.id ?? ruleSets[0]?.id ?? null;
      if (activeId) saveActiveRuleSetId(activeId);
    }
    set({ ruleSets, activeRuleSetId: activeId, loaded: true });
  },

  setActive: (id) => {
    saveActiveRuleSetId(id);
    set({ activeRuleSetId: id });
  },

  getActive: () => {
    const { ruleSets, activeRuleSetId } = get();
    return ruleSets.find((r) => r.id === activeRuleSetId);
  },

  createNew: async (name, fromRuleSetId) => {
    const source =
      get().ruleSets.find((r) => r.id === fromRuleSetId) ??
      get().ruleSets.find((r) => r.isDefault);
    const now = Date.now();
    const rs: RuleSet = {
      id: uuid(),
      name: name.trim() || 'ชุดใหม่',
      isDefault: false,
      rules: (source?.rules ?? []).map((r) => ({ ...r })),
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION,
    };
    await putRuleSet(rs);
    set({ ruleSets: await getAllRuleSets() });
    return rs;
  },

  duplicate: async (id) => {
    const source = get().ruleSets.find((r) => r.id === id);
    if (!source) return undefined;
    const now = Date.now();
    const rs: RuleSet = {
      ...source,
      id: uuid(),
      name: `${source.name} (สำเนา)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      rules: source.rules.map((r) => ({ ...r })),
    };
    await putRuleSet(rs);
    set({ ruleSets: await getAllRuleSets() });
    return rs;
  },

  rename: async (id, name) => {
    const rs = get().ruleSets.find((r) => r.id === id);
    if (!rs) return;
    const updated = { ...rs, name: name.trim() || rs.name, updatedAt: Date.now() };
    await putRuleSet(updated);
    set({ ruleSets: await getAllRuleSets() });
  },

  updateRule: async (ruleSetId, rank, patch) => {
    const rs = get().ruleSets.find((r) => r.id === ruleSetId);
    if (!rs) return;
    const updated: RuleSet = {
      ...rs,
      rules: rs.rules.map((r) => (r.rank === rank ? { ...r, ...patch, rank } : r)),
      updatedAt: Date.now(),
    };
    await putRuleSet(updated);
    set({ ruleSets: await getAllRuleSets() });
  },

  remove: async (id) => {
    const rs = get().ruleSets.find((r) => r.id === id);
    if (!rs || rs.isDefault) return; // default cannot be deleted (FR-3.1)
    await deleteRuleSet(id);
    const ruleSets = await getAllRuleSets();
    let activeId = get().activeRuleSetId;
    if (activeId === id) {
      activeId = ruleSets.find((r) => r.isDefault)?.id ?? ruleSets[0]?.id ?? null;
      if (activeId) saveActiveRuleSetId(activeId);
    }
    set({ ruleSets, activeRuleSetId: activeId });
  },

  addImported: async (rs) => {
    await putRuleSet(rs);
    set({ ruleSets: await getAllRuleSets() });
  },
}));
