import postgres from "postgres";

export type TestSql = ReturnType<typeof postgres>;

export function createTestSql(): TestSql {
  return postgres(process.env.DATABASE_URL as string, {
    max: 1,
    onnotice: () => {},
  });
}

/**
 * ล้างข้อมูลระหว่างเทสต์ ไม่แตะ schema
 * seed.sql ถูก truncate ด้วย ซึ่งไม่กระทบเทสต์เพราะทุกเทสต์สร้างข้อมูลเอง
 */
export async function resetData(sql: TestSql): Promise<void> {
  await sql`
    truncate table public.messages, public.webhook_events, public.customers
    restart identity cascade
  `;
}
