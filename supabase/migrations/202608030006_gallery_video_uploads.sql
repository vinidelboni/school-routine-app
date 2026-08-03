create type public.gallery_media_type as enum ('image', 'video');

alter table public.photo_publications
add column media_type public.gallery_media_type not null default 'image',
add column mime_type text not null default 'image/jpeg',
add column file_size_bytes bigint not null default 0 check (file_size_bytes between 0 and 52428800);

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ]
where id = 'school-photos';

create policy school_photos_delete_staff on storage.objects
for delete to authenticated
using (
  bucket_id = 'school-photos'
  and public.has_school_role((storage.foldername(name))[1]::uuid, array['teacher', 'director']::public.school_role[])
);
