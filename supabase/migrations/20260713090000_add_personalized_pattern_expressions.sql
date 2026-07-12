alter table public.scan_pattern_matches
  add column if not exists pattern_expression_id text,
  add column if not exists pattern_expression_title text,
  add column if not exists pattern_expression_summary text,
  add column if not exists modifiers jsonb not null default '[]'::jsonb,
  add column if not exists expression_evidence jsonb not null default '[]'::jsonb,
  add column if not exists baseline_comparison jsonb;

create table if not exists public.user_narrative_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  direct_count integer not null default 0 check (direct_count >= 0),
  supportive_count integer not null default 0 check (supportive_count >= 0),
  insight_count integer not null default 0 check (insight_count >= 0),
  preferred_style text check (preferred_style in ('Direct', 'Supportive', 'Insight')),
  total_selections integer not null default 0 check (total_selections >= 0),
  last_selected_style text check (last_selected_style in ('Direct', 'Supportive', 'Insight')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_narrative_preferences enable row level security;

drop policy if exists "Users can read their own narrative preference" on public.user_narrative_preferences;
create policy "Users can read their own narrative preference"
  on public.user_narrative_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own narrative preference" on public.user_narrative_preferences;
create policy "Users can create their own narrative preference"
  on public.user_narrative_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own narrative preference" on public.user_narrative_preferences;
create policy "Users can update their own narrative preference"
  on public.user_narrative_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_scan_story_preference(
  p_scan_id uuid,
  p_user_id uuid,
  p_selected_style text,
  p_selected_title text,
  p_selected_summary text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous_style text;
  v_direct integer;
  v_supportive integer;
  v_insight integer;
  v_total integer;
  v_preferred text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_selected_style not in ('Direct', 'Supportive', 'Insight') then
    raise exception 'Invalid narrative style';
  end if;

  select selected_style
    into v_previous_style
  from public.scan_story_preferences
  where scan_id = p_scan_id and user_id = p_user_id
  for update;

  insert into public.scan_story_preferences (
    scan_id,
    user_id,
    selected_style,
    selected_title,
    selected_summary,
    updated_at
  ) values (
    p_scan_id,
    p_user_id,
    p_selected_style,
    p_selected_title,
    p_selected_summary,
    now()
  )
  on conflict (scan_id) do update set
    selected_style = excluded.selected_style,
    selected_title = excluded.selected_title,
    selected_summary = excluded.selected_summary,
    updated_at = now()
  where public.scan_story_preferences.user_id = p_user_id;

  insert into public.user_narrative_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if v_previous_style is distinct from p_selected_style then
    update public.user_narrative_preferences
    set
      direct_count = greatest(0, direct_count
        + case when p_selected_style = 'Direct' then 1 else 0 end
        - case when v_previous_style = 'Direct' then 1 else 0 end),
      supportive_count = greatest(0, supportive_count
        + case when p_selected_style = 'Supportive' then 1 else 0 end
        - case when v_previous_style = 'Supportive' then 1 else 0 end),
      insight_count = greatest(0, insight_count
        + case when p_selected_style = 'Insight' then 1 else 0 end
        - case when v_previous_style = 'Insight' then 1 else 0 end),
      total_selections = total_selections + case when v_previous_style is null then 1 else 0 end,
      last_selected_style = p_selected_style,
      updated_at = now()
    where user_id = p_user_id;
  else
    update public.user_narrative_preferences
    set last_selected_style = p_selected_style, updated_at = now()
    where user_id = p_user_id;
  end if;

  select direct_count, supportive_count, insight_count, total_selections
    into v_direct, v_supportive, v_insight, v_total
  from public.user_narrative_preferences
  where user_id = p_user_id;

  if v_total < 3 then
    v_preferred := null;
  elsif v_direct > v_supportive and v_direct > v_insight then
    v_preferred := 'Direct';
  elsif v_supportive > v_direct and v_supportive > v_insight then
    v_preferred := 'Supportive';
  elsif v_insight > v_direct and v_insight > v_supportive then
    v_preferred := 'Insight';
  else
    v_preferred := null;
  end if;

  update public.user_narrative_preferences
  set preferred_style = v_preferred, updated_at = now()
  where user_id = p_user_id;
end;
$$;

grant execute on function public.set_scan_story_preference(uuid, uuid, text, text, text) to authenticated;
