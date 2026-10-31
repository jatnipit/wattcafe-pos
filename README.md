# Watt Cafe POS

ระบบรับออเดอร์ร้านกาแฟ–น้ำปั่นร้านเดียวในหมู่บ้าน รับข้อความจาก LINE Official Account มาแสดงบนกระดาน เก็บเป็นออเดอร์ และสรุปยอดขายรายวัน

ระบบ **ไม่ส่งข้อความใด ๆ ออกไปหาลูกค้า** (ADR-0002) ร้านพิมพ์ตอบเองผ่าน LINE OA Manager และ **ไม่สร้างออเดอร์อัตโนมัติ** ทุกออเดอร์ต้องให้ร้านตรวจและยืนยัน

## เอกสาร

| ไฟล์ | เนื้อหา |
|---|---|
| `docs/srs.md` | ข้อกำหนดระบบฉบับเต็ม (FR/NFR) |
| `GLOSSARY.md` | คำศัพท์บังคับของโดเมน |
| `docs/adr/` | บันทึกการตัดสินใจ архитектуры |
| `.scratch/pos-v1/spec.md` | สเปกที่ใช้สร้างระบบ |
| `.scratch/pos-v1/issues/` | ticket ทั้งหมดพร้อม dependency |
| `docs/setup-checklist.md` | สิ่งที่ต้องทำด้วยมือ (Supabase, Google, LINE, Cloudflare) |

## สิ่งที่ต้องมีในเครื่อง

- Node.js 22 ขึ้นไป
- **Docker Desktop ที่ทำงานได้** — Supabase local ต้องใช้ Linux containers
  - บน Windows ต้องเปิด WSL2 ก่อน (`wsl --install --no-distribution` ใน PowerShell as Administrator แล้วรีสตาร์ท) ถ้า `wsl --status` ยังบอกว่าไม่รองรับ Docker จะสตาร์ทไม่ขึ้น

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # รันเอง แล้วเติมค่าจาก `npx supabase status`
npm run db:start             # สตาร์ท Supabase local + รัน migration + seed
npm run dev
```

> agent ไม่มีสิทธิ์อ่านหรือเขียนไฟล์ `.env` ใด ๆ (ดู `AGENTS.md`) — ขั้นคัดลอกและเติมค่า `.env.local` ต้องทำเอง วิธีละเอียดอยู่ที่ `docs/setup-checklist.md` หัวข้อ "เขียนไฟล์ `.env` ด้วยตัวเอง"

เปิด http://localhost:3000 จะเห็นกระดานข้อความเข้า (seed มีข้อความตัวอย่าง)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันเว็บบนเครื่อง |
| `npm test` | สตาร์ท Supabase local, reset ฐานข้อมูล, รันเทสต์ทั้งหมด |
| `npm run test:watch` | รันเทสต์แบบเฝ้าไฟล์ (ต้องมี Supabase รันอยู่) |
| `npm run db:reset` | ล้างฐานข้อมูลแล้วรัน migration + seed ใหม่ |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm run lint` | ตรวจ ESLint |
| `npm run build` | build สำหรับ production |

> `npm test` ล้างข้อมูลในฐานข้อมูล local (truncate ตารางข้อความ/ลูกค้า) หลังรันแล้วข้อมูล seed หาย ให้รัน `npm run db:reset` ถ้าต้องการตัวอย่างคืน

## สถาปัตยกรรมโดยย่อ

- แอปคุยฐานข้อมูลผ่าน **HTTPS (PostgREST)** ไม่ใช่ TCP เพราะ Cloudflare Workers เปิด connection ตรงไป PostgreSQL ไม่ได้
- การกัน webhook ซ้ำ, upsert ลูกค้า และ insert ข้อความ อยู่ในฟังก์ชันเดียวในฐานข้อมูล (`record_incoming_message`) จึงไม่มีทางเกิดข้อมูลครึ่งเดียว
- เทสต์ยิง `Request` เข้า route handler ตรง ๆ แล้วตรวจผลกับ Postgres จริง ไม่ mock ฐานข้อมูล
