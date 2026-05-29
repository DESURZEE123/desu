-- Run this in Supabase SQL Editor.
-- This schema uses Supabase Auth + Row Level Security so every user only sees their own records.

create extension if not exists pgcrypto;

create table if not exists public.work_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  style_name text not null check (length(trim(style_name)) > 0),
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  note text not null default '',
  subtotal numeric(14, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_records_user_date_idx
  on public.work_records (user_id, work_date desc);

create index if not exists work_records_user_created_idx
  on public.work_records (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_work_records_updated_at on public.work_records;

create trigger set_work_records_updated_at
before update on public.work_records
for each row
execute function public.set_updated_at();

alter table public.work_records enable row level security;

drop policy if exists "work_records_select_own" on public.work_records;
drop policy if exists "work_records_insert_own" on public.work_records;
drop policy if exists "work_records_update_own" on public.work_records;
drop policy if exists "work_records_delete_own" on public.work_records;

create policy "work_records_select_own"
on public.work_records
for select
to authenticated
using (auth.uid() = user_id);

create policy "work_records_insert_own"
on public.work_records
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "work_records_update_own"
on public.work_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "work_records_delete_own"
on public.work_records
for delete
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.work_records to authenticated;
