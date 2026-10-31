import { execSync } from "node:child_process";

/**
 * เทสต์ทุกตัวคุยกับ Postgres จริง (Supabase local) ไม่ใช่ฐานข้อมูลจำลอง
 * ค่าจึงอ่านจาก stack ที่รันอยู่ ไม่ hardcode ไว้ในโค้ด
 */
function readSupabaseStatus(): Record<string, string> {
  let output: string;

  try {
    output = execSync("npx supabase status -o env", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "อ่านสถานะ Supabase local ไม่ได้: ให้รัน `npx supabase start` ก่อน หรือใช้ `npm test`",
    );
  }

  const values: Record<string, string> = {};

  for (const line of output.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)="?(.*?)"?$/.exec(line.trim());
    if (match) values[match[1]] = match[2];
  }

  return values;
}

if (!process.env.DATABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const status = readSupabaseStatus();

  process.env.SUPABASE_URL ??= status.API_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= status.SERVICE_ROLE_KEY;
  process.env.DATABASE_URL ??= status.DB_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= status.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= status.ANON_KEY;
}

for (const name of [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  if (!process.env[name]) {
    throw new Error(
      `ไม่มี ${name}: รัน \`npx supabase start\` ก่อนแล้วลองใหม่`,
    );
  }
}
