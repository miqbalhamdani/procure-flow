alter table public.workspaces
  add column if not exists address text,
  add column if not exists country text;
