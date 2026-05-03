create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.workspaces (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.workspaces enable row level security;

alter table public.users
  add constraint users_workspace_id_fkey
  foreign key (workspace_id)
  references public.workspaces (id)
  on delete set null;

create policy "workspaces_super_admin_all"
on public.workspaces
for all
using (
  public.is_super_admin()
)
with check (
  public.is_super_admin()
);
