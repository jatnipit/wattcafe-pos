-- Ticket 01: รับข้อความ LINE เข้ามาเก็บและขึ้นกระดาน
-- ขอบเขต: dedupe ของ webhook, เก็บลูกค้า, เก็บข้อความ
-- ยังไม่มีเมนู/ออเดอร์ (ticket 04) และยังไม่มี auth (ticket 02)

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null unique,
  display_name text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- primary key ของ webhook_events คือ webhookEventId ของ LINE
-- การ insert ชนกันจึงเป็นกลไกกัน event ซ้ำทั้งระบบ
create table public.webhook_events (
  webhook_event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  webhook_event_id text not null unique
    references public.webhook_events (webhook_event_id) on delete cascade,
  customer_id uuid not null
    references public.customers (id) on delete cascade,
  body text not null,
  sent_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index messages_received_at_idx on public.messages (received_at desc);

alter table public.customers enable row level security;
alter table public.webhook_events enable row level security;
alter table public.messages enable row level security;

-- ยังไม่มี policy โดยตั้งใจ: ticket 01 เปิดให้เฉพาะ service_role
-- (service_role ข้าม RLS) ส่วน policy สำหรับ Staff มาพร้อม ticket 02

-- รับข้อความหนึ่งครั้งแบบ atomic: กันซ้ำ + upsert ลูกค้า + insert ข้อความ
-- คืน status = 'duplicate' เมื่อ webhookEventId นี้เคยเข้ามาแล้ว
create or replace function public.record_incoming_message(
  p_webhook_event_id text,
  p_event_type text,
  p_line_user_id text,
  p_body text,
  p_sent_at timestamptz,
  p_display_name text default null
)
returns table (status text, message_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_message_id uuid;
begin
  insert into public.webhook_events (webhook_event_id, event_type)
  values (p_webhook_event_id, p_event_type)
  on conflict (webhook_event_id) do nothing;

  if not found then
    return query select 'duplicate'::text, null::uuid;
    return;
  end if;

  insert into public.customers as c (line_user_id, display_name, last_seen_at)
  values (p_line_user_id, p_display_name, now())
  on conflict (line_user_id) do update
    set last_seen_at = now(),
        display_name = coalesce(excluded.display_name, c.display_name)
  returning c.id into v_customer_id;

  insert into public.messages (webhook_event_id, customer_id, body, sent_at)
  values (p_webhook_event_id, v_customer_id, p_body, p_sent_at)
  returning id into v_message_id;

  return query select 'recorded'::text, v_message_id;
end;
$$;

revoke all on function public.record_incoming_message(
  text, text, text, text, timestamptz, text
) from public;

grant execute on function public.record_incoming_message(
  text, text, text, text, timestamptz, text
) to service_role;
