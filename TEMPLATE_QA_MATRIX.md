# Medical Template QA Matrix

Use this matrix before publishing `chinese-medicine` template updates or cloning to a new client.

Supported locales for this template: `en`, `zh`.

## 1) Public Experience

- [x] `GET /en` renders content.
- [x] `GET /zh` renders content.
- [x] Header language switch includes only `en` and `zh`.
- [x] Core pages build and route: `/services`, `/pricing`, `/contact`, `/blog`, `/case-studies`.
- [ ] Manual browser spot-check for medical copy quality and translation consistency.

## 2) Services Variants

- [x] `services.json` supports `servicesList.variant` and keeps legacy `services` fallback.
- [x] Services page uses variant-aware rendering via `ServicesSection`.
- [x] Services variant union includes `detail-alternating`.
- [x] Admin Form supports editing `servicesList.items` (title/description/image/price/duration/featured).
- [ ] Manual check in Admin: change variant and confirm frontend layout updates.

## 3) Content Variant Coverage

- [x] Missing `variant` fields auto-filled for medical page JSON files (`en`/`zh`).
- [x] Coverage check result: `en` missing variant count = `0`.
- [x] Coverage check result: `zh` missing variant count = `0`.

## 4) Data Safety (DB <-> JSON)

- [x] Import supports safe mode (`missing`) and skips existing DB rows.
- [x] Overwrite mode is explicit (`mode = overwrite`).
- [x] Export writes DB content to source files under `content/<siteId>/<locale>/`.
- [x] `theme.json` export writes to site-level `content/<siteId>/theme.json`.
- [ ] Manual roundtrip check: edit DB -> Export JSON -> verify expected file diff.

## 5) Admin + RBAC

- [x] Site/locale selectors use `en`/`zh` labels consistently in content/blog/template managers.
- [ ] `super_admin` full access verified with real accounts.
- [ ] `site_admin` scope restrictions verified with assigned sites.
- [ ] `editor` and `viewer` permission boundaries verified.

## 6) Build and Runtime

- [x] `npm run build` succeeds after updates.
- [x] Build routes generate for `/en/*` and `/zh/*`.
- [ ] Runtime smoke test in browser for Admin login and CRUD actions.

## 7) Clone Readiness

- [x] Site creation defaults now use `supportedLocales: ['en', 'zh']`.
- [x] i18n locale registry set to `en`/`zh`.
- [ ] Confirm cloned site has expected `sites` and `admin_users` rows in DB.
