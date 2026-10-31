import { createHmac } from "node:crypto";

/**
 * เซ็นและสร้าง Request เองในเทสต์ ด้วย node:crypto
 * จงใจไม่ใช้ signBody ของแอป เพื่อไม่ให้เทสต์ผ่านเพราะโค้ดเดียวกันผิดทั้งคู่
 */
export function sign(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

export type TextMessageOverrides = {
  webhookEventId?: string;
  userId?: string;
  text?: string;
  timestamp?: number;
};

export function textMessageEvent(overrides: TextMessageOverrides = {}) {
  return {
    type: "message",
    webhookEventId: overrides.webhookEventId ?? "01HTESTEVENT000000000000001",
    timestamp: overrides.timestamp ?? 1_790_000_000_000,
    source: { type: "user", userId: overrides.userId ?? "Utest0000000000000000000000001" },
    message: {
      type: "text",
      id: "msg-1",
      text: overrides.text ?? "โกโก้ปั่น 2 แก้วครับ",
    },
  };
}

export function webhookPayload(events: unknown[]) {
  return { destination: "Udestination", events };
}

export function webhookRequest(input: {
  channelSecret: string;
  payload: unknown;
  signature?: string | null;
  rawBody?: string;
}): Request {
  const rawBody = input.rawBody ?? JSON.stringify(input.payload);
  const headers = new Headers({ "content-type": "application/json" });

  if (input.signature === undefined) {
    headers.set("x-line-signature", sign(input.channelSecret, rawBody));
  } else if (input.signature !== null) {
    headers.set("x-line-signature", input.signature);
  }

  return new Request("http://localhost/api/line/webhook", {
    method: "POST",
    headers,
    body: rawBody,
  });
}
