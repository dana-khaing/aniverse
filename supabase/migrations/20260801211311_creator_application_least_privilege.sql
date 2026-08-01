create or replace function public.submit_creator_application(p_channel_name text,p_legal_name text,p_portfolio_url text,p_rights_summary text)
returns public.creator_applications language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); existing public.creator_applications%rowtype; result public.creator_applications%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_channel_name)) not between 2 and 80 or char_length(trim(p_legal_name)) not between 2 and 120
    or char_length(trim(p_rights_summary)) not between 40 and 4000 then raise exception 'Invalid application'; end if;
  select * into existing from public.creator_applications where user_id=actor for update;
  if existing.status in ('submitted','approved') then raise exception 'Application is already active'; end if;
  insert into public.creator_applications(user_id,channel_name,legal_name,portfolio_url,rights_summary,status,submitted_at,reviewed_at,reviewed_by,review_notes,updated_at)
  values(actor,trim(p_channel_name),trim(p_legal_name),nullif(trim(p_portfolio_url),''),trim(p_rights_summary),'submitted',now(),null,null,null,now())
  on conflict(user_id) do update set channel_name=excluded.channel_name,legal_name=excluded.legal_name,portfolio_url=excluded.portfolio_url,
    rights_summary=excluded.rights_summary,status='submitted',submitted_at=now(),reviewed_at=null,reviewed_by=null,review_notes=null,updated_at=now()
  returning * into result; return result;
end $$;
revoke execute on function public.submit_creator_application(text,text,text,text) from public,anon;
grant execute on function public.submit_creator_application(text,text,text,text) to authenticated;
