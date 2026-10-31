import { parseWebhookPayload } from "@/src/line/events";
import type { IntakeDeps, IntakeOutcome } from "@/src/messages/intake";
import { intakeEvent } from "@/src/messages/intake";
import { verifySignature } from "@/src/line/signature";

export type WebhookHandlerDeps = IntakeDeps & {
  channelSecret: string;
};

export type WebhookSummary = {
  received: number;
  recorded: number;
  duplicate: number;
  ignored: number;
};

/**
 * สร้าง handler ของ POST /api/line/webhook
 *
 * สัญญากับ LINE:
 * - ลายเซ็นไม่ถูกต้อง -> 400 และไม่เขียนอะไรลงฐานข้อมูลเลย
 * - ผ่าน -> 200 ภายใน 2 วินาที
 * - ฐานข้อมูลล่ม -> 500 เพื่อให้ LINE ส่งซ้ำ (ถ้าเปิด webhook redelivery)
 */
export function createWebhookHandler(deps: WebhookHandlerDeps) {
  return async function POST(request: Request): Promise<Response> {
    // ต้องอ่าน raw body ก่อน parse เพื่อให้ตรวจลายเซ็นได้ตรงตามที่ LINE ส่งมา
    const rawBody = await request.text();

    const signatureValid = await verifySignature({
      channelSecret: deps.channelSecret,
      rawBody,
      signature: request.headers.get("x-line-signature"),
    });

    if (!signatureValid) {
      return Response.json(
        { error: "invalid signature" },
        { status: 400 },
      );
    }

    let payload;
    try {
      payload = parseWebhookPayload(rawBody);
    } catch {
      return Response.json({ error: "invalid payload" }, { status: 400 });
    }

    const summary: WebhookSummary = {
      received: payload.events.length,
      recorded: 0,
      duplicate: 0,
      ignored: 0,
    };

    try {
      for (const event of payload.events) {
        const outcome: IntakeOutcome = await intakeEvent(event, {
          store: deps.store,
          profiles: deps.profiles,
        });
        summary[outcome] += 1;
      }
    } catch (error) {
      console.error("line webhook failed", error);
      return Response.json({ error: "internal error" }, { status: 500 });
    }

    return Response.json(summary, { status: 200 });
  };
}
