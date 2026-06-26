create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_id_created_at_idx
  on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

drop policy if exists "Users can read their own scans" on public.scans;
create policy "Users can read their own scans"
  on public.scans
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own scans" on public.scans;
create policy "Users can create their own scans"
  on public.scans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scans" on public.scans;
create policy "Users can update their own scans"
  on public.scans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scans" on public.scans;
create policy "Users can delete their own scans"
  on public.scans
  for delete
  using (auth.uid() = user_id);
