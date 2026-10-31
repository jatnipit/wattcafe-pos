/**
 * ตรวจลายเซ็นของ LINE webhook
 *
 * กติกาจาก LINE: signature = Base64(HMAC-SHA256(channel secret, raw body))
 * และต้องเทียบกับ header `x-line-signature` แบบคงเวลา (constant time)
 *
 * ใช้ Web Crypto ไม่ใช้ node:crypto เพื่อให้รันได้ทั้ง Node และ Cloudflare Workers
 * โดยไม่ต้องเปิด nodejs_compat
 */

const encoder = new TextEncoder();

export async function signBody(
  channelSecret: string,
  rawBody: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * เทียบแบบไม่ลัดวงจร: ใช้เวลาเท่ากันทุกกรณี เพื่อไม่ให้เดาลายเซ็นได้ทีละตัว
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

export async function verifySignature(input: {
  channelSecret: string;
  rawBody: string;
  signature: string | null;
}): Promise<boolean> {
  const { channelSecret, rawBody, signature } = input;

  if (!channelSecret || !signature) return false;

  const expected = await signBody(channelSecret, rawBody);
  return timingSafeEqual(expected, signature);
}
