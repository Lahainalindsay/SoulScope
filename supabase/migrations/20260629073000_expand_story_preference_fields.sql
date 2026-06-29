alter table public.scan_story_variants
  drop constraint if exists scan_story_variants_style_check;

alter table public.scan_story_variants
  add constraint scan_story_variants_style_check
  check (style in ('Direct', 'Supportive', 'Insight', 'Grounded/Actionable'));

alter table public.scan_story_preferences
  drop constraint if exists scan_story_preferences_selected_style_check;

alter table public.scan_story_preferences
  add constraint scan_story_preferences_selected_style_check
  check (selected_style in ('Direct', 'Supportive', 'Insight', 'Grounded/Actionable'));

alter table public.scan_story_preferences
  add column if not exists selected_primary_pattern text,
  add column if not exists selected_at timestamptz default now();
