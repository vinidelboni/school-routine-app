create type public.school_document_category as enum (
  'circular',
  'policy',
  'calendar',
  'pedagogical',
  'health',
  'other'
);

create type public.school_document_scope as enum ('school', 'classroom', 'child');

create table public.school_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text check (description is null or char_length(description) <= 1000),
  category public.school_document_category not null,
  scope public.school_document_scope not null,
  classroom_id uuid references public.classrooms(id) on delete restrict,
  child_id uuid references public.children(id) on delete restrict,
  original_filename text not null,
  storage_path text not null unique,
  published_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint school_documents_scope_target_check check (
    (scope = 'school' and classroom_id is null and child_id is null)
    or (scope = 'classroom' and classroom_id is not null and child_id is null)
    or (scope = 'child' and classroom_id is null and child_id is not null)
  ),
  constraint school_documents_storage_path_format_check check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
  )
);

create table public.school_document_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  document_id uuid not null references public.school_documents(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (document_id, membership_id, child_id)
);

create index school_documents_school_published_idx
on public.school_documents (school_id, published_at desc);
create index school_document_recipients_member_idx
on public.school_document_recipients (membership_id, viewed_at, created_at desc);

alter table public.school_documents enable row level security;
alter table public.school_document_recipients enable row level security;

create policy school_documents_manage_director on public.school_documents
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_document_recipients_manage_director on public.school_document_recipients
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_document_recipients_read_family on public.school_document_recipients
for select to authenticated
using (
  exists (
    select 1 from public.school_memberships sm
    where sm.id = school_document_recipients.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy school_documents_read_family on public.school_documents
for select to authenticated
using (
  exists (
    select 1
    from public.school_document_recipients sdr
    join public.school_memberships sm on sm.id = sdr.membership_id
    where sdr.document_id = school_documents.id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-documents', 'school-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy school_documents_storage_insert_director on storage.objects
for insert to authenticated
with check (
  bucket_id = 'school-documents'
  and public.has_school_role(
    (storage.foldername(name))[1]::uuid,
    array['director']::public.school_role[]
  )
);

create policy school_documents_storage_read_authorized on storage.objects
for select to authenticated
using (
  bucket_id = 'school-documents'
  and (
    public.has_school_role(
      (storage.foldername(name))[1]::uuid,
      array['director']::public.school_role[]
    )
    or exists (
      select 1
      from public.school_documents sd
      join public.school_document_recipients sdr on sdr.document_id = sd.id
      join public.school_memberships sm on sm.id = sdr.membership_id
      where sd.storage_path = storage.objects.name
        and sm.user_id = auth.uid()
        and sm.role = 'family'
        and sm.status = 'active'
    )
  )
);

create policy school_documents_storage_delete_director on storage.objects
for delete to authenticated
using (
  bucket_id = 'school-documents'
  and public.has_school_role(
    (storage.foldername(name))[1]::uuid,
    array['director']::public.school_role[]
  )
);
