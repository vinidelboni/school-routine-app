create type public.meal_plan_scope as enum ('school', 'classroom');
create type public.meal_plan_type as enum ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'bottle', 'dinner');

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  scope public.meal_plan_scope not null,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  service_date date not null,
  meal_type public.meal_plan_type not null,
  title text not null check (char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  allergen_notes text check (allergen_notes is null or char_length(allergen_notes) <= 500),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_scope_target_check check (
    (scope = 'school' and classroom_id is null)
    or (scope = 'classroom' and classroom_id is not null)
  )
);

create unique index meal_plans_school_unique_idx
on public.meal_plans (school_id, service_date, meal_type)
where scope = 'school';

create unique index meal_plans_classroom_unique_idx
on public.meal_plans (school_id, classroom_id, service_date, meal_type)
where scope = 'classroom';

create index meal_plans_school_date_idx on public.meal_plans (school_id, service_date, meal_type);

create trigger meal_plans_touch
before update on public.meal_plans
for each row execute function public.touch_updated_at();

alter table public.meal_plans enable row level security;

create policy meal_plans_manage_director on public.meal_plans
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy meal_plans_read_teacher on public.meal_plans
for select to authenticated
using (
  public.has_school_role(school_id, array['teacher']::public.school_role[])
  and (
    scope = 'school'
    or exists (
      select 1 from public.classroom_staff cs
      join public.school_memberships sm on sm.id = cs.membership_id
      where cs.classroom_id = meal_plans.classroom_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  )
);

create policy meal_plans_read_family on public.meal_plans
for select to authenticated
using (
  exists (
    select 1 from public.school_memberships sm
    where sm.school_id = meal_plans.school_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
  and (
    scope = 'school'
    or exists (
      select 1
      from public.guardian_links gl
      join public.school_memberships sm on sm.id = gl.membership_id
      join public.enrollments enrollment on enrollment.child_id = gl.child_id
      where sm.user_id = auth.uid()
        and sm.status = 'active'
        and gl.active = true
        and gl.can_view_routine = true
        and enrollment.status = 'active'
        and enrollment.classroom_id = meal_plans.classroom_id
    )
  )
);
