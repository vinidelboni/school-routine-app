create or replace function public.set_classroom_teachers(
  target_classroom_id uuid,
  target_membership_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_school_id uuid;
begin
  select school_id into target_school_id
  from public.classrooms
  where id = target_classroom_id and active = true;

  if target_school_id is null or not public.has_school_role(target_school_id, array['director'::public.school_role]) then
    raise exception 'Turma não encontrada ou acesso negado.';
  end if;

  if exists (
    select 1
    from unnest(coalesce(target_membership_ids, array[]::uuid[])) selected_id
    left join public.school_memberships membership
      on membership.id = selected_id
      and membership.school_id = target_school_id
      and membership.role = 'teacher'
      and membership.status = 'active'
    where membership.id is null
  ) then
    raise exception 'Professora inválida para esta escola.';
  end if;

  delete from public.classroom_staff where classroom_id = target_classroom_id;

  insert into public.classroom_staff (school_id, classroom_id, membership_id)
  select target_school_id, target_classroom_id, selected_id
  from (select distinct unnest(coalesce(target_membership_ids, array[]::uuid[])) as selected_id) selected;
end;
$$;

revoke all on function public.set_classroom_teachers(uuid, uuid[]) from public;
grant execute on function public.set_classroom_teachers(uuid, uuid[]) to authenticated;

create or replace function public.get_family_child_teachers(target_membership_id uuid)
returns table (
  guardian_link_id uuid,
  child_id uuid,
  classroom_id uuid,
  classroom_name text,
  teacher_membership_id uuid,
  teacher_name text,
  teacher_avatar_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    guardian.id,
    child.id,
    classroom.id,
    classroom.name,
    teacher_membership.id,
    teacher_profile.full_name,
    teacher_profile.avatar_path
  from public.guardian_links guardian
  join public.school_memberships family_membership
    on family_membership.id = guardian.membership_id
  join public.children child on child.id = guardian.child_id
  join public.enrollments enrollment
    on enrollment.child_id = child.id and enrollment.status = 'active'
  join public.classrooms classroom
    on classroom.id = enrollment.classroom_id and classroom.active = true
  left join public.classroom_staff staff on staff.classroom_id = classroom.id
  left join public.school_memberships teacher_membership
    on teacher_membership.id = staff.membership_id
    and teacher_membership.role = 'teacher'
    and teacher_membership.status = 'active'
  left join public.profiles teacher_profile on teacher_profile.id = teacher_membership.user_id
  where guardian.membership_id = target_membership_id
    and guardian.active = true
    and family_membership.user_id = auth.uid()
    and family_membership.role = 'family'
    and family_membership.status = 'active'
  order by child.first_name, teacher_profile.full_name;
$$;

revoke all on function public.get_family_child_teachers(uuid) from public;
grant execute on function public.get_family_child_teachers(uuid) to authenticated;
