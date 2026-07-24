import type { CardRule, RuleSet } from '../types';
import { SCHEMA_VERSION } from '../types';

// Fixed id so the default set is stable across reinstalls (FR-3.1).
export const DEFAULT_RULE_SET_ID = 'default-kings-cup';

// A classic Kings Cup rule set (Thai). Users can copy & edit this (FR-3.2).
const DEFAULT_RULES: CardRule[] = [
  {
    rank: 'A',
    title: 'น้ำตก',
    description:
      'ทุกคนเริ่มดื่มพร้อมกัน คนถัดจากผู้จั่วจะหยุดได้ก็ต่อเมื่อผู้จั่วหยุดก่อน ไล่ไปเรื่อย ๆ ตามวง',
    icon: '🌊',
  },
  {
    rank: '2',
    title: 'คุณ',
    description: 'ชี้เลือกใครก็ได้ 1 คนให้ดื่ม',
    icon: '👉',
  },
  {
    rank: '3',
    title: 'ฉัน',
    description: 'ผู้จั่วดื่มเอง 1 อึก',
    icon: '🙋',
  },
  {
    rank: '4',
    title: 'พื้น',
    description: 'ทุกคนรีบแตะพื้น คนสุดท้ายที่แตะต้องดื่ม',
    icon: '⬇️',
  },
  {
    rank: '5',
    title: 'หนุ่ม ๆ',
    description: 'ผู้ชายทุกคนดื่ม',
    icon: '🧑',
  },
  {
    rank: '6',
    title: 'สาว ๆ',
    description: 'ผู้หญิงทุกคนดื่ม',
    icon: '👧',
  },
  {
    rank: '7',
    title: 'สวรรค์',
    description: 'ทุกคนรีบยกมือขึ้นฟ้า คนสุดท้ายที่ยกต้องดื่ม',
    icon: '🙌',
  },
  {
    rank: '8',
    title: 'คู่หู',
    description: 'เลือกคู่ดื่ม 1 คน จากนี้ไปเมื่อคุณดื่ม คู่ของคุณต้องดื่มด้วย',
    icon: '🤝',
  },
  {
    rank: '9',
    title: 'คล้องจอง',
    description: 'พูดคำหนึ่งขึ้นมา แล้วไล่ให้แต่ละคนพูดคำที่คล้องจอง ใครตันหรือซ้ำต้องดื่ม',
    icon: '🎵',
  },
  {
    rank: '10',
    title: 'หมวดหมู่',
    description: 'ตั้งหมวดหมู่ขึ้นมา 1 อย่าง ไล่พูดคนละอย่างในหมวดนั้น ใครตันต้องดื่ม',
    icon: '📚',
  },
  {
    rank: 'J',
    title: 'ตั้งกฎ',
    description: 'ผู้จั่วตั้งกฎ 1 ข้อ ใช้ไปจนจบเกม ใครทำผิดกฎต้องดื่ม',
    icon: '📜',
  },
  {
    rank: 'Q',
    title: 'ราชินีคำถาม',
    description: 'ผู้จั่วเป็นราชินีคำถาม ใครเผลอตอบคำถามของราชินีต้องดื่ม จนกว่าจะมีคนจั่ว Q ใบถัดไป',
    icon: '❓',
  },
  {
    rank: 'K',
    title: 'ถ้วยราชา',
    description: 'เทเครื่องดื่มลงถ้วยกลาง คนที่จั่ว K ใบที่ 4 (ใบสุดท้าย) ต้องดื่มถ้วยกลางทั้งหมด',
    icon: '👑',
    isSpecial: true,
  },
];

export function createDefaultRuleSet(now: number = Date.now()): RuleSet {
  return {
    id: DEFAULT_RULE_SET_ID,
    name: 'กติกามาตรฐาน',
    isDefault: true,
    rules: DEFAULT_RULES.map((r) => ({ ...r })),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}
