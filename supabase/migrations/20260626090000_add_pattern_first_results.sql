create table if not exists public.scan_pattern_matches (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('primary', 'supporting', 'emerging')),
  pattern_id text not null,
  pattern_name text not null,
  pattern_theme text not null,
  explanation text not null,
  what_this_may_feel_like text[] not null default '{}'::text[],
  supportive_factors text[] not null default '{}'::text[],
  what_is_working_hardest text[] not null default '{}'::text[],
  what_needs_attention text not null,
  confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (scan_id, role)
);

create index if not exists scan_pattern_matches_user_id_scan_id_idx
  on public.scan_pattern_matches (user_id, scan_id);

create table if not exists public.scan_story_variants (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  style text not null check (style in ('Direct', 'Supportive', 'Insight')),
  title text not null,
  summary text not null,
  strongest_resources text[] not null default '{}'::text[],
  areas_working_hard text[] not null default '{}'::text[],
  areas_asking_for_support text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  unique (scan_id, style)
);

create index if not exists scan_story_variants_user_id_scan_id_idx
  on public.scan_story_variants (user_id, scan_id);

create table if not exists public.scan_story_preferences (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_style text not null check (selected_style in ('Direct', 'Supportive', 'Insight')),
  selected_title text not null,
  selected_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_story_preferences_user_id_idx
  on public.scan_story_preferences (user_id);

alter table public.scan_pattern_matches enable row level security;
alter table public.scan_story_variants enable row level security;
alter table public.scan_story_preferences enable row level security;

drop policy if exists "Users can read their own scan pattern matches" on public.scan_pattern_matches;
create policy "Users can read their own scan pattern matches"
  on public.scan_pattern_matches
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own scan pattern matches" on public.scan_pattern_matches;
create policy "Users can create their own scan pattern matches"
  on public.scan_pattern_matches
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scan pattern matches" on public.scan_pattern_matches;
create policy "Users can update their own scan pattern matches"
  on public.scan_pattern_matches
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scan pattern matches" on public.scan_pattern_matches;
create policy "Users can delete their own scan pattern matches"
  on public.scan_pattern_matches
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own story variants" on public.scan_story_variants;
create policy "Users can read their own story variants"
  on public.scan_story_variants
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own story variants" on public.scan_story_variants;
create policy "Users can create their own story variants"
  on public.scan_story_variants
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own story variants" on public.scan_story_variants;
create policy "Users can update their own story variants"
  on public.scan_story_variants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own story variants" on public.scan_story_variants;
create policy "Users can delete their own story variants"
  on public.scan_story_variants
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own story preferences" on public.scan_story_preferences;
create policy "Users can read their own story preferences"
  on public.scan_story_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own story preferences" on public.scan_story_preferences;
create policy "Users can create their own story preferences"
  on public.scan_story_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own story preferences" on public.scan_story_preferences;
create policy "Users can update their own story preferences"
  on public.scan_story_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own story preferences" on public.scan_story_preferences;
create policy "Users can delete their own story preferences"
  on public.scan_story_preferences
  for delete
  using (auth.uid() = user_id);
