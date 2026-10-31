import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createSupabaseMessageStore } from "@/src/db/supabase-store";
import type { ProfileClient } from "@/src/line/profile";
import { createWebhookHandler } from "@/src/line/webhook-handler";
import { listRecentMessages } from "@/src/messages/queries";

import { createTestSql, resetData } from "./support/db";
import {
  textMessageEvent,
  webhookPayload,
  webhookRequest,
} from "./support/fixtures";

const CHANNEL_SECRET = "test-channel-secret";

const sql = createTestSql();
const client = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function stubProfiles(displayName: string | null): ProfileClient {
  return {
    async getProfile(userId) {
      return displayName === null ? null : { userId, displayName };
    },
  };
}

function webhook(profiles: ProfileClient = stubProfiles("คุณทดสอบ")) {
  return createWebhookHandler({
    channelSecret: CHANNEL_SECRET,
    store: createSupabaseMessageStore(client),
    profiles,
  });
}

async function rowCounts() {
  const [row] = await sql<
    { events: number; messages: number; customers: number }[]
  >`
    select
      (select count(*)::int from public.webhook_events) as events,
      (select count(*)::int from public.messages) as messages,
      (select count(*)::int from public.customers) as customers
  `;

  return { events: row.events, messages: row.messages, customers: row.customers };
}

beforeEach(async () => {
  await resetData(sql);
});

afterAll(async () => {
  await sql.end({ timeout: 5 });
});

describe("POST /api/line/webhook", () => {
  it("บันทึกข้อความใหม่ที่ลายเซ็นถูกต้องและพาไปขึ้นกระดาน", async () => {
    const event = textMessageEvent();
    const response = await webhook()(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: webhookPayload([event]),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ recorded: 1 });

    const board = await listRecentMessages(client);
    expect(board).toHaveLength(1);
    expect(board[0].body).toBe("โกโก้ปั่น 2 แก้วครับ");
    expect(board[0].displayName).toBe("คุณทดสอบ");

    const [message] = await sql<{ sent_at: Date; line_user_id: string }[]>`
      select m.sent_at, c.line_user_id
      from public.messages m
      join public.customers c on c.id = m.customer_id
    `;
    expect(message.sent_at.toISOString()).toBe(
      new Date(event.timestamp).toISOString(),
    );
    expect(message.line_user_id).toBe(event.source.userId);
  });

  it("ปฏิเสธลายเซ็นที่ไม่ถูกต้องโดยไม่เขียนข้อมูลใดเลย", async () => {
    const response = await webhook()(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: webhookPayload([textMessageEvent()]),
        signature: "this-is-not-the-right-signature",
      }),
    );

    expect(response.status).toBe(400);
    expect(await rowCounts()).toEqual({ events: 0, messages: 0, customers: 0 });
  });

  it("ปฏิเสธคำขอที่ไม่มี header ลายเซ็น", async () => {
    const response = await webhook()(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: webhookPayload([textMessageEvent()]),
        signature: null,
      }),
    );

    expect(response.status).toBe(400);
    expect(await rowCounts()).toEqual({ events: 0, messages: 0, customers: 0 });
  });

  it("ตอบ 200 แต่ไม่เก็บซ้ำเมื่อ event เดิมถูกส่งมาอีกครั้ง", async () => {
    const payload = webhookPayload([textMessageEvent()]);

    const first = await webhook()(
      webhookRequest({ channelSecret: CHANNEL_SECRET, payload }),
    );
    const second = await webhook()(
      webhookRequest({ channelSecret: CHANNEL_SECRET, payload }),
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: 1 });
    expect(await rowCounts()).toEqual({ events: 1, messages: 1, customers: 1 });
  });

  it("ยังบันทึกข้อความได้เมื่อดึงโปรไฟล์ผู้ส่งไม่สำเร็จ", async () => {
    const response = await webhook(stubProfiles(null))(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: webhookPayload([textMessageEvent()]),
      }),
    );

    expect(response.status).toBe(200);

    const board = await listRecentMessages(client);
    expect(board).toHaveLength(1);
    expect(board[0].displayName).toBeNull();
  });

  it("ตอบ 200 ให้คำขอตรวจสอบ webhook ที่ไม่มี event", async () => {
    const response = await webhook()(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: { destination: "Udestination", events: [] },
      }),
    );

    expect(response.status).toBe(200);
    expect(await rowCounts()).toEqual({ events: 0, messages: 0, customers: 0 });
  });

  it("เพิกเฉย event ที่ไม่ใช่ข้อความตัวอักษร", async () => {
    const follow = {
      type: "follow",
      webhookEventId: "01HTESTFOLLOW00000000000001",
      timestamp: 1_790_000_000_000,
      source: { type: "user", userId: "Utest0000000000000000000000001" },
    };

    const response = await webhook()(
      webhookRequest({
        channelSecret: CHANNEL_SECRET,
        payload: webhookPayload([follow]),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ignored: 1 });
    expect(await rowCounts()).toEqual({ events: 0, messages: 0, customers: 0 });
  });
});

describe("route handler ที่ผูกกับ Next.js", () => {
  it("export POST ให้ LINE เรียกได้", async () => {
    const route = await import("@/app/api/line/webhook/route");
    expect(typeof route.POST).toBe("function");
  });
});
