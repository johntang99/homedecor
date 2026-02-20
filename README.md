# Chinese Medicine Template


lsof -ti:3003 | xargs kill -9
rm -rf .next
npm run dev

npm install
npm run build

git add .
git commit -m "Update: describe your changes"
git push


curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_djRlq5PsWfKq75nViJDtyg3gzsBH/nWJg1rsYkt








Production-ready multi-site Traditional Chinese Medicine template with admin CMS, DB-first content, and EN/ZH locale support.

## What this template includes

- Multi-site architecture with host-based site resolution
- Admin dashboard (sites, users, content, blog, booking, media)
- DB-first storage with file fallback
- Clinic booking model:
  - consultation booking
  - follow-up visits
  - treatment planning
  - provider operations support
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

Health check:

```bash
curl http://localhost:3003/api/health
```

## Default admin (file fallback seed)

- `admin@example.com`
- `admin123`

## Canonical locales

- `en` (default)
- `zh`

## Key docs

- `DRHUANG_CLINIC_REPRODUCTION_GUIDE.md`
- `SITE_REPRODUCTION_TEMPLATE.md`
- `NEW_SITE_DUPLICATION_CHECKLIST.md`
- `TEMPLATE_QA_MATRIX.md`
- `TEMPLATE_RUNBOOK.md`
- `STAGING_PROMOTION_RUNBOOK.md`

## Starter seed packs

- `content/starter-packs/starter-basic/`
- `content/starter-packs/starter-pro/`

Use starter packs as booking data blueprints when launching a new site clone.

---

This repository is the active Chinese Medicine clinic template baseline.
