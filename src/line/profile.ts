export type LineProfile = {
  userId: string;
  displayName: string | null;
};

export interface ProfileClient {
  /** คืน null เมื่อดึงไม่ได้ ไม่ throw เพื่อไม่ให้ข้อความตกหล่น */
  getProfile(userId: string): Promise<LineProfile | null>;
}

export type HttpProfileClientOptions = {
  channelAccessToken: string;
  /** เปลี่ยนได้ในเทสต์ ไม่ต้องเรียก LINE จริง */
  baseUrl?: string;
  /** งบเวลาของ webhook ทั้งคำขอคือ 2 วินาที จึงเผื่อให้การดึงโปรไฟล์แค่ 1 วินาที */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export function createHttpProfileClient(
  options: HttpProfileClientOptions,
): ProfileClient {
  const {
    channelAccessToken,
    baseUrl = "https://api.line.me",
    timeoutMs = 1000,
    fetchImpl = fetch,
  } = options;

  return {
    async getProfile(userId) {
      try {
        const response = await fetchImpl(
          `${baseUrl}/v2/bot/profile/${encodeURIComponent(userId)}`,
          {
            headers: { Authorization: `Bearer ${channelAccessToken}` },
            signal: AbortSignal.timeout(timeoutMs),
          },
        );

        if (!response.ok) return null;

        const body = (await response.json()) as {
          userId?: string;
          displayName?: string;
        };

        return {
          userId: body.userId ?? userId,
          displayName: body.displayName ?? null,
        };
      } catch {
        return null;
      }
    },
  };
}
