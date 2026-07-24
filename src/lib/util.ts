// Small shared helpers.

export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Fire a short haptic pulse if supported and enabled (FR-1.9).
export function haptic(enabled: boolean, pattern: number | number[] = 15): void {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

// Alcohol-free transformation (FR-4.4 / AC-5): swap drink commands for
// alternative activities in displayed rule text. Applied at render time only,
// so it works for custom rule sets too without mutating stored data.
const ALCOHOL_FREE_MAP: [RegExp, string][] = [
  [/ดื่มถ้วยกลางทั้งหมด/g, 'ทำภารกิจสุดหินที่วงเลือกให้'],
  [/ต้องดื่มด้วย/g, 'ต้องทำท่าเต้น 5 วินาทีด้วย'],
  [/ต้องดื่ม/g, 'โดนวงสั่งทำภารกิจ 1 อย่าง'],
  [/ทุกคนดื่ม/g, 'ทุกคนทำท่าโปรด 1 ท่า'],
  [/ให้ดื่ม/g, 'ให้ทำภารกิจ 1 อย่าง'],
  [/ดื่มเอง/g, 'ทำภารกิจเอง'],
  [/ทุกคนเริ่มดื่มพร้อมกัน/g, 'ทุกคนเริ่มทำท่าตลกพร้อมกัน'],
  [/หยุดได้/g, 'หยุดทำท่าได้'],
  [/ผู้จั่วหยุดก่อน/g, 'ผู้จั่วหยุดทำท่าก่อน'],
  [/เทเครื่องดื่มลงถ้วยกลาง/g, 'สะสมแต้มภารกิจไว้ที่กองกลาง'],
  [/คู่ดื่ม/g, 'คู่หูภารกิจ'],
  [/คุณดื่ม/g, 'คุณทำภารกิจ'],
  [/ดื่ม/g, 'ทำภารกิจ'],
];

export function applyAlcoholFree(text: string, enabled: boolean): string {
  if (!enabled || !text) return text;
  let out = text;
  for (const [re, rep] of ALCOHOL_FREE_MAP) {
    out = out.replace(re, rep);
  }
  return out;
}
