# Hosting and Google auth: verified constraints

What Supabase Auth + Google actually permits, and which free hosts allow paid customers, per primary vendor docs only. Accessed: 2026-10-30.

## A. Supabase Auth + Google

### A1. Setup prerequisites (Google Cloud side)

- The OAuth client type must be **Web application** ("choose **Web application** for the application type"). Source: https://supabase.com/docs/guides/auth/social-login/auth-google
- The authorised redirect URI Supabase documents is `https://<project-ref>.supabase.co/auth/v1/callback`, copied from the Google provider page in the dashboard. Source: https://supabase.com/docs/guides/auth/self-hosting/self-hosted-oauth
- For local development the documented callback is `http://127.0.0.1:54321/auth/v1/callback`. Source: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google additionally requires **Authorized JavaScript origins** (e.g. `https://example.com`, no path) alongside the redirect URI; mismatches produce `origin_mismatch` / `redirect_uri_mismatch`. Source: https://support.google.com/cloud/answer/15549257?hl=en
- Consent-screen user type is **External** ("available to any user with a Google Account") or **Internal**, and Internal requires the project to belong to a Google Cloud Organization. Source: https://support.google.com/cloud/answer/15549945?hl=en
- Scopes needed are `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and Supabase warns that adding more "might be subject to verification which may take a long time". Source: https://supabase.com/docs/guides/auth/social-login/auth-google

### A2. Does Google sign-in create a Supabase user automatically?

- Yes — a first OAuth sign-in creates a Supabase user: "When a new user signs in with OAuth, Supabase Auth will attempt to look for an existing user that uses the same email address." Source: https://supabase.com/docs/guides/auth/auth-identity-linking
- With signups disabled, the documented rule is "If this config is disabled, only existing users can sign in." Source: https://supabase.com/docs/guides/auth/general-configuration
- The error catalogue defines the rejection as `signup_disabled`: "Sign ups (new account creation) are disabled on the server." Source: https://supabase.com/docs/guides/auth/debugging/error-codes
- Supabase documents **no OAuth carve-out** from the signup toggle; neither page says OAuth bypasses it. Source: https://supabase.com/docs/guides/auth/general-configuration

### A3. Allowlisting without sending email

- `before-user-created` hook: "This hook runs before a new user is created" and "If the hook returns an error object, the signup is denied and the user is not created" — so it is **before** the row exists. Source: https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
- The same hook page documents blocking OAuth providers per provider: it "prevents unwanted signups through OAuth flows" by inspecting `app_metadata.provider`. Source: https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
- Google-side gating happens **before** Supabase: a Testing-status app only admits listed test users, and an External app published to production admits "any user with a Google Account". Source: https://support.google.com/cloud/answer/15549945?hl=en
- RLS policies (e.g. on `profiles`) run **after** the auth user exists and gate data, not account creation; Supabase's user docs describe RLS as the Postgres authorization mechanism for the `authenticated` role. Source: https://supabase.com/docs/guides/auth/users
- No built-in email-allowlist setting is documented: General configuration lists only "Allow new users to sign up", "Confirm Email", anonymous sign-ins, and manual linking. Source: https://supabase.com/docs/guides/auth/general-configuration
- Banning/deleting a user is post-creation cleanup via the Admin API (`updateUserById` / `deleteUser`), not a pre-creation gate. Source: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid

### A4. Pre-creating a user by email, then Google sign-in

- Admin `createUser` accepts `{ email, email_confirm: true }` to create a user with no confirmation email ("Auto-confirm the user's email"). Source: https://supabase.com/docs/reference/javascript/auth-admin-createuser
- A later Google sign-in with that same email is **linked, not duplicated**: "If a match is found, the new identity is linked to the user." Source: https://supabase.com/docs/guides/auth/auth-identity-linking
- Automatic linking requires unique, verified emails, and Supabase "will remove any other unconfirmed identities linked to an existing user" when linking. Source: https://supabase.com/docs/guides/auth/auth-identity-linking
- The reverse case is deliberately obfuscated: creating an email account after an OAuth account with the same email returns "an obfuscated user response with no verification email sent". Source: https://supabase.com/docs/guides/auth/auth-identity-linking

### A5. Consent screen: verification, test users, publishing

- For `email`/`profile` (`openid`) only: "If your app utilizes only non-sensitive scopes, it is not mandatory for your app to complete the app verification process," though displaying a name/logo needs lighter "brand-verification". Source: https://support.google.com/cloud/answer/13463073?hl=en
- Google's verification flow pre-fills "an initial set of scopes that are necessary for Google Sign-In ... in the **Non-sensitive scopes** section". Source: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- A **Testing** app is "limited to up to 100 test users listed in the OAuth consent screen". Source: https://support.google.com/cloud/answer/15549945?hl=en
- Test-user authorizations normally "expire seven days from the time of consent", **except** for the subset "name, email address, and user profile (through the `userinfo.email, userinfo.profile, openid` scopes)". Source: https://support.google.com/cloud/answer/15549945?hl=en
- Publishing to **In production** makes the app "available to any user with a Google Account", with verification required only for sensitive/restricted scopes. Source: https://support.google.com/cloud/answer/15549945?hl=en
- Unverified personal-use apps are tolerated only at "fewer than 100 users", with an "unverified app" warning and a 100-new-user lifetime cap. Source: https://support.google.com/cloud/answer/13464323?hl=en

### A6. Does OAuth bypass email confirmation?

- Supabase requires verified email for OAuth accounts and sends its own verification email when a provider does not verify: `provider_email_needs_verification` — "Not all OAuth providers verify their user's email address. Supabase Auth requires emails to be verified, so this error is sent out when a verification email is sent after completing the OAuth flow." Source: https://supabase.com/docs/guides/auth/debugging/error-codes
- So OAuth does **not** bypass verification for providers with unverified email; Google normally returns a verified email, which is why the extra email step does not appear. Source: https://supabase.com/docs/guides/auth/debugging/error-codes
- Caveat: auto-linking only trusts verified emails — "It would also be an insecure practice to automatically link an identity to a user with an unverified email address". Source: https://supabase.com/docs/guides/auth/auth-identity-linking

### A7. MAU / billing for OAuth users

- OAuth users count exactly like password users: "You are charged for the number of distinct users who sign in or refresh their token during the billing cycle (including social sign-in with e.g. Google...)". Source: https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users
- Free quota is 50,000 MAU; Pro/Team 100,000 then "$0.00325 per MAU". Source: https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users

### A8. Session lifetime with `@supabase/ssr`

- No provider-specific session-lifetime rule is documented: access tokens are "usually between 5 minutes and 1 hour while refresh tokens never expire but can only be used once", regardless of sign-in method. Source: https://supabase.com/docs/guides/auth/sessions
- Supabase documents no OAuth-vs-password difference in session duration, refresh rotation, or inactivity timeout. Source: https://supabase.com/docs/guides/auth/sessions
- Session lifetime controls are paid-only: "This feature is only available on Pro Plans and up", and the pricing table marks "Session timeouts" and "Single session per user" as "Not included in free". Source: https://supabase.com/docs/guides/auth/sessions and https://supabase.com/pricing
- The real OAuth-specific SSR requirement is PKCE state: `signInWithOAuth` "stores the PKCE code verifier in a cookie", and "When that `Set-Cookie` header doesn't reach the browser, the callback can't exchange the code for a session." Source: https://supabase.com/docs/guides/auth/social-login/auth-google
- Server-side refresh tokens may be reused within a documented reuse interval (default 10 s) because of SSR, which is a flow issue, not an OAuth issue. Source: https://supabase.com/docs/guides/auth/sessions

## B. Free / near-free hosting that permits commercial use

### B1. Vercel

- **Hobby is contractually banned for this use**: "**Hobby teams** are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." Source: https://vercel.com/docs/limits/fair-use-guidelines
- Commercial use is defined to include "Any method of requesting or processing payment from visitors of the site" and "Advertising the sale of a product or service". Source: https://vercel.com/docs/limits/fair-use-guidelines
- Pro is "$20/mo." plus "$20 / month" per developer seat. Source: https://vercel.com/pricing
- **volatile**: prices, plan names, and fair-use wording. Source: https://vercel.com/pricing

### B2. Cloudflare Workers / Pages

- No commercial-use ban appears in Cloudflare's Self-Serve Subscription Agreement; the only free-tier content prohibition found is "(h) process or collect personal or business credit card information on any web property that is receiving Free Services". Source: https://www.cloudflare.com/terms/
- `*.workers.dev` is a stable-form HTTPS hostname (`<worker>.<subdomain>.workers.dev`) but is framed as non-production: "It's recommended to run production Workers on a Workers route or custom domain... intended for personal or hobby projects that aren't business-critical." Source: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- `*.pages.dev` exists and is used as the CNAME target for custom domains; Cloudflare documents no personal/hobby restriction on it. Source: https://developers.cloudflare.com/pages/configuration/custom-domains/
- **volatile**: plan names/limits. Source: https://developers.cloudflare.com/workers/platform/limits/
- Workers Free CPU is **10 ms per HTTP request**; Cloudflare notes "Heavier workloads that handle authentication, server-side rendering, or parse large payloads typically use 10-20 ms." Source: https://developers.cloudflare.com/workers/platform/limits/
- Workers Free allows **100,000 requests/day**, then returns Error 1027. Source: https://developers.cloudflare.com/workers/platform/limits/
- Official Next.js support is now **vinext** (beta), described as "a Vite plugin that reimplements the Next.js API surface", with App Router, route handlers, Server Actions and `middleware.ts`/`proxy.ts` listed as supported. Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- `@opennextjs/cloudflare` remains as the legacy path "if you ... cannot yet migrate to vinext"; its own docs list "Node Middleware ... introduced in 15.2 are not yet supported". Source: https://opennext.js.org/cloudflare
- Pages is documented only for **static export** of Next.js, not a server app. Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare's OpenNext page claims a 3 MiB free / 10 MiB paid compressed Worker limit, which conflicts with the Workers limits page (64 MiB uncompressed, "no compressed size limit"). Source: https://opennext.js.org/cloudflare

### B3. Cloudflare Tunnel

- A named tunnel does require a domain on Cloudflare: "Before you publish an application through your tunnel, you must add a website to Cloudflare." Source: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/
- Quick Tunnels need no account or domain but are explicitly temporary: "The hostname changes each time you create a Quick Tunnel" and "The URL stops working when you stop the `cloudflared` process." Source: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- Quick Tunnels are "for testing and development" with "no uptime guarantee". Source: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- If the host sleeps or loses power, the tunnel goes `Down` ("the machine being powered off") and requests receive **Error 1033**, because Cloudflare "cannot find a healthy `cloudflared` instance". Source: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1033/
- No free Cloudflare option is documented that yields a **stable** hostname without a domain added to Cloudflare; the named-tunnel route is free but needs the zone. Source: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/

### B4. Netlify, Render, Fly.io, Railway

- **Netlify**: Free is "$0 forever" with "Audience: Individual" and a "300 credit limit"; the Self-Serve Subscription Agreement contains no commercial-use clause (full-text search for "commercial" returned nothing). Source: https://www.netlify.com/pricing/ and https://www.netlify.com/legal/self-serve-subscription-agreement/
- **Render**: no commercial restriction found, but the free-tier doc says "Do not use them for production applications", spins down after "15 minutes without receiving any inbound traffic", and takes "about one minute" to wake. Source: https://render.com/docs/free
- **Fly.io**: no free option at all — "No. New organizations don't have a free tier or a monthly free usage allowance." Source: https://fly.io/docs/about/pricing/
- **Railway**: Free is "$0/month with $1 of monthly usage credits", limited to 1 project/3 services and **0 custom domains**, with auto-generated `*.up.railway.app` domains available. Source: https://railway.com/pricing and https://docs.railway.com/networking/domains/working-with-domains
- Railway's Fair Use page lists abuse (fraud, malware, spam, etc.) but no commercial-use ban. Source: https://railway.com/legal/fair-use

### B5. Options that satisfy "Next.js server app + stable HTTPS + commercial use"

- **Fully satisfied as documented**: Cloudflare Workers Free with vinext/OpenNext — App Router, route handlers, Server Actions, middleware all listed, HTTPS on `workers.dev`, no commercial ban; caveats are the 10 ms CPU/100k-request limits and the "not business-critical" framing of `workers.dev`. Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ and https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- **Partially satisfied**: Netlify Free (stable `*.netlify.app`, no commercial clause, 300 credits) has no documented restriction matching Vercel's, but its Free audience is labelled "Individual". Source: https://www.netlify.com/pricing/
- **Partially satisfied**: Railway Free gives a stable `*.up.railway.app` HTTPS URL and no commercial ban, but $1/month credit will not cover a 24/7 Next.js server at $10/GB-month memory + $20/vCPU-month. Source: https://railway.com/pricing
- **Not satisfied**: Vercel Hobby (explicit ban), Render Free ("Do not use ... for production"), Fly.io (no free tier), Cloudflare Pages (static export only for Next.js). Source: https://vercel.com/docs/limits/fair-use-guidelines
- **Not satisfied**: running the app on Supabase itself — Supabase documents no general Next.js hosting product. Source: https://supabase.com/docs

## C. Supabase Free plan operational behaviour

### C1. Inactivity pausing

- Free projects are paused after "1 week of inactivity"; the pausing guide says a project is inactive "if it does not receive sufficient user database activity over the past week". Source: https://supabase.com/pricing and https://supabase.com/docs/guides/platform/project-pausing
- "Typically a few user requests to the database each day over the previous week is enough to keep the project from being paused." Source: https://supabase.com/docs/guides/platform/project-pausing
- Supabase emails a warning "roughly one week before the pause takes effect", and a dashboard visit counts as activity. Source: https://supabase.com/docs/guides/platform/project-pausing
- A paused project cannot serve requests: custom status **540 project paused** — "The project cannot process requests until it is un-paused by the owner." Source: https://supabase.com/kb/troubleshooting/http-status-codes
- Resume is documented only through the Dashboard ("Click **Resume project**"), but a Management API endpoint `POST /v1/projects/{ref}/restore` exists. Source: https://supabase.com/docs/guides/platform/project-pausing and https://supabase.com/docs/reference/api/v1-restore-a-project
- Restore is possible "for up to 1 year after it was paused". Source: https://supabase.com/docs/guides/platform/project-pausing
- Resume duration is not documented (see Unverified). Source: https://supabase.com/docs/guides/platform/project-pausing

### C2. `pg_cron`, `pg_net`, Database Webhooks on Free

- Supabase Cron is `pg_cron` under the hood and its guide states **no plan restriction**; it documents 8 concurrent jobs and 10-minute job runs as recommendations. Source: https://supabase.com/docs/guides/cron
- The `pg_net` extension page documents enabling it from the dashboard with no plan restriction. Source: https://supabase.com/docs/guides/database/extensions/pg_net
- Database Webhooks are "a convenience wrapper around triggers using the `pg_net` extension" and document no plan restriction. Source: https://supabase.com/docs/guides/database/webhooks
- I found no statement that any of these three require Pro; equally, I found no explicit "available on Free" sentence. Source: https://supabase.com/docs/guides/cron

### C3. Free plan quotas and backups

- **volatile**: Free is "500 MB database size", "5 GB egress", "5 GB cached egress", "50,000 monthly active users", "1 GB file storage", "Shared CPU • 500 MB RAM", "Limit of 2 active projects". Source: https://supabase.com/pricing
- The 2 GB disk is separate from the 500 MB billing quota: "Free Plan projects have a fixed disk size of 2 GB"; read-only mode triggers at **95% disk usage**, not at the 500 MB quota. Source: https://supabase.com/docs/guides/platform/manage-your-usage/database-size
- **There are no backups on Free**: "We automatically back up all Pro, Team, and Enterprise Plan projects on a daily basis," and the pricing table marks "Automatic backups" as "Not included in free". Source: https://supabase.com/docs/guides/platform/backups and https://supabase.com/pricing
- Documented Free-plan backup recommendation: "We recommend that free tier plan projects regularly export their data using the Supabase CLI db dump command and maintain off-site backups." Source: https://supabase.com/docs/guides/platform/backups
- Exceeding Free quotas triggers the Fair Use Policy, which can mean pausing, read-only mode, or **402** responses on all API requests. Source: https://supabase.com/docs/guides/platform/billing-faq

### C4. Paused/over-quota project vs LINE webhook delivery

- A paused project returns **540** and a Fair-Use-restricted project returns **402**, so LINE receives a non-2xx response. Source: https://supabase.com/kb/troubleshooting/http-status-codes
- LINE only retries when redelivery is enabled: "By default, webhook redelivery is disabled," and retries require "The bot server didn't return `2xx` status code for the webhook." Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- Retry count and interval are undisclosed: "The number and interval of the webhook redelivery aren't disclosed" and "are subject to change without notice". Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- LINE may stop sending events entirely: "The LINE Platform may suspend sending webhooks to your bot server if your bot server fails to receive webhooks for a long time." Source: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- LINE requires HTTPS with a publicly trusted certificate: "it must use HTTPS communication. Use an SSL/TLS certificate issued by a public certification authority". Source: https://developers.line.biz/en/docs/messaging-api/ssl-tls-spec-of-the-webhook-source/

## Facts that contradict common assumptions

- "Commercial use is fine on any free tier" is false for Vercel: Hobby explicitly forbids "Any method of requesting or processing payment from visitors of the site". Source: https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare's free-tier prohibition is not about commerce but about card data: "(h) process or collect personal or business credit card information on any web property that is receiving Free Services". Source: https://www.cloudflare.com/terms/
- `workers.dev` is stable but not positioned as production: it is "intended for personal or hobby projects that aren't business-critical". Source: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Supabase Free is 500 MB of *billing* quota but 2 GB of *disk*, and read-only mode is driven by 95% disk usage, not the 500 MB quota. Source: https://supabase.com/docs/guides/platform/manage-your-usage/database-size
- Supabase Free has **zero** automatic backups; the docs' only advice is manual `db dump`. Source: https://supabase.com/docs/guides/platform/backups
- OAuth logins are not free of MAU accounting; social sign-in is explicitly counted. Source: https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users
- Google's 7-day test-mode authorization expiry does **not** apply to email/profile/openid-only apps, which is exactly the Supabase Google setup. Source: https://support.google.com/cloud/answer/15549945?hl=en
- Fly.io no longer has any free tier, free allowance, or hobby plan. Source: https://fly.io/docs/about/pricing/
- Render's free tier is not merely slow: the docs say "Do not use them for production applications." Source: https://render.com/docs/free
- Supabase session time-boxing and inactivity timeouts are Pro-and-up features, so a Free project cannot force re-login. Source: https://supabase.com/docs/guides/auth/sessions
- A "local use" POS still needs a publicly trusted TLS endpoint, and LINE can suspend webhooks entirely if deliveries keep failing. Source: https://developers.line.biz/en/docs/messaging-api/ssl-tls-spec-of-the-webhook-source/

## Unverified

- **OAuth behaviour with signups disabled**: Supabase never states in the pages I read whether Google sign-in for a *new* user returns `signup_disabled` or is special-cased. I relied on General configuration ("only existing users can sign in") plus the error catalogue; I could not find a sentence that names OAuth explicitly.
- **Paused-project resume duration**: no number (seconds/minutes) is documented on the pausing or Management API pages; only that the project "will return to its previous state". Tried `project-pausing`, `billing-faq`, `v1-restore-a-project`.
- **Free-plan support for `pg_cron`/`pg_net`/Database Webhooks**: I found absence of a plan restriction, not an affirmative "available on Free" statement. Tried the Cron, pg_net, Webhooks, and pricing pages.
- **Netlify/Render/Railway commercial permission**: none of the three says commercial use is allowed; I could only verify that no prohibition appears in the documents I read.
- **Cloudflare Worker size limit**: OpenNext says 3 MiB free / 10 MiB paid compressed; Cloudflare's limits page says 64 MiB uncompressed with no compressed limit. Tried both pages; unresolved conflict.
- **Cloudflare Pages as a Next.js server host**: Cloudflare's current Next.js guide lists only static export for Pages; I did not find a doc authorising a server-rendered App Router app on Pages.
- **LINE webhook HTTP timeout**: I did not find a documented per-delivery timeout value; only the non-2xx retry condition and the SSL/TLS spec.
- **Supabase custom-domain cost / availability for auth**: not investigated, so `auth.example.com` branding advice is un-costed.
