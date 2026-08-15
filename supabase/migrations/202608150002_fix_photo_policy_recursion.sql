create or replace function public.can_access_photo_publication(target_photo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.photo_publications publication
    where publication.id = target_photo_id
      and (
        public.has_school_role(publication.school_id, array['director']::public.school_role[])
        or public.can_access_classroom(publication.classroom_id)
      )
  );
$$;

grant execute on function public.can_access_photo_publication(uuid) to authenticated;

drop policy if exists photo_children_read_staff on public.photo_children;
create policy photo_children_read_staff on public.photo_children
for select to authenticated
using (public.can_access_photo_publication(photo_id));

drop policy if exists photo_children_insert_staff on public.photo_children;
create policy photo_children_insert_staff on public.photo_children
for insert to authenticated
with check (
  public.can_access_child(child_id)
  and public.can_access_photo_publication(photo_id)
);
