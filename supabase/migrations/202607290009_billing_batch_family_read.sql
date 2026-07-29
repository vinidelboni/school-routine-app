create policy billing_batches_read_family on public.billing_batches
for select to authenticated
using (
  status = 'distributed'
  and exists (
    select 1
    from public.billing_documents bd
    join public.guardian_links gl on gl.child_id = bd.child_id
    join public.school_memberships sm on sm.id = gl.membership_id
    where bd.batch_id = billing_batches.id
      and bd.status = 'distributed'
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
  )
);
