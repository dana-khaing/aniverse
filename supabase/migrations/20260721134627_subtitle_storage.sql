insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('subtitles', 'subtitles', false, 5242880, array['text/vtt', 'application/x-subrip', 'text/plain'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "published subtitle files are readable"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'subtitles'
  and exists (
    select 1 from public.subtitle_tracks
    join public.episodes on episodes.id = subtitle_tracks.episode_id
    where subtitle_tracks.storage_path = storage.objects.name
      and episodes.status = 'published'
      and episodes.available_at <= now()
  )
);

create policy "creators upload subtitle files"
on storage.objects for insert to authenticated
with check (bucket_id = 'subtitles' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "creators update subtitle files"
on storage.objects for update to authenticated
using (bucket_id = 'subtitles' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'subtitles' and owner_id = (select auth.uid()::text));

create policy "creators delete subtitle files"
on storage.objects for delete to authenticated
using (bucket_id = 'subtitles' and owner_id = (select auth.uid()::text));
