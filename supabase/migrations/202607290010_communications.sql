create type public.communication_kind as enum (
  'general',
  'important',
  'authorization',
  'item_request'
);

create type public.communication_scope as enum (
  'school',
  'classroom',
  'child'
);

create table public.communications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  kind public.communication_kind not null,
  scope public.communication_scope not null,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 3 and 2000),
  event_date date,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint communication_scope_target_check check (
    (scope = 'school' and classroom_id is null and child_id is null)
    or (scope = 'classroom' and classroom_id is not null and child_id is null)
    or (scope = 'child' and classroom_id is null and child_id is not null)
  )
);

create table public.communication_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  communication_id uuid not null references public.communications(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  viewed_at timestamptz,
  response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (communication_id, child_id, membership_id)
);

create index communications_school_published_idx
  on public.communications(school_id, published_at desc);
create index communication_recipients_communication_idx
  on public.communication_recipients(communication_id);
create index communication_recipients_membership_idx
  on public.communication_recipients(membership_id, created_at desc);

alter table public.communications enable row level security;
alter table public.communication_recipients enable row level security;

create policy communications_manage_director on public.communications
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy communications_read_family on public.communications
for select to authenticated
using (
  exists (
    select 1
    from public.communication_recipients cr
    join public.school_memberships sm on sm.id = cr.membership_id
    where cr.communication_id = communications.id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy communication_recipients_manage_director
on public.communication_recipients
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy communication_recipients_read_family
on public.communication_recipients
for select to authenticated
using (
  exists (
    select 1
    from public.school_memberships sm
    where sm.id = communication_recipients.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy communication_recipients_update_family
on public.communication_recipients
for update to authenticated
using (
  exists (
    select 1
    from public.school_memberships sm
    where sm.id = communication_recipients.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.school_memberships sm
    where sm.id = communication_recipients.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);
