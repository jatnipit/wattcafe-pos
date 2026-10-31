import { Suspense } from "react";
import { connection } from "next/server";

import { createServiceClient } from "@/src/db/supabase";
import { listRecentMessages, type BoardMessage } from "@/src/messages/queries";

const timestampFormat = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          กระดานข้อความเข้า
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ข้อความที่ลูกค้าส่งเข้าทาง LINE OA · ระบบไม่ส่งข้อความตอบกลับ
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลดข้อความ...</p>}>
        <MessageList />
      </Suspense>
    </main>
  );
}

async function MessageList() {
  // ต้อง defer ไปตอนมี request จริง ไม่ใช่ตอน build
  // ถ้าไม่เรียก connection() ก่อน การ throw จาก env ที่ยังไม่ตั้งจะถูกฝังลง static shell
  await connection();

  let messages: BoardMessage[];

  try {
    messages = await listRecentMessages(createServiceClient());
  } catch (error) {
    console.error("board load failed", error);
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        อ่านข้อความไม่ได้ ตรวจว่าฐานข้อมูลทำงานอยู่และค่าใน .env.local ถูกต้อง
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        ยังไม่มีข้อความเข้ามา
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {messages.map((message) => (
        <li
          key={message.id}
          className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {message.displayName ?? "ไม่ทราบชื่อ"}
            </span>
            <time
              dateTime={message.receivedAt}
              className="shrink-0 text-xs text-zinc-500"
            >
              {timestampFormat.format(new Date(message.receivedAt))}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {message.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
