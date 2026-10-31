import { createServiceClient } from "@/src/db/supabase";
import { createSupabaseMessageStore } from "@/src/db/supabase-store";
import { requireEnv } from "@/src/env";
import { createHttpProfileClient } from "@/src/line/profile";
import { createWebhookHandler } from "@/src/line/webhook-handler";

/**
 * POST /api/line/webhook
 *
 * สร้าง dependency ตอนรับคำขอ ไม่ใช่ตอน import เพื่อให้ build ไม่ต้องมี env
 * และเพื่อให้คำขอแรกหลัง deploy ยังอ่านค่าใหม่ได้
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const handler = createWebhookHandler({
      channelSecret: requireEnv("LINE_CHANNEL_SECRET"),
      store: createSupabaseMessageStore(createServiceClient()),
      profiles: createHttpProfileClient({
        channelAccessToken: requireEnv("LINE_CHANNEL_ACCESS_TOKEN"),
      }),
    });

    return await handler(request);
  } catch (error) {
    console.error("line webhook setup failed", error);
    return Response.json({ error: "not configured" }, { status: 500 });
  }
}
