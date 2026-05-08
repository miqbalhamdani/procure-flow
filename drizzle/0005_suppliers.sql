create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null,
  address text,
  country text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint suppliers_workspace_name_unique unique (workspace_id, name)
);

create index if not exists suppliers_workspace_idx
  on public.suppliers (workspace_id);

create index if not exists suppliers_company_idx
  on public.suppliers (company_id);

alter table public.suppliers enable row level security;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and (
        m.workspace_id = p_workspace_id
        or exists (
          select 1
          from public.workspaces w
          where w.id = p_workspace_id
            and w.parent_id = m.workspace_id
        )
      )
  );
$$;

create policy "suppliers_select"
on public.suppliers
for select
using (
  public.is_super_admin()
  or public.is_workspace_member(workspace_id)
);

create policy "suppliers_insert"
on public.suppliers
for insert
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.workspace_id = suppliers.workspace_id
      and m.role in ('admin', 'manager')
  )
);

create policy "suppliers_update"
on public.suppliers
for update
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.workspace_id = suppliers.workspace_id
      and m.role in ('admin', 'manager')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.workspace_id = suppliers.workspace_id
      and m.role in ('admin', 'manager')
  )
);

create policy "suppliers_delete"
on public.suppliers
for delete
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.workspace_id = suppliers.workspace_id
      and m.role in ('admin', 'manager')
  )
);
