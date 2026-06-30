-- Supabase schema for Approximately Up Mods V2
-- Run this in Supabase SQL Editor after creating a project.

create table if not exists public.mods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid references auth.users(id),
  name text not null,
  category text not null default 'Tools',
  version text,
  game_build text,
  loader text,
  status text not null default 'warn',
  summary_ru text,
  summary_en text,
  description text,
  file_url text,
  published boolean not null default false
);

alter table public.mods enable row level security;

create policy "Public can read published mods"
  on public.mods for select
  using (published = true);

create policy "Authors can insert own mods"
  on public.mods for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own mods"
  on public.mods for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
