# New Site Duplication Checklist

Use this checklist to duplicate the full platform (frontend, admin, and DB) safely.

Reference SOP:
- `DRHUANG_CLINIC_REPRODUCTION_GUIDE.md` -> section `14) New Site Duplication SOP`

---

## A) Pre-flight

- [ ] Confirm source project is `chinese-medicine`.
- [ ] Confirm target folder name (example: `chinese-medicine-newsite`).
- [ ] Confirm new `siteId` (example: `new-site-id`).
- [ ] Confirm new production domain.
- [ ] Confirm this migration will use a new Supabase project.

---

## B) Code clone

- [ ] Duplicate project folder:

```bash
cd /Users/johntang/Desktop/clients/medical-clinic
cp -R chinese-medicine chinese-medicine-newsite
cd chinese-medicine-newsite
rm -rf node_modules .next
npm install
```

- [ ] Keep original `chinese-medicine` unchanged.
- [ ] Initialize separate git remote/repo for new client.

---

## C) New Supabase project

- [ ] Create a new Supabase project.
- [ ] Save credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Run SQL: `supabase/admin-schema.sql`.
- [ ] Ensure content tables exist:
  - [ ] `content_entries`
  - [ ] `content_revisions`
- [ ] Run SQL: `supabase/rls.sql`.

If content tables are missing, run:

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

---

## D) Prepare new site content (including booking)

- [ ] Copy base content:

```bash
cd /Users/johntang/Desktop/clients/medical-clinic/chinese-medicine-newsite
cp -R content/dr-huang-clinic content/new-site-id
```

- [ ] Update `content/new-site-id/theme.json`.
- [ ] Update `content/new-site-id/en/site.json`.
- [ ] Update `content/new-site-id/zh/site.json`.
- [ ] Update both locales:
  - [ ] `navigation.json`
  - [ ] `header.json`
  - [ ] `footer.json`
  - [ ] `seo.json`
- [ ] Review page files:
  - [ ] `pages/*.json`
  - [ ] `pages/*.layout.json`
- [ ] Review booking files:
  - [ ] `booking/services.json`
  - [ ] `booking/settings.json`
  - [ ] `booking/bookings/*.json` (if historical bookings are migrated)

- [ ] Register site in `content/_sites.json` with:
  - [ ] `id`
  - [ ] `name`
  - [ ] `domain`
  - [ ] `defaultLocale`
  - [ ] `supportedLocales`

---

## E) Environment setup

- [ ] Create/update `.env.local` in new clone.
- [ ] Set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `JWT_SECRET` (new secret)
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM`
  - [ ] `CONTACT_FALLBACK_TO`
  - [ ] `ALERT_TO` (optional)
- [ ] Confirm no env values point to old production project.

---

## E.1) Resend/Booking setup checks

- [ ] Verify Resend env vars from section `E` are present in local and deployment env.
- [ ] Confirm contact email route is active: `app/api/contact/route.ts`.
- [ ] Confirm booking email sender is configured: `lib/booking/email.ts`.
- [ ] Verify booking settings include notification recipients:
  - [ ] `notificationEmails`
  - [ ] `notificationPhones` (if SMS enabled)
- [ ] Optional SMS/Twilio setup:
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_FROM`
- [ ] Confirm booking tables exist in DB:
  - [ ] `booking_services`
  - [ ] `booking_settings`
  - [ ] `bookings`
- [ ] Confirm content tables exist in DB:
  - [ ] `content_entries`
  - [ ] `content_revisions`

---

## F) Run app + import sequence

- [ ] Start app:

```bash
npm run dev
```

- [ ] Import sites (`/api/admin/sites/import`).
- [ ] Import users if required (`/api/admin/users/import`).
- [ ] For each locale (`en`, `zh`), import content using `missing` mode first.
- [ ] Import booking data for site (`/api/admin/booking/import`).
- [ ] Import media only if existing assets are being migrated (`/api/admin/media/import`).
- [ ] Use overwrite import only intentionally.

---

## G) Domain routing

- [ ] Verify new site `domain` in site data is correct.
- [ ] Verify no port in stored domain.
- [ ] Verify host resolves to correct site in app.

---

## H) Build and deploy

- [ ] Run production build:

```bash
npm run build
```

- [ ] Create separate deployment project (for example, new Vercel project).
- [ ] Add new env vars in deployment target.
- [ ] Configure DNS for new domain.
- [ ] Deploy.

---

## I) Post-deploy verification

- [ ] `/en` and `/zh` load.
- [ ] Admin login works.
- [ ] Edit in `Site Settings` saves and persists.
- [ ] Contact form sends:
  - [ ] clinic notification email
  - [ ] user auto-reply email
- [ ] Booking flow works end-to-end:
  - [ ] create booking
  - [ ] cancel booking
  - [ ] reschedule booking
- [ ] Booking notifications send correctly (email and optional SMS).
- [ ] Booking data is persisted in DB tables:
  - [ ] `booking_services`
  - [ ] `booking_settings`
  - [ ] `bookings`
- [ ] Theme changes reflect on frontend.
- [ ] Layout and variant changes reflect on frontend.
- [ ] Import/export works.
- [ ] RBAC/site access boundaries work.

---

## J) Safety guardrails

- [ ] Do not reuse old Supabase project.
- [ ] Do not deploy without `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Do not reuse old `JWT_SECRET`.
- [ ] Do not run overwrite import unless approved.
- [ ] Do not point new domain to old deployment.
