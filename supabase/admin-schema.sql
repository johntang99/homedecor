-- Julia Studio — BAAM System F
-- Run this in your Supabase SQL editor (design project)
-- No booking tables — design studio, not a clinic

create extension if not exists pgcrypto;

-- ── Sites ──────────────────────────────────────────────────────────────────────
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

create table if not exists public.site_domains (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites(id) on delete cascade,
  domain text not null,
  environment text not null default 'prod',
  is_primary boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, domain, environment)
);

create index if not exists site_domains_domain_idx on public.site_domains (domain);

-- ── Admin users ────────────────────────────────────────────────────────────────
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

-- ── Media assets ───────────────────────────────────────────────────────────────
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  path text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, path)
);

-- ── Content entries (DB-first CMS) ─────────────────────────────────────────────
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

-- ── Content revisions (audit trail) ───────────────────────────────────────────
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by text,
  note text
);

-- ── Consultation requests (contact form submissions) ───────────────────────────
create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  name text not null,
  email text not null,
  phone text,
  project_type text,
  scope text,
  budget text,
  location text,
  referral text,
  preferred_language text default 'en',
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultation_requests_site_idx on public.consultation_requests (site_id, created_at desc);

-- ── Admin audit logs ───────────────────────────────────────────────────────────
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_email text,
  action text not null,
  site_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Seed Julia Studio site entry ───────────────────────────────────────────────
insert into public.sites (id, name, domain, enabled, default_locale, supported_locales)
values ('julia-studio', 'Julia Studio', 'studio-julia.com', true, 'en', array['en','zh']::text[])
on conflict (id) do nothing;

-- ================================================================
-- Data API explicit grants (Supabase requirement)
-- IMPORTANT: When adding new public tables, include explicit GRANTs.
-- ================================================================
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;
