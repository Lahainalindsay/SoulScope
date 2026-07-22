alter table public.scan_subjects
  add column if not exists name text,
  add column if not exists subject_type text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists identity_metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scan_subjects'
      and column_name = 'display_name'
  ) then
    update public.scan_subjects
       set name = coalesce(name, display_name)
     where name is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scan_subjects'
      and column_name = 'subject_kind'
  ) then
    update public.scan_subjects
       set subject_type = coalesce(subject_type, subject_kind)
     where subject_type is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scan_subjects'
      and column_name = 'identity_confidence'
  ) then
    update public.scan_subjects
       set identity_metadata = coalesce(identity_metadata, '{}'::jsonb)
         || jsonb_build_object('identityConfidence', identity_confidence)
     where identity_confidence is not null
       and not coalesce(identity_metadata, '{}'::jsonb) ? 'identityConfidence';
  end if;
end $$;

update public.scan_subjects
   set subject_type = 'primary'
 where subject_type is null;

update public.scan_subjects
   set name = 'Unnamed subject'
 where name is null;

alter table public.scan_subjects
  alter column name set not null,
  alter column subject_type set not null,
  alter column subject_type set default 'primary';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.scan_subjects'::regclass
      and conname = 'scan_subjects_subject_type_check'
  ) then
    alter table public.scan_subjects
      add constraint scan_subjects_subject_type_check
      check (subject_type in ('primary', 'secondary', 'guest', 'unidentified'));
  end if;
end $$;

create index if not exists scan_subjects_user_id_idx on public.scan_subjects(user_id);
create unique index if not exists scan_subjects_one_primary_per_user_idx
  on public.scan_subjects(user_id) where is_primary;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scan_interpretation_diagnostics'
      and column_name = 'interpretation_limits'
      and data_type = 'ARRAY'
  ) then
    alter table public.scan_interpretation_diagnostics
      alter column interpretation_limits drop default,
      alter column interpretation_limits type jsonb using to_jsonb(interpretation_limits),
      alter column interpretation_limits set default '[]'::jsonb;
  end if;
end $$;
