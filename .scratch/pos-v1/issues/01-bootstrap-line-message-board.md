# 01: วางฐานระบบและพาข้อความ LINE ขึ้นกระดาน

**What to build:** ข้อความที่ลูกค้าส่งเข้าช่องทาง LINE ถูกบันทึกและแสดงบนกระดานทันที โดยระบบปฏิเสธของปลอมและไม่เก็บซ้ำ — ใบนี้รวม bootstrap ของโปรเจกต์ (Supabase local, migration, test harness) และรันบนเครื่องเท่านั้น ยังไม่ deploy

**Blocked by:** None (can start immediately)

**Status:** done

- [x] POST ที่มีลายเซ็นถูกต้องและเป็น event ใหม่ → ข้อความถูกบันทึกพร้อมผู้ส่ง เวลา และแสดงบนกระดาน
- [x] ลายเซ็นผิดหรือไม่มี header → 400 และไม่มีข้อมูลใดถูกเขียน
- [x] event เดิมส่งซ้ำ → ตอบ 200 แต่ไม่มีข้อความหรือออเดอร์เพิ่ม
- [x] ผู้ส่งที่ดึงโปรไฟล์ไม่ได้ → ข้อความยังถูกบันทึก โดยชื่อที่แสดงว่าง
- [x] เทสต์ integration ยิงผ่าน route handler กับ Postgres จริงผ่าน และรันได้ด้วยคำสั่งเดียว
- [x] มี migration และ seed สำหรับรันระบบบนเครื่อง

## Comments

**2026-10-31 — เสร็จแล้ว**

- `npm test` ผ่าน 8/8 (Supabase local + migration + seed + Vitest)
- ยิงจริงผ่าน HTTP: `POST /api/line/webhook` 200 ใน 292 ms (เพดานของ LINE คือ 2 วินาที), ลายเซ็นผิดได้ 400 ใน 12 ms, ข้อความใหม่ขึ้นกระดานทันที
- ค้นพบระหว่างทำ: `npm run build` prerender หน้าแรกแล้วฝังข้อความ error ลง static shell เพราะ component throw ก่อนถึง `await` ใด ๆ แก้ด้วย `await connection()` ก่อนแตะฐานข้อมูล
- เทสต์จะ truncate ตาราง `messages`/`webhook_events`/`customers` ทุกเคส หลังรัน `npm test` ข้อมูล seed จึงหาย ให้รัน `npm run db:reset` ถ้าอยากได้ข้อมูลตัวอย่างคืน
