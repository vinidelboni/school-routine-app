alter table public.family_contacts
add column membership_id uuid references public.school_memberships(id) on delete set null;

create unique index family_contacts_membership_unique
on public.family_contacts (membership_id)
where membership_id is not null;

create or replace function public.activate_current_user_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  activated_count integer;
begin
  update public.school_memberships
  set status = 'active', updated_at = now()
  where user_id = auth.uid() and status = 'invited';

  get diagnostics activated_count = row_count;

  update public.family_contacts contact
  set
    access_status = 'active',
    activated_at = now(),
    suspended_at = null,
    updated_at = now()
  from public.school_memberships membership
  where contact.membership_id = membership.id
    and membership.user_id = auth.uid()
    and membership.status = 'active';

  return activated_count;
end;
$$;

revoke all on function public.activate_current_user_invites() from public;
grant execute on function public.activate_current_user_invites() to authenticated;
