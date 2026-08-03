create type public.school_event_kind as enum ('event', 'meeting', 'trip');
create type public.school_event_scope as enum ('school', 'classroom', 'child');
create type public.school_event_status as enum ('published', 'cancelled');
create type public.school_event_response as enum ('pending', 'attending', 'not_attending');

create table public.school_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  kind public.school_event_kind not null,
  scope public.school_event_scope not null,
  classroom_id uuid references public.classrooms(id) on delete restrict,
  child_id uuid references public.children(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 3 and 2000),
  location text check (location is null or char_length(location) <= 160),
  starts_at timestamptz not null,
  ends_at timestamptz,
  requires_response boolean not null default false,
  response_deadline date,
  status public.school_event_status not null default 'published',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_events_time_check check (ends_at is null or ends_at >= starts_at),
  constraint school_events_response_deadline_check check (not requires_response or response_deadline is not null),
  constraint school_events_scope_target_check check (
    (scope = 'school' and classroom_id is null and child_id is null)
    or (scope = 'classroom' and classroom_id is not null and child_id is null)
    or (scope = 'child' and classroom_id is null and child_id is not null)
  )
);

create table public.school_event_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_id uuid not null references public.school_events(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  viewed_at timestamptz,
  response public.school_event_response not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, membership_id, child_id)
);

create index school_events_school_start_idx on public.school_events (school_id, starts_at);
create index school_event_recipients_member_idx on public.school_event_recipients (membership_id, viewed_at, created_at desc);

alter table public.school_events enable row level security;
alter table public.school_event_recipients enable row level security;

create policy school_events_manage_director on public.school_events
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_event_recipients_manage_director on public.school_event_recipients
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_event_recipients_read_family on public.school_event_recipients
for select to authenticated
using (
  exists (
    select 1 from public.school_memberships sm
    where sm.id = school_event_recipients.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy school_events_read_family on public.school_events
for select to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.school_event_recipients ser
    join public.school_memberships sm on sm.id = ser.membership_id
    where ser.event_id = school_events.id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy school_events_read_teacher on public.school_events
for select to authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.school_memberships sm
    where sm.school_id = school_events.school_id
      and sm.user_id = auth.uid()
      and sm.role = 'teacher'
      and sm.status = 'active'
      and (
        school_events.scope = 'school'
        or exists (
          select 1 from public.classroom_staff cs
          where cs.membership_id = sm.id
            and cs.classroom_id = school_events.classroom_id
        )
        or exists (
          select 1
          from public.enrollments e
          join public.classroom_staff cs on cs.classroom_id = e.classroom_id
          where cs.membership_id = sm.id
            and e.child_id = school_events.child_id
            and e.status = 'active'
        )
      )
  )
);
