# GumballZ Neo-Brutalist Commerce Experience

## Goal

Unify discovery and purchase of digital tools, license keys, and Coiz while keeping the existing payment and key flows, and establish one fresh Supabase schema that matches the running application.

## Users and success

- Visitors can understand the offer and reach a relevant product or key flow from the home page.
- Buyers can search/filter an explicit catalog and see availability and price before continuing.
- Key users can request a free key or check an existing key without navigating to a different service.
- Developers can find product-linked, searchable docs with copyable examples.
- Operators can initialize a clean Supabase project using one documented SQL entry point.

## Architecture

- Keep Next.js App Router, existing Supabase server API, and Tailwind. Use existing React client components for interactive filters, clipboard actions, and key lookup.
- `/store` becomes the unified catalog. Preserve the existing payment flow at `/store/coiz`; keep `/tools` as a redirect to `/store?category=tool` for old links.
- `/` adds category bento cards, database-backed featured products, and a key status lookup. `/keys` keeps free/premium issuance and adds status lookup and docs links. `/docs` uses a category sidebar and structured article blocks with copyable code.
- Use a consistent Neo-Brutalist system: off-white canvas, ink borders, crisp offset shadows, yellow/cyan/lime/magenta accents, bold sans display type, monospace for codes, and press-like hover states. Respect reduced motion and keyboard focus.
- `supabase_schema.sql` is the only clean-install script. It creates all tables used by current routes, the new catalog fields, indexes, triggers, grants, RLS and a small safe seed. No browser client receives table access beyond explicitly public catalog/config reads. Server-only service-role APIs continue to enforce admin/user checks.
- No project Supabase connection or destructive remote command is part of this work.

## UX and content decisions

- Catalog category filters are `Tất cả`, `Tool`, `Key`, `Coiz`; search matches title, description, and tags; status and price stay visible on each card.
- Coiz catalog cards route to the existing top-up experience. Product checkout remains authenticated and uses server-side product prices.
- Key lookup reports only status, type, expiry, and device-binding state; it never returns internal verification tokens or secrets. Clipboard action copies the submitted key.
- Docs retain Minecraft and Roblox content as distinct articles and add a key activation article linked from `/keys`.
- The home page labels featured catalog items only when marked featured in the database; empty catalog has a useful fallback.

## Scope boundaries

- Preserve payment-provider integrations and their secrets. The schema supports their current transaction columns and metadata.
- Do not claim unverified provider delivery or add new payment methods.
- The clean-install schema is for the user's new empty project; do not apply it to a live Supabase database from this workspace.

## Review risks

- Product stock must be represented honestly: null means unlimited, zero means out of stock.
- Transactions need nullable/authenticated user IDs plus guest/Minecraft transactions.
- Key lookup must use server-side validation and must not expose service-role data.
- Public catalog must never return download URLs.
- Footer markup must remain valid to avoid the observed hydration error.

## Files

- Create: `supabase_schema.sql` (replace the fragmented clean-install recipe with one full schema).
- Modify: `app/page.tsx`, `app/store/page.tsx`, `app/keys/page.tsx`, `app/docs/page.tsx`, `app/globals.css`, `app/layout.tsx`, `app/components/Navbar.tsx`, `app/components/Footer.tsx`.
- Create: `app/store/coiz/page.tsx`, `app/store/StoreCatalog.tsx`, `app/components/KeyLookup.tsx`, `app/components/FeaturedProducts.tsx`, `app/api/keys/status/route.ts`.
- Modify: `app/api/products/route.ts`, `app/api/products/checkout/route.ts`, `app/admin/products/page.tsx`, `README.md`.
