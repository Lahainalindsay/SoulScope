-- SoulScope V2 hosted schema reset and rebuild
-- Target project: jhamqpfxblybshjmgvsy
--
-- DESTRUCTIVE SCOPE
--   Drops and recreates SoulScope-owned objects in the public schema.
--   Deletes all existing SoulScope application data stored in public tables.
--
-- PRESERVED
--   auth schema and all Auth users, identities, and sessions
--   storage schema, buckets, and objects
--   Supabase system schemas and installed extensions
--   project URL, API keys, secrets, Edge Functions, and Vercel configuration
--
-- Execute this file once, in full, through the Supabase SQL Editor.
-- Do not execute individual sections out of order.

begin;

set local lock_timeout = '15s';
set local statement_timeout = '0';

-- -----------------------------------------------------------------------------
-- 1. Remove obsolete SoulScope-owned functions.
-- -----------------------------------------------------------------------------

drop function if exists public.set_scan_story_preference(uuid, uuid, text, text, text);
drop function if exists public.set_scan_reflection_preference(uuid, uuid, text, text, text);
drop function if exists public.owns_scan(uuid);
drop function if exists public.enforce_scan_child_owner();
drop function if exists public.set_updated_at();
drop function if exists public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. Remove obsolete and prior V2 relations by explicit name.
--    The DO block safely handles a prior table, view, or materialized view named
--    public.scans without dropping the public schema itself.
-- -----------------------------------------------------------------------------

do $$
declare
  relation_name text;
  relation_kind "char";
begin
  foreach relation_name in array array[
    'scans'
  ] loop
    select c.relkind
      into relation_kind
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = relation_name;

    if relation_kind in ('r', 'p', 'f') then
      execute format('drop table public.%I cascade', relation_name);
    elsif relation_kind = 'v' then
      execute format('drop view public.%I cascade', relation_name);
    elsif relation_kind = 'm' then
      execute format('drop materialized view public.%I cascade', relation_name);
    end if;
  end loop;
end
$$;

-- V2 tables, in child-first dependency order.
drop table if exists public.scan_reflection_preferences cascade;
drop table if exists public.reflection_variants cascade;
drop table if exists public.pattern_matches cascade;
drop table if exists public.domain_results cascade;
drop table if exists public.observation_results cascade;
drop table if exists public.evidence_signal_results cascade;
drop table if exists public.raw_feature_measurements cascade;
drop table if exists public.sensor_captures cascade;
drop table if exists public.personal_baselines cascade;
drop table if exists public.user_narrative_preferences cascade;
drop table if exists public.scan_sessions cascade;
drop table if exists public.profiles cascade;

-- Previous canonical-result tables.
drop table if exists public.scan_story_preferences cascade;
drop table if exists public.scan_story_variants cascade;
drop table if exists public.scan_pattern_matches cascade;

-- Legacy application tables discovered in the hosted public schema.
drop table if exists public.session_chakra_results cascade;
drop table if exists public.session_tones_used cascade;
drop table if exists public.sessions cascade;
drop table if exists public.recommendations cascade;
drop table if exists public.user_feedback cascade;
drop table if exists public.user_tone_presets cascade;
drop table if exists public.chakra_tone_presets cascade;
drop table if exists public.chakras cascade;

-- Explicitly remove known legacy compatibility/report views if they exist.
drop view if exists public.scan_history cascade;
drop view if exists public.latest_scan_results cascade;
drop view if exists public.user_scan_history cascade;

-- -----------------------------------------------------------------------------
-- 3. Shared trigger and ownership functions.
-- -----------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'partial', 'failed')),
  expected_recording_count integer not null default 7
    check (expected_recording_count >= 0),
  valid_recording_count integer not null default 0
    check (valid_recording_count >= 0),
  invalid_recording_count integer not null default 0
    check (invalid_recording_count >= 0),
  completion_ratio numeric(6,5)
    check (completion_ratio is null or completion_ratio between 0 and 1),
  capture_quality text not null default 'poor'
    check (capture_quality in ('high', 'good', 'limited', 'poor')),
  result_confidence text not null default 'exploratory'
    check (result_confidence in ('high', 'moderate', 'exploratory')),
  retry_recommended boolean not null default false,
  engine_version text,
  observation_engine_version text,
  observation_pipeline jsonb,
  observation_pipeline_created_at timestamptz,
  raw_result jsonb,
  completeness_metadata jsonb not null default '{}'::jsonb,
  invalid_recording_reasons jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scan_sessions_recording_totals_check
    check (valid_recording_count + invalid_recording_count <= expected_recording_count),
  constraint scan_sessions_completed_at_check
    check (status in ('processing', 'failed') or completed_at is not null)
);

create function public.owns_scan(p_scan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.scan_sessions s
     where s.id = p_scan_id
       and s.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_scan(uuid) from public;
revoke all on function public.owns_scan(uuid) from anon;
grant execute on function public.owns_scan(uuid) to authenticated;

create function public.enforce_scan_child_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  scan_owner uuid;
begin
  select s.user_id
    into scan_owner
    from public.scan_sessions s
   where s.id = new.scan_id;

  if scan_owner is null then
    raise exception 'Referenced scan does not exist';
  end if;

  if new.user_id is distinct from scan_owner then
    raise exception 'Child row user_id must match scan owner';
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Normalized scan-owned records.
-- -----------------------------------------------------------------------------

create table public.sensor_captures (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sensor_type text not null,
  task_id text,
  attempt_number integer not null default 1 check (attempt_number > 0),
  status text not null check (status in ('valid', 'invalid', 'missing')),
  quality text not null check (quality in ('high', 'good', 'limited', 'poor')),
  recorded_at timestamptz,
  duration_seconds numeric check (duration_seconds is null or duration_seconds >= 0),
  invalid_reasons jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, sensor_type, task_id, attempt_number)
);

create table public.raw_feature_measurements (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid references public.sensor_captures(id) on delete cascade,
  feature_id text not null,
  sensor_type text not null,
  value double precision not null check (isfinite(value)),
  unit text,
  task_id text,
  extraction_version text not null,
  quality text not null check (quality in ('high', 'good', 'limited', 'poor')),
  source_capture_ids uuid[] not null default '{}'::uuid[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.evidence_signal_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_id text not null,
  label text not null,
  direction text not null
    check (direction in ('elevated', 'reduced', 'stable', 'mixed', 'unavailable')),
  strength numeric(6,5) not null check (strength between 0 and 1),
  capture_confidence text not null
    check (capture_confidence in ('high', 'moderate', 'exploratory')),
  evidence_confidence text not null
    check (evidence_confidence in ('high', 'moderate', 'exploratory')),
  validity_level text not null
    check (validity_level in ('supported', 'emerging', 'exploratory')),
  rule_version text not null,
  contributing_feature_ids uuid[] not null default '{}'::uuid[],
  source_capture_ids uuid[] not null default '{}'::uuid[],
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (scan_id, evidence_id, rule_version)
);

create table public.observation_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_id text not null,
  label text not null,
  summary text not null,
  direction text not null
    check (direction in ('elevated', 'reduced', 'stable', 'mixed', 'unavailable')),
  strength numeric(6,5) not null check (strength between 0 and 1),
  capture_confidence text not null
    check (capture_confidence in ('high', 'moderate', 'exploratory')),
  interpretation_confidence text not null
    check (interpretation_confidence in ('high', 'moderate', 'exploratory')),
  rule_version text not null,
  contributing_evidence_ids uuid[] not null default '{}'::uuid[],
  source_capture_ids uuid[] not null default '{}'::uuid[],
  alternatives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (scan_id, observation_id, rule_version)
);

create table public.domain_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id text not null,
  name text not null,
  score numeric(6,3) not null check (score between 0 and 100),
  state text not null
    check (state in ('available', 'balanced', 'working_hard', 'asking_for_support')),
  orientation text not null
    check (orientation in ('availability', 'demand', 'neutral')),
  interpretation_confidence text not null
    check (interpretation_confidence in ('high', 'moderate', 'exploratory')),
  rule_version text not null,
  contributing_observation_ids uuid[] not null default '{}'::uuid[],
  source_capture_ids uuid[] not null default '{}'::uuid[],
  user_facing_summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, domain_id, rule_version)
);

create table public.pattern_matches (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('primary', 'supporting', 'emerging')),
  pattern_id text not null,
  pattern_name text not null,
  pattern_theme text,
  explanation text not null,
  confidence numeric(6,5) check (confidence is null or confidence between 0 and 1),
  pattern_expression_id text,
  pattern_expression_title text,
  pattern_expression_summary text,
  modifiers jsonb not null default '[]'::jsonb,
  evidence_provenance jsonb not null default '[]'::jsonb,
  baseline_comparison jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, role)
);

create table public.reflection_variants (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  style text not null check (style in ('direct', 'supportive', 'insight')),
  title text not null,
  summary text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, style),
  unique (id, scan_id)
);

create table public.scan_reflection_preferences (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_variant_id uuid,
  selected_style text not null check (selected_style in ('direct', 'supportive', 'insight')),
  selected_title text not null,
  selected_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scan_reflection_preferences_variant_fk
    foreign key (selected_variant_id, scan_id)
    references public.reflection_variants(id, scan_id)
    on delete set null
);

create table public.user_narrative_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  direct_count integer not null default 0 check (direct_count >= 0),
  supportive_count integer not null default 0 check (supportive_count >= 0),
  insight_count integer not null default 0 check (insight_count >= 0),
  preferred_style text
    check (preferred_style is null or preferred_style in ('direct', 'supportive', 'insight')),
  total_selections integer not null default 0 check (total_selections >= 0),
  last_selected_style text
    check (last_selected_style is null or last_selected_style in ('direct', 'supportive', 'insight')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint narrative_preference_count_total_check
    check (direct_count + supportive_count + insight_count = total_selections)
);

create table public.personal_baselines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_id text not null,
  calculation_version text not null,
  baseline_score numeric(6,3) not null check (baseline_score between 0 and 100),
  scans_used integer not null check (scans_used > 0),
  source_scan_ids uuid[] not null default '{}'::uuid[],
  confidence text not null check (confidence in ('high', 'moderate', 'exploratory')),
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, domain_id, calculation_version)
);

-- -----------------------------------------------------------------------------
-- 5. Indexes.
-- -----------------------------------------------------------------------------

create index scan_sessions_user_created_at_idx
  on public.scan_sessions (user_id, created_at desc);
create index scan_sessions_user_status_idx
  on public.scan_sessions (user_id, status);
create index sensor_captures_scan_id_idx
  on public.sensor_captures (scan_id);
create index raw_feature_measurements_scan_id_idx
  on public.raw_feature_measurements (scan_id);
create index raw_feature_measurements_scan_feature_idx
  on public.raw_feature_measurements (scan_id, feature_id);
create index raw_feature_measurements_capture_idx
  on public.raw_feature_measurements (capture_id)
  where capture_id is not null;
create unique index raw_feature_measurements_capture_feature_unique_idx
  on public.raw_feature_measurements (capture_id, feature_id)
  where capture_id is not null;
create index evidence_signal_results_scan_id_idx
  on public.evidence_signal_results (scan_id);
create index observation_results_scan_id_idx
  on public.observation_results (scan_id);
create index domain_results_scan_id_idx
  on public.domain_results (scan_id);
create index domain_results_scan_domain_idx
  on public.domain_results (scan_id, domain_id);
create index pattern_matches_scan_role_idx
  on public.pattern_matches (scan_id, role);
create index reflection_variants_scan_style_idx
  on public.reflection_variants (scan_id, style);
create index scan_reflection_preferences_user_idx
  on public.scan_reflection_preferences (user_id);
create index personal_baselines_user_domain_idx
  on public.personal_baselines (user_id, domain_id);

-- -----------------------------------------------------------------------------
-- 6. Ownership and updated_at triggers.
-- -----------------------------------------------------------------------------

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger scan_sessions_set_updated_at
before update on public.scan_sessions
for each row execute function public.set_updated_at();

create trigger sensor_captures_set_updated_at
before update on public.sensor_captures
for each row execute function public.set_updated_at();

create trigger domain_results_set_updated_at
before update on public.domain_results
for each row execute function public.set_updated_at();

create trigger pattern_matches_set_updated_at
before update on public.pattern_matches
for each row execute function public.set_updated_at();

create trigger reflection_variants_set_updated_at
before update on public.reflection_variants
for each row execute function public.set_updated_at();

create trigger scan_reflection_preferences_set_updated_at
before update on public.scan_reflection_preferences
for each row execute function public.set_updated_at();

create trigger user_narrative_preferences_set_updated_at
before update on public.user_narrative_preferences
for each row execute function public.set_updated_at();

create trigger personal_baselines_set_updated_at
before update on public.personal_baselines
for each row execute function public.set_updated_at();

create trigger sensor_captures_enforce_owner
before insert or update on public.sensor_captures
for each row execute function public.enforce_scan_child_owner();
create trigger raw_feature_measurements_enforce_owner
before insert or update on public.raw_feature_measurements
for each row execute function public.enforce_scan_child_owner();
create trigger evidence_signal_results_enforce_owner
before insert or update on public.evidence_signal_results
for each row execute function public.enforce_scan_child_owner();
create trigger observation_results_enforce_owner
before insert or update on public.observation_results
for each row execute function public.enforce_scan_child_owner();
create trigger domain_results_enforce_owner
before insert or update on public.domain_results
for each row execute function public.enforce_scan_child_owner();
create trigger pattern_matches_enforce_owner
before insert or update on public.pattern_matches
for each row execute function public.enforce_scan_child_owner();
create trigger reflection_variants_enforce_owner
before insert or update on public.reflection_variants
for each row execute function public.enforce_scan_child_owner();
create trigger scan_reflection_preferences_enforce_owner
before insert or update on public.scan_reflection_preferences
for each row execute function public.enforce_scan_child_owner();

-- -----------------------------------------------------------------------------
-- 7. Row-level security.
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.scan_sessions enable row level security;
alter table public.sensor_captures enable row level security;
alter table public.raw_feature_measurements enable row level security;
alter table public.evidence_signal_results enable row level security;
alter table public.observation_results enable row level security;
alter table public.domain_results enable row level security;
alter table public.pattern_matches enable row level security;
alter table public.reflection_variants enable row level security;
alter table public.scan_reflection_preferences enable row level security;
alter table public.user_narrative_preferences enable row level security;
alter table public.personal_baselines enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles
for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_delete_own on public.profiles
for delete to authenticated using (user_id = auth.uid());

create policy scan_sessions_select_own on public.scan_sessions
for select to authenticated using (user_id = auth.uid());
create policy scan_sessions_insert_own on public.scan_sessions
for insert to authenticated with check (user_id = auth.uid());
create policy scan_sessions_update_own on public.scan_sessions
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy scan_sessions_delete_own on public.scan_sessions
for delete to authenticated using (user_id = auth.uid());

-- Child-table policies validate both the row user_id and the parent scan owner.
create policy sensor_captures_select_own on public.sensor_captures
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy sensor_captures_insert_own on public.sensor_captures
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy sensor_captures_update_own on public.sensor_captures
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy sensor_captures_delete_own on public.sensor_captures
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy raw_features_select_own on public.raw_feature_measurements
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy raw_features_insert_own on public.raw_feature_measurements
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy raw_features_update_own on public.raw_feature_measurements
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy raw_features_delete_own on public.raw_feature_measurements
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy evidence_signals_select_own on public.evidence_signal_results
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy evidence_signals_insert_own on public.evidence_signal_results
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy evidence_signals_update_own on public.evidence_signal_results
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy evidence_signals_delete_own on public.evidence_signal_results
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy observations_select_own on public.observation_results
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy observations_insert_own on public.observation_results
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy observations_update_own on public.observation_results
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy observations_delete_own on public.observation_results
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy domains_select_own on public.domain_results
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy domains_insert_own on public.domain_results
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy domains_update_own on public.domain_results
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy domains_delete_own on public.domain_results
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy patterns_select_own on public.pattern_matches
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy patterns_insert_own on public.pattern_matches
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy patterns_update_own on public.pattern_matches
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy patterns_delete_own on public.pattern_matches
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy reflections_select_own on public.reflection_variants
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy reflections_insert_own on public.reflection_variants
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy reflections_update_own on public.reflection_variants
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy reflections_delete_own on public.reflection_variants
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy scan_preferences_select_own on public.scan_reflection_preferences
for select to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));
create policy scan_preferences_insert_own on public.scan_reflection_preferences
for insert to authenticated with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy scan_preferences_update_own on public.scan_reflection_preferences
for update to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id))
with check (user_id = auth.uid() and public.owns_scan(scan_id));
create policy scan_preferences_delete_own on public.scan_reflection_preferences
for delete to authenticated using (user_id = auth.uid() and public.owns_scan(scan_id));

create policy narrative_preferences_select_own on public.user_narrative_preferences
for select to authenticated using (user_id = auth.uid());
create policy narrative_preferences_insert_own on public.user_narrative_preferences
for insert to authenticated with check (user_id = auth.uid());
create policy narrative_preferences_update_own on public.user_narrative_preferences
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy narrative_preferences_delete_own on public.user_narrative_preferences
for delete to authenticated using (user_id = auth.uid());

create policy personal_baselines_select_own on public.personal_baselines
for select to authenticated using (user_id = auth.uid());
create policy personal_baselines_insert_own on public.personal_baselines
for insert to authenticated with check (user_id = auth.uid());
create policy personal_baselines_update_own on public.personal_baselines
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy personal_baselines_delete_own on public.personal_baselines
for delete to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. Secured reflection-preference RPC.
-- -----------------------------------------------------------------------------

create function public.set_scan_reflection_preference(
  p_scan_id uuid,
  p_user_id uuid,
  p_selected_style text,
  p_selected_title text,
  p_selected_summary text
)
returns public.user_narrative_preferences
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  authenticated_user uuid := auth.uid();
  normalized_style text := lower(trim(p_selected_style));
  scan_owner uuid;
  variant_id uuid;
  previous_style text;
  direct_value integer;
  supportive_value integer;
  insight_value integer;
  total_value integer;
  preferred_value text;
  result_row public.user_narrative_preferences;
begin
  if authenticated_user is null
     or p_user_id is distinct from authenticated_user then
    raise exception 'Not authorized';
  end if;

  select s.user_id
    into scan_owner
    from public.scan_sessions s
   where s.id = p_scan_id;

  if scan_owner is null or scan_owner is distinct from authenticated_user then
    raise exception 'Not authorized';
  end if;

  if normalized_style not in ('direct', 'supportive', 'insight') then
    raise exception 'Invalid reflection style';
  end if;

  select rv.id
    into variant_id
    from public.reflection_variants rv
   where rv.scan_id = p_scan_id
     and rv.user_id = authenticated_user
     and rv.style = normalized_style;

  if variant_id is null then
    raise exception 'Selected reflection variant does not exist';
  end if;

  select srp.selected_style
    into previous_style
    from public.scan_reflection_preferences srp
   where srp.scan_id = p_scan_id
     and srp.user_id = authenticated_user
   for update;

  insert into public.scan_reflection_preferences (
    scan_id,
    user_id,
    selected_variant_id,
    selected_style,
    selected_title,
    selected_summary
  ) values (
    p_scan_id,
    authenticated_user,
    variant_id,
    normalized_style,
    p_selected_title,
    p_selected_summary
  )
  on conflict (scan_id) do update set
    selected_variant_id = excluded.selected_variant_id,
    selected_style = excluded.selected_style,
    selected_title = excluded.selected_title,
    selected_summary = excluded.selected_summary,
    updated_at = now()
  where public.scan_reflection_preferences.user_id = authenticated_user;

  insert into public.user_narrative_preferences (user_id)
  values (authenticated_user)
  on conflict (user_id) do nothing;

  select unp.direct_count,
         unp.supportive_count,
         unp.insight_count,
         unp.total_selections
    into direct_value,
         supportive_value,
         insight_value,
         total_value
    from public.user_narrative_preferences unp
   where unp.user_id = authenticated_user
   for update;

  if previous_style is null then
    direct_value := direct_value + case when normalized_style = 'direct' then 1 else 0 end;
    supportive_value := supportive_value + case when normalized_style = 'supportive' then 1 else 0 end;
    insight_value := insight_value + case when normalized_style = 'insight' then 1 else 0 end;
    total_value := total_value + 1;
  elsif previous_style <> normalized_style then
    direct_value := greatest(0, direct_value - case when previous_style = 'direct' then 1 else 0 end)
                    + case when normalized_style = 'direct' then 1 else 0 end;
    supportive_value := greatest(0, supportive_value - case when previous_style = 'supportive' then 1 else 0 end)
                        + case when normalized_style = 'supportive' then 1 else 0 end;
    insight_value := greatest(0, insight_value - case when previous_style = 'insight' then 1 else 0 end)
                     + case when normalized_style = 'insight' then 1 else 0 end;
  end if;

  preferred_value := null;
  if total_value >= 3 then
    if direct_value > supportive_value and direct_value > insight_value then
      preferred_value := 'direct';
    elsif supportive_value > direct_value and supportive_value > insight_value then
      preferred_value := 'supportive';
    elsif insight_value > direct_value and insight_value > supportive_value then
      preferred_value := 'insight';
    end if;
  end if;

  update public.user_narrative_preferences
     set direct_count = direct_value,
         supportive_count = supportive_value,
         insight_count = insight_value,
         total_selections = total_value,
         preferred_style = preferred_value,
         last_selected_style = normalized_style,
         updated_at = now()
   where user_id = authenticated_user
   returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.set_scan_reflection_preference(uuid, uuid, text, text, text) from public;
revoke all on function public.set_scan_reflection_preference(uuid, uuid, text, text, text) from anon;
grant execute on function public.set_scan_reflection_preference(uuid, uuid, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Explicit grants. RLS remains the authorization boundary.
-- -----------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.scan_sessions to authenticated;
grant select, insert, update, delete on table public.sensor_captures to authenticated;
grant select, insert, update, delete on table public.raw_feature_measurements to authenticated;
grant select, insert, update, delete on table public.evidence_signal_results to authenticated;
grant select, insert, update, delete on table public.observation_results to authenticated;
grant select, insert, update, delete on table public.domain_results to authenticated;
grant select, insert, update, delete on table public.pattern_matches to authenticated;
grant select, insert, update, delete on table public.reflection_variants to authenticated;
grant select, insert, update, delete on table public.scan_reflection_preferences to authenticated;
grant select, insert, update, delete on table public.user_narrative_preferences to authenticated;
grant select, insert, update, delete on table public.personal_baselines to authenticated;

-- -----------------------------------------------------------------------------
-- 10. Read-only compatibility view for legacy scan reads.
--     This is not a second writable scan source.
-- -----------------------------------------------------------------------------

create view public.scans
with (security_invoker = true)
as
select
  s.id,
  s.user_id,
  s.raw_result as result,
  s.status,
  s.expected_recording_count,
  s.valid_recording_count,
  s.invalid_recording_count,
  s.capture_quality as quality_level,
  s.retry_recommended,
  s.observation_engine_version,
  s.observation_pipeline,
  s.observation_pipeline_created_at,
  s.created_at,
  s.updated_at
from public.scan_sessions s;

comment on view public.scans is
  'Read-only compatibility view. public.scan_sessions is the only canonical writable scan source.';

revoke all on table public.scans from public;
revoke all on table public.scans from anon;
revoke insert, update, delete, truncate, references, trigger on table public.scans from authenticated;
grant select on table public.scans to authenticated;

-- -----------------------------------------------------------------------------
-- 11. Object documentation.
-- -----------------------------------------------------------------------------

comment on table public.scan_sessions is
  'Canonical SoulScope scan record. All scan-owned V2 records cascade from this table.';
comment on table public.sensor_captures is
  'Per-task sensor captures and capture-quality decisions.';
comment on table public.raw_feature_measurements is
  'Versioned raw measurements produced directly from usable sensor captures.';
comment on table public.evidence_signal_results is
  'Versioned, non-diagnostic evidence signals derived from raw measurements.';
comment on table public.observation_results is
  'Cautious observations derived from agreeing evidence signals.';
comment on table public.domain_results is
  'User-facing domain results with explicit score orientation and traceability.';
comment on table public.pattern_matches is
  'Primary, supporting, and emerging current-state pattern matches.';
comment on table public.reflection_variants is
  'Direct, supportive, and insight renderings of one canonical scan result.';
comment on table public.scan_reflection_preferences is
  'One selected reflection style per scan.';
comment on table public.user_narrative_preferences is
  'Per-user aggregate reflection-style preference counts.';
comment on table public.personal_baselines is
  'Versioned personal domain baselines calculated from eligible prior scans.';

commit;
