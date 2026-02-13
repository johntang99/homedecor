-- Admin dashboard tables for sites, users, media, and bookings.

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

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  path text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, path)
);

create table if not exists public.booking_services (
  site_id text primary key,
  services jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_settings (
  site_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  site_id text not null,
  service_id text not null,
  service_type text,
  date date not null,
  time text not null,
  duration_minutes integer not null,
  name text not null,
  phone text not null,
  email text not null,
  note text,
  details jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_site_date_idx on public.bookings (site_id, date);

-- Safe incremental migration for existing projects
alter table public.bookings
  add column if not exists service_type text;
alter table public.bookings
  add column if not exists details jsonb not null default '{}'::jsonb;
