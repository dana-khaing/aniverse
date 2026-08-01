drop policy if exists "creator editors replace title artwork" on storage.objects;
create policy "creator editors replace title artwork"
on storage.objects for update to authenticated
using (
  bucket_id = 'title-artwork'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'title-artwork'
  and owner_id = (select auth.uid())::text
);

drop policy if exists "hosts manage invitations" on public.watch_party_invitations;
create policy "hosts manage invitations"
on public.watch_party_invitations for update to authenticated
using (
  exists (
    select 1 from public.watch_parties
    where id = watch_party_invitations.party_id
      and host_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.watch_parties
    where id = watch_party_invitations.party_id
      and host_id = (select auth.uid())
  )
);
