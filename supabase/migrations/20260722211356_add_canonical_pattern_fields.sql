alter table public.scan_interpretation_diagnostics
  add column if not exists canonical_pattern_signature text,
  add column if not exists canonical_display_name text,
  add column if not exists canonical_family text,
  add column if not exists primary_family text,
  add column if not exists secondary_family text,
  add column if not exists confidence_margin double precision check (confidence_margin is null or (confidence_margin >= 0 and confidence_margin <= 1)),
  add column if not exists reflection_source jsonb;

update public.scan_interpretation_diagnostics
set
  canonical_pattern_signature = coalesce(canonical_pattern_signature, pattern_signature),
  canonical_display_name = coalesce(canonical_display_name, display_name),
  canonical_family = coalesce(canonical_family, family),
  primary_family = coalesce(primary_family, family)
where
  canonical_pattern_signature is null
  or canonical_display_name is null
  or canonical_family is null
  or primary_family is null;

create index if not exists scan_interpretation_diagnostics_canonical_family_idx
  on public.scan_interpretation_diagnostics (canonical_family);

comment on column public.scan_interpretation_diagnostics.canonical_display_name is
  'Single user-facing pattern name selected by the canonical resolver. Atlas and legacy names remain diagnostic inputs.';

comment on column public.scan_interpretation_diagnostics.confidence_margin is
  'Difference between the top canonical family score and the nearest viable candidate.';
