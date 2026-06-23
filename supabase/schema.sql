-- AyuPulse Date-Specific Scheduler Schema
-- Run this in Supabase SQL Editor.
-- This version uses date-specific availability windows, not weekly recurring rules.

create extension if not exists "uuid-ossp";

create table if not exists availability_windows (
  id uuid primary key default uuid_generate_v4(),
  host_id text not null check (host_id in ('tejaaswin', 'raksha')),
  available_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_windows_time_check check (start_time < end_time)
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  host_id text not null check (host_id in ('tejaaswin', 'raksha')),
  meeting_type_id text not null,
  guest_name text not null,
  guest_email text not null,
  guest_telegram text not null,
  agenda text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending',
  outlook_url text,
  confirmation_token text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table bookings add column if not exists confirmation_token text;
alter table bookings add column if not exists confirmed_at timestamptz;
alter table bookings add column if not exists cancelled_at timestamptz;

create unique index if not exists bookings_confirmation_token_idx
on bookings(confirmation_token)
where confirmation_token is not null;

create index if not exists availability_windows_host_date_idx
on availability_windows(host_id, available_date, start_time);

create index if not exists bookings_host_start_idx
on bookings(host_id, start_time);

create index if not exists bookings_status_idx
on bookings(status);

alter table availability_windows enable row level security;
alter table bookings enable row level security;

-- No public policies are needed.
-- Server API routes validate Supabase Auth and then use the service role key.

-- Example date-specific availability:
-- Change these dates/times or add from the dashboard.
insert into availability_windows (host_id, available_date, start_time, end_time)
values
  ('tejaaswin', '2026-06-23', '16:00', '22:00'),
  ('raksha', '2026-06-23', '17:00', '21:00')
on conflict do nothing;

notify pgrst, 'reload schema';
