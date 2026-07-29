create extension if not exists pgcrypto;

create type public.school_role as enum ('director', 'teacher', 'family');
create type public.membership_status as enum ('invited', 'active', 'suspended');
create type public.enrollment_status as enum ('active', 'inactive');
create type public.day_status as enum ('draft', 'ready', 'published');
create type public.attendance_status as enum ('present', 'absent', 'late', 'left_early');
create type public.routine_category as enum (
  'attendance',
  'meal',
  'hydration',
  'sleep',
  'hygiene',
  'activity',
  'note'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.school_role not null,
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id, role)
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  age_group text,
  default_start time not null,
  default_end time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table public.classroom_staff (
  school_id uuid not null references public.schools(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (classroom_id, membership_id)
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  schedule_name text not null,
  weekdays smallint[] not null default '{1,2,3,4,5}',
  expected_start time not null,
  expected_end time not null,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  relationship text not null,
  can_view_routine boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (child_id, membership_id)
);

create table public.routine_configurations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  category public.routine_category not null,
  enabled boolean not null default true,
  required boolean not null default false,
  position smallint not null default 0,
  options jsonb not null default '[]'::jsonb,
  unique (classroom_id, category)
);

create table public.school_days (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  day date not null,
  status public.day_status not null default 'draft',
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, day),
  check (
    (status <> 'published')
    or (published_at is not null and published_by is not null)
  )
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  school_day_id uuid not null references public.school_days(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  unique (school_day_id, child_id)
);

create table public.routine_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  school_day_id uuid not null references public.school_days(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  category public.routine_category not null,
  period_key text not null default 'default',
  value jsonb not null,
  is_exception boolean not null default false,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_day_id, child_id, category, period_key)
);

create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  school_day_id uuid not null references public.school_days(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  narrative text not null,
  snapshot jsonb not null,
  published_at timestamptz not null,
  published_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (school_day_id, child_id)
);

create table public.summary_views (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  summary_id uuid not null references public.daily_summaries(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  unique (summary_id, viewer_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index school_memberships_user_idx on public.school_memberships(user_id, status);
create index classroom_staff_membership_idx on public.classroom_staff(membership_id);
create index enrollments_classroom_active_idx on public.enrollments(classroom_id, status);
create index guardian_links_membership_idx on public.guardian_links(membership_id, active);
create index school_days_school_day_idx on public.school_days(school_id, day);
create index routine_entries_day_child_idx on public.routine_entries(school_day_id, child_id);
create index daily_summaries_child_published_idx on public.daily_summaries(child_id, published_at desc);
create index audit_logs_school_created_idx on public.audit_logs(school_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger schools_touch before update on public.schools
for each row execute function public.touch_updated_at();
create trigger memberships_touch before update on public.school_memberships
for each row execute function public.touch_updated_at();
create trigger school_days_touch before update on public.school_days
for each row execute function public.touch_updated_at();
create trigger routine_entries_touch before update on public.routine_entries
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_active_school_member(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_memberships
    where school_id = target_school_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_school_role(
  target_school_id uuid,
  allowed_roles public.school_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_memberships
    where school_id = target_school_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.can_access_classroom(target_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classrooms c
    where c.id = target_classroom_id
      and (
        public.has_school_role(c.school_id, array['director']::public.school_role[])
        or exists (
          select 1
          from public.classroom_staff cs
          join public.school_memberships sm on sm.id = cs.membership_id
          where cs.classroom_id = c.id
            and sm.user_id = auth.uid()
            and sm.status = 'active'
            and sm.role = 'teacher'
        )
      )
  );
$$;

create or replace function public.can_access_child(target_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children child
    where child.id = target_child_id
      and (
        public.has_school_role(child.school_id, array['director']::public.school_role[])
        or exists (
          select 1
          from public.enrollments e
          where e.child_id = child.id
            and e.status = 'active'
            and public.can_access_classroom(e.classroom_id)
        )
        or exists (
          select 1
          from public.guardian_links gl
          join public.school_memberships sm on sm.id = gl.membership_id
          where gl.child_id = child.id
            and gl.active
            and gl.can_view_routine
            and sm.user_id = auth.uid()
            and sm.status = 'active'
            and sm.role = 'family'
        )
      )
  );
$$;

grant execute on function public.is_active_school_member(uuid) to authenticated;
grant execute on function public.has_school_role(uuid, public.school_role[]) to authenticated;
grant execute on function public.can_access_classroom(uuid) to authenticated;
grant execute on function public.can_access_child(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_staff enable row level security;
alter table public.children enable row level security;
alter table public.enrollments enable row level security;
alter table public.guardian_links enable row level security;
alter table public.routine_configurations enable row level security;
alter table public.school_days enable row level security;
alter table public.attendance_records enable row level security;
alter table public.routine_entries enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.summary_views enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self on public.profiles
for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy schools_read_member on public.schools
for select to authenticated using (public.is_active_school_member(id));
create policy schools_update_director on public.schools
for update to authenticated
using (public.has_school_role(id, array['director']::public.school_role[]))
with check (public.has_school_role(id, array['director']::public.school_role[]));

create policy memberships_read_school on public.school_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.has_school_role(school_id, array['director']::public.school_role[])
);
create policy memberships_manage_director on public.school_memberships
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

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
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and gl.active
  )
);
create policy classrooms_manage_director on public.classrooms
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy classroom_staff_read_assigned on public.classroom_staff
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);
create policy classroom_staff_manage_director on public.classroom_staff
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy children_read_authorized on public.children
for select to authenticated using (public.can_access_child(id));
create policy children_manage_director on public.children
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy enrollments_read_authorized on public.enrollments
for select to authenticated
using (public.can_access_classroom(classroom_id) or public.can_access_child(child_id));
create policy enrollments_manage_director on public.enrollments
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy guardian_links_read_authorized on public.guardian_links
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_child(child_id)
);
create policy guardian_links_manage_director on public.guardian_links
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy configurations_read_classroom on public.routine_configurations
for select to authenticated
using (public.can_access_classroom(classroom_id));
create policy configurations_manage_director on public.routine_configurations
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_days_read_authorized on public.school_days
for select to authenticated
using (
  public.can_access_classroom(classroom_id)
  or exists (
    select 1
    from public.daily_summaries ds
    where ds.school_day_id = school_days.id
      and public.can_access_child(ds.child_id)
  )
);
create policy school_days_write_staff on public.school_days
for insert to authenticated
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);
create policy school_days_update_staff on public.school_days
for update to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
)
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);

create policy attendance_read_authorized on public.attendance_records
for select to authenticated using (public.can_access_child(child_id));
create policy attendance_write_staff on public.attendance_records
for all to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.school_days sd
    where sd.id = attendance_records.school_day_id
      and public.can_access_classroom(sd.classroom_id)
  )
)
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.school_days sd
    where sd.id = attendance_records.school_day_id
      and public.can_access_classroom(sd.classroom_id)
  )
);

create policy routine_entries_read_authorized on public.routine_entries
for select to authenticated using (public.can_access_child(child_id));
create policy routine_entries_write_staff on public.routine_entries
for all to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.school_days sd
    where sd.id = routine_entries.school_day_id
      and sd.status <> 'published'
      and public.can_access_classroom(sd.classroom_id)
  )
)
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.school_days sd
    where sd.id = routine_entries.school_day_id
      and sd.status <> 'published'
      and public.can_access_classroom(sd.classroom_id)
  )
);

create policy summaries_read_authorized on public.daily_summaries
for select to authenticated using (public.can_access_child(child_id));
create policy summaries_write_staff on public.daily_summaries
for insert to authenticated
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1 from public.school_days sd
    where sd.id = daily_summaries.school_day_id
      and public.can_access_classroom(sd.classroom_id)
  )
);

create policy summary_views_read_authorized on public.summary_views
for select to authenticated
using (
  viewer_id = auth.uid()
  or public.has_school_role(school_id, array['director']::public.school_role[])
);
create policy summary_views_insert_self on public.summary_views
for insert to authenticated
with check (
  viewer_id = auth.uid()
  and exists (
    select 1 from public.daily_summaries ds
    where ds.id = summary_views.summary_id
      and public.can_access_child(ds.child_id)
  )
);
create policy summary_views_update_self on public.summary_views
for update to authenticated
using (viewer_id = auth.uid())
with check (viewer_id = auth.uid());

create policy audit_logs_read_director on public.audit_logs
for select to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]));

revoke insert, update, delete on public.audit_logs from authenticated;

create or replace function public.publish_school_day(target_day_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_day public.school_days;
  target_child record;
  entry_snapshot jsonb;
  meal_label text;
  summary_text text;
begin
  select * into target_day
  from public.school_days
  where id = target_day_id
  for update;

  if target_day.id is null then
    raise exception 'school_day_not_found';
  end if;

  if not (
    public.has_school_role(target_day.school_id, array['director']::public.school_role[])
    or public.can_access_classroom(target_day.classroom_id)
  ) then
    raise exception 'not_authorized';
  end if;

  if target_day.status = 'published' then
    raise exception 'school_day_already_published';
  end if;

  for target_child in
    select c.id, c.first_name
    from public.children c
    join public.enrollments e on e.child_id = c.id
    join public.attendance_records ar
      on ar.child_id = c.id
      and ar.school_day_id = target_day.id
    where e.classroom_id = target_day.classroom_id
      and e.status = 'active'
      and ar.status in ('present', 'late', 'left_early')
  loop
    select coalesce(jsonb_object_agg(category::text || ':' || period_key, value), '{}'::jsonb)
    into entry_snapshot
    from public.routine_entries
    where school_day_id = target_day.id
      and child_id = target_child.id;

    select value ->> 'label'
    into meal_label
    from public.routine_entries
    where school_day_id = target_day.id
      and child_id = target_child.id
      and category = 'meal'
    order by recorded_at desc
    limit 1;

    summary_text := target_child.first_name
      || case
        when meal_label is not null
          then ' participou da rotina e ' || lower(meal_label) || ' no almoço.'
        else ' participou da rotina escolar de hoje.'
      end;

    insert into public.daily_summaries (
      school_id,
      school_day_id,
      child_id,
      narrative,
      snapshot,
      published_at,
      published_by
    )
    values (
      target_day.school_id,
      target_day.id,
      target_child.id,
      summary_text,
      entry_snapshot,
      now(),
      auth.uid()
    );
  end loop;

  update public.school_days
  set status = 'published',
      published_at = now(),
      published_by = auth.uid()
  where id = target_day.id;

  insert into public.audit_logs (
    school_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    target_day.school_id,
    auth.uid(),
    'school_day.published',
    'school_day',
    target_day.id::text,
    jsonb_build_object('classroom_id', target_day.classroom_id, 'day', target_day.day)
  );
end;
$$;

grant execute on function public.publish_school_day(uuid) to authenticated;
