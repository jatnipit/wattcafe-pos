# Setup บริการภายนอก (ทำด้วยมือ)

เอกสารนี้คือรายการสิ่งที่ **คุณต้องทำเอง** ก่อนและระหว่างสร้างระบบ เพราะเป็นขั้นตอนที่ agent ทำแทนไม่ได้ (สร้างบัญชี, กดยืนยันในหน้าจอ, คัดลอกกุญแจ)

ติ๊ก `- [ ]` เป็น `- [x]` เมื่อทำเสร็จ แล้วบอก agent ว่าทำถึงข้อไหน

- ทุกอย่างในเอกสารนี้ใช้แผนฟรีทั้งหมด ค่าใช้จ่าย 0 บาท
- ใช้เวลารวมประมาณ 60–90 นาที (รอ Supabase สร้างโปรเจกต์นานสุด)
- ทำไม่จบในรอบเดียวได้ กลับมาทำต่อได้ตลอด ไม่มีอะไรเสียหาย

---

## ก่อนเริ่ม: ต้องมีอะไรในเครื่อง

- [x] **Docker Desktop** เปิดอยู่ (ใช้รัน Supabase local สำหรับเทสต์) — ตรวจด้วย `docker info`
  - Docker Desktop บน Windows ใช้ Linux containers จึงต้องเปิด **WSL2** ก่อน ถ้า `wsl --status` ยังบอกว่า "WSL2 is not supported" ให้รัน `wsl --install --no-distribution` ใน PowerShell as Administrator แล้วรีสตาร์ท 1 ครั้ง (ทำแล้ว 31 ต.ค. 2026)
- [x] **Node.js** ติดตั้งแล้ว (มีอยู่: v26.13.0)
- [x] **Git Bash** ใช้ได้ที่ `C:\Program Files\Git\bin\bash.exe` (มีอยู่)
  - หมายเหตุ: `bash` ที่อยู่ใน PATH คือ WSL ซึ่งยังไม่ได้ติดตั้ง ถ้าเจอ error แปลก ๆ ให้เรียก Git Bash ตรง ๆ
- [ ] **GitHub CLI (`gh`)** — ยังไม่มีในเครื่อง ติดตั้งด้วย `winget install --id GitHub.cli` แล้วเปิด terminal ใหม่
  - ใช้สำหรับส่งค่าเข้า GitHub Actions (ข้อ 6) ถ้าไม่อยากติดตั้ง ข้ามได้แล้วไปตั้ง secret ในหน้าเว็บเอง

**ทำไมต้องมี:** สามข้อแรกปลดล็อก ticket 01 (รันบนเครื่อง) ส่วน `gh` ปลดล็อก ticket 12 (backup)

---

## 1. Supabase: สร้างโปรเจกต์ production

**ปลดล็อก:** ticket 02, 03, 12
**หน้าเว็บ:** https://supabase.com/dashboard/projects

- [x] สมัคร/ล็อกอิน Supabase ด้วยบัญชี GitHub หรือ Google
- [x] กด **New project**
- [x] ตั้งชื่อ `wattcafe-pos`
- [x] เลือก Region **Southeast Asia (Singapore)** — ใกล้ไทยที่สุด ลด latency
- [x] ตั้ง **Database Password** ให้ยาวและสุ่ม แล้วเก็บลง password manager ทันที
  - สำคัญ: หน้านี้แสดงรหัสครั้งเดียว ถ้าหายต้อง reset ซึ่งจะกระทบ connection string
- [x] รอจนสถานะเป็น **Active** (ประมาณ 2 นาที)
- [x] คัดลอก **project ref** จาก URL: `dashboard/project/<ref>` (ref คือชุดอักษร 20 ตัว)
- [ ] จดบันทึก:

```
SUPABASE_PROJECT_REF  =
SUPABASE_DB_PASSWORD  = (เก็บใน password manager)
SUPABASE_URL          = https://<ref>.supabase.co
```

**ตรวจว่าเสร็จ:** เปิด `https://<ref>.supabase.co/rest/v1/` แล้วได้ JSON กลับมา (ไม่ใช่ error)

---

## 2. Supabase: เอา API keys

**ปลดล็อก:** ticket 01 (ตอนต่อกับ hosted), 02, 03
**หน้าเว็บ:** `https://supabase.com/dashboard/project/<ref>/settings/api-keys`
(โปรเจกต์เก่าอาจอยู่ที่ `Settings → API`)

- [x] คัดลอก **Project URL** แล้วเทียบกับ `SUPABASE_URL` ที่จดไว้ในข้อ 1 ต้องตรงกัน
- [x] คัดลอก **anon / publishable key** (ขึ้นต้นด้วย `eyJ...` หรือ `sb_publishable_...`)
- [x] คัดลอก **service_role / secret key** (ขึ้นต้นด้วย `eyJ...` หรือ `sb_secret_...`)

```
NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  =
SUPABASE_SERVICE_ROLE_KEY      =
```

> ⚠ `service_role` ข้าม RLS ทั้งหมด ห้ามหลุดไปฝั่งเบราว์เซอร์หรือขึ้น git เด็ดขาด

- [x] เขียนค่าทั้งสามลง `.env.hosted` ด้วยตัวเอง (ดูวิธีในหัวข้อ "เขียนไฟล์ `.env` ด้วยตัวเอง" ท้ายเอกสาร)
- [x] อย่าส่งค่าลับในแชต — agent ไม่อ่านและไม่เขียนไฟล์ `.env` ใด ๆ เว้น `.env.example` (กฎใน `AGENTS.md`)

---

## 3. Google Cloud: OAuth consent screen

**ปลดล็อก:** ticket 02
**หน้าเว็บ:** https://console.cloud.google.com/

- [ ] สร้างโปรเจกต์ใหม่ชื่อ `wattcafe-pos`
- [ ] เปิด **APIs & Services → OAuth consent screen**
  - ใน console เวอร์ชันใหม่เมนูนี้อยู่ในชื่อ **Google Auth Platform**
- [ ] เลือก **User type: External** (Internal ต้องมี Google Workspace องค์กร)
- [ ] กรอกชื่อแอป `Watt Cafe POS` และอีเมลสนับสนุน (อีเมลคุณ)
- [ ] เลือก scopes เฉพาะ 3 ตัวนี้ ไม่ต้องเพิ่มอะไร:
  - `openid`
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - เพิ่ม scope อื่นเมื่อไร Google อาจบังคับให้ผ่านการตรวจสอบนานเป็นสัปดาห์
- [ ] เพิ่ม **Test users**: อีเมล Google ของเจ้าของร้านและพนักงานทุกคนที่จะใช้ระบบ
  - สถานะ Testing ยอมรับเฉพาะอีเมลในลิสต์ นี่คือด่านที่หนึ่งของ allowlist
  - โควตาสูงสุด 100 test users ซึ่งเกินพอสำหรับร้านเดียว
- [ ] ยังไม่ต้องกด Publish to production

**หมายเหตุ:** แอปที่ขอแค่ email/profile/openid ไม่ต้องผ่าน Google verification และ authorization ของ test user **ไม่หมดอายุใน 7 วัน** (ข้อยกเว้นนี้ระบุไว้ในเอกสาร Google)

---

## 4. Google Cloud: สร้าง OAuth client

**ปลดล็อก:** ticket 02
**หน้าเว็บ:** https://console.cloud.google.com/apis/credentials

- [ ] กด **Create credentials → OAuth client ID**
- [ ] Application type: **Web application**
- [ ] **Authorized JavaScript origins** เพิ่ม:
  - [ ] `http://localhost:3000`
  - [ ] `http://127.0.0.1:3000`
- [ ] **Authorized redirect URIs** เพิ่ม 2 บรรทัดนี้ (คัดลอกจาก Supabase จะแม่นสุด):
  - [ ] `http://127.0.0.1:54321/auth/v1/callback` (สำหรับ Supabase local)
  - [ ] `https://<ref>.supabase.co/auth/v1/callback` (สำหรับ production)
- [ ] กด Create แล้วคัดลอก **Client ID** และ **Client secret**

```
GOOGLE_CLIENT_ID      =
GOOGLE_CLIENT_SECRET  =
```

> URL ของ Cloudflare Workers จะมาเพิ่มใน origins/redirect ตอนข้อ 8 หลังจาก deploy เสร็จ

---

## 5. Supabase Auth: เปิด Google และปิด signup

**ปลดล็อก:** ticket 02
**หน้าเว็บ:** `https://supabase.com/dashboard/project/<ref>/auth/providers`

- [ ] เปิด provider **Google**
- [ ] วาง Client ID และ Client secret จากข้อ 4
- [ ] คัดลอก **Callback URL** ที่หน้านี้แสดง แล้วเทียบกับ redirect URI ในข้อ 4 ต้องตรงกันเป๊ะ
  - ถ้าไม่ตรง จะได้ error `redirect_uri_mismatch` ตอนล็อกอิน
- [ ] กด Save

**หน้าเว็บ:** `https://supabase.com/dashboard/project/<ref>/auth/sign-in`

- [ ] ปิด **Allow new users to sign up**
  - ผลคือ "มีแต่บัญชีที่มีอยู่แล้วเท่านั้นที่ล็อกอินได้" ซึ่งเป็นกลไกหลักของ ADR-0004
- [ ] ตั้ง **Site URL** เป็น URL ของ Workers (ใส่ทีหลังได้ถ้ายังไม่ deploy)
- [ ] เพิ่ม `http://localhost:3000` ใน Redirect URLs สำหรับ dev

**ตรวจว่าเสร็จ:** ลองล็อกอินด้วยอีเมลที่ยังไม่มีในระบบ ต้องถูกปฏิเสธ (จะทดสอบจริงตอน ticket 02)

---

## 6. สร้างบัญชี Super Admin ล่วงหน้า

**ปลดล็อก:** ticket 02
**หน้าเว็บ:** `https://supabase.com/dashboard/project/<ref>/auth/users`

- [ ] กด **Add user → Create new user**
- [ ] กรอกอีเมล Google ของเจ้าของร้าน
- [ ] เปิด **Auto Confirm User** (ไม่ต้องส่งอีเมลยืนยัน)
- [ ] กด Create

```
SUPER_ADMIN_EMAIL =
```

**หมายเหตุ:** ขั้นนี้แค่ทำให้อีเมลมีบัญชีอยู่ใน Supabase Auth การกำหนดบทบาท `Super Admin` ในฐานข้อมูลของแอปเป็นงานของ ticket 02 (ไม่ใช่ติ๊กในเอกสารนี้)

---

## 7. LINE: สร้าง channel และเก็บกุญแจ

**ปลดล็อก:** ticket 03
**หน้าเว็บ:** https://developers.line.biz/console/

- [ ] สร้าง **Provider** ใหม่ ชื่อร้าน
- [ ] สร้าง channel ชนิด **Messaging API**
- [ ] กรอกชื่อร้าน, หมวดหมู่, อีเมล
- [ ] ไปที่แท็บ **Basic settings** แล้วคัดลอก **Channel secret**
- [ ] ไปที่แท็บ **Messaging API** เลื่อนหา **Channel access token** แล้วกด **Issue**
  - ถ้าไม่กด Issue จะไม่มี token ให้ใช้

```
LINE_CHANNEL_SECRET        =
LINE_CHANNEL_ACCESS_TOKEN  =
```

**หน้าเว็บ:** https://manager.line.biz/

- [ ] ไปที่ **Settings → Response settings**
- [ ] **ปิด Auto-reply messages**
- [ ] **ปิด Greeting messages**

> ⚠ ห้ามข้ามสองข้อนี้ ถ้าเปิดไว้ LINE จะส่งข้อความหาลูกค้าเอง ซึ่งขัด ADR-0002 (ระบบต้องไม่ส่งข้อความออกเลย) ทั้งที่โค้ดเราไม่ได้ส่งอะไร

- [ ] เปิด **Chat** ไว้ เพื่อให้ร้านพิมพ์ตอบลูกค้าเองได้ตามปกติ

> ยังไม่ต้องตั้ง Webhook URL ตอนนี้ — รอจน deploy เสร็จ (ข้อ 8)

---

## 8. Cloudflare: บัญชีและ deploy

**ปลดล็อก:** ticket 03
**หน้าเว็บ:** https://dash.cloudflare.com/

- [ ] สมัคร/ล็อกอิน Cloudflare
- [ ] ในเครื่อง รัน `npx wrangler login` แล้วกด Allow ในเบราว์เซอร์
- [ ] คัดลอก **Account ID** จาก URL ของ dashboard หรือแถบด้านข้างของ Workers & Pages

```
CLOUDFLARE_ACCOUNT_ID =
```

**หลัง agent deploy เสร็จ (ticket 03) — กลับมาทำส่วนนี้:**

- [ ] คัดลอก URL ที่ deploy ได้ เช่น `https://wattcafe-pos.<subdomain>.workers.dev`
- [ ] ไปที่ LINE Developers Console → channel → **Messaging API → Webhook settings**
- [ ] วาง `<URL>/api/line/webhook`
- [ ] กด **Verify** ต้องขึ้น Success
- [ ] เปิด **Use webhook**
- [ ] เปิด **Webhook redelivery** (LINE ปิดไว้โดยปริยาย การเปิดช่วยกู้ event ที่หลุด)
- [ ] กลับไปที่ Google Cloud → Authorized JavaScript origins: เพิ่ม URL ของ Workers
- [ ] กลับไปที่ Google Cloud → Authorized redirect URIs: เพิ่ม `<URL>/auth/v1/callback` ถ้าใช้ custom auth domain (ปกติไม่ต้อง)
- [ ] กลับไปที่ Supabase → Site URL: ใส่ URL ของ Workers

```
APP_BASE_URL =
```

---

## 9. GitHub secrets สำหรับ backup รายวัน

**ปลดล็อก:** ticket 12
**หน้าเว็บ:** https://supabase.com/dashboard/account/tokens

- [ ] กด **Generate new token** ตั้งชื่อ `backup-action` แล้วคัดลอกค่า
- [ ] ล็อกอิน `gh` ในเครื่อง: `gh auth login` (เลือก GitHub.com → HTTPS → Login with a web browser)

```
SUPABASE_ACCESS_TOKEN =
```

- [ ] ตั้ง secret และ variable ด้วยตัวเองด้วยคำสั่งนี้ (คำสั่งจะถามค่าทีละตัว จึงไม่ต้องพิมพ์ค่าลงใน command line และ agent ไม่ต้องเห็นค่า)

```bash
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_DB_PASSWORD
gh variable set SUPABASE_PROJECT_REF
```

**ทำไมต้องมี:** Supabase Free **ไม่มี backup อัตโนมัติเลย** ถ้าไม่ทำ dump รายวัน ข้อมูลออเดอร์หายถาวรเมื่อเกิดปัญหา

---

## 10. ปิดงาน: ตรวจว่าครบ

- [ ] `.env.hosted` มีค่าครบ 12 ตัว (คุณเขียนเอง) และไม่ถูก commit (`.env*` ถูก gitignore แล้ว)
- [ ] `git status --short` ไม่แสดงไฟล์ `.env` ใด ๆ
- [ ] `gh secret list` แสดง `SUPABASE_ACCESS_TOKEN` และ `SUPABASE_DB_PASSWORD`
- [ ] `gh variable list` แสดง `SUPABASE_PROJECT_REF`
- [ ] LINE: auto-reply และ greeting ปิดทั้งคู่
- [ ] LINE: webhook Verify ผ่าน และ Use webhook เปิด
- [ ] Google: test users มีอีเมลของทุกคนที่จะใช้ระบบ
- [ ] Supabase: Allow new users to sign up ปิดอยู่
- [ ] Supabase: มีบัญชี Super Admin ของเจ้าของร้าน

---

## ค่าทั้งหมดที่ต้องได้ (สรุปในที่เดียว)

| ชื่อค่า                         | มาจาก                         | เก็บที่                         | ลับ |
| ------------------------------- | ----------------------------- | ------------------------------- | --- |
| `SUPABASE_PROJECT_REF`          | URL ของโปรเจกต์               | `.env.hosted` + gh variable     | ไม่ |
| `SUPABASE_DB_PASSWORD`          | ตอนสร้างโปรเจกต์ (ครั้งเดียว) | `.env.hosted` + gh secret       | ใช่ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Settings → API keys           | `.env.hosted`                   | ไม่ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API keys           | `.env.hosted` + client bundle   | ไม่ |
| `SUPABASE_SERVICE_ROLE_KEY`     | Settings → API keys           | `.env.hosted` (server เท่านั้น) | ใช่ |
| `GOOGLE_CLIENT_ID`              | Google Cloud → Credentials    | `.env.hosted`                   | ไม่ |
| `GOOGLE_CLIENT_SECRET`          | Google Cloud → Credentials    | `.env.hosted`                   | ใช่ |
| `SUPER_ADMIN_EMAIL`             | อีเมลเจ้าของร้าน              | `.env.hosted`                   | ไม่ |
| `LINE_CHANNEL_SECRET`           | LINE Basic settings           | `.env.hosted`                   | ใช่ |
| `LINE_CHANNEL_ACCESS_TOKEN`     | LINE Messaging API tab        | `.env.hosted`                   | ใช่ |
| `CLOUDFLARE_ACCOUNT_ID`         | Cloudflare dashboard          | `.env.hosted`                   | ไม่ |
| `APP_BASE_URL`                  | หลัง deploy                   | `.env.hosted`                   | ไม่ |
| `SUPABASE_ACCESS_TOKEN`         | Account → Access tokens       | gh secret เท่านั้น              | ใช่ |

## `.env` สองไฟล์ที่ต้องแยกกัน

| ไฟล์          | ใช้เมื่อ                        | ค่า                                             | ใครเขียน    |
| ------------- | ------------------------------- | ----------------------------------------------- | ----------- |
| `.env.local`  | `npm run dev` และเทสต์บนเครื่อง | ชี้ไป Supabase local (`http://127.0.0.1:54321`) | คุณเขียนเอง |
| `.env.hosted` | อ้างอิงค่าจริงของ production    | ชี้ไปโปรเจกต์ Supabase บนคลาวด์                 | คุณเขียนเอง |

> แยกสองไฟล์เพราะถ้า `npm run dev` ชี้ไป production โดยไม่ตั้งใจ การทดสอบจะเขียนข้อมูลลงฐานข้อมูลจริง

### เขียนไฟล์ `.env` ด้วยตัวเอง

agent ถูกห้ามอ่านและเขียนไฟล์ `.env` ทุกไฟล์ (กฎใน `AGENTS.md`) แก้ได้แค่ `.env.example` ไฟล์จริงจึงต้องสร้างและกรอกด้วยมือเสมอ

1. **คัดลอกตัวอย่างเป็นไฟล์จริง**

   ```powershell
   Copy-Item .env.example .env.local    # สำหรับรันบนเครื่อง
   Copy-Item .env.example .env.hosted   # สำหรับอ้างอิงค่า production
   ```

2. **เติมค่าเฉพาะบรรทัดที่ต้องใช้** — เปิดด้วย editor เช่น `code .env.local`
   - รูปแบบคือ `ชื่อ=ค่า` ห้ามมีช่องว่างรอบ `=` และไม่ต้องใส่เครื่องหมายคำพูด
   - บรรทัดที่ขึ้นต้นด้วย `#` เป็น comment ปล่อยไว้ได้
   - ไฟล์ไหนใช้ค่าไหนดูจากหัวข้อใน `.env.example` และตารางค่าทั้งหมดด้านบน
   - `.env.local` ใช้ค่าจาก `npx supabase status` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`) ส่วน LINE ใช้ค่า dummy อะไรก็ได้ตอนเทสต์บนเครื่อง

3. **บันทึกเป็น UTF-8 without BOM** — ถ้าแก้ด้วย PowerShell 5.1 ให้ระวัง BOM (กับดักข้อ 8) วิธีที่ปลอดภัยคือใช้ VS Code แล้วดูมุมขวาล่างให้เป็น `UTF-8`

4. **ตรวจว่าไม่หลุดเข้า git**

   ```powershell
   git status --short    # ต้องไม่เห็น .env.local หรือ .env.hosted
   ```

5. **ถ้าแอปฟ้องว่าค่าหาย** — error จะบอกชื่อตัวแปรที่ขาด บอก agent ได้แค่ว่าตัวแปรไหนขาด โดยไม่ต้องส่งค่าจริง agent จะชี้ไปยังข้อในเอกสารนี้ที่ทำให้ได้ค่านั้น

> ห้าม commit ไฟล์จริงทุกกรณี แม้จะเป็น repo ส่วนตัว — `service_role` และ `LINE_CHANNEL_SECRET` คือกุญแจที่ใช้แทนรหัสผ่านของระบบทั้งหมด

## กับดักที่เจอบ่อย

1. **`bash` ใน PATH เป็น WSL ที่ยังไม่ติดตั้ง** — ถ้าคำสั่ง bash พัง ให้ใช้ `C:\Program Files\Git\bin\bash.exe`
2. **LINE auto-reply ยังเปิดอยู่** — ระบบจะดูเหมือน "ส่งข้อความออก" ทั้งที่โค้ดไม่ได้ส่ง เป็นข้อที่ขัด ADR-0002 มากที่สุด
3. **DB password หาย** — Supabase แสดงครั้งเดียว ต้อง reset ถ้าลืม
4. **redirect URI ไม่ตรงเป๊ะ** — ต่างกันแม้แต่ `localhost` กับ `127.0.0.1` ก็ล็อกอินไม่ได้
5. **ลืมเพิ่ม test user ใน Google** — อีเมลที่ไม่อยู่ในลิสต์จะล็อกอินไม่ได้ แม้จะสร้างบัญชีใน Supabase แล้ว
6. **Supabase Free pause หลังไม่มี activity 1 สัปดาห์** — ถ้าร้านหยุดยาว ต้องกด Resume ใน dashboard ก่อนใช้งาน
7. **พอร์ต 54321–54324 ชนกับ Supabase local ของโปรเจกต์อื่น** — ถ้า `supabase start` ฟ้อง `port is already allocated` ให้หา container ที่จองอยู่ด้วย `docker ps` แล้วหยุดด้วย `docker stop <id>` (ของโปรเจกต์อื่นจะกลับมาได้ด้วย `supabase start` ในโฟลเดอร์นั้น)
8. **`.env.local` ที่มี BOM ทำให้ Supabase CLI อ่าน config ไม่ได้** — ถ้าเจอ `failed to parse environment file ... unexpected character` ให้บันทึกไฟล์เป็น UTF-8 **without BOM** (Windows PowerShell 5.1 `Set-Content -Encoding utf8` เติม BOM ให้)
