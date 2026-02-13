# WEWASH Notes

Project-specific implementation notes for the `wewash` clone.

## Project Identity

- Project root: `/Users/johntang/Desktop/clients/laundry/wewash`
- Site id: `wewash`
- Domain: `wewash99.com`
- Default locale: `en`
- Supported locales: `en`, `es`

## Current Runtime

- Dev command with custom port:
  - `npm run dev -- -p 5001`
- Build command:
  - `npm run build`

Port notes:
- macOS `ControlCenter` occupies `5000` on this machine.
- Use `5001` (or another free port) for local dev.

## Files Confirmed for Wewash

- `content/_sites.json` contains `wewash` as enabled site.
- `content/wewash/` is the active content root.
- `content/dr-huang-clinic/` was renamed/migrated out of runtime use.

## Environment Checklist (`.env.local`)

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Optional notifications:
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_FALLBACK_TO`
- `ALERT_TO`
- Twilio keys if SMS is enabled

## DB Setup Order (New Supabase)

1. Run `supabase/admin-schema.sql`
2. Ensure content tables exist
3. Run `supabase/rls.sql`

## Admin Import Order

1. Sites import
2. Users import
3. Content import (`missing` first)
4. Booking import
5. Media import

## Localhost Site Resolution Notes

To avoid fallback to old site ids on localhost:
- Content/site resolution is patched to prefer local `_sites.json` default site in local environments.
- If old DB records still appear in behavior, verify `.env.local` points to the intended Supabase project and re-import site/content.

## Known Non-Blocking Warnings

- Some icon names in content may not match `lucide-react` exactly (for example `Certificate`, `ShirtIcon`, `Grid`), producing warnings during build.
- This does not block app startup/build, but should be normalized in content if you want clean logs.

## Recommended Next Cleanup

- Remove outdated historical backups under:
  - `content/_history/dr-huang-clinic/*`
  if they are no longer needed.
- Keep one canonical process doc:
  - `SITE_REPRODUCTION_TEMPLATE.md`
  and update this file per project.
