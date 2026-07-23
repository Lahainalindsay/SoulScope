alter table public.scan_interpretation_diagnostics
  add column if not exists organizing_quality text,
  add column if not exists result_type text,
  add column if not exists naming_matrix_version text,
  add column if not exists subpattern_scores jsonb not null default '[]'::jsonb;

update public.scan_interpretation_diagnostics
set
  result_type = coalesce(
    result_type,
    decision_ledger #>> '{selected,mode}',
    case
      when canonical_display_name = 'A Limited Reflection' or display_name = 'A Limited Reflection' then 'insufficient-evidence'
      when secondary_family is not null then 'composite'
      else 'single'
    end
  )
where result_type is null;

create index if not exists scan_interpretation_diagnostics_result_type_idx
  on public.scan_interpretation_diagnostics (result_type);

create index if not exists scan_interpretation_diagnostics_naming_matrix_version_idx
  on public.scan_interpretation_diagnostics (naming_matrix_version);

comment on column public.scan_interpretation_diagnostics.organizing_quality is
  'Controlled organizing-quality band used by the canonical naming matrix.';

comment on column public.scan_interpretation_diagnostics.result_type is
  'Canonical result selection type: single, composite, ambiguous, or insufficient-evidence.';

comment on column public.scan_interpretation_diagnostics.naming_matrix_version is
  'Version of the deterministic canonical naming matrix used to select the user-facing name.';

comment on column public.scan_interpretation_diagnostics.subpattern_scores is
  'Atlas subpattern scores retained for internal diagnostics and distribution review.';
