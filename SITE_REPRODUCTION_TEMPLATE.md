# Site Reproduction Template

Use this template to spin up a new site from an existing base project safely.

## 1) Fill These Variables First

- `<PROJECT_ROOT>`: absolute project path
- `<BASE_SITE_ID>`: current source site id (for cloning content)
- `<NEW_SITE_ID>`: new site id
- `<NEW_SITE_NAME>`: human-readable name
- `<NEW_DOMAIN>`: production domain (no port)
- `<DEFAULT_LOCALE>`: usually `en`
- `<SUPPORTED_LOCALES>`: e.g. `en,es`

---

## 2) Create Isolated Code Copy

```bash
cd "<PARENT_DIR>"
cp -R "<BASE_PROJECT_DIR>" "<NEW_PROJECT_DIR>"
cd "<NEW_PROJECT_DIR>"
rm -rf node_modules .next
npm install
```

Important:
- Remove copied runtime env files and create fresh ones:
  - delete `.env.local` and any production env files copied from source
- Keep `.env*.example` as references

---

## 3) Create New Supabase Project

Do not reuse the old project.

Run in SQL editor:
1. `supabase/admin-schema.sql`
2. content tables SQL (if not already included in schema)
3. `supabase/rls.sql`

---

## 4) Duplicate Content Tree

```bash
cp -R "content/<BASE_SITE_ID>" "content/<NEW_SITE_ID>"
```

Then update:
- `content/_sites.json`
  - `id`, `name`, `domain`, `enabled`, `defaultLocale`, `supportedLocales`
- `content/<NEW_SITE_ID>/theme.json`
- `content/<NEW_SITE_ID>/<locale>/site.json`
- `navigation.json`, `header.json`, `footer.json`, `seo.json`
- `pages/*.json` and `pages/*.layout.json`
- `booking/services.json`, `booking/settings.json`, `booking/bookings/*.json` (if needed)

---

## 5) Environment Setup

Create new `.env.local` with project-specific values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (new value per project)
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_FALLBACK_TO`
- `ALERT_TO` (optional)
- Twilio vars (optional)

Never reuse:
- previous `SUPABASE_SERVICE_ROLE_KEY`
- previous `JWT_SECRET`

---

## 6) Start + Import in Safe Order

```bash
npm run dev -- -p <PORT>
```

Then from admin:
1. import sites
2. import users
3. import content with `missing` mode
4. import booking data
5. import media (if needed)
6. use overwrite import only intentionally

---

## 7) Lock Identity + Access (Mandatory)

Before any design/content edits, verify identity and RBAC:

1. In `/admin/sites`:
   - confirm only intended site IDs are enabled
   - confirm domain is `<NEW_DOMAIN>`
   - confirm `defaultLocale` + `supportedLocales` match your final values
2. In `/admin/users`:
   - ensure at least one working `super_admin` exists
   - verify user `sites` assignments only include intended site IDs
   - remove/restrict template users not needed for this client
3. Re-login with final admin account and verify all admin sections load.

Also validate DB rows directly:
- `sites.default_locale` and `sites.supported_locales` are correct
- `admin_users.role` and `admin_users.sites` are correct
- Optional runbook: `ADMIN_TEMPLATE_SETUP_CHECKLIST.md`

---

## 8) Verification Checklist

- `/en` + secondary locale routes resolve
- admin login works
- DB-first writes persist from admin
- theme/layout/variant changes render on frontend
- site/domain/locale values are correct in `sites` table
- user role/site mapping is correct in `admin_users` table
- booking workflows create/cancel/reschedule
- contact/notification emails work
- `npm run build` succeeds

---

## 9) Common Pitfalls

- Old env still points to old Supabase
- Host mapping/domain not updated
- `_sites.json` missing `enabled: true`
- Hardcoded old site id left in code/content
- site created in file JSON but not synced in DB (or vice versa)
- locale mismatch between `_sites.json` and DB `sites` row
- admin user exists but role/sites are wrong, causing hidden/blocked admin actions
- Import done in overwrite mode too early
