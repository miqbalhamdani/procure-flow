create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid,
  email text not null unique,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.users enable row level security;

-- Security definer function bypasses RLS on users table,
-- preventing infinite recursion in policies that check is_super_admin.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and is_super_admin = true
  );
$$;

create policy "users_self_or_super_admin_select"
on public.users
for select
using (
  auth.uid() = id
  or public.is_super_admin()
);

create policy "users_super_admin_update"
on public.users
for update
using (
  public.is_super_admin()
);
