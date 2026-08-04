alter table public.profiles
add column avatar_path text;

alter table public.profiles
add constraint profiles_avatar_path_format_check check (
  avatar_path is null
  or avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-avatars',
  'teacher-avatars',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy teacher_avatars_read_own on storage.objects
for select to authenticated
using (
  bucket_id = 'teacher-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
