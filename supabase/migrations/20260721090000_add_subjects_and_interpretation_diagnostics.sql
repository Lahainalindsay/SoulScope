create extension if not exists pgcrypto;

create table if not exists public.scan_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject_type text not null default 'primary'
    check (subject_type in ('primary', 'secondary', 'guest', 'unidentified')),
  is_primary boolean not null default false,
  identity_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_subjects_user_id_idx on public.scan_subjects(user_id);
create unique index if not exists scan_subjects_one_primary_per_user_idx
  on public.scan_subjects(user_id) where is_primary;

alter table public.scan_subjects enable row level security;

drop policy if exists "Users can view own scan subjects" on public.scan_subjects;
create policy "Users can view own scan subjects"
  on public.scan_subjects for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own scan subjects" on public.scan_subjects;
create policy "Users can insert own scan subjects"
  on public.scan_subjects for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own scan subjects" on public.scan_subjects;
create policy "Users can update own scan subjects"
  on public.scan_subjects for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own scan subjects" on public.scan_subjects;
create policy "Users can delete own scan subjects"
  on public.scan_subjects for delete using (auth.uid() = user_id);

-- scan_sessions is the real table. public.scans is a compatibility view.
alter table public.scan_sessions
  add column if not exists subject_id uuid
  references public.scan_subjects(id) on delete set null;

create index if not exists scan_sessions_subject_id_idx
  on public.scan_sessions(subject_id);

-- Preserve existing view column order and append subject_id.
create or replace view public.scans as
select
  id,
  user_id,
  raw_result as result,
  status,
  expected_recording_count,
  valid_recording_count,
  invalid_recording_count,
  capture_quality as quality_level,
  retry_recommended,
  observation_engine_version,
  observation_pipeline,
  observation_pipeline_created_at,
  created_at,
  updated_at,
  subject_id
from public.scan_sessions;

create table if not exists public.scan_interpretation_diagnostics (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.scan_subjects(id) on delete set null,
  pattern_signature text not null,
  display_name text not null,
  family text,
  confidence double precision not null default 0
    check (confidence >= 0 and confidence <= 1),
  state_vector jsonb not null default '{}'::jsonb,
  evidence_ledger jsonb not null default '[]'::jsonb,
  dimension_ledger jsonb not null default '{}'::jsonb,
  decision_ledger jsonb not null default '{}'::jsonb,
  baseline jsonb,
  interpretation_limits jsonb not null default '[]'::jsonb,
  engine_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists scan_interpretation_diagnostics_scan_id_idx
  on public.scan_interpretation_diagnostics(scan_id);
create index if not exists scan_interpretation_diagnostics_user_id_idx
  on public.scan_interpretation_diagnostics(user_id);
create index if not exists scan_interpretation_diagnostics_subject_id_idx
  on public.scan_interpretation_diagnostics(subject_id);
create index if not exists scan_interpretation_diagnostics_family_idx
  on public.scan_interpretation_diagnostics(family);
create index if not exists scan_interpretation_diagnostics_created_at_idx
  on public.scan_interpretation_diagnostics(created_at desc);

alter table public.scan_interpretation_diagnostics enable row level security;

drop policy if exists "Users can view own interpretation diagnostics"
  on public.scan_interpretation_diagnostics;
create policy "Users can view own interpretation diagnostics"
  on public.scan_interpretation_diagnostics for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own interpretation diagnostics"
  on public.scan_interpretation_diagnostics;
create policy "Users can insert own interpretation diagnostics"
  on public.scan_interpretation_diagnostics for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own interpretation diagnostics"
  on public.scan_interpretation_diagnostics;
create policy "Users can update own interpretation diagnostics"
  on public.scan_interpretation_diagnostics for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own interpretation diagnostics"
  on public.scan_interpretation_diagnostics;
create policy "Users can delete own interpretation diagnostics"
  on public.scan_interpretation_diagnostics for delete using (auth.uid() = user_id);

alter table public.scan_sessions enable row level security;
drop policy if exists "Users can delete own scan sessions" on public.scan_sessions;
create policy "Users can delete own scan sessions"
  on public.scan_sessions for delete using (auth.uid() = user_id);

do $$
declare
  table_name_to_secure text;
begin
  foreach table_name_to_secure in array array[
    'pattern_matches',
    'reflection_variants',
    'scan_reflection_preferences'
  ] loop
    if to_regclass('public.' || table_name_to_secure) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name = table_name_to_secure
           and column_name = 'user_id'
       ) then
      execute format('alter table public.%I enable row level security', table_name_to_secure);
      execute format(
        'drop policy if exists %I on public.%I',
        'Users can delete own ' || table_name_to_secure,
        table_name_to_secure
      );
      execute format(
        'create policy %I on public.%I for delete using (auth.uid() = user_id)',
        'Users can delete own ' || table_name_to_secure,
        table_name_to_secure
      );
    end if;
  end loop;
end $$;
