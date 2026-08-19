-- 1) 创建女士资料表
create extension if not exists pgcrypto;

create table if not exists public.women (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null check (age >= 18 and age <= 100),
  city text default '',
  occupation text default '',
  height_cm integer,
  marital_status text default '',
  short_intro text default '',
  bio text default '',
  hobbies text default '',
  whatsapp text not null,
  photos text[] not null default '{}',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) 开启 RLS
alter table public.women enable row level security;

-- 前台：任何访客只能看到已发布资料
create policy "public can read published women"
on public.women for select
to anon, authenticated
using (is_published = true);

-- 后台：登录用户可以查看全部资料并完整管理
create policy "authenticated can read all women"
on public.women for select
to authenticated
using (true);

create policy "authenticated can insert women"
on public.women for insert
to authenticated
with check (true);

create policy "authenticated can update women"
on public.women for update
to authenticated
using (true)
with check (true);

create policy "authenticated can delete women"
on public.women for delete
to authenticated
using (true);

-- 3) Storage bucket：照片公开读取，上传/删除需要登录
insert into storage.buckets (id, name, public)
values ('women-photos', 'women-photos', true)
on conflict (id) do nothing;

create policy "public can view women photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'women-photos');

create policy "authenticated can upload women photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'women-photos');

create policy "authenticated can update women photos"
on storage.objects for update
to authenticated
using (bucket_id = 'women-photos')
with check (bucket_id = 'women-photos');

create policy "authenticated can delete women photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'women-photos');
