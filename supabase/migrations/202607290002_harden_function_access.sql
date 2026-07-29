revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_active_school_member(uuid) from public, anon;
revoke execute on function public.has_school_role(uuid, public.school_role[]) from public, anon;
revoke execute on function public.can_access_classroom(uuid) from public, anon;
revoke execute on function public.can_access_child(uuid) from public, anon;
revoke execute on function public.publish_school_day(uuid) from public, anon;

grant execute on function public.is_active_school_member(uuid) to authenticated;
grant execute on function public.has_school_role(uuid, public.school_role[]) to authenticated;
grant execute on function public.can_access_classroom(uuid) to authenticated;
grant execute on function public.can_access_child(uuid) to authenticated;
grant execute on function public.publish_school_day(uuid) to authenticated;

drop policy profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy memberships_read_school on public.school_memberships;
create policy memberships_read_school on public.school_memberships
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_school_role(school_id, array['director']::public.school_role[])
);

drop policy classrooms_read_member on public.classrooms;
create policy classrooms_read_member on public.classrooms
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(id)
  or exists (
    select 1
    from public.enrollments e
    join public.guardian_links gl on gl.child_id = e.child_id
    join public.school_memberships sm on sm.id = gl.membership_id
    where e.classroom_id = classrooms.id
      and sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and gl.active
  )
);

drop policy summary_views_read_authorized on public.summary_views;
create policy summary_views_read_authorized on public.summary_views
for select to authenticated
using (
  viewer_id = (select auth.uid())
  or public.has_school_role(school_id, array['director']::public.school_role[])
);

drop policy summary_views_insert_self on public.summary_views;
create policy summary_views_insert_self on public.summary_views
for insert to authenticated
with check (
  viewer_id = (select auth.uid())
  and exists (
    select 1
    from public.daily_summaries ds
    where ds.id = summary_views.summary_id
      and public.can_access_child(ds.child_id)
  )
);

drop policy summary_views_update_self on public.summary_views;
create policy summary_views_update_self on public.summary_views
for update to authenticated
using (viewer_id = (select auth.uid()))
with check (viewer_id = (select auth.uid()));
