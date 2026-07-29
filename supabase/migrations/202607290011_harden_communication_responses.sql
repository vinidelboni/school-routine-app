create or replace function public.validate_communication_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_kind public.communication_kind;
begin
  if new.response is null then
    return new;
  end if;

  select kind into target_kind
  from public.communications
  where id = new.communication_id;

  if target_kind = 'important' and new.response = 'acknowledged' then
    return new;
  elsif target_kind = 'authorization' and new.response in ('authorized', 'not_authorized') then
    return new;
  elsif target_kind = 'item_request' and new.response in ('will_send', 'sent', 'cannot_send') then
    return new;
  end if;

  raise exception 'Resposta incompatível com o tipo do comunicado.';
end;
$$;

create trigger validate_communication_response_trigger
before insert or update of response on public.communication_recipients
for each row execute function public.validate_communication_response();

revoke update on public.communication_recipients from authenticated;
grant update (viewed_at, response, responded_at)
on public.communication_recipients to authenticated;
