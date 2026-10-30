# โฮสต์บน Cloudflare Workers free

Vercel Hobby ห้ามใช้เชิงพาณิชย์อย่างชัดเจน และ free tier ของ Render หลับจน webhook รับไม่ได้ ส่วน Supabase ไม่มีผลิตภัณฑ์โฮสต์ Next.js เราจึงเลือก Cloudflare Workers เพราะไม่มีข้อห้ามเชิงพาณิชย์ มี URL คงที่แบบ HTTPS และโควตา 100,000 request/วัน ซึ่งเกินพอสำหรับร้านเดียว โดยยอมรับเพดาน CPU 10 ms ต่อ request และสถานะ beta ของ Next.js บน Workers

**Consequences**: โค้ดฝั่งเซิร์ฟเวอร์ต้องเล็ก (webhook, auth callback) และงานอ่านข้อมูลหนักควรวิ่งจากเบราว์เซอร์ด้วย RLS; หากชนเพดาน CPU ให้อัปเกรดเป็น Workers Paid (~$5/เดือน) ไม่ใช่ย้ายไป Vercel Pro
