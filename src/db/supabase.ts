import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "@/src/env";

/**
 * client ฝั่งเซิร์ฟเวอร์ที่ใช้ service role
 *
 * ใช้ HTTPS (PostgREST) ไม่ใช่ TCP โดยตั้งใจ เพราะ Cloudflare Workers
 * ไม่สามารถเปิด connection ตรงไป PostgreSQL ได้
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
