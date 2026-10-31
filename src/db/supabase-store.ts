import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MessageStore,
  RecordIncomingInput,
  RecordIncomingResult,
} from "@/src/messages/intake";

type RecordIncomingRow = {
  status: "recorded" | "duplicate";
  message_id: string | null;
};

/**
 * ที่เก็บข้อความผ่าน PostgREST
 *
 * การกัน event ซ้ำ + upsert ลูกค้า + insert ข้อความ อยู่ในฟังก์ชันเดียวในฐานข้อมูล
 * (record_incoming_message) จึงสำเร็จหรือล้มเหลวพร้อมกัน ไม่มีทางเกิดข้อความครึ่งเดียว
 */
export function createSupabaseMessageStore(
  client: SupabaseClient,
): MessageStore {
  return {
    async recordIncoming(input: RecordIncomingInput) {
      const { data, error } = await client.rpc("record_incoming_message", {
        p_webhook_event_id: input.webhookEventId,
        p_event_type: input.eventType,
        p_line_user_id: input.lineUserId,
        p_body: input.body,
        p_sent_at: input.sentAt.toISOString(),
        p_display_name: input.displayName,
      });

      if (error) throw error;

      const rows = (Array.isArray(data) ? data : [data]) as RecordIncomingRow[];
      const row = rows[0];

      if (!row) throw new Error("record_incoming_message returned no row");

      const result: RecordIncomingResult = {
        status: row.status,
        messageId: row.message_id,
      };

      return result;
    },
  };
}
