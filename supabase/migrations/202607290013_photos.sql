create type public.image_consent_status as enum ('pending', 'authorized', 'not_authorized');

create table public.image_consents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  status public.image_consent_status not null default 'pending',
  notes text,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id)
);

create table public.photo_publications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  storage_path text not null unique,
  caption text not null check (char_length(caption) between 3 and 500),
  activity_date date not null,
  published_by uuid not null references public.profiles(id),
  published_at timestamptz not null default now()
);

create table public.photo_children (
  photo_id uuid not null references public.photo_publications(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  primary key (photo_id, child_id)
);

create index photo_publications_school_date_idx on public.photo_publications(school_id, activity_date desc);
create index photo_children_child_idx on public.photo_children(child_id);

alter table public.image_consents enable row level security;
alter table public.photo_publications enable row level security;
alter table public.photo_children enable row level security;

create policy image_consents_manage_director on public.image_consents
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));
create policy image_consents_read_staff on public.image_consents
for select to authenticated
using (public.has_school_role(school_id, array['teacher', 'director']::public.school_role[]));

create policy photos_read_staff on public.photo_publications
for select to authenticated
using (public.has_school_role(school_id, array['teacher', 'director']::public.school_role[]));
create policy photos_insert_staff on public.photo_publications
for insert to authenticated
with check (public.has_school_role(school_id, array['teacher', 'director']::public.school_role[]));
create policy photos_read_family on public.photo_publications
for select to authenticated
using (
  exists (
    select 1 from public.photo_children pc
    join public.guardian_links gl on gl.child_id = pc.child_id and gl.active
    join public.school_memberships sm on sm.id = gl.membership_id
    where pc.photo_id = photo_publications.id
      and sm.user_id = auth.uid() and sm.role = 'family' and sm.status = 'active'
  )
);

create policy photo_children_read_staff on public.photo_children
for select to authenticated
using (public.has_school_role(school_id, array['teacher', 'director']::public.school_role[]));
create policy photo_children_insert_staff on public.photo_children
for insert to authenticated
with check (public.has_school_role(school_id, array['teacher', 'director']::public.school_role[]));
create policy photo_children_read_family on public.photo_children
for select to authenticated
using (
  exists (
    select 1 from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = photo_children.child_id and gl.active
      and sm.user_id = auth.uid() and sm.role = 'family' and sm.status = 'active'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-photos', 'school-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy school_photos_insert_staff on storage.objects
for insert to authenticated
with check (
  bucket_id = 'school-photos'
  and public.has_school_role((storage.foldername(name))[1]::uuid, array['teacher', 'director']::public.school_role[])
);
create policy school_photos_read_authorized on storage.objects
for select to authenticated
using (
  bucket_id = 'school-photos'
  and (
    public.has_school_role((storage.foldername(name))[1]::uuid, array['teacher', 'director']::public.school_role[])
    or exists (
      select 1 from public.photo_publications pp
      join public.photo_children pc on pc.photo_id = pp.id
      join public.guardian_links gl on gl.child_id = pc.child_id and gl.active
      join public.school_memberships sm on sm.id = gl.membership_id
      where pp.storage_path = storage.objects.name
        and sm.user_id = auth.uid() and sm.role = 'family' and sm.status = 'active'
    )
  )
);
