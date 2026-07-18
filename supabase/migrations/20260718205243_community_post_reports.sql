alter table public.reports drop constraint reports_entity_type_check;
alter table public.reports add constraint reports_entity_type_check
  check (entity_type in ('title', 'episode', 'comment', 'profile', 'community_post'));

create index reports_reporter_entity_active_idx
  on public.reports(reporter_id, entity_type, entity_id)
  where status in ('open', 'reviewing');
