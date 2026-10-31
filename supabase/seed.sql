-- ข้อมูลตัวอย่างสำหรับรันบนเครื่อง ให้กระดานไม่ว่างตอนเปิดครั้งแรก
-- ลบทิ้งได้ด้วย: supabase db reset

insert into public.customers (line_user_id, display_name)
values
  ('Udemo00000000000000000000000001', 'คุณสมชาย (ตัวอย่าง)'),
  ('Udemo00000000000000000000000002', 'คุณมาลี (ตัวอย่าง)')
on conflict (line_user_id) do nothing;

insert into public.webhook_events (webhook_event_id, event_type)
values
  ('demo-event-0001', 'message'),
  ('demo-event-0002', 'message'),
  ('demo-event-0003', 'message')
on conflict (webhook_event_id) do nothing;

insert into public.messages (webhook_event_id, customer_id, body, sent_at)
select 'demo-event-0001', c.id, 'โกโก้ปั่น 2 แก้วครับ', now() - interval '18 minutes'
from public.customers c where c.line_user_id = 'Udemo00000000000000000000000001'
on conflict (webhook_event_id) do nothing;

insert into public.messages (webhook_event_id, customer_id, body, sent_at)
select 'demo-event-0002', c.id, 'ชาไทยเย็น หวานน้อย 1 แก้ว', now() - interval '11 minutes'
from public.customers c where c.line_user_id = 'Udemo00000000000000000000000002'
on conflict (webhook_event_id) do nothing;

insert into public.messages (webhook_event_id, customer_id, body, sent_at)
select 'demo-event-0003', c.id, 'ส่งบ้านเลขที่ 42 หมู่ 5 นะคะ', now() - interval '4 minutes'
from public.customers c where c.line_user_id = 'Udemo00000000000000000000000002'
on conflict (webhook_event_id) do nothing;
