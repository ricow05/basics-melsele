alter table public.club_members
add column if not exists last_active text;

create or replace function public.refresh_club_members_last_active()
returns void
language sql
as $$
  update public.club_members
  set last_active = null;

  with ranked_seasons as (
    select
      tp.source_member_id,
      t.season,
      row_number() over (
        partition by tp.source_member_id
        order by
          coalesce(nullif(substring(t.season from '^\d{4}'), ''), '0')::int desc,
          t.season desc,
          tp.source_team_id desc
      ) as row_num
    from public.team_players tp
    join public.teams t
      on t.source_team_id::text = tp.source_team_id::text
    where tp.source_member_id is not null
      and t.season is not null
      and btrim(t.season) <> ''
  )
  update public.club_members cm
  set last_active = ranked_seasons.season
  from ranked_seasons
  where cm.source_member_id::text = ranked_seasons.source_member_id::text
    and ranked_seasons.row_num = 1;
$$;

select public.refresh_club_members_last_active();
