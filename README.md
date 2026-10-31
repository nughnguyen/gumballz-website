# GumballZ Hub

Next.js storefront for digital tools, license keys and Coiz, with Supabase-backed products, purchases, key status and admin tools.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

Open <http://localhost:3000>.

## Main routes

- `/` — Neo-Brutalist home, category links, featured products and quick key lookup.
- `/store` — searchable and filterable tool/key/Coiz catalog.
- `/store/coiz` — existing Coiz and Minecraft top-up flow.
- `/keys` — free and premium keys plus status lookup.
- `/docs` — searchable-by-section product and activation guides.
- `/admin` — allowlisted administrator dashboard.

`/tools` redirects to `/store?category=tool` for existing bookmarks.

## Fresh Supabase setup

1. Create an empty Supabase project. Remove old tables yourself if you are replacing an existing database.
2. Run `supabase_all_in_one.sql` in Supabase SQL Editor. It contains the current schema, product catalog, wallet top-ups and wallet checkout, rate limits, site visit counters, and restrictive RLS setup. It preserves table data, but refreshes policies and triggers. Review the policy changes before running it on a project with custom policies.
3. Fill `vercel.env.template` with your own values, then add those variables to Vercel. Set `ADMIN_EMAILS` to the comma-separated allowlist of existing Supabase Auth users.
4. Keep `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) and payment/provider secrets on the server. Never expose them with a `NEXT_PUBLIC_` prefix.
5. Rotate the previously committed Yeulink token and configure the replacement as `YEULINK_TOKEN`.

### Wallet payment webhooks

- Store products and premium key packages can be paid from the signed-in account wallet. The required RPC functions are included in `supabase_all_in_one.sql`.
- Configure payOS with the webhook URL `https://<your-domain>/api/webhook/payos`. Set the server-only `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, and `PAYOS_CHECKSUM_KEY` from your payOS payment channel. The app creates signed payment links and verifies the signed webhook before matching the order amount and settling the transaction.
- For SePay, configure HMAC-SHA256 and set `SEPAY_WEBHOOK_SECRET` (recommended). If HMAC is not configured, set `SEPAY_API_KEY` to the exact key configured on the webhook. At least one must be configured.
- If MoMo IPN is enabled, set `MOMO_ACCESS_KEY` and `MOMO_SECRET_KEY`; the webhook rejects callbacks without a valid MoMo HMAC-SHA256 signature.
- Set `VNPAY_HASH_SECRET` to the VNPay checksum secret if VNPay IPN is enabled.
- Wallet top-ups are credited only after a verified incoming payment matches the requested amount; the ledger trigger prevents duplicate credits.
- If a customer pays from a bank that is not connected to automatic confirmation, they can submit a manual review request on the payment page. The request appears in Admin → Dashboard; verify the incoming bank statement before approving. Approval triggers the normal purchase/key or wallet-credit flow, and the signed-in customer sees the pending/review result in `/account`.
- Configure `CRON_SECRET` in the Vercel Production environment. The hourly schedule in `vercel.json` requires Pro or Enterprise; Hobby supports only daily cron runs. Pending payments are marked expired after 15 minutes, then pending or expired transactions are deleted after 12 hours on the next cron run.
- API rate limits use hashed client IPs in Supabase and return `429` with a `Retry-After` header when a limit is reached. Make sure the deployed platform provides a trusted `x-real-ip` or `x-forwarded-for` header. The cleanup endpoint removes rate-limit buckets older than three days.
- Minecraft plugin requests to `/api/minecraft/check-order` must send `x-api-key` (or `Authorization: Bearer ...`); API keys are not accepted in query strings.

The older individual SQL files are kept for reference; use `supabase_all_in_one.sql` for the current consolidated setup. Review `SECURITY_AUDIT.md` before deployment, especially provider webhook verification and transaction ownership checks.

## Useful scripts

```powershell
npm.cmd run lint
npm.cmd run build
```
