revoke all privileges on table public.reference_signatures from anon;

grant select, insert, update
  on table public.reference_signatures
  to authenticated;
