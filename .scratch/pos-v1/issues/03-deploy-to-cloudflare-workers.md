# 03: ขึ้นระบบจริงบน Cloudflare Workers และผูก webhook กับ LINE

**What to build:** ระบบรันบน URL HTTPS คงที่ที่ LINE ยิงเข้ามาได้จริง และมีตัวเลข CPU/ปริมาณ request ที่วัดได้จากของจริง เพื่อพิสูจน์ว่าเพดานแผนฟรีก่อนสร้างฟีเจอร์ที่เหลือ

**Blocked by:** 01 — วางฐานระบบและพาข้อความ LINE ขึ้นกระดาน; 02 — เข้าสู่ระบบด้วย Google และแบ่งสิทธิ์ Staff/Super Admin

**Status:** ready-for-agent

- [ ] deploy แล้วได้ URL HTTPS คงที่และหน้าแรกโหลดได้
- [ ] ตั้ง webhook URL ใน LINE console แล้วส่งข้อความจริงเข้ามา ข้อความขึ้นกระดานภายใน 5 วินาที
- [ ] บันทึก CPU time ต่อ request และจำนวน request/วัน จาก dashboard ของผู้ให้บริการ
- [ ] ถ้า CPU เกิน 10 ms ต่อ request ให้บันทึกผลและทางเลือก (Workers Paid) ไว้ใน ticket นี้
- [ ] หน้าเว็บเข้าได้เฉพาะผู้ที่ล็อกอินแล้ว
- [ ] ตรวจ bundle แล้วไม่มี secret ฝั่ง client
