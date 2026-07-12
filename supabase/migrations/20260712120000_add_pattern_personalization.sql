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
  on public.user_narrative_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own narrative preference" on public.user_narrative_preferences;
create policy "Users can create their own narrative preference"
  on public.user_narrative_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own narrative preference" on public.user_narrative_preferences;
create policy "Users can update their own narrative preference"
  on public.user_narrative_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_scan_story_preference(
  p_scan_id uuid,
  p_user_id uuid,
  p_selected_style text,
  p_selected_title text,
  p_selected_summary text
)
returns public.user_narrative_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_style text;
  direct_value integer;
  supportive_value integer;
  insight_value integer;
  total_value integer;
  preferred_value text;
  result_row public.user_narrative_preferences;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_selected_style not in ('Direct', 'Supportive', 'Insight') then
    raise exception 'Invalid story style';
  end if;

  select selected_style into previous_style
  from public.scan_story_preferences
  where scan_id = p_scan_id and user_id = p_user_id
  for update;

  insert into public.scan_story_preferences (
    scan_id, user_id, selected_style, selected_title, selected_summary, updated_at
  ) values (
    p_scan_id, p_user_id, p_selected_style, p_selected_title, p_selected_summary, now()
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

  if previous_style is null then
    update public.user_narrative_preferences set
      direct_count = direct_count + case when p_selected_style = 'Direct' then 1 else 0 end,
      supportive_count = supportive_count + case when p_selected_style = 'Supportive' then 1 else 0 end,
      insight_count = insight_count + case when p_selected_style = 'Insight' then 1 else 0 end,
      total_selections = total_selections + 1,
      last_selected_style = p_selected_style,
      updated_at = now()
    where user_id = p_user_id;
  elsif previous_style <> p_selected_style then
    update public.user_narrative_preferences set
      direct_count = greatest(0, direct_count - case when previous_style = 'Direct' then 1 else 0 end) + case when p_selected_style = 'Direct' then 1 else 0 end,
      supportive_count = greatest(0, supportive_count - case when previous_style = 'Supportive' then 1 else 0 end) + case when p_selected_style = 'Supportive' then 1 else 0 end,
      insight_count = greatest(0, insight_count - case when previous_style = 'Insight' then 1 else 0 end) + case when p_selected_style = 'Insight' then 1 else 0 end,
      last_selected_style = p_selected_style,
      updated_at = now()
    where user_id = p_user_id;
  else
    update public.user_narrative_preferences set
      last_selected_style = p_selected_style,
      updated_at = now()
    where user_id = p_user_id;
  end if;

  select direct_count, supportive_count, insight_count, total_selections
  into direct_value, supportive_value, insight_value, total_value
  from public.user_narrative_preferences
  where user_id = p_user_id
  for update;

  preferred_value := null;
  if total_value >= 3 then
    if direct_value > supportive_value and direct_value > insight_value then preferred_value := 'Direct';
    elsif supportive_value > direct_value and supportive_value > insight_value then preferred_value := 'Supportive';
    elsif insight_value > direct_value and insight_value > supportive_value then preferred_value := 'Insight';
    end if;
  end if;

  update public.user_narrative_preferences set
    preferred_style = preferred_value,
    updated_at = now()
  where user_id = p_user_id
  returning * into result_row;

  return result_row;
end;
$$;

grant execute on function public.set_scan_story_preference(uuid, uuid, text, text, text) to authenticated;
