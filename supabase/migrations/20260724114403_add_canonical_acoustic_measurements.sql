-- Canonical acoustic measurement layer.
-- Additive only: existing scan, feature, evidence, observation, domain, pattern
-- and reflection tables remain unchanged.

create table if not exists public.voice_audio_captures (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sensor_capture_id uuid references public.sensor_captures(id) on delete set null,
  source_capture_id text not null,
  capture_kind text not null check (capture_kind in (
    'sustained_vowel',
    'guided_speech',
    'neutral_baseline',
    'challenge_response',
    'recovery_response'
  )),
  prompt_id text not null default '',
  storage_provider text not null default 'server_private',
  storage_bucket text,
  storage_path text,
  original_content_type text,
  canonical_format text not null default 'mono PCM WAV, 16000 Hz',
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  sample_rate_hz integer check (sample_rate_hz is null or sample_rate_hz > 0),
  channel_count integer check (channel_count is null or channel_count > 0),
  retention_policy text not null,
  retention_delete_after timestamptz,
  status text not null default 'processed' check (status in ('uploaded', 'processing', 'processed', 'failed', 'deleted')),
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, source_capture_id)
);

create table if not exists public.acoustic_feature_measurements (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scan_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  voice_audio_capture_id uuid references public.voice_audio_captures(id) on delete cascade,
  source_capture_id text not null,
  capture_kind text not null check (capture_kind in (
    'sustained_vowel',
    'guided_speech',
    'neutral_baseline',
    'challenge_response',
    'recovery_response'
  )),
  feature_id text not null,
  feature_version text not null,
  value double precision,
  unit text,
  method text not null,
  segment_start_ms integer not null check (segment_start_ms >= 0),
  segment_end_ms integer not null check (segment_end_ms >= segment_start_ms),
  quality text not null check (quality in ('high', 'good', 'limited', 'poor')),
  confidence numeric(6,5) not null check (confidence between 0 and 1),
  rejection_reason text,
  extractor text not null,
  extractor_version text not null,
  parameters jsonb not null default '{}'::jsonb,
  device_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    value is null
    or value not in ('Infinity'::double precision, '-Infinity'::double precision, 'NaN'::double precision)
  ),
  check (
    (value is not null and rejection_reason is null)
    or (value is null and rejection_reason is not null)
  ),
  unique (scan_id, source_capture_id, feature_id, feature_version, segment_start_ms, segment_end_ms)
);

create table if not exists public.personal_acoustic_baselines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_id text not null,
  feature_version text not null,
  capture_kind text not null check (capture_kind in (
    'sustained_vowel',
    'guided_speech',
    'neutral_baseline',
    'challenge_response',
    'recovery_response'
  )),
  prompt_id text not null default '',
  baseline_window text not null check (baseline_window in ('7_day', '30_day', 'stable')),
  calculation_version text not null,
  status text not null check (status in ('not_established', 'provisional', 'established')),
  scans_used integer not null default 0 check (scans_used >= 0),
  measurements_used integer not null default 0 check (measurements_used >= 0),
  measurements_rejected integer not null default 0 check (measurements_rejected >= 0),
  source_scan_ids uuid[] not null default '{}'::uuid[],
  center_value double precision,
  dispersion_value double precision,
  iqr double precision,
  current_value double precision,
  current_deviation double precision,
  current_robust_z double precision,
  confidence numeric(6,5) not null default 0 check (confidence between 0 and 1),
  unit text,
  metadata jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.voice_audio_captures enable row level security;
alter table public.acoustic_feature_measurements enable row level security;
alter table public.personal_acoustic_baselines enable row level security;

create policy voice_audio_captures_select_own
  on public.voice_audio_captures for select
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy voice_audio_captures_insert_own
  on public.voice_audio_captures for insert
  to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy voice_audio_captures_update_own
  on public.voice_audio_captures for update
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy voice_audio_captures_delete_own
  on public.voice_audio_captures for delete
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));

create policy acoustic_feature_measurements_select_own
  on public.acoustic_feature_measurements for select
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy acoustic_feature_measurements_insert_own
  on public.acoustic_feature_measurements for insert
  to authenticated
  with check ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy acoustic_feature_measurements_update_own
  on public.acoustic_feature_measurements for update
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));
create policy acoustic_feature_measurements_delete_own
  on public.acoustic_feature_measurements for delete
  to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.scan_sessions s where s.id = scan_id and s.user_id = (select auth.uid())));

create policy personal_acoustic_baselines_select_own
  on public.personal_acoustic_baselines for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy personal_acoustic_baselines_insert_own
  on public.personal_acoustic_baselines for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy personal_acoustic_baselines_update_own
  on public.personal_acoustic_baselines for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy personal_acoustic_baselines_delete_own
  on public.personal_acoustic_baselines for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists voice_audio_captures_scan_idx
  on public.voice_audio_captures (scan_id);
create index if not exists voice_audio_captures_user_created_idx
  on public.voice_audio_captures (user_id, created_at desc);
create index if not exists acoustic_feature_measurements_scan_idx
  on public.acoustic_feature_measurements (scan_id);
create index if not exists acoustic_feature_measurements_user_feature_idx
  on public.acoustic_feature_measurements (user_id, feature_id, capture_kind, created_at desc);
create index if not exists personal_acoustic_baselines_user_feature_idx
  on public.personal_acoustic_baselines (user_id, feature_id, capture_kind, baseline_window);
create unique index if not exists personal_acoustic_baselines_unique_idx
  on public.personal_acoustic_baselines (user_id, feature_id, feature_version, capture_kind, prompt_id, baseline_window, calculation_version);

create trigger voice_audio_captures_set_updated_at
before update on public.voice_audio_captures
for each row execute function public.set_updated_at();

create trigger personal_acoustic_baselines_set_updated_at
before update on public.personal_acoustic_baselines
for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.voice_audio_captures to authenticated;
grant select, insert, update, delete on table public.acoustic_feature_measurements to authenticated;
grant select, insert, update, delete on table public.personal_acoustic_baselines to authenticated;

comment on table public.voice_audio_captures is
  'Private metadata for original/canonical audio retained only for processing, retry and audit policy; no public audio URLs.';
comment on table public.acoustic_feature_measurements is
  'Versioned null-capable canonical acoustic measurements with extractor provenance and quality metadata.';
comment on table public.personal_acoustic_baselines is
  'Feature-specific capture-kind-specific robust acoustic baselines for 7-day, 30-day and stable windows.';
