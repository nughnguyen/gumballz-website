# GumballZ Neo-Brutalist Commerce Implementation Plan

> **For agentic workers:** Execute inline task-by-task; use checkbox syntax and review the final branch as a whole.

**Goal:** Rebuild the four customer routes as a coherent Neo-Brutalist digital shop and provide a clean-install Supabase schema matching the project.

**Architecture:** Next.js App Router with existing Supabase APIs. `/store` becomes searchable catalog and `/store/coiz` preserves top-up. Key lookup is a read-only server API; admin catalog writes remain allowlisted.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Supabase JS, Lucide.

**Spec:** `docs/superpowers/designs/2026-10-30-gumballz-commerce.md`

## Global Constraints

- Preserve server-side authorization and keep service-role credentials server-only.
- Do not connect to Supabase or delete/modify hosted data.
- Keep existing payment provider route contracts and metadata columns supported.
- Use semantic landmarks, labeled controls, visible focus, responsive layouts, and reduced-motion support.
- `/store/coiz` preserves the current top-up code.

## Review Focus

- Empty catalog and catalog API failures show a usable state.
- Key lookup rejects malformed and unknown keys without leaking secrets.
- Product stock status matches the database and unavailable items cannot be checked out.
- Coiz redirect preserves old key/docs paths and return links.
- All four routes hydrate without invalid nesting.

---

### Task 1: Build one clean-install schema

**Files:** Modify `supabase_schema.sql`; modify `README.md`.

- [ ] Enumerate every table and column read/written in `app/api`.
- [ ] Define transaction, key, config, download, product, license stock, and optional user-profile schema as needed by current contracts.
- [ ] Add constraints, indexes, `updated_at` triggers, RLS, narrow anon/authenticated grants, and service-role-only private table policies.
- [ ] Document the single SQL Editor install step and required server secrets without reading local environment files.

### Task 2: Preserve Coiz and rebuild catalog route

**Files:** Create `app/store/coiz/page.tsx`; modify `app/store/page.tsx`; create `app/store/StoreCatalog.tsx`; modify `app/api/products/route.ts`, `app/api/products/checkout/route.ts`, and `app/admin/products/page.tsx`.

- [ ] Copy existing Coiz/Minecraft top-up page intact into `/store/coiz`.
- [ ] Add typed catalog categories, stock state, tags, featured flag, search and URL-backed category filter.
- [ ] Keep public responses free of private download URLs; keep checkout auth and server price lookup.
- [ ] Preserve `/tools` compatibility as redirect to the tool filter.

### Task 3: Add safe key lookup and keep issuance flow

**Files:** Create `app/components/KeyLookup.tsx`, `app/api/keys/status/route.ts`; modify `app/keys/page.tsx`.

- [ ] Provide input, paste action, inline errors/loading, and status/type/expiry/device state.
- [ ] Query key tables server-side without returning internal tokens.
- [ ] Retain free/premium key selection, pricing and checkout; add product-linked docs CTAs.

### Task 4: Implement Neo-Brutalist home and navigation

**Files:** Modify `app/page.tsx`, `app/components/FeaturedProducts.tsx`, `app/components/Navbar.tsx`, `app/globals.css`, `app/layout.tsx`.

- [ ] Build strong hero, bento category links, DB-backed best sellers, and quick key lookup.
- [ ] Apply shared palette, thick borders, crisp shadows, press interactions, mobile navigation, focus and reduced motion.
- [ ] Match metadata and navigation labels to final route map.

### Task 5: Restructure docs and resolve runtime hydration issue

**Files:** Modify `app/docs/page.tsx`, `app/components/Footer.tsx`.

- [ ] Add two-column article navigation, selected category/article state, copyable snippets and info/warning/success callouts.
- [ ] Keep Minecraft and Roblox articles; add a key activation path linked from `/keys`.
- [ ] Correct invalid paragraph/div nesting found during browser capture.

### Task 6: Review and verify

**Files:** all files above.

- [ ] Run targeted lint on changed TypeScript files.
- [ ] Capture the four local routes at desktop and mobile widths; inspect console/page errors and key interaction affordances.
- [ ] Review schema against every `.from(table)` reference; verify every private table has RLS and no public download URL grant.
- [ ] Report remaining deployment prerequisites, especially setting `ADMIN_EMAILS` and applying the SQL manually in the empty Supabase project.
