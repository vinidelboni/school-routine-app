create type public.family_contact_kind as enum (
  'primary_guardian',
  'additional_guardian',
  'emergency_contact',
  'pickup_only'
);

create type public.family_access_status as enum (
  'not_invited',
  'pending',
  'active',
  'expired',
  'suspended'
);

create table public.family_contacts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  email text,
  phone text not null,
  access_status public.family_access_status not null default 'not_invited',
  invited_at timestamptz,
  invitation_expires_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone <> '')
);

create table public.child_contact_links (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  contact_id uuid not null references public.family_contacts(id) on delete cascade,
  kind public.family_contact_kind not null,
  relationship text not null,
  can_view_routine boolean not null default false,
  can_view_photos boolean not null default false,
  can_view_communications boolean not null default false,
  can_view_documents boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, contact_id),
  check (
    kind in ('primary_guardian', 'additional_guardian')
    or (
      not can_view_routine
      and not can_view_photos
      and not can_view_communications
      and not can_view_documents
    )
  )
);

create unique index family_contacts_school_email_unique
on public.family_contacts (school_id, lower(email))
where email is not null;

create index family_contacts_school_status_idx
on public.family_contacts (school_id, access_status);

create index child_contact_links_child_idx
on public.child_contact_links (child_id, active);

create trigger family_contacts_touch before update on public.family_contacts
for each row execute function public.touch_updated_at();

create trigger child_contact_links_touch before update on public.child_contact_links
for each row execute function public.touch_updated_at();

alter table public.family_contacts enable row level security;
alter table public.child_contact_links enable row level security;

create policy family_contacts_manage_director on public.family_contacts
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));

create policy child_contact_links_manage_director on public.child_contact_links
for all to authenticated
using (public.has_school_role(school_id, array['director']::public.school_role[]))
with check (public.has_school_role(school_id, array['director']::public.school_role[]));
