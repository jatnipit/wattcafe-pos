/**
 * รูปร่างของ LINE webhook ที่ระบบใช้จริง
 *
 * ไม่พึ่ง type จาก SDK เพราะ LINE เพิ่ม field ใหม่ได้ตลอด และเราไม่ต้องการ
 * ให้ type ที่เข้มเกินจริงทำให้ข้อมูลที่ถูกต้องถูกทิ้ง
 */

export type LineWebhookEvent = {
  type: string;
  webhookEventId: string;
  timestamp: number;
  source?: {
    type?: string;
    userId?: string;
  };
  message?: {
    type?: string;
    id?: string;
    text?: string;
  };
};

export type LineWebhookPayload = {
  destination?: string;
  events: LineWebhookEvent[];
};

export function parseWebhookPayload(rawBody: string): LineWebhookPayload {
  const parsed: unknown = JSON.parse(rawBody);

  if (typeof parsed !== "object" || parsed === null) {
    return { events: [] };
  }

  const events = (parsed as { events?: unknown }).events;
  if (!Array.isArray(events)) {
    return { events: [] };
  }

  return {
    destination: (parsed as { destination?: string }).destination,
    events: events as LineWebhookEvent[],
  };
}
