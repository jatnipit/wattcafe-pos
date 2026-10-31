import type { SupabaseClient } from "@supabase/supabase-js";

export type BoardMessage = {
  id: string;
  body: string;
  sentAt: string;
  receivedAt: string;
  displayName: string | null;
  lineUserId: string;
};

type MessageRow = {
  id: string;
  body: string;
  sent_at: string;
  received_at: string;
  customer: {
    display_name: string | null;
    line_user_id: string;
  } | null;
};

/**
 * ข้อความล่าสุดสำหรับกระดาน
 *
 * เรียงตามเวลาที่ระบบได้รับ ไม่ใช่เวลาที่ LINE ส่ง เพราะ LINE ไม่รับประกันลำดับ
 * ของ webhook ที่ส่งซ้ำ
 */
export async function listRecentMessages(
  client: SupabaseClient,
  limit = 50,
): Promise<BoardMessage[]> {
  const { data, error } = await client
    .from("messages")
    .select(
      "id, body, sent_at, received_at, customer:customers(display_name, line_user_id)",
    )
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as MessageRow[];

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    sentAt: row.sent_at,
    receivedAt: row.received_at,
    displayName: row.customer?.display_name ?? null,
    lineUserId: row.customer?.line_user_id ?? "",
  }));
}
