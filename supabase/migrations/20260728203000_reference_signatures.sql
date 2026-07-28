create table if not exists public.reference_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid null references public.scan_subjects(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'retired')),
  prompt_id text not null default 'reference_self_intro',
  prompt_text text not null,
  duration_ms integer not null check (duration_ms > 0),
  signature jsonb not null default '{}'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  engine_version text not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz null
);

create unique index if not exists reference_signatures_one_active_per_user
  on public.reference_signatures(user_id)
  where status = 'active';

create index if not exists reference_signatures_user_created_idx
  on public.reference_signatures(user_id, created_at desc);

alter table public.reference_signatures enable row level security;

drop policy if exists "Users can read their own reference signatures" on public.reference_signatures;
create policy "Users can read their own reference signatures"
  on public.reference_signatures for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own reference signatures" on public.reference_signatures;
create policy "Users can create their own reference signatures"
  on public.reference_signatures for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reference signatures" on public.reference_signatures;
create policy "Users can update their own reference signatures"
  on public.reference_signatures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.reference_signatures is
  'Versioned calibration signatures used internally for speaker continuity and personalized measurement. They are not report labels.';
