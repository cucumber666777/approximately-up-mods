-- Supabase schema for Approximately Up Mods
-- Run this in Supabase SQL Editor after creating a project.
-- Then put your Project URL and anon public key into supabase-config.js.

create extension if not exists pgcrypto;

create table if not exists public.mods (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid references auth.users(id) on delete set null,
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
  file_path text,
  screenshots jsonb not null default '[]'::jsonb,
  published boolean not null default false
);

alter table public.mods add column if not exists file_path text;
alter table public.mods add column if not exists screenshots jsonb not null default '[]'::jsonb;
alter table public.mods alter column published set default false;

alter table public.mods enable row level security;

drop policy if exists "Public can read published mods" on public.mods;
drop policy if exists "Authors can read own mods" on public.mods;
drop policy if exists "Authors can insert own mods" on public.mods;
drop policy if exists "Authors can update own mods" on public.mods;
drop policy if exists "Authors can delete own mods" on public.mods;

create policy "Public can read published mods"
  on public.mods for select
  using (published = true);

create policy "Authors can read own mods"
  on public.mods for select
  using (auth.uid() = author_id);

create policy "Authors can insert own mods"
  on public.mods for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own mods"
  on public.mods for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete own mods"
  on public.mods for delete
  using (auth.uid() = author_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('mod-files', 'mod-files', true, 104857600, null),
  ('mod-screenshots', 'mod-screenshots', true, 10485760, array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read AU mod storage" on storage.objects;
drop policy if exists "Users can upload own AU files" on storage.objects;
drop policy if exists "Users can update own AU files" on storage.objects;
drop policy if exists "Users can delete own AU files" on storage.objects;

create policy "Public can read AU mod storage"
  on storage.objects for select
  using (bucket_id in ('mod-files', 'mod-screenshots'));

create policy "Users can upload own AU files"
  on storage.objects for insert
  with check (
    bucket_id in ('mod-files', 'mod-screenshots')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own AU files"
  on storage.objects for update
  using (
    bucket_id in ('mod-files', 'mod-screenshots')
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id in ('mod-files', 'mod-screenshots')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own AU files"
  on storage.objects for delete
  using (
    bucket_id in ('mod-files', 'mod-screenshots')
    and auth.uid()::text = (storage.foldername(name))[1]
  );
