# Wewash Reproduction Guide

This document describes the current production architecture for `wewash` inside `laundry/wewash`, so another developer can reproduce the same site structure and behavior.

It covers:
- DB-first + file fallback content model
- page layout control via `*.layout.json`
- section variants via page JSON (`*.json`)
- theme-driven typography and colors
- admin editing flows and import/export behavior

---

## 1) System Architecture

Wewash is implemented as a multi-site, multi-locale Next.js app with:

- **App router + host-based site resolution**
  - Site is resolved by host, fallback to `wewash`
  - Locale routes are under `app/[locale]`
- **DB-first content loading**
  - Read from Supabase `content_entries` first
  - Fallback to JSON files under `content/` if DB entry not present
- **Admin CMS**
  - Admin writes directly to DB when `SUPABASE_SERVICE_ROLE_KEY` is configured
  - Local filesystem mode is fallback only
- **Layout composition**
  - Per-page section order/visibility is controlled by `pages/<page>.layout.json`
- **Variant-driven rendering**
  - Section visual style/layout is controlled by `variant` inside each page JSON section
- **Theme variables**
  - `theme.json` drives runtime CSS variables for typography sizes, font families, and colors

---

## 2) Required Project Paths

Core app and data paths:

- `app/[locale]/*/page.tsx` - public page renderers
- `app/[locale]/layout.tsx` - site shell + theme variable injection
- `components/sections/*` - reusable variant-capable sections
- `components/admin/ContentEditor.tsx` - Form + JSON editor (includes variant dropdowns)
- `lib/content.ts` - DB-first loader + file fallback
- `lib/contentDb.ts` - Supabase content adapters
- `lib/types.ts` - shared content and variant types
- `content/wewash/*` - site content source
- `supabase/admin-schema.sql` - admin/site/media/booking tables
- `supabase/rls.sql` - deny-public RLS policies

---

## 3) Wewash Content Structure

Current site content root:

- `content/wewash/theme.json`
- `content/wewash/en/*`
- `content/wewash/es/*`

Per-locale base files:

- `site.json`
- `navigation.json`
- `header.json`
- `footer.json`
- `seo.json`
- `pages/*.json`
- `pages/*.layout.json`
- `blog/*.json` (EN currently has blog post files)

Booking files (filesystem backup/source):

- `content/wewash/booking/services.json`
- `content/wewash/booking/settings.json`
- `content/wewash/booking/bookings/*.json`

---

## 4) Layout JSON Pattern (`page.layout`)

Each page layout file contains ordered section IDs:

```json
{
  "sections": [
    { "id": "hero" },
    { "id": "services" },
    { "id": "cta" }
  ]
}
```

Rules:
- If a section ID exists in layout and renderer supports it, it is shown.
- If omitted, the section is hidden.
- Order in `sections[]` controls render order.
- If no layout exists, renderer falls back to default order.

Files in Wewash already include layout JSON for:
- `home`, `about`, `contact`, `services`, `conditions`, `pricing`, `gallery`, `blog`, `case-studies`, `new-patients` (EN + ES)

---

## 5) Variant Control Pattern (`page.json`)

Section variants are controlled in page JSON, for example:

```json
{
  "hero": {
    "variant": "split-photo-right",
    "title": "...",
    "subtitle": "..."
  }
}
```

Current variant support is wired in page/section renderers for:

- `about.json`
  - `hero`, `profile`, `credentials`, `specializations`, `philosophy`, `journey`, `affiliations`, `continuingEducation`, `clinic`, `cta`
- `contact.json`
  - `hero`, `introduction`, `hours`, `form`, `map`, `faq`
- `pricing.json`
  - `hero`, `individualTreatments`, `packages`, `insurance`, `policies`, `faq`, optional `cta`
- Other pages (already wired)
  - `services`, `conditions`, `blog`, `gallery`, `case-studies`, `new-patients`

Important distinction:
- `*.layout.json` controls **order/visibility**
- section `variant` in `*.json` controls **visual layout style**

---

## 6) Theme System (Typography + Colors + Fonts)

Theme source:
- `content/<siteId>/theme.json`

Runtime injection:
- `app/[locale]/layout.tsx` injects `:root` CSS variables from theme
- `styles/globals.css` consumes variables in utilities/classes

Controlled values:
- Typography sizes: `display`, `heading`, `subheading`, `body`, `small`
- Font families: `typography.fonts.display|heading|subheading|body|small`
- Colors:
  - `colors.primary` (`DEFAULT`, `dark`, `light`, `50`, `100`)
  - `colors.secondary` (`DEFAULT`, `dark`, `light`, `50`)
  - `colors.backdrop` (`primary`, `secondary`)

---

## 7) DB + File Data Model

### DB-first behavior

When `SUPABASE_SERVICE_ROLE_KEY` exists:
- reads/writes use DB tables via `lib/contentDb.ts`
- filesystem is fallback source for missing DB content

When key is absent:
- filesystem mode is used

### Primary content tables expected

- `content_entries`
  - expected fields used by code: `id`, `site_id`, `locale`, `path`, `data`, `updated_at`, `updated_by`
  - unique key expected by upsert: `(site_id, locale, path)`
- `content_revisions`
  - stores prior versions when admin updates content entries

### Admin/ops tables (in `supabase/admin-schema.sql`)

- `sites`
- `admin_users`
- `media_assets`
- `booking_services`
- `booking_settings`
- `bookings`

### Booking DB behavior

Booking storage is also DB-first when `SUPABASE_SERVICE_ROLE_KEY` exists:
- DB adapters: `lib/booking/db.ts`
- hybrid storage layer (DB + file fallback): `lib/booking/storage.ts`
- fallback files under `content/<siteId>/booking/`:
  - `services.json`
  - `settings.json`
  - `bookings/<yyyy-mm>.json`

### Resend in data model

Resend email delivery does not require DB tables in this codebase.
- Contact form emails are sent directly in `app/api/contact/route.ts`
- Booking emails are sent via `lib/booking/email.ts`
- Recipients for booking admin notifications come from booking settings data (`notificationEmails`)

### RLS posture

`supabase/rls.sql` enables RLS and creates deny-public policies on:
- `sites`, `admin_users`, `media_assets`
- `booking_services`, `booking_settings`, `bookings`
- `content_entries`, `content_revisions`

The app uses service-role server client for admin operations.

---

## 8) Required Environment Variables

At minimum for DB-first:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (if used in local scripts/utilities)
- `JWT_SECRET` (admin auth/session signing)

Without `SUPABASE_SERVICE_ROLE_KEY`, content falls back to filesystem mode.

### Booking + notifications env

For booking/email in production, also configure:
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_FALLBACK_TO` (contact form destination; fallback default exists in code)
- `ALERT_TO` (optional CC for contact form alerts)

Optional SMS (if using Twilio booking notifications):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

---

## 9) Admin APIs Used For Reproduction

Core content APIs:
- `GET /api/admin/content/files`
- `GET/PUT/POST/DELETE /api/admin/content/file`
- `POST /api/admin/content/import` (`mode: missing|overwrite`)
- `POST /api/admin/content/export`

Migration/ops APIs:
- `POST /api/admin/users/import`
- `POST /api/admin/sites/import`
- `POST /api/admin/booking/import`
- `POST /api/admin/media/import`

Booking APIs (public + admin workflows):
- `GET /api/booking/services`
- `GET /api/booking/slots`
- `POST /api/booking/create`
- `POST /api/booking/cancel`
- `POST /api/booking/reschedule`
- `POST /api/booking/list`

Contact email API:
- `POST /api/contact` (Resend integration)

Auth + RBAC:
- `lib/admin/permissions.ts`
  - `requireSiteAccess`, `canWriteContent`, `canManageBookings`, `canManageMedia`

---

## 10) Admin Editor Features Needed

`components/admin/ContentEditor.tsx` should include:

- **Form mode + JSON mode**
- variant dropdowns in Form mode (`Section Variants` panel)
- theme form editing for typography/font/color
- import/export buttons with loading states
- safe import default (`missing`)
- overwrite import as explicit action

If reproducing from older branch, ensure this file contains variant dropdown logic and theme panel support.

---

## 11) Reproduce Wewash on a Fresh Environment

### A. Code + files

1. Copy project codebase.
2. Ensure Wewash files exist under:
   - `content/wewash/theme.json`
   - `content/wewash/en/*`
   - `content/wewash/es/*`
   - including all `pages/*.layout.json`

### B. Database

1. Run `supabase/admin-schema.sql`.
2. Ensure `content_entries` + `content_revisions` exist with required columns.
3. Run `supabase/rls.sql`.

### C. Env setup

1. Set Supabase + JWT env vars.
2. Start app:
   - `npm install`
   - `npm run dev`

### D. Seed DB content

From admin UI:
1. Import users/sites (bootstrap)
2. Import content JSON (`missing` first)
3. If needed, run overwrite import intentionally
4. Verify pages load from DB and admin edits persist

### E. Mandatory identity updates (site ID + locales + users)

Do not skip this section when cloning to a new client:

1. **Site identity**
   - Update all `siteId` references from template values to your new site ID.
   - Ensure `content/<siteId>/...` exists and old template site IDs are removed from active routing config.
2. **Locales**
   - Set `defaultLocale` and `supportedLocales` consistently in:
     - `content/_sites.json`
     - DB table `sites` (`default_locale`, `supported_locales`)
   - For Wewash, this must be `default=en`, `supported=[en, es]`.
3. **Users + RBAC**
   - Create at least one `super_admin` user in DB.
   - Ensure `site_admin/editor/viewer` users are assigned to the correct site IDs.
   - Remove or downgrade template users that should not access the new site.
4. **Admin verification**
   - In `/admin/sites`, verify site ID, domain, and locales.
   - In `/admin/users`, verify role and `sites` mapping for each user.

### F. How to add a site and user (exact ops)

Use this when bootstrapping a new client site.

#### Option 1 (recommended): Admin UI

1. **Add site**
   - Login as `super_admin`.
   - Go to `/admin/sites` -> create new site.
   - Fill: `id`, `name`, `domain`, `enabled`, `defaultLocale`, `supportedLocales`.
   - For Wewash baseline: `defaultLocale=en`, `supportedLocales=[en, es]`.
   - Save, then open the site detail page to confirm values persisted.

2. **Add user**
   - Go to `/admin/users` -> create user.
   - Fill: `email`, `name`, `role`, `sites`.
   - `role` should be one of: `super_admin`, `site_admin`, `editor`, `viewer`.
   - Assign correct site IDs in `sites` (empty for `super_admin` is acceptable).
   - Create user, then use password reset/set action to define initial password.

3. **Verify access**
   - Logout, login with the new user.
   - Confirm expected admin pages are accessible based on role/site scope.

#### Option 2: API (authenticated admin session required)

Create site:

```bash
curl -X POST "http://localhost:5001/api/admin/sites" \
  -H "Content-Type: application/json" \
  -b "<ADMIN_SESSION_COOKIE>" \
  --data-raw '{
    "id":"new-site-id",
    "name":"New Site Name",
    "domain":"example.com",
    "enabled":true,
    "defaultLocale":"en",
    "supportedLocales":["en","es"]
  }'
```

Create user:

```bash
curl -X POST "http://localhost:5001/api/admin/users" \
  -H "Content-Type: application/json" \
  -b "<ADMIN_SESSION_COOKIE>" \
  --data-raw '{
    "email":"owner@example.com",
    "name":"Site Owner",
    "role":"site_admin",
    "sites":["new-site-id"]
  }'
```

Set/reset password:

```bash
curl -X POST "http://localhost:5001/api/admin/users/<USER_ID>/password" \
  -H "Content-Type: application/json" \
  -b "<ADMIN_SESSION_COOKIE>" \
  --data-raw '{
    "password":"ChangeMe123!"
  }'
```

#### Option 3: SQL fallback (last resort)

Use SQL only if admin APIs are unavailable.

1. Insert site:

```sql
insert into public.sites (id, name, domain, enabled, default_locale, supported_locales)
values ('new-site-id', 'New Site Name', 'example.com', true, 'en', array['en','es']::text[])
on conflict (id) do update
set name = excluded.name,
    domain = excluded.domain,
    enabled = excluded.enabled,
    default_locale = excluded.default_locale,
    supported_locales = excluded.supported_locales;
```

2. Generate password hash (from project root):

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('ChangeMe123!',10));"
```

3. Insert user with that hash:

```sql
insert into public.admin_users (id, email, name, role, sites, password_hash)
values (
  'user-new-site-admin',
  'owner@example.com',
  'Site Owner',
  'site_admin',
  array['new-site-id']::text[],
  '<PASTE_BCRYPT_HASH>'
)
on conflict (id) do update
set email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    sites = excluded.sites,
    password_hash = excluded.password_hash;
```

4. Re-login and verify `/admin/sites` + `/admin/users` behavior.

---

## 12) Verification Checklist

Use this checklist before handing off:

- [ ] `/en` and `/es` resolve correctly for Wewash domain/host
- [ ] Theme changes in admin immediately affect typography/colors
- [ ] Page order changes via `*.layout.json` reflect on frontend
- [ ] Variant changes in page JSON reflect in frontend section layout
- [ ] Admin content save writes to DB (not only local files)
- [ ] Import/export works and `missing` mode does not overwrite
- [ ] RBAC restrictions are enforced per role + site
- [ ] `sites` table has the final site ID + domain + locale set (no template leftovers)
- [ ] `admin_users` table has intended users only, with correct roles and site assignments
- [ ] `npm run build` succeeds

---

## 13) Notes for Multi-Site Reuse

To reproduce another site quickly:

1. Copy `wewash` content tree to new `content/<new-site-id>/`.
2. Update `site.json`, `navigation.json`, `theme.json`, SEO.
3. Keep page/section structure, layout files, and variant schema intact.
4. Create site in admin (or import site JSON), then import content.
5. Customize variants/layout in admin per site.

This preserves a shared platform while allowing each site to look different.

---

## 14) New Site Duplication SOP (Full Clone, Frontend + Admin + DB + Booking)

Use this SOP when you want a fully isolated new client deployment based on this project.

### Step 1 - Create an isolated code copy

From the parent folder, duplicate the app into a new workspace.

```bash
cd /Users/johntang/Desktop/clients/laundry
cp -R wewash wewash-newsite
cd wewash-newsite
rm -rf node_modules .next
npm install
```

Recommended:
- Use a new git repository or new branch strategy for the new client.
- Keep original `wewash` untouched.

### Step 2 - Create a brand-new Supabase project

Do not reuse the current production Supabase project.

In Supabase:
1. Create a new project.
2. Save keys for env setup:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Run `supabase/admin-schema.sql`.
4. Ensure `content_entries` and `content_revisions` tables exist.
5. Run `supabase/rls.sql`.

If content tables do not exist yet, use:

```sql
create extension if not exists pgcrypto;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  locale text not null,
  path text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (site_id, locale, path)
);

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by text,
  note text
);
```

### Step 3 - Duplicate Wewash content + booking data as base for new site

Inside the new project copy:

```bash
cd /Users/johntang/Desktop/clients/laundry/wewash-newsite
cp -R content/wewash content/new-site-id
```

Then update:
- `content/new-site-id/theme.json`
- `content/new-site-id/en/site.json`
- `content/new-site-id/es/site.json`
- `navigation.json`, `header.json`, `footer.json`, `seo.json` for both locales
- `pages/*.json` and `pages/*.layout.json` as needed
- booking files:
  - `content/new-site-id/booking/services.json`
  - `content/new-site-id/booking/settings.json`
  - `content/new-site-id/booking/bookings/*.json` (if migrating historical bookings)

Also add site metadata in `content/_sites.json`:
- `id`
- `name`
- `domain`
- `defaultLocale`
- `supportedLocales`

### Step 4 - Configure environment variables for the new clone (including booking/notifications)

Create `.env.local` in the new clone:

- `NEXT_PUBLIC_SUPABASE_URL=<new supabase url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<new anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<new service role key>`
- `JWT_SECRET=<new secret>`
- `RESEND_API_KEY=<resend api key>`
- `RESEND_FROM=<from email>`
- `CONTACT_FALLBACK_TO=<primary contact recipient>`
- `ALERT_TO=<secondary recipient optional>`

Optional SMS:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

Critical:
- Never point new project to old Supabase.
- Never reuse old `JWT_SECRET`.

### Step 5 - Boot app and import data in safe order

```bash
npm run dev
```

Then from admin UI:
1. Import sites (`/api/admin/sites/import`).
2. Import users if needed (`/api/admin/users/import`).
3. Import content JSON with `missing` mode first (`/api/admin/content/import`).
4. Import booking JSON for each site (`/api/admin/booking/import`).
5. Import media (`/api/admin/media/import`) if migrating existing assets.
6. Use overwrite import only when intentional.

### Step 5.1 - Lock identity and access immediately after import

Before any design/content edits:

1. Open `/admin/sites` and confirm:
   - only intended site IDs are enabled
   - domain points to the new client domain
   - locale settings are final (`en/es` for Wewash)
2. Open `/admin/users` and confirm:
   - one known working `super_admin` exists
   - site-scoped users only include intended site IDs
   - old/template users are removed or restricted
3. Re-login with the final admin account and verify all admin sections load.

### Step 6 - Configure domain mapping and host routing

This app resolves site by host/domain.

Ensure new site record domain is correct in `sites`:
- exact production domain
- no port
- `www` is normalized by code

### Step 7 - Deploy as a separate production app

1. Create a new deployment target (new Vercel project).
2. Add new env vars there (from Step 4).
3. Configure DNS to point the new domain to this deployment.
4. Deploy and run smoke tests.

### Step 8 - Run production verification

Verify:
- `/en` and `/es` routes load.
- Admin login works.
- `Site Settings` edits persist in DB.
- Theme, layout, and variant edits reflect on frontend.
- booking workflows pass:
  - create booking
  - cancel booking
  - reschedule booking
- notification workflows pass:
  - contact form notification + auto-reply email
  - booking confirmation/cancel/reschedule emails
- Import/export works as expected.
- `npm run build` succeeds.

### Step 9 - Avoid common duplication mistakes

- Reusing old Supabase project (cross-client data leakage).
- Missing `SUPABASE_SERVICE_ROLE_KEY` in production.
- Forgetting to update site domain.
- Missing booking import after content import.
- Missing Resend env vars (`RESEND_API_KEY`, `RESEND_FROM`) causing silent notification failures.
- Accidentally overwriting content with import mode.
- Reusing admin credentials/JWT secret without rotation.

---

## 15) Execution Checklist

For a copy-paste execution list, use:

- `NEW_SITE_DUPLICATION_CHECKLIST.md`
- `ADMIN_TEMPLATE_SETUP_CHECKLIST.md`
- `TEMPLATE_QA_MATRIX.md`
- `content/starter-packs/starter-basic.json`
- `content/starter-packs/starter-pro.json`

---

## 16) Booking + Resend Related Files (Reproduction Map)

Booking core:
- `lib/booking/storage.ts` - booking storage abstraction (DB first, file fallback)
- `lib/booking/db.ts` - Supabase booking adapters
- `lib/booking/availability.ts` - slot generation and window checks
- `lib/booking/email.ts` - booking email notifications via Resend
- `lib/booking/sms.ts` - optional booking SMS notifications via Twilio
- `app/api/booking/create/route.ts`
- `app/api/booking/cancel/route.ts`
- `app/api/booking/reschedule/route.ts`
- `app/api/booking/services/route.ts`
- `app/api/booking/slots/route.ts`
- `app/api/booking/list/route.ts`
- `app/api/admin/booking/import/route.ts`

Contact/Resend:
- `app/api/contact/route.ts` - contact form notification + auto-reply email flow

Filesystem fallback sources:
- `content/<siteId>/booking/services.json`
- `content/<siteId>/booking/settings.json`
- `content/<siteId>/booking/bookings/*.json`

---

## 17) Full SQL for Reproduction (Copy/Paste)

Run these SQL blocks in order for a fresh Supabase project.

### 17.1 Admin + booking schema

```sql
-- Admin dashboard tables for sites, users, media, and bookings.

create table if not exists public.sites (
  id text primary key,
  name text not null,
  domain text,
  enabled boolean not null default true,
  default_locale text not null default 'en',
  supported_locales text[] not null default array['en']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null,
  sites text[] not null default '{}'::text[],
  avatar text,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  path text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, path)
);

create table if not exists public.booking_services (
  site_id text primary key,
  services jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_settings (
  site_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  site_id text not null,
  service_id text not null,
  date date not null,
  time text not null,
  duration_minutes integer not null,
  name text not null,
  phone text not null,
  email text not null,
  note text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_site_date_idx on public.bookings (site_id, date);
```

### 17.2 Content tables schema

```sql
create extension if not exists pgcrypto;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  locale text not null,
  path text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (site_id, locale, path)
);

create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by text,
  note text
);
```

### 17.3 RLS policies (deny public access)

```sql
-- Enable RLS and deny all public access (anon/auth roles).

-- Sites
alter table public.sites enable row level security;
drop policy if exists "deny_public" on public.sites;
create policy "deny_public" on public.sites for all
  to anon, authenticated
  using (false) with check (false);

-- Admin users
alter table public.admin_users enable row level security;
drop policy if exists "deny_public" on public.admin_users;
create policy "deny_public" on public.admin_users for all
  to anon, authenticated
  using (false) with check (false);

-- Media
alter table public.media_assets enable row level security;
drop policy if exists "deny_public" on public.media_assets;
create policy "deny_public" on public.media_assets for all
  to anon, authenticated
  using (false) with check (false);

-- Booking services
alter table public.booking_services enable row level security;
drop policy if exists "deny_public" on public.booking_services;
create policy "deny_public" on public.booking_services for all
  to anon, authenticated
  using (false) with check (false);

-- Booking settings
alter table public.booking_settings enable row level security;
drop policy if exists "deny_public" on public.booking_settings;
create policy "deny_public" on public.booking_settings for all
  to anon, authenticated
  using (false) with check (false);

-- Bookings
alter table public.bookings enable row level security;
drop policy if exists "deny_public" on public.bookings;
create policy "deny_public" on public.bookings for all
  to anon, authenticated
  using (false) with check (false);

-- Content entries
alter table public.content_entries enable row level security;
drop policy if exists "deny_public" on public.content_entries;
create policy "deny_public" on public.content_entries for all
  to anon, authenticated
  using (false) with check (false);

-- Content revisions
alter table public.content_revisions enable row level security;
drop policy if exists "deny_public" on public.content_revisions;
create policy "deny_public" on public.content_revisions for all
  to anon, authenticated
  using (false) with check (false);
```

### 17.4 SQL execution order

1. Run `17.1 Admin + booking schema`
2. Run `17.2 Content tables schema`
3. Run `17.3 RLS policies`
