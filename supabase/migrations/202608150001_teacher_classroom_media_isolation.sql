drop policy if exists image_consents_read_staff on public.image_consents;
create policy image_consents_read_staff on public.image_consents
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_child(child_id)
);

drop policy if exists photos_read_staff on public.photo_publications;
create policy photos_read_staff on public.photo_publications
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);

drop policy if exists photos_insert_staff on public.photo_publications;
create policy photos_insert_staff on public.photo_publications
for insert to authenticated
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);

drop policy if exists photo_children_read_staff on public.photo_children;
create policy photo_children_read_staff on public.photo_children
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.photo_publications publication
    where publication.id = photo_children.photo_id
      and public.can_access_classroom(publication.classroom_id)
  )
);

drop policy if exists photo_children_insert_staff on public.photo_children;
create policy photo_children_insert_staff on public.photo_children
for insert to authenticated
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or (
    public.can_access_child(child_id)
    and exists (
      select 1 from public.photo_publications publication
      where publication.id = photo_children.photo_id
        and public.can_access_classroom(publication.classroom_id)
    )
  )
);

drop policy if exists school_photos_insert_staff on storage.objects;
create policy school_photos_insert_staff on storage.objects
for insert to authenticated
with check (
  bucket_id = 'school-photos'
  and (
    public.has_school_role((storage.foldername(name))[1]::uuid, array['director']::public.school_role[])
    or public.can_access_classroom((storage.foldername(name))[2]::uuid)
  )
);

drop policy if exists school_photos_read_authorized on storage.objects;
create policy school_photos_read_authorized on storage.objects
for select to authenticated
using (
  bucket_id = 'school-photos'
  and (
    public.has_school_role((storage.foldername(name))[1]::uuid, array['director']::public.school_role[])
    or exists (
      select 1 from public.photo_publications publication
      where publication.storage_path = storage.objects.name
        and public.can_access_classroom(publication.classroom_id)
    )
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

drop policy if exists school_photos_delete_staff on storage.objects;
create policy school_photos_delete_staff on storage.objects
for delete to authenticated
using (
  bucket_id = 'school-photos'
  and (
    public.has_school_role((storage.foldername(name))[1]::uuid, array['director']::public.school_role[])
    or public.can_access_classroom((storage.foldername(name))[2]::uuid)
    or exists (
      select 1 from public.photo_publications publication
      where publication.storage_path = storage.objects.name
        and public.can_access_classroom(publication.classroom_id)
    )
  )
);
