create policy profiles_read_school_director on public.profiles
for select to authenticated
using (
  exists (
    select 1
    from public.school_memberships target_membership
    where target_membership.user_id = profiles.id
      and target_membership.status = 'active'
      and public.has_school_role(
        target_membership.school_id,
        array['director']::public.school_role[]
      )
  )
);
