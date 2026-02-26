# Julia Studio Site (BAAM Multi-Site Platform)


lsof -ti:3040 | xargs kill -9
rm -rf .next
npm run dev

npm run build

git add .                    
git commit -m "Update: describe your changes"
git push   


Production-ready bilingual (EN/ZH) studio website built on the BAAM platform.  
It includes public pages, admin CMS, DB-first content storage, file fallback, media tools, and site/domain-aware routing.

---

## 1) Tech Stack

- Next.js App Router (`app/`)
- TypeScript + React
- Tailwind CSS + CSS variables
- Supabase (content/site/admin data + storage)
- JSON content contracts for page and collection data

---

## 2) Quick Start

### Install and run

```bash
npm install
npm run dev
```

Default dev port from `package.json`:

- `http://localhost:3040`

### Build and run checks

```bash
npm run build
npm run lint
npm run type-check
```

### Full CI-style local check

```bash
npm run ci:check
```

---

## 3) Environment Configuration

Use `.env.local.example` as the starting template.

Key variables:

- `APP_ENV`, `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_DEFAULT_SITE`
- `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_FALLBACK_TO`, `ALERT_TO`

Important:

- DB-first mode is enabled when `SUPABASE_SERVICE_ROLE_KEY` is present.
- Without it, the app falls back to local `content/` JSON files.
- For this project, ensure the default site points to the active studio site (for example `julia-studio`) rather than legacy template IDs.

---

## 4) High-Level Architecture

### Frontend (public)

- Routes are under `app/[locale]/...`
- Locale-aware pages (`en`, `zh`)
- Shared shell in `app/[locale]/layout.tsx`
- Theme tokens injected as CSS variables from `theme.json`

### Backend (API)

- Public content APIs under `app/api/content/*`
- Admin APIs under `app/api/admin/*`
- Contact + booking APIs under `app/api/contact` and `app/api/booking/*`

### Data layer

- Content table: `content_entries` (DB-first)
- Optional revisions table: `content_revisions`
- Site/domain management via DB or fallback JSON (`content/_sites.json`, `content/_site-domains.json`)

---

## 5) Repository Structure (Core Areas)

```text
app/
  [locale]/
    page.tsx
    portfolio/
    collections/
    shop/
    journal/
    services/
  admin/
  api/
    content/
    admin/
    contact/
    booking/

components/
  layout/
  ui/
  admin/
    panels/

content/
  julia-studio/
    en/
    zh/
    theme.json
  _sites.json
  _site-domains.json

lib/
  content.ts
  contentDb.ts
  sites.ts
  ...

styles/
  globals.css
```

---

## 6) Frontend Architecture Details

### 6.1 Locale routing

- Public pages are built under `app/[locale]/...`
- Locale value controls content selection (`en` or `zh`) and text rendering.

### 6.2 Theme system

- Source of truth: `content/<siteId>/theme.json`
- Runtime mapping: `app/[locale]/layout.tsx` -> CSS variables
- Consumption: semantic classes and `var(--token)` usage in components

### 6.3 Page content model

- Page-level JSON: `content/<siteId>/<locale>/pages/*.json`
- Optional layout JSON for section ordering: `*.layout.json`
- Collection JSON folders:
  - `portfolio/`
  - `collections/`
  - `shop-products/`
  - `journal/`
  - `testimonials.json` (array-style collection file)

### 6.4 Public content loading

Used patterns:

- Server loaders (`lib/content.ts`) for DB-first fetch with file fallback
- Public API endpoints:
  - `GET /api/content/file?locale=...&path=...`
  - `GET /api/content/items?locale=...&directory=...`

Guardrail:

- Public pages must not call admin APIs (`/api/admin/*`), especially in production.

---

## 7) Backend/API Architecture

### 7.1 Public APIs

- `app/api/content/file/route.ts`
  - Reads one content file path
  - Supports host-based site inference when `siteId` is omitted
- `app/api/content/items/route.ts`
  - Reads collection directory items
  - Supports host-based site inference when `siteId` is omitted

### 7.2 Admin APIs

Main groups:

- Auth/session/logout
- Content file CRUD + import/export
- Media list/upload/import/provider search
- Site management
- User management
- Booking admin operations

All admin routes are under `app/api/admin/*` and are not for public page rendering.

### 7.3 Contact and booking APIs

- Public contact submission endpoint
- Booking endpoints for service list, slots, create/cancel/reschedule/list

---

## 8) Multi-Site + Domain Resolution

Site resolution priority (simplified):

1. Explicit `siteId` (when provided)
2. Host/domain mapping (`getSiteByHost`)
3. Default enabled site
4. `NEXT_PUBLIC_DEFAULT_SITE`

This logic is implemented through `lib/content.ts` and `lib/sites.ts`.

Operational rule:

- Do not hardcode `siteId` in public page fetches unless there is a strict one-site requirement.

---

## 9) Admin CMS Structure

### 9.1 Main admin areas

- Content editor
- Blog posts / collection management surfaces
- Media manager
- Variants library
- Site settings
- Users
- Sites
- Booking settings and bookings

### 9.2 Content editor design

- `components/admin/ContentEditor.tsx` orchestrates file loading/saving and panel routing.
- Complex forms are extracted into `components/admin/panels/*`.
- Examples include:
  - `TestimonialsPanel.tsx`
  - `ServicesPagePanel.tsx`
  - `ThemePanel.tsx`
  - `JournalItemPanel.tsx`

### 9.3 Form mode + JSON mode

- Form mode: constrained fields, image pickers, dropdowns, add/remove controls
- JSON mode: raw contract editing
- Roundtrip expectation: changes in either mode remain consistent

---

## 10) Content Sync Model (DB <-> Local Files)

Two directions are supported:

- **Import** = DB -> local files
- **Export** = local files -> DB

Recommended workflow:

1. Run check/dry-run first.
2. Review changed counts and folder breakdown.
3. Choose direction explicitly based on source of truth.

Rule of thumb:

- If DB is canonical and conflicts are safe, use Import.
- If local JSON is canonical, use Export.

---

## 11) Data Integrity Rules

- Collection `slug` must match filename stem/path.
- Duplicate/create/save should keep slug/path synchronized.
- Diff checks should include all collection folders to avoid false "no difference" results.

---

## 12) Media and Assets

- Storage target is Supabase media storage in production.
- Admin media flows support upload and provider import/search.
- Content should store media URLs in JSON/DB content entries.

Support scripts:

- `npm run media:migrate`
- `npm run content:normalize-media-urls`

---

## 13) QA and Operational Scripts

Available QA scripts:

- `npm run qa:routes`
- `npm run qa:seo`
- `npm run qa:content`
- `npm run qa:bilingual`
- `npm run qa:all`

Recommended pre-deploy sequence:

1. `npm run ci:check`
2. `npm run qa:all`
3. Manual smoke test (EN/ZH and key listing pages)
4. Content sync dry-run before import/export operations

---

## 14) Deployment Notes

- Deploy target: Vercel
- Ensure production env vars are fully configured
- Confirm domain-to-site mapping in sites/domain config
- Verify public pages load content from host-resolved site in production

Post-deploy checks:

- `/api/health` returns healthy response
- Public pages are non-empty for portfolio/collections/shop/journal
- Admin login and content save operations succeed

---

## 15) Known Platform Guardrails

- Keep public APIs and admin APIs strictly separated.
- Use theme tokens, not ad-hoc hardcoded visual values.
- Keep complex content editing in dedicated admin panels.
- Always decide content sync direction before import/export.
- Prefer host-based site resolution for multi-site safety.

---

## 16) Useful Files to Read First

- `BAAM_MASTER_PLAN_V3_COMPLETE.md`
- `JULIA_STUDIO_COMPLETE_PLAN.md`
- `JULIA_STUDIO_CONTENT_CONTRACTS.md`
- `THEME_NORMALIZATION_SOP.md`

---

## 17) Current Site Baseline

This repository currently serves as the Julia Studio implementation baseline on BAAM platform architecture.
