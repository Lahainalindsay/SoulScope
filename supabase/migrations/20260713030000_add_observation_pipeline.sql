alter table public.scans
  add column if not exists observation_engine_version text,
  add column if not exists observation_pipeline jsonb,
  add column if not exists observation_pipeline_created_at timestamptz;

comment on column public.scans.observation_engine_version is
  'Version of the deterministic SoulScope observation pipeline used for this scan.';
comment on column public.scans.observation_pipeline is
  'Traceable raw-feature, evidence, observation, and domain output for the scan.';
comment on column public.scans.observation_pipeline_created_at is
  'Timestamp when the observation pipeline output was generated.';
