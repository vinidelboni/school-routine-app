create or replace function public.get_family_shell_context(target_membership_id uuid)
returns table (child_first_name text, child_last_name text, notification_count bigint)
language sql stable security invoker set search_path = public
as $$
  select child.first_name, child.last_name,
    ((select count(*) from public.communication_recipients item where item.membership_id = target_membership_id and item.viewed_at is null)
    + (select count(*) from public.occurrence_recipients item where item.membership_id = target_membership_id and item.acknowledged_at is null)
    + (select count(*) from public.billing_documents item where item.status = 'distributed' and item.viewed_at is null)
    + (select count(*) from public.school_document_recipients item where item.membership_id = target_membership_id and item.viewed_at is null)
    + (select count(*) from public.school_event_recipients item join public.school_events event on event.id = item.event_id where item.membership_id = target_membership_id and item.viewed_at is null and event.status = 'published')
    + (select count(*) from public.school_event_reminders item where item.membership_id = target_membership_id and item.viewed_at is null))::bigint
  from public.school_memberships membership
  left join lateral (
    select linked_child.first_name, linked_child.last_name
    from public.guardian_links link
    join public.children linked_child on linked_child.id = link.child_id
    where link.membership_id = membership.id and link.active = true
    order by link.created_at limit 1
  ) child on true
  where membership.id = target_membership_id and membership.user_id = auth.uid()
    and membership.role = 'family' and membership.status = 'active';
$$;

revoke all on function public.get_family_shell_context(uuid) from public, anon;
grant execute on function public.get_family_shell_context(uuid) to authenticated;
