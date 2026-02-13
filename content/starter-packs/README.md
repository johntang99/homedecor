# Laundry Starter Packs

This folder provides reusable seed packs for new laundry clients.

- `starter-basic.json`: small local laundry shop (pickup + drop-off + self-service).
- `starter-pro.json`: hybrid operation with commercial programs and richer operations config.

## How to use

1. Create the new site in admin (`/admin/sites`) with the target `siteId`.
2. Create users in admin (`/admin/users`) and assign roles/sites.
3. Copy the selected pack's booking/services/settings values into:
   - `content/<siteId>/booking/services.json`
   - `content/<siteId>/booking/settings.json`
4. Import bookings/settings/services from JSON via:
   - `POST /api/admin/booking/import` (or use admin button).
5. Run content import in safe mode (`missing`) and validate routes `/en` and `/es`.

These packs are intentionally content-light and operations-heavy, so each client can customize pages while keeping a proven laundry operations baseline.
