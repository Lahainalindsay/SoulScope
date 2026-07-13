alter table public.scans
  add column if not exists status text not null default 'completed'
    check (status in ('completed', 'partial', 'failed')),
  add column if not exists expected_recording_count integer,
  add column if not exists valid_recording_count integer,
  add column if not exists invalid_recording_count integer,
  add column if not exists quality_level text
    check (quality_level in ('high', 'good', 'limited')),
  add column if not exists retry_recommended boolean not null default false;

create index if not exists scans_user_status_created_at_idx
  on public.scans (user_id, status, created_at desc);
