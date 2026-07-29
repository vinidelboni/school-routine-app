create type public.billing_batch_status as enum ('review', 'distributed');
create type public.billing_document_status as enum ('matched', 'needs_review', 'distributed');

create table public.billing_batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  reference_month date not null,
  status public.billing_batch_status not null default 'review',
  created_by uuid not null references public.profiles(id),
  distributed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.billing_documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  batch_id uuid not null references public.billing_batches(id) on delete cascade,
  child_id uuid references public.children(id) on delete restrict,
  original_filename text not null,
  due_date date not null,
  payment_reference text not null,
  match_confidence numeric(5,2) not null default 0,
  status public.billing_document_status not null default 'needs_review',
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (match_confidence >= 0 and match_confidence <= 100),
  check (status <> 'distributed' or child_id is not null)
);

create index billing_batches_school_created_idx
on public.billing_batches (school_id, created_at desc);
create index billing_documents_batch_idx on public.billing_documents (batch_id);
create index billing_documents_child_status_idx on public.billing_documents (child_id, status);

alter table public.billing_batches enable row level security;
alter table public.billing_documents enable row level security;

create policy billing_batches_manage_director on public.billing_batches
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy billing_documents_manage_director on public.billing_documents
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy billing_documents_read_family on public.billing_documents
for select to authenticated
using (
  status = 'distributed'
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = billing_documents.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
  )
);

create policy billing_documents_update_view_family on public.billing_documents
for update to authenticated
using (
  status = 'distributed'
  and exists (
    select 1
    from public.guardian_links gl
    join public.school_memberships sm on sm.id = gl.membership_id
    where gl.child_id = billing_documents.child_id
      and gl.active
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role = 'family'
  )
)
with check (status = 'distributed');
