create or replace function public.get_family_calendar_items(
  target_membership_id uuid,
  range_start date,
  range_end date
)
returns table (item_id text, item_date date, title text, detail text, kind text, href text)
language sql stable security invoker set search_path = public
as $$
  select 'summary-' || summary.id, day.day, 'Agenda de ' || child.first_name, summary.narrative, 'routine', '/app/family/history'
  from public.daily_summaries summary
  join public.school_days day on day.id = summary.school_day_id
  join public.children child on child.id = summary.child_id
  where day.day >= range_start and day.day < range_end
  union all
  select 'communication-' || recipient.id, coalesce(communication.event_date, communication.published_at::date), communication.title, null, 'communication', '/app/family/communications'
  from public.communication_recipients recipient
  join public.communications communication on communication.id = recipient.communication_id
  where recipient.membership_id = target_membership_id
    and coalesce(communication.event_date, communication.published_at::date) >= range_start
    and coalesce(communication.event_date, communication.published_at::date) < range_end
  union all
  select 'request-' || request.id, request.effective_date, 'Aviso sobre ' || child.first_name, replace(request.request_type::text, '_', ' '), 'request', '/app/family/requests'
  from public.family_requests request
  join public.children child on child.id = request.child_id
  where request.effective_date >= range_start and request.effective_date < range_end
  union all
  select 'occurrence-' || recipient.id, occurrence.occurred_at::date, occurrence.title, null, 'occurrence', '/app/family/occurrences'
  from public.occurrence_recipients recipient
  join public.occurrences occurrence on occurrence.id = recipient.occurrence_id
  where recipient.membership_id = target_membership_id
    and occurrence.occurred_at >= range_start::timestamptz
    and occurrence.occurred_at < range_end::timestamptz
  union all
  select 'medication-' || medication.id, medication.starts_on, medication.medication_name, child.first_name || ' · ' || left(medication.scheduled_time::text, 5), 'medication', '/app/family/medications'
  from public.medication_requests medication
  join public.children child on child.id = medication.child_id
  where medication.starts_on >= range_start and medication.starts_on < range_end
  order by 2, 1;
$$;

revoke all on function public.get_family_calendar_items(uuid, date, date) from public, anon;
grant execute on function public.get_family_calendar_items(uuid, date, date) to authenticated;
