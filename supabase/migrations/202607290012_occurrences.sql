create type public.occurrence_severity as enum ('attention', 'important', 'urgent');
create type public.occurrence_status as enum ('internal', 'communicated', 'acknowledged', 'closed');

create table public.occurrences (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  severity public.occurrence_severity not null,
  status public.occurrence_status not null default 'internal',
  occurred_at timestamptz not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 3 and 2000),
  actions_taken text not null check (char_length(actions_taken) between 3 and 2000),
  communicated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.occurrence_recipients (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  viewed_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  unique (occurrence_id, membership_id)
);

create index occurrences_school_status_idx on public.occurrences(school_id, status, occurred_at desc);
create index occurrence_recipients_membership_idx on public.occurrence_recipients(membership_id, created_at desc);

alter table public.occurrences enable row level security;
alter table public.occurrence_recipients enable row level security;

create policy occurrences_manage_director on public.occurrences
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy occurrences_read_family on public.occurrences
for select to authenticated
using (
  status <> 'internal'
  and exists (
    select 1
    from public.occurrence_recipients recipient
    join public.school_memberships membership on membership.id = recipient.membership_id
    where recipient.occurrence_id = occurrences.id
      and membership.user_id = auth.uid()
      and membership.role = 'family'
      and membership.status = 'active'
  )
);

create policy occurrence_recipients_manage_director on public.occurrence_recipients
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy occurrence_recipients_read_family on public.occurrence_recipients
for select to authenticated
using (
  exists (
    select 1 from public.school_memberships membership
    where membership.id = occurrence_recipients.membership_id
      and membership.user_id = auth.uid()
      and membership.role = 'family'
      and membership.status = 'active'
  )
);

create policy occurrence_recipients_update_family on public.occurrence_recipients
for update to authenticated
using (
  exists (
    select 1 from public.school_memberships membership
    where membership.id = occurrence_recipients.membership_id
      and membership.user_id = auth.uid()
      and membership.role = 'family'
      and membership.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.school_memberships membership
    where membership.id = occurrence_recipients.membership_id
      and membership.user_id = auth.uid()
      and membership.role = 'family'
      and membership.status = 'active'
  )
);

revoke update on public.occurrence_recipients from authenticated;
grant update (viewed_at, acknowledged_at) on public.occurrence_recipients to authenticated;
