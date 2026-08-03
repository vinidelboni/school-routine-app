alter table public.school_events
add column reminder_offsets_minutes integer[] not null default array[1440, 120],
add constraint school_events_reminder_offsets_check check (
  reminder_offsets_minutes <@ array[1440, 120]
  and cardinality(reminder_offsets_minutes) <= 2
);

create table public.school_event_reminders (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_id uuid not null references public.school_events(id) on delete cascade,
  recipient_id uuid not null references public.school_event_recipients(id) on delete cascade,
  membership_id uuid not null references public.school_memberships(id) on delete cascade,
  offset_minutes integer not null check (offset_minutes in (1440, 120)),
  scheduled_for timestamptz not null,
  delivered_at timestamptz not null default now(),
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, recipient_id, offset_minutes)
);

create index school_event_reminders_member_unread_idx
on public.school_event_reminders (membership_id, viewed_at, delivered_at desc);

alter table public.school_event_reminders enable row level security;

create policy school_event_reminders_manage_director on public.school_event_reminders
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy school_event_reminders_read_family on public.school_event_reminders
for select to authenticated
using (
  exists (
    select 1 from public.school_memberships sm
    where sm.id = school_event_reminders.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create policy school_event_reminders_update_family on public.school_event_reminders
for update to authenticated
using (
  exists (
    select 1 from public.school_memberships sm
    where sm.id = school_event_reminders.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.school_memberships sm
    where sm.id = school_event_reminders.membership_id
      and sm.user_id = auth.uid()
      and sm.role = 'family'
      and sm.status = 'active'
  )
);

create or replace function public.generate_school_event_reminders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  insert into public.school_event_reminders (
    school_id,
    event_id,
    recipient_id,
    membership_id,
    offset_minutes,
    scheduled_for
  )
  select
    event.school_id,
    event.id,
    recipient.id,
    recipient.membership_id,
    reminder.offset_minutes,
    event.starts_at - make_interval(mins => reminder.offset_minutes)
  from public.school_events event
  join public.school_event_recipients recipient on recipient.event_id = event.id
  cross join lateral unnest(event.reminder_offsets_minutes) as reminder(offset_minutes)
  where event.status = 'published'
    and event.starts_at > now()
    and event.starts_at - make_interval(mins => reminder.offset_minutes) <= now()
  on conflict (event_id, recipient_id, offset_minutes) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.generate_school_event_reminders() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'generate-school-event-reminders',
  '*/15 * * * *',
  $$select public.generate_school_event_reminders();$$
);
