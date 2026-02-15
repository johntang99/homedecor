# Chinese Medicine Template Runbook

Operational runbook for launching a new medical clinic from this template.

## 1) Required replacements

Every new clone must replace:
- `siteId`
- domain
- locales
- admin users and role/site mapping

## 2) Recommended import order

1. Import sites (`/api/admin/sites/import`)
2. Import users (`/api/admin/users/import`)
3. Import content (`/api/admin/content/import`, mode=`missing`)
4. Import bookings/settings/services (`/api/admin/booking/import`)
5. Import media (`/api/admin/media/import`)

Only use overwrite mode when explicitly approved.

## 3) API payload examples

Create site:

```json
{
  "id": "new-site-id",
  "name": "New Clinic Site",
  "domain": "example.com",
  "enabled": true,
  "defaultLocale": "en",
  "supportedLocales": ["en", "zh"]
}
```

Create user:

```json
{
  "email": "owner@example.com",
  "name": "Site Owner",
  "role": "site_admin",
  "sites": ["new-site-id"]
}
```

Set password:

```json
{
  "password": "ChangeMe123!"
}
```

Create booking:

```json
{
  "serviceId": "initial-consultation",
  "date": "2026-02-20",
  "time": "10:00",
  "name": "Jane Doe",
  "phone": "+18455550123",
  "email": "jane@example.com",
  "pickupAddress": "87 North Street",
  "zipCode": "10940",
  "bags": 3,
  "estimatedWeightLb": 24,
  "requestType": "one_time"
}
```

## 4) SQL checks

```sql
select id, domain, default_locale, supported_locales from public.sites order by id;
select email, role, sites from public.admin_users order by email;
select site_id, count(*) from public.content_entries group by site_id order by site_id;
select site_id, count(*) from public.media_assets group by site_id order by site_id;
select site_id, count(*) from public.bookings group by site_id order by site_id;
```

## 5) Release checklist

- `/en` and `/zh` render correctly
- admin role boundaries work
- booking create/cancel/reschedule works
- import/export behavior validated
- `npm run build` passes
