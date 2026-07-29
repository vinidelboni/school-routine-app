create type public.family_request_type as enum (
  'absence',
  'late_arrival',
  'early_departure',
  'poor_sleep',
  'toilet_training',
  'pickup_change',
  'extended_period'
);

create type public.family_request_status as enum (
  'submitted',
  'acknowledged',
  'approved',
  'declined',
  'completed'
);

create table public.family_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  request_type public.family_request_type not null,
  effective_date date not null,
  details jsonb not null default '{}'::jsonb,
  status public.family_request_status not null default 'submitted',
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    request_type = 'extended_period'
    or status not in ('approved', 'declined')
  )
);

create index family_requests_school_status_idx
on public.family_requests (school_id, status, effective_date);

create index family_requests_child_created_idx
on public.family_requests (child_id, created_at desc);

create trigger family_requests_touch before update on public.family_requests
for each row execute function public.touch_updated_at();

alter table public.family_requests enable row level security;

create policy family_requests_read_director on public.family_requests
for select to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy family_requests_read_creator on public.family_requests
for select to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = family_requests.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
  )
);

create policy family_requests_create_family on public.family_requests
for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = family_requests.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
      and sm.school_id = family_requests.school_id
  )
);

create policy family_requests_update_director on public.family_requests
for update to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));
