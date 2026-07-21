create table if not exists public.scan_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  subject_kind text not null default 'primary' check (subject_kind in ('primary', 'secondary', 'guest', 'unidentified')),
  identity_confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_subjects_user_id_created_at_idx
  on public.scan_subjects (user_id, created_at desc);

alter table public.scan_sessions
  add column if not exists subject_id uuid references public.scan_subjects(id) on delete set null;

create index if not exists scan_sessions_subject_id_created_at_idx
  on public.scan_sessions (subject_id, created_at desc);

create table if not exists public.scan_interpretation_diagnostics (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.scan_subjects(id) on delete set null,
  pattern_signature text not null,
  display_name text not null,
  family text not null,
  confidence numeric not null default 0,
  state_vector jsonb not null default '{}'::jsonb,
  evidence_ledger jsonb not null default '{}'::jsonb,
  dimension_ledger jsonb not null default '{}'::jsonb,
  decision_ledger jsonb not null default '{}'::jsonb,
  baseline jsonb not null default '{}'::jsonb,
  interpretation_limits text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_interpretation_diagnostics_user_id_idx
  on public.scan_interpretation_diagnostics (user_id);

create index if not exists scan_interpretation_diagnostics_subject_id_idx
  on public.scan_interpretation_diagnostics (subject_id);

alter table public.scan_subjects enable row level security;
alter table public.scan_interpretation_diagnostics enable row level security;

drop policy if exists "Users can read their own scan subjects" on public.scan_subjects;
create policy "Users can read their own scan subjects"
  on public.scan_subjects
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own scan subjects" on public.scan_subjects;
create policy "Users can create their own scan subjects"
  on public.scan_subjects
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scan subjects" on public.scan_subjects;
create policy "Users can update their own scan subjects"
  on public.scan_subjects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scan subjects" on public.scan_subjects;
create policy "Users can delete their own scan subjects"
  on public.scan_subjects
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own interpretation diagnostics" on public.scan_interpretation_diagnostics;
create policy "Users can read their own interpretation diagnostics"
  on public.scan_interpretation_diagnostics
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own interpretation diagnostics" on public.scan_interpretation_diagnostics;
create policy "Users can create their own interpretation diagnostics"
  on public.scan_interpretation_diagnostics
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own interpretation diagnostics" on public.scan_interpretation_diagnostics;
create policy "Users can update their own interpretation diagnostics"
  on public.scan_interpretation_diagnostics
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own interpretation diagnostics" on public.scan_interpretation_diagnostics;
create policy "Users can delete their own interpretation diagnostics"
  on public.scan_interpretation_diagnostics
  for delete
  using (auth.uid() = user_id);
