# LINE Messaging API, Supabase, hosting and PDPA — primary-source facts

Purpose: settle open SRS decisions for a single-shop LINE-ordering POS with verified limits, prices and constraints. Accessed: 2026-10-30.

## A. LINE Messaging API

### A1. Webhook signature verification

- Signature = Base64(HMAC-SHA256(key = channel secret, data = the raw request body string)), compared with the request header `x-line-signature`. Source: https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
- The header field name is case-insensitive and may change case without notice (`X-Line-Signature` → `x-line-signature`). Source: https://developers.line.biz/en/reference/messaging-api/#request-headers
- The body must be verified as the exact received string: parsing, deserializing, pretty-printing, unescaping or re-encoding before verification makes the request "indistinguishable from a request that has been tampered with". Source: https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
- Webhooks are sent as `Content-Type: application/json; charset=utf-8`; processing in any other encoding (e.g. LF→CRLF conversion) breaks verification. Source: https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
- On mismatch or missing header the instruction is: "don't process the webhook event and end the process with an error"; LINE returns no specific status, so the bot server chooses its response. Source: https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
- LINE does not disclose source IPs; it explicitly says to use signature validation instead of IP allow-listing. Source: https://developers.line.biz/en/reference/messaging-api/#webhooks

### A2. Duplicate and retried delivery

- Webhook redelivery exists for all Messaging API channels and is **disabled by default**; it is enabled in the Developers Console ("Use webhook" + "Webhook redelivery"). Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery
- Redelivery is attempted when the bot server did not return a `2xx`; retries happen "for a pre-defined number of times with a time interval" that is **not disclosed** and "subject to change without notice". Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery-condition
- Duplicates can also arrive without retry being enabled ("by different reasons such as network routing problem"); LINE's stated dedupe key is `webhookEventId`. Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery
- A redelivered event is identical to the original except `deliveryContext.isRedelivery`; "values such as webhook event ID and reply token remain unchanged". Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#redelivered-webhooks
- Ordering is not guaranteed across redeliveries; LINE says to use `timestamp` to reconstruct order. Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery
- Redelivery is not a guarantee ("doesn't guarantee that webhooks will be reliably delivered") and may be force-disabled if retry volume spikes; LINE may suspend webhook sending to a server that fails to receive them "for a long time". Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#webhook-redelivery-condition and https://developers.line.biz/en/docs/messaging-api/receiving-messages/

### A3. Reply API (`POST /v2/bot/message/reply`)

- Reply tokens "can only be used once" and "must be used within one minute after receiving the webhook"; use beyond one minute "isn't guaranteed to work". Source: https://developers.line.biz/en/reference/messaging-api/#send-reply-message
- The time limit is subject to change without notice and varies with network delay, so LINE says "don't rely on the time limit". Source: https://developers.line.biz/en/reference/messaging-api/#send-reply-message
- A reply token in a redelivered webhook is usable within one minute of the redelivery, **except** if the original token was already used or 20 minutes have passed since the event. Source: https://developers.line.biz/en/reference/messaging-api/#send-reply-message
- Reuse or expiry returns HTTP `400` with `"message": "Invalid reply token"`; the status table lists "expired reply token" and "used reply token". Source: https://developers.line.biz/en/reference/messaging-api/#send-reply-message

### A4. Push API and monthly message quota

- **volatile** Thailand plans: Free = 300 messages/month, Basic = 1,280 THB/month (15,000 messages), Pro = 1,780 THB/month (35,000 messages); extra messages 0.10 THB (Basic) / 0.06 THB (Pro) each, prices exclude 7% VAT. Source: https://lineforbusiness.com/th/service/line-oa-features
- Counted toward the quota: push, multicast, broadcast and narrowcast. Not counted: reply messages. Source: https://developers.line.biz/en/docs/messaging-api/pricing/
- Quota is counted per recipient, not per message object: a push with four message objects to five people counts as five. Source: https://developers.line.biz/en/docs/messaging-api/pricing/
- Over the limit "an error response will be returned and the messages won't be sent"; quota exhaustion maps to HTTP `429`. Source: https://developers.line.biz/en/docs/messaging-api/pricing/ and https://developers.line.biz/en/reference/messaging-api/#status-codes
- Push can only reach friends, and non-friends only within 7 days of that user messaging the OA; otherwise `200` is returned but the user receives nothing. Source: https://developers.line.biz/en/reference/messaging-api/#send-push-message
- The Japan table on the pricing page (Free 200, Light ¥5,000/5,000, Standard ¥15,000/30,000, up to ¥3/message) is an example only — "Pricing plans vary by country or region". Source: https://developers.line.biz/en/docs/messaging-api/pricing/

### A5. Webhook response expectations

- "The bot server must return status code `200`" for every webhook POST, including the empty-events validation POST. Source: https://developers.line.biz/en/reference/messaging-api/#response
- LINE's error taxonomy defines `request_timeout` as: the webhook was sent "but the bot server didn't return a response within 2 seconds". Source: https://developers.line.biz/en/docs/messaging-api/check-webhook-error-statistics/
- LINE recommends processing events asynchronously "to prevent subsequent requests to wait until the current request is processed". Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/

### A6. Human vs bot chat in LINE Official Account Manager

- Since 2022-11-30 webhooks and human chat work together; the old "Response mode" (Bot mode / Chat mode) became a "Chat" On/Off setting (Chat mode → Chat "On", Bot mode → Chat "Off"). Source: https://developers.line.biz/en/news/2022/12/01/use-webhook-and-chat-together/
- Webhook delivery is governed by "Use webhook" in the Developers Console, not by staff chatting, so messages keep arriving while a human answers. Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- Built-in greeting/auto-response messages are separate OA Manager features, not suppressed by the Messaging API; no API reads or sets them (absent from the endpoint index). Source: https://developers.line.biz/en/reference/messaging-api/
- No endpoint to read or set the OA "Chat" on/off or response mode appears anywhere in the Messaging API reference. Source: https://developers.line.biz/en/reference/messaging-api/

### A7. User profile

- `GET https://api.line.me/v2/bot/profile/{userId}` returns `displayName`, `userId`, `pictureUrl`, `statusMessage`. Source: https://developers.line.biz/en/reference/messaging-api/#get-profile
- It works for friends **and** for non-friends who have sent a message (except users who blocked the OA); subprofiles are unavailable and blocked users return nothing. Source: https://developers.line.biz/en/reference/messaging-api/#get-profile
- Consent/privacy terms specific to profile retrieval are not stated in the API reference; the governing document is the LINE Developers terms — UNVERIFIED (searched the reference and receiving-messages guide; no consent clause found). Source: https://developers.line.biz/en/reference/messaging-api/#get-profile

### A8. Message limits relevant to a confirmation summary

- Text messages: max **5,000 characters** per text object. Source: https://developers.line.biz/en/reference/messaging-api/#text-message
- `messages` array max **5** per request, for both reply and push. Source: https://developers.line.biz/en/reference/messaging-api/#send-reply-message and https://developers.line.biz/en/reference/messaging-api/#send-push-message
- Thai text is supported as ordinary UTF-8; Unicode emoji are supported (LINE's own "LINE original unicode emojis" were discontinued 2022-03-31). Source: https://developers.line.biz/en/reference/messaging-api/#text-message
- Quick reply and Flex messages have no documented plan restriction; the only documented plan differentiator is the monthly message count. Source: https://developers.line.biz/en/reference/messaging-api/#quick-reply and https://developers.line.biz/en/docs/messaging-api/pricing/

### A9. LINE Notify shutdown

- LINE Notify was **terminated on 2025-03-31** (announced 2024-10-07); from 2025-04-01 all APIs (`notify-bot.line.me/*`, `notify-api.line.me/*`) and the My Page stopped working. Source: https://developers.line.biz/en/news/2025/04/01/line-notify/
- The `@linenotify` OA and its documentation/help pages were scheduled for deletion after 2025-05-12; LINE points users to the Messaging API instead. Source: https://developers.line.biz/en/news/2025/04/01/line-notify/

### A10. Webhook endpoint requirements

- The webhook URL must be a valid **HTTPS** URL and ≤500 characters; console changes can take up to 1 minute to apply. Source: https://developers.line.biz/en/reference/messaging-api/#set-webhook-endpoint-url
- Verification is a POST with `{"destination":"...","events":[]}` that must be answered `200`. Source: https://developers.line.biz/en/docs/messaging-api/verify-webhook-url/
- Two different secrets: the **channel access token** (Bearer) authorises API calls; the **channel secret** is only the HMAC key for signature verification. Source: https://developers.line.biz/en/docs/basics/channel-access-token/ and https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/

## B. Supabase

### B1. Auth: username + password, and Next.js App Router sessions

- Supabase Auth password login is documented only for **email + password** and **phone + password**; there is no native username identifier. Source: https://supabase.com/docs/guides/auth/passwords
- Synthetic `<username>@<fakedomain>` emails are explicitly discouraged: "Please don't do this… Part of the reason why we were forced to lock down these changes is bounced emails", and "Official username + password support is going to be made available in the coming year" (published 2024-09-18; still absent from the password guide at access date). Source: https://supabase.com/changelog/29370-supabase-auth-changes-to-default-email-provider
- That changelog's suggested workaround is a real domain you control plus a **Send Email Auth Hook** (a Postgres function that does nothing), or custom SMTP. Source: https://supabase.com/changelog/29370-supabase-auth-changes-to-default-email-provider
- Extra claims/roles can be injected with a **Custom Access Token Hook** (Postgres function receiving `user_id`, `claims`, `authentication_method`), e.g. adding `app_metadata.admin`. Source: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- The built-in email sender is limited to organisation members' addresses and **2 emails per hour**; without custom SMTP, signup confirmation and password reset are effectively broken for real users. Source: https://supabase.com/docs/guides/auth/testing-auth-flows
- SSR sessions live in a cookie named `sb-<project_ref>-auth-token` by default, read/written through `@supabase/ssr`'s `getAll`/`setAll`. Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Server Components cannot write cookies, so a proxy/middleware must call `supabase.auth.getClaims()` and write both `request.cookies` and `response.cookies`; on Next.js 16 the file is `proxy.ts`, on 15 and earlier `middleware.ts`. Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- `getSession()` must not be trusted in server code (it reads the cookie without revalidating); `getClaims()` verifies the JWT signature on every call. Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- `setAll` also returns `Cache-Control`, `Expires`, `Pragma` headers that must be applied, or a CDN can cache a response containing someone else's session. Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Refresh tokens are single-use apart from a short reuse window and a parent-token exception; a reuse matching neither "revokes the whole session" — the documented cause of random sign-outs when refreshing in two places. Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client

### B2. RLS and the service-role key

- A policy is effectively an added `WHERE` clause, written per operation (`select`/`insert`/`update`/`delete`) and per role via `to`; `insert` uses `with check`, `update` uses both `using` and `with check`, and an `UPDATE` also needs a `SELECT` policy. Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- Grants and policies are separate checks: "A table in an exposed schema without RLS is readable and writable by any role with a grant on it", and adding policies does not revoke default grants. Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- `service_role` "has the `bypassrls` attribute", and Supabase's instruction is "Never use a secret key in the browser or expose it to customers." Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- A secret key bypasses RLS **only when the request carries no user access token**; if a user JWT is present the request runs under that user's policies even from a secret-key client. Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- RLS still matters with server-only access: the Data API exposes `public` to `anon`/`authenticated`, and a view created by `postgres` bypasses RLS unless `security_invoker = true`. Source: https://supabase.com/docs/guides/database/postgres/row-level-security

### B3. Compute for a webhook, and delayed/scheduled work

- Edge Functions: 256 MB, **2 s CPU per request**, wall-clock 150 s on Free / 400 s on paid, and a 150 s idle timeout returning `504`. Source: https://supabase.com/docs/guides/functions/limits
- Vercel Functions (Fluid compute default): default 300 s on every plan; Hobby max 300 s; Pro max 800 s (1,800 s beta for supported runtimes). Source: https://vercel.com/docs/functions/configuring-functions/duration
- Supabase Database Webhooks are `pg_net` triggers fired **after** the row change, asynchronous by design ("will not block your database changes"), supporting `INSERT`/`UPDATE`/`DELETE`. Source: https://supabase.com/docs/guides/database/webhooks
- Supabase Cron is `pg_cron`; jobs run "anywhere from every second to once a year", recommended "no more than 8 Jobs run concurrently" and "no more than 10 minutes" per job. Source: https://supabase.com/docs/guides/cron
- Vercel Cron: Hobby **once per day only** with per-hour precision (±59 min); Pro once per minute with per-minute precision. More frequent expressions fail at deploy on Hobby. Source: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Supabase Queues (pgmq) provides durable, "exactly once" delivery within a configurable visibility window, with RLS-controlled consumer access. Source: https://supabase.com/docs/guides/queues
- Cold-start durations for either platform are not stated in these pages — UNVERIFIED (checked Edge Functions limits and Vercel duration docs). Source: https://supabase.com/docs/guides/functions/limits

### B4. Realtime for a live order board

- Postgres Changes requires the table in the `supabase_realtime` publication (`alter publication supabase_realtime add table ...`), with events `INSERT`/`UPDATE`/`DELETE`/`*`. Source: https://supabase.com/docs/guides/realtime/postgres-changes
- Every event is authorised per subscriber, so throughput scales with subscribers, and changes are processed on a single thread — larger compute does not increase throughput. Source: https://supabase.com/docs/guides/realtime/postgres-changes#scaling-postgres-changes
- Documented Micro-instance benchmark with RLS: 500 clients → 30 changes/s, p95 **228 ms**; 3,000 clients → 5 changes/s, p95 616 ms; verdict: "For most applications this is plenty." Source: https://supabase.com/docs/guides/realtime/postgres-changes#scaling-postgres-changes
- Above ~3,000 concurrent subscribers on the same changes, Supabase says to use Broadcast instead. Source: https://supabase.com/docs/guides/realtime/postgres-changes#scaling-postgres-changes
- **volatile** Limits: Free 200 concurrent connections, 100 messages/s, 2M messages/month, 256 KB payload; Pro 500 connections, 500 msg/s, 5M messages/month, 3 MB payload; Postgres-changes payload cap 1,024 KB on all plans. Source: https://supabase.com/docs/guides/realtime/limits
- Filtering `DELETE` events requires `replica identity full` on the table. Source: https://supabase.com/docs/guides/realtime/postgres-changes#limitations

### B5. Pricing (Free vs Pro)

- **volatile** Free: $0, 500 MB database, 5 GB egress (+5 GB cached), 1 GB storage, 50,000 MAU, **no backups**, limit of 2 active projects. Source: https://supabase.com/pricing
- **volatile** Free projects are "paused after 1 week of inactivity" — one week, not one month; paid-plan projects are never paused. Source: https://supabase.com/pricing
- **volatile** Pro: from **$25/month**, 8 GB disk per project, 250 GB egress (+250 GB cached), 100 GB storage, 100,000 MAU then $0.00325/MAU, daily backups retained 7 days, 7-day log retention; includes $10/month compute credit covering one Micro instance. Source: https://supabase.com/pricing
- **volatile** PITR is **$100/month per 7 days retention** ($200/14 days, $400/28 days) and requires at least a Small compute add-on. Source: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/backups
- **volatile** Team is $599/month (14-day backups, 28-day logs); spend caps are on by default on Pro. Source: https://supabase.com/pricing

### B6. Region

- Singapore is offered both as "APAC, Southeast Asia (Singapore)" and as the specific region `ap-southeast-1`. Source: https://supabase.com/docs/guides/platform/regions
- Documented guidance is only "Choose the location closest to your users for the best performance"; no latency figures are published per region. Source: https://supabase.com/docs/guides/platform/regions

### B7. Backups and restore

- Daily backups: Pro 7 days, Team 14 days, Enterprise up to 30 days; Free has none, and Supabase recommends Free projects run `supabase db dump` and keep off-site copies. Source: https://supabase.com/docs/guides/platform/backups
- PITR gives "up to seconds of granularity" and, because WAL is archived every two minutes by default, "in the worst case scenario, PITR achieves a Recovery Point Objective (RPO) of two minutes". Source: https://supabase.com/docs/guides/platform/backups
- Restore makes the project inaccessible for a duration that "depends on the size of the database"; backups exclude Storage objects, and custom-role passwords are not stored in daily backups. Source: https://supabase.com/docs/guides/platform/backups
- No RTO figure is published — UNVERIFIED (backups page only says downtime depends on database size). Source: https://supabase.com/docs/guides/platform/backups

### B8. Local dev and migrations

- Convention: `supabase/migrations/<timestamp>_<name>.sql`, created with `supabase migration new <name>`; seed data lives in `supabase/seed.sql` and is applied by `supabase db reset`. Source: https://supabase.com/docs/guides/deployment/database-migrations
- Deploy with `supabase db push` (optionally `--include-seed`); editing the remote DB directly bypasses migration history and makes `db push` fail with sync errors. Source: https://supabase.com/docs/guides/deployment/database-migrations
- Applied migrations are tracked in `supabase_migrations.schema_migrations`; `supabase migration repair` fixes history records only (it runs no SQL). Source: https://supabase.com/docs/guides/deployment/database-migrations

### B9. Thai alias matching with pg_trgm / unaccent

- Both are ordinary Postgres extensions enabled with `create extension`; Supabase notes "Most extensions are installed under the `extensions` schema", so functions may need schema-qualifying or a `search_path`. Source: https://supabase.com/docs/guides/database/extensions and https://www.postgresql.org/docs/current/pgtrgm.html
- `pg_trgm` measures similarity from **three consecutive characters**, ignoring non-alphanumerics; `similarity()` returns 0–1, and the `%` operator's default threshold is **0.3**. Source: https://www.postgresql.org/docs/current/pgtrgm.html
- GiST/GIN trigram indexes accelerate `%`, `<%`, `LIKE`, `ILIKE`, `~`; `ORDER BY <->` (nearest-neighbour) is efficient only with GiST. Source: https://www.postgresql.org/docs/current/pgtrgm.html
- `unaccent` strips diacritics via a rules dictionary and is a full-text filtering dictionary; its stock rules target Latin accents, so it has no effect on Thai script. Source: https://www.postgresql.org/docs/current/unaccent.html
- Thai has no reliable algorithmic word boundaries: Unicode states "reliable detection of word boundaries in languages such as Thai, Lao, Chinese, or Japanese requires the use of dictionary lookup or other mechanisms". Source: https://www.unicode.org/reports/tr29/
- Whether trigram similarity over short, unspaced Thai strings works for a menu-alias dictionary is not validated in any Supabase/PostgreSQL doc — UNVERIFIED empirically (no benchmark published). Source: https://www.postgresql.org/docs/current/pgtrgm.html

## C. Hosting / budget

### C1. Vercel Hobby for commercial use

- Hobby is **not** permitted for commercial use: "Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." Source: https://vercel.com/docs/limits/fair-use-guidelines
- Commercial use includes "Any method of requesting or processing payment from visitors of the site", "Advertising the sale of a product or service", and "Receiving payment to create, update, or host the site"; donations are excluded. Source: https://vercel.com/docs/limits/fair-use-guidelines
- **volatile** Pro is $20/month, billed per developer seat, and includes a $20 monthly usage credit; prices are USD and exclude VAT. Source: https://vercel.com/pricing

### C2. Other hosting facts that affect a ~1,500 THB/month budget

- **volatile** Sum of the two paid plans is $45/month before tax and overage (Supabase Pro $25 + Vercel Pro $20); THB conversion is not cited — UNVERIFIED (no official FX rate consulted). Source: https://supabase.com/pricing and https://vercel.com/pricing
- The LINE Basic plan alone is 1,280 THB/month before 7% VAT, consuming most of a 1,500 THB envelope if push volume exceeds the Free 300 messages. Source: https://lineforbusiness.com/th/service/line-oa-features
- Staying on Vercel Hobby for a revenue-generating shop would breach the fair-use clause, so the $20 seat is effectively mandatory for this use case. Source: https://vercel.com/docs/limits/fair-use-guidelines
- If scheduled work is needed more than daily, Hobby cannot do it (once-per-day limit), while Supabase Cron on Free can run every second. Source: https://vercel.com/docs/cron-jobs/usage-and-pricing and https://supabase.com/docs/guides/cron

## D. Thai PDPA (brief)

- The PDPA (B.E. 2562 / 2019) is the governing statute; the PDPC publishes the Act and subordinate notifications. Source: https://www.pdpc.or.th/en/23134/
- The PDPC's SME handbook states a privacy notice must disclose the purpose and legal basis, the **types of personal data and the retention period**, the categories of recipients, the data source if not the subject, the controller's details, and the data subject's rights. Source: https://www.pdpc.or.th/wp-content/uploads/2022/06/10pdpcbook.pdf
- Lawful bases listed by the PDPC include contract performance, consent, legal obligation, vital interest, public task, legitimate interest, and research/statistics. Source: https://www.pdpc.or.th/wp-content/uploads/2022/06/10pdpcbook.pdf
- No fixed statutory retention period for order/chat records is published by the PDPC; retention must be defined by the controller and disclosed — UNVERIFIED (searched PDPC Act page and SME handbook; no numeric period found). Source: https://www.pdpc.or.th/wp-content/uploads/2022/06/10pdpcbook.pdf

## Facts that contradict common assumptions

- LINE Free OA in Thailand is **300** messages/month, not 1,000; Japan's Free tier is 200 — the 1,000-message figure appears on neither current page.
- Reply messages are free of quota; only push/multicast/broadcast/narrowcast count, so a reply-only bot costs 0 messages.
- LINE's Thai pricing page labels the quota "broadcast messages" (ข้อความบรอดแคสต์), while the developer pricing page counts push/multicast/narrowcast into the same allowance — the two primary pages are not worded identically.
- LINE retries are **off by default**; duplicate protection is opt-in *and* duplicates can occur anyway, so `webhookEventId` dedupe is required regardless.
- The reply token window is 1 minute, not 30 seconds or 24 hours, and a redelivered event carries the *same* token (usable 1 min after redelivery, max 20 min after the event).
- LINE's webhook timeout is **2 seconds**, not 10–30 s; anything slower must be queued, not awaited.
- The old "Chat mode disables webhooks" advice is obsolete: since 2022-11-30 webhooks and human chat coexist, and the setting is now "Chat On/Off".
- Supabase Free projects pause after **1 week** of inactivity, and have **no** backups at all.
- Supabase's `service_role`/secret key does **not** bypass RLS when a user access token is attached to the request.
- Supabase has no native username login; its own changelog says do not fake emails with `<username>@<fakedomain>`.
- Vercel Hobby cron can only run **once per day** (±59 min), so it cannot expire unconfirmed orders hourly.
- Vercel Hobby is explicitly non-commercial — a paying café cannot deploy there.
- `unaccent` does nothing for Thai script; it targets Latin diacritics.

## Unverified

- LINE Notify consent/retention terms — pages deleted after 2025-05-12; only the shutdown notice remains. Tried: developers.line.biz news 2025/04/01 and notify-bot.line.me (dead).
- LINE user-profile consent basis — the reference documents eligibility (friend / recent messenger / not blocked) but no consent language. Tried: Messaging API reference `#get-profile`, receiving-messages guide.
- Supabase/Vercel cold-start durations — not published. Tried: supabase.com/docs/guides/functions/limits, vercel.com/docs/functions/configuring-functions/duration.
- Supabase RTO — backups page states only that downtime depends on database size. Tried: supabase.com/docs/guides/platform/backups.
- Thai PDPA numeric retention period for order and chat records — no figure published. Tried: PDPC Act page (PDF only), PDPC SME handbook.
- Whether `pg_trgm` similarity is accurate enough for short Thai menu aliases — no vendor benchmark exists. Tried: PostgreSQL pg_trgm docs, Supabase extensions overview, UAX #29.
- THB/USD conversion for the budget comparison — no official rate cited. Tried: none (deliberately skipped to avoid a non-primary FX figure).
