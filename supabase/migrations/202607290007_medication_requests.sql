create type public.medication_request_status as enum (
  'submitted',
  'accepted',
  'declined',
  'completed'
);

create type public.medication_administration_status as enum (
  'administered',
  'not_administered'
);

create table public.medication_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  scheduled_time time not null,
  starts_on date not null,
  ends_on date not null,
  instructions text not null,
  authorization_reference text not null,
  status public.medication_request_status not null default 'submitted',
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.medication_administrations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  request_id uuid not null references public.medication_requests(id) on delete cascade,
  scheduled_for timestamptz not null,
  status public.medication_administration_status not null,
  note text,
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now()
);

create index medication_requests_school_status_idx
on public.medication_requests (school_id, status, starts_on);

create index medication_administrations_request_idx
on public.medication_administrations (request_id, recorded_at desc);

create trigger medication_requests_touch before update on public.medication_requests
for each row execute function public.touch_updated_at();

alter table public.medication_requests enable row level security;
alter table public.medication_administrations enable row level security;

create policy medication_requests_read_director on public.medication_requests
for select to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy medication_requests_read_creator on public.medication_requests
for select to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = medication_requests.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
  )
);

create policy medication_requests_create_family on public.medication_requests
for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = medication_requests.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
      and sm.school_id = medication_requests.school_id
  )
);

create policy medication_requests_update_director on public.medication_requests
for update to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy medication_administrations_read_authorized
on public.medication_administrations
for select to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or exists (
    select 1
    from public.medication_requests mr
    where mr.id = medication_administrations.request_id
      and mr.created_by = auth.uid()
  )
);

create policy medication_administrations_create_director
on public.medication_administrations
for insert to authenticated
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
);
