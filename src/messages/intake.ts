import type { ProfileClient } from "@/src/line/profile";
import type { LineWebhookEvent } from "@/src/line/events";

export type RecordIncomingInput = {
  webhookEventId: string;
  eventType: string;
  lineUserId: string;
  body: string;
  sentAt: Date;
  displayName: string | null;
};

export type RecordIncomingResult = {
  status: "recorded" | "duplicate";
  messageId: string | null;
};

export interface MessageStore {
  recordIncoming(input: RecordIncomingInput): Promise<RecordIncomingResult>;
}

export type IntakeDeps = {
  store: MessageStore;
  profiles: ProfileClient;
};

export type IntakeOutcome = "recorded" | "duplicate" | "ignored";

/**
 * แปลง event ของ LINE หนึ่งอันเป็นข้อความในฐานข้อมูล
 *
 * รับเฉพาะข้อความตัวอักษร เพราะระบบนี้เก็บ "สิ่งที่ลูกค้าพิมพ์" เพื่อให้ร้านอ่าน
 * event อื่น (follow, sticker, รูป) ถูกเพิกเฉยโดยไม่เขียนอะไรลงฐานข้อมูล
 */
export async function intakeEvent(
  event: LineWebhookEvent,
  deps: IntakeDeps,
): Promise<IntakeOutcome> {
  if (event.type !== "message") return "ignored";
  if (event.message?.type !== "text") return "ignored";

  const lineUserId = event.source?.userId;
  const body = event.message.text;
  const webhookEventId = event.webhookEventId;

  if (!lineUserId || !body || !webhookEventId) return "ignored";

  const sentAt = new Date(event.timestamp);
  if (Number.isNaN(sentAt.getTime())) return "ignored";

  // ดึงโปรไฟล์ก่อนเขียน เพื่อให้ได้ชื่อมาในรอบเดียว
  // ถ้าดึงไม่ได้ (LINE ล่ม, ผู้ใช้บล็อก, หมดเวลา) ยังบันทึกข้อความต่อโดยไม่มีชื่อ
  // กันทั้งกรณี adapter คืน null และกรณี adapter throw เอง
  const profile = await deps.profiles.getProfile(lineUserId).catch(() => null);

  const result = await deps.store.recordIncoming({
    webhookEventId,
    eventType: event.type,
    lineUserId,
    body,
    sentAt,
    displayName: profile?.displayName ?? null,
  });

  return result.status;
}
