# Kings Cup — Party Card PWA 👑🎴

เกมไพ่ **Kings Cup** แบบ Progressive Web App (PWA) — เล่นได้ออฟไลน์ 100%,
ปรับกติกาได้เอง, ไม่ต้องสมัครสมาชิก, ไม่มีเซิร์ฟเวอร์ และไม่เก็บข้อมูลออกนอกเครื่อง

สร้างตามเอกสาร `KingsCup_PWA_Requirement_TH.pdf` (SRS v1.0) — ขอบเขต **Phase 1 (MVP)**

## ✨ ฟีเจอร์

- **เล่นเกม** — สับ/จั่วไพ่ครบ 52 ใบ, แสดงหน้าไพ่และกติกาของใบที่จั่ว, นับไพ่ที่เหลือ,
  ตัวนับราชา (K) 0–4 พร้อมเน้นใบสุดท้าย, ย้อนกลับ (Undo), หน้าจบเกม
- **แก้กติกา** — รายการไพ่ 13 แต้ม, แก้ชื่อ/รายละเอียด/อีโมจิ/ไพ่พิเศษ,
  ตรวจความยาว (ชื่อ 1–30 / รายละเอียด 0–300) พร้อมตัวอย่างเรียลไทม์
- **ชุดกติกา** — ชุดมาตรฐาน (ลบไม่ได้), สร้าง/ทำสำเนา/แก้/ลบ, เลือกชุดที่ใช้งาน,
  ส่งออก/นำเข้าเป็น JSON หรือลิงก์แชร์ (ตรวจ schema + sanitize กัน XSS)
- **ตั้งค่า** — ภาษา ไทย/อังกฤษ, ธีม สว่าง/มืด/ตามระบบ, เปิด-ปิดเสียง/ภาพเคลื่อนไหว/สั่น,
  โหมดไม่มีแอลกอฮอล์ (แทนคำสั่งดื่มด้วยกิจกรรมทางเลือก), ล้างข้อมูล
- **PWA** — Manifest + ไอคอน (192/512/maskable), Service Worker แบบ cache-first,
  แบนเนอร์ติดตั้ง (A2HS), แจ้งเตือนเมื่อมีเวอร์ชันใหม่, ล็อกหน้าจอไม่ให้ดับระหว่างเล่น

## 🧱 เทคโนโลยี

React + Vite + TypeScript · Tailwind CSS · Zustand · React Router (HashRouter) ·
`vite-plugin-pwa` (Workbox) · `idb-keyval` (IndexedDB)

ไม่มี backend — เป็น static site ที่ deploy บน Vercel / Netlify / GitHub Pages ได้เลย

## 🗄️ การเก็บข้อมูล

| ข้อมูล | ที่เก็บ |
|--------|---------|
| `AppSettings` | `localStorage` (อ่านก่อน paint แรก) |
| `GameSession` | `localStorage` (เล่นต่อได้หลังปิดแอป) |
| `RuleSet` | `IndexedDB` ผ่าน `idb-keyval` |

## 🚀 เริ่มต้น

```bash
npm install
npm run dev      # เปิด dev server (พอร์ต 5199)
npm run build    # ตรวจชนิด + build โปรดักชัน → dist/
npm run preview  # ทดสอบไฟล์ที่ build แล้ว (ทดสอบ Service Worker/ออฟไลน์)
```

## 📁 โครงสร้าง

```
src/
  types.ts                 โครงสร้างข้อมูล (§4 ของ SRS)
  data/defaultRuleSet.ts   ชุดกติกามาตรฐาน 13 ใบ
  lib/                     deck, storage, wakeLock, sound, util
  store/                   Zustand: settings, ruleSet, game
  i18n/                    สตริง TH/EN + hook useT
  components/              Layout, PlayingCard, PwaPrompts, ui
  pages/                   Game, Rules, RuleEdit, RuleSets, New, Import, Settings
```

เส้นทางหน้าจอ (ใช้ HashRouter): `#/` เล่นเกม · `#/rules` · `#/rules/:rank` ·
`#/rulesets` · `#/rulesets/new` · `#/rulesets/import` · `#/settings`

## ✅ สถานะ

Bundle ~75 KB gzipped (งบ < 300 KB) · ผ่านเกณฑ์ยอมรับ AC-1…AC-7

## 🔞 หมายเหตุ

แอปเกี่ยวข้องกับการดื่มแอลกอฮอล์ สำหรับผู้มีอายุ 20 ปีขึ้นไป — โปรดดื่มอย่างรับผิดชอบ
และ **ดื่มไม่ขับ** (มีโหมดไม่มีแอลกอฮอล์สำหรับผู้ที่ไม่ดื่ม)

## 🛣️ Roadmap (ระยะถัดไป)

Phase 2 ระบบผู้เล่น (ใส่ชื่อ/สุ่มลำดับ/สถิติ) · Phase 3 Multiplayer (WebRTC/Firebase) ·
Phase 4 แชร์ชุดกติกาสาธารณะ · Phase 5 ธีมการ์ดแบบกำหนดเอง
