do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'membership_role'
  ) then
    create type public.membership_role as enum (
      'admin',
      'manager',
      'procurement',
      'logistics',
      'supplier',
      'viewer'
    );
  end if;
end $$;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.membership_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint memberships_user_workspace_unique unique (user_id, workspace_id)
);

create index if not exists memberships_workspace_idx
  on public.memberships (workspace_id);

create index if not exists memberships_user_idx
  on public.memberships (user_id);

alter table public.memberships enable row level security;

create policy "memberships_self_or_super_admin_select"
on public.memberships
for select
using (
  user_id = auth.uid()
  or public.is_super_admin()
);

create policy "memberships_super_admin_all"
on public.memberships
for all
using (
  public.is_super_admin()
)
with check (
  public.is_super_admin()
);

create policy "workspaces_member_select"
on public.workspaces
for select
using (
  exists (
    select 1
    from public.memberships m
    where m.workspace_id = workspaces.id
      and m.user_id = auth.uid()
  )
);
