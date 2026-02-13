# WeWash Industry Template

Production-ready multi-site laundry template with admin CMS, DB-first content, and EN/ES locale support.

## What this template includes

- Multi-site architecture with host-based site resolution
- Admin dashboard (sites, users, content, blog, booking, media)
- DB-first storage with file fallback
- Hybrid laundry booking model:
  - pickup/delivery
  - drop-off
  - self-service
  - commercial accounts
- Clone-safe docs and starter seed packs

## Local development

```bash
npm run dev -- -p 5001
```

Stop local dev quickly:

```bash
pkill -f "next dev"
```

Build:

```bash
npm run build
```

## Default admin (file fallback seed)

- `admin@example.com`
- `admin123`

## Canonical locales

- `en` (default)
- `es`

## Key docs

- `DRHUANG_CLINIC_REPRODUCTION_GUIDE.md`
- `SITE_REPRODUCTION_TEMPLATE.md`
- `NEW_SITE_DUPLICATION_CHECKLIST.md`
- `TEMPLATE_QA_MATRIX.md`
- `TEMPLATE_RUNBOOK.md`

## Starter seed packs

- `content/starter-packs/starter-basic/`
- `content/starter-packs/starter-pro/`

Use starter packs as booking data blueprints when launching a new site clone.

---

This repository is the active hybrid laundry template baseline.
