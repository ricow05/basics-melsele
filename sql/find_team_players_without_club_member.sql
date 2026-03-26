-- Team player rows whose source_member_id does not exist in club_members.
select
  tp.*
from public.team_players tp
left join public.club_members cm
  on cm.source_member_id::text = tp.source_member_id::text
where tp.source_member_id is not null
  and btrim(tp.source_member_id::text) <> ''
  and cm.source_member_id is null
order by tp.source_member_id, tp.source_team_id;

-- Optional summary: unique missing source_member_id values + row counts.
select
  tp.source_member_id,
  count(*) as team_player_rows
from public.team_players tp
left join public.club_members cm
  on cm.source_member_id::text = tp.source_member_id::text
where tp.source_member_id is not null
  and btrim(tp.source_member_id::text) <> ''
  and cm.source_member_id is null
group by tp.source_member_id
order by tp.source_member_id;

-- Initialize placeholder club_members rows for all missing source_member_id values.
with missing_member_ids as (
  select
    tp.source_member_id,
    max(nullif(btrim(tp.member_name), '')) as member_name
  from public.team_players tp
  where tp.source_member_id is not null
    and btrim(tp.source_member_id::text) <> ''
    and not exists (
      select 1
      from public.club_members cm
      where cm.source_member_id::text = tp.source_member_id::text
    )
  group by tp.source_member_id
)
insert into public.club_members (
  source_member_id,
  first_name,
  last_name
)
select
  m.source_member_id,
  case
    when m.member_name is null then null
    else nullif(split_part(m.member_name, ' ', 1), '')
  end as first_name,
  case
    when m.member_name is null then null
    when position(' ' in m.member_name) = 0 then null
    else nullif(btrim(substr(m.member_name, position(' ' in m.member_name) + 1)), '')
  end as last_name
from missing_member_ids m;
