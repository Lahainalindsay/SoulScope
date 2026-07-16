begin;

create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null,
  emotions text[] not null default '{}'::text[],
  note text,
  linked_scan_id uuid references public.scan_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_check_ins_user_date_key unique (user_id, check_in_date),
  constraint daily_check_ins_emotion_count_check check (cardinality(emotions) <= 3),
  constraint daily_check_ins_emotion_vocabulary_check check (
    emotions <@ array[
      'Calm','Focused','Hopeful','Energized','Connected','Grounded',
      'Restless','Uncertain','Tense','Distracted','Sensitive','Pressured',
      'Overwhelmed','Drained','Low','Frustrated','Disconnected','Exhausted'
    ]::text[]
  ),
  constraint daily_check_ins_note_length_check check (note is null or char_length(note) <= 2000)
);

create index if not exists daily_check_ins_user_date_idx
  on public.daily_check_ins (user_id, check_in_date desc);
create index if not exists daily_check_ins_linked_scan_idx
  on public.daily_check_ins (linked_scan_id)
  where linked_scan_id is not null;

alter table public.daily_check_ins enable row level security;

drop policy if exists daily_check_ins_select_own on public.daily_check_ins;
create policy daily_check_ins_select_own on public.daily_check_ins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists daily_check_ins_insert_own on public.daily_check_ins;
create policy daily_check_ins_insert_own on public.daily_check_ins
  for insert to authenticated with check (
    user_id = auth.uid()
    and (linked_scan_id is null or public.owns_scan(linked_scan_id))
  );

drop policy if exists daily_check_ins_update_own on public.daily_check_ins;
create policy daily_check_ins_update_own on public.daily_check_ins
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (linked_scan_id is null or public.owns_scan(linked_scan_id))
  );

drop policy if exists daily_check_ins_delete_own on public.daily_check_ins;
create policy daily_check_ins_delete_own on public.daily_check_ins
  for delete to authenticated using (user_id = auth.uid());

drop trigger if exists daily_check_ins_set_updated_at on public.daily_check_ins;
create trigger daily_check_ins_set_updated_at
before update on public.daily_check_ins
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.daily_check_ins to authenticated;
revoke all on public.daily_check_ins from anon;

commit;
