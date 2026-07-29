create type public.shift_key as enum ('morning', 'afternoon');
create type public.handoff_status as enum ('open', 'resolved');

create table public.shift_handoffs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  school_day_id uuid not null references public.school_days(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  from_shift public.shift_key not null,
  to_shift public.shift_key not null,
  note text not null,
  status public.handoff_status not null default 'open',
  created_by uuid not null references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (from_shift <> to_shift),
  check (char_length(trim(note)) between 3 and 500),
  check (
    (status = 'open' and resolved_at is null and resolved_by is null)
    or (status = 'resolved' and resolved_at is not null and resolved_by is not null)
  )
);

create index shift_handoffs_day_status_idx
on public.shift_handoffs(school_day_id, status, created_at desc);

alter table public.shift_handoffs enable row level security;

create policy handoffs_read_classroom on public.shift_handoffs
for select to authenticated
using (public.can_access_classroom(classroom_id));

create policy handoffs_write_staff on public.shift_handoffs
for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    public.has_school_role(school_id, array['director']::public.school_role[])
    or public.can_access_classroom(classroom_id)
  )
);

create policy handoffs_update_staff on public.shift_handoffs
for update to authenticated
using (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
)
with check (
  public.has_school_role(school_id, array['director']::public.school_role[])
  or public.can_access_classroom(classroom_id)
);

create or replace function public.resolve_shift_handoff(target_handoff_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_handoff public.shift_handoffs;
begin
  select * into target_handoff
  from public.shift_handoffs
  where id = target_handoff_id;

  if target_handoff.id is null then
    raise exception 'Passagem de turno não encontrada.';
  end if;

  if not (
    public.has_school_role(target_handoff.school_id, array['director']::public.school_role[])
    or public.can_access_classroom(target_handoff.classroom_id)
  ) then
    raise exception 'Acesso negado.';
  end if;

  update public.shift_handoffs
  set
    status = 'resolved',
    resolved_by = auth.uid(),
    resolved_at = now()
  where id = target_handoff_id
    and status = 'open';

  insert into public.audit_logs (
    school_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    target_handoff.school_id,
    auth.uid(),
    'shift_handoff.resolved',
    'shift_handoff',
    target_handoff.id::text,
    jsonb_build_object('school_day_id', target_handoff.school_day_id)
  );
end;
$$;

revoke all on function public.resolve_shift_handoff(uuid) from public;
revoke all on function public.resolve_shift_handoff(uuid) from anon;
grant execute on function public.resolve_shift_handoff(uuid) to authenticated;
