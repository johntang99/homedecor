# Laundry Template QA Matrix

Use this matrix before publishing a template release or cloning to a new client.

## 1) Public Experience

- [ ] `GET /en` renders laundry messaging (not clinic wording).
- [ ] `GET /es` renders Spanish navigation and CTA labels.
- [ ] Header language switch includes only `en` and `es`.
- [ ] Core pages load: `/services`, `/pricing`, `/contact`, `/blog`, `/case-studies`.

## 2) Booking Flows (Hybrid)

- [ ] Service types available in admin: `pickup_delivery`, `dropoff`, `self_service`, `commercial`.
- [ ] Slot generation respects:
  - [ ] `minNoticeHours`
  - [ ] per-service `leadTimeHours`
  - [ ] per-slot capacity (`capacityPerSlot` or global max)
- [ ] Public booking create endpoint accepts optional hybrid fields without error.
- [ ] Cancel and reschedule still work on existing records.

## 3) Admin + RBAC

- [ ] `super_admin` can manage all sites/users/modules.
- [ ] `site_admin` only manages assigned sites.
- [ ] `editor` can edit content but cannot manage users/sites.
- [ ] `viewer` has read-only behavior where expected.
- [ ] Site and locale selectors are consistent in content/blog/template managers.

## 4) Data Safety

- [ ] Import `missing` mode does not overwrite existing DB rows.
- [ ] Overwrite import requires explicit action.
- [ ] Export returns current DB-backed content.
- [ ] `sites` and `admin_users` rows match intended clone identity.

## 5) Starter Seed Packs

- [ ] `content/starter-packs/starter-basic/` reviewed and usable.
- [ ] `content/starter-packs/starter-pro/` reviewed and usable.
- [ ] Pack fields align with current booking/content schema.

## 6) Build and Runtime

- [ ] `npm run build` succeeds.
- [ ] No locale label regressions in admin (`Chinese` should not appear for this template).
- [ ] No 404s for default locale route.
