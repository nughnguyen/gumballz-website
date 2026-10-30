# Security audit notes

Audit scope: Next.js App Router routes and Supabase client/server boundaries reviewed using the Cloudflare security-audit workflow principles (map trust boundaries, trace attacker-controlled inputs, record evidence, separate confirmed issues from deployment-dependent items).

## Confirmed and addressed in source

| Finding | Evidence | Change |
| --- | --- | --- |
| Admin key creation accepted a hardcoded password `gumballz_admin_2025` and fell back to the anon key for database writes. | `app/api/admin/create-key/route.ts` | Removed password fallback; require a valid Supabase bearer token for an explicitly listed admin; require service role for writes; validate key parameters; use cryptographic randomness. |
| Download and remote-config write APIs accepted `default_insecure_secret` when no server secret was configured. | `app/api/downloads/route.ts`, `app/api/mod-config/route.ts` | Replaced shared secrets with verified Supabase admin sessions; validate inputs; public download listing no longer selects the download URL. |
| Supabase master schema gave broad policies with `USING (true)` to every role and allowed public reads of Roblox keys. | `supabase_schema.sql` | Restricted policies to `service_role`, removed public key reads and added `supabase_security_hardening.sql`. Run this migration in Supabase before deploying an existing database. |
| Payment recipient details were configured with `NEXT_PUBLIC_*` variables and hardcoded browser fallbacks. | `app/payment/page.tsx`, `app/minecraft/pay/page.tsx` | Moved lookups to a no-store server endpoint that only serves details for a pending transaction. Configure server-only `BANK_ID`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` (and optional `_2`, `MOMO_PHONE`). |
| Free-key link provider token was committed directly in source. | `app/api/keys/generate-free/route.ts` | Removed it from code and require `YEULINK_TOKEN` in server-only environment. Rotate the old provider token immediately. |
| Transaction creation trusted client supplied pricing metadata and returned the full transaction row. | `app/api/create-transaction/route.ts` | Enforce key package price/duration pairs, validate Discord IDs/purchase types, and only return the transaction ID. |
| MoMo callbacks could mark arbitrary pending payments successful without a signature. | `app/api/webhook/momo/route.ts` | Verify the documented MoMo HMAC-SHA256 signature, require exact transaction amount and match a pending order before updating it. |
| SePay/payOS/VNPay callbacks could be forged or accept a mismatched paid amount. | `app/api/webhook/{sepay,payos,vnpay}/route.ts` | Require provider authentication/signature and only settle matching orders for the expected amount. |
| The scheduled cleanup endpoint had no authentication and deleted payment history. | `app/api/cron/cleanup/route.ts` | Require `CRON_SECRET`; mark old pending rows expired and retain transaction records. |
| Premium key generation was public and inactive keys could be activated by the verifier. | `app/api/keys/generate-premium/route.ts`, `app/api/keys/verify/route.ts` | Require admin authorization for legacy key generation; reject inactive keys and make initial device binding conditional. |
| Minecraft redeem could credit a code to a different player or accept concurrent redemptions. | `app/api/minecraft/redeem/route.ts`, `app/api/minecraft/check-order/route.ts` | Match the stored player name where present and atomically claim only unrewarded transactions. |
| The Minecraft check-order API key was accepted in the URL. | `app/api/minecraft/check-order/route.ts` | Require `x-api-key` or Bearer authorization instead of query parameters. |
| A failed Yeulink request could return the provider URL containing its API token. | `app/api/keys/generate-free/route.ts` | Return the destination URL as fallback; never send the provider request URL to callers. |

## Needs validation / deployment action

- Admin APIs deny requests unless `ADMIN_EMAILS` is configured as a comma-separated list of authorized emails and a server-only `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) is configured. The local env file was not read or copied into this report.
- For a clean/current-schema setup, use the consolidated `supabase_all_in_one.sql`. Configure Vercel using `vercel.env.template`; keep server keys out of all `NEXT_PUBLIC_*` variables.
- The payment details endpoint uses the transaction UUID as a bearer capability. Review transaction ID exposure in logs, analytics, referrers and support screenshots; a stronger design would use a dedicated random payment-view token.
- Existing download URLs can be fetched by anyone who already knows them. The new public listing omits them, but secure delivery requires purchase records and authorization checks at a download endpoint.
- Public, payment-polling, key-validation, wallet top-up, and product-checkout endpoints use shared Supabase-backed per-IP limits. Run `supabase_rate_limit_migration.sql` on an existing database before deployment; if the RPC/table is unavailable, these routes fail closed with `503`. IPs are stored only as HMAC hashes. Confirm the hosting proxy supplies trusted client IP headers; otherwise requests may share the `unknown` bucket.
- `/api/minecraft/claim-status` and `/api/payment-details` use unguessable transaction UUIDs as bearer capabilities. Do not expose them in logs, analytics or support screenshots; consider dedicated short-lived view tokens if stronger isolation is needed.
- Minecraft plugin endpoints still accept `MINECRAFT_API_KEY` in JSON bodies for compatibility, except `/api/minecraft/check-order`, which now requires a header. Keep TLS enabled and rotate this key if the plugin/server logs request bodies.
- The active remote mod configuration endpoint intentionally returns `config_data` publicly. Never place private credentials or signing keys in that configuration.
- Key-validation APIs are intentionally public and reveal validity for a submitted key; high-entropy keys and provider-side request limits remain important. Device IDs are client supplied and are not hardware attestation.
- Rotate the committed Yeulink token at its provider, remove it from repository history where practical, and audit deployment secrets. Source findings do not establish whether the old token remains valid.
- Running the consolidated Supabase script and setting Vercel environment values remain manual deployment steps; repository changes cannot update hosted services automatically.

## Future review rule

Run an authorization check on every API route that reads or changes user, admin, payment, key, configuration, or download data. Keep service-role clients server-only, validate body/query schemas and bounds, avoid returning secret columns, and test the actual Supabase role grants after every schema migration.
