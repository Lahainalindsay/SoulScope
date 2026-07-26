insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scan-audio', 'scan-audio', false, 5242880, array['audio/wav','audio/wave','audio/x-wav'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.sensor_captures
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists analysis_status text not null default 'pending'
    check (analysis_status in ('pending','uploaded','processing','analyzed','failed_retryable','failed_terminal')),
  add column if not exists analyzed_at timestamptz,
  add column if not exists analysis_error text;

create unique index if not exists sensor_captures_storage_path_unique_idx
  on public.sensor_captures (storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;

create policy "scan audio select own"
on storage.objects for select to authenticated
using (bucket_id = 'scan-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "scan audio insert own"
on storage.objects for insert to authenticated
with check (bucket_id = 'scan-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "scan audio update own"
on storage.objects for update to authenticated
using (bucket_id = 'scan-audio' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'scan-audio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "scan audio delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'scan-audio' and (storage.foldername(name))[1] = auth.uid()::text);