alter table public.billing_documents
add column storage_path text unique;

alter table public.billing_documents
add constraint billing_documents_storage_path_format_check
check (
  storage_path is null
  or storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('billing-documents', 'billing-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy billing_documents_storage_insert_director on storage.objects
for insert to authenticated
with check (
  bucket_id = 'billing-documents'
  and public.has_school_role(
    (storage.foldername(name))[1]::uuid,
    array['director']::public.school_role[]
  )
);

create policy billing_documents_storage_read_authorized on storage.objects
for select to authenticated
using (
  bucket_id = 'billing-documents'
  and (
    public.has_school_role(
      (storage.foldername(name))[1]::uuid,
      array['director']::public.school_role[]
    )
    or exists (
      select 1
      from public.billing_documents bd
      join public.guardian_links gl on gl.child_id = bd.child_id and gl.active
      join public.school_memberships sm on sm.id = gl.membership_id
      where bd.storage_path = storage.objects.name
        and bd.status = 'distributed'
        and sm.user_id = auth.uid()
        and sm.role = 'family'
        and sm.status = 'active'
    )
  )
);

create policy billing_documents_storage_delete_director on storage.objects
for delete to authenticated
using (
  bucket_id = 'billing-documents'
  and public.has_school_role(
    (storage.foldername(name))[1]::uuid,
    array['director']::public.school_role[]
  )
);
