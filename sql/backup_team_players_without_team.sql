-- Backup table for team_players rows that reference a non-existing team.
create table if not exists public.team_players_backup_missing_team (
  source_team_player_id bigint not null,
  source_team_id bigint null,
  team_name text null,
  source_member_id bigint not null,
  member_name text null,
  shirt_number integer null,
  role_primary text null,
  role_secondary text null,
  role_tertiary text null,
  position_primary text null,
  position_secondary text null,
  membership_discount numeric null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null,
  backed_up_at timestamp with time zone not null default now(),
  backup_reason text not null default 'missing_team',
  constraint team_players_backup_missing_team_pkey primary key (source_team_player_id)
);

create index if not exists tp_backup_missing_team_source_team_id_idx
  on public.team_players_backup_missing_team using btree (source_team_id);

create index if not exists tp_backup_missing_team_source_member_id_idx
  on public.team_players_backup_missing_team using btree (source_member_id);

-- Insert every team_players row that has a source_team_id without a matching teams row.
insert into public.team_players_backup_missing_team (
  source_team_player_id,
  source_team_id,
  team_name,
  source_member_id,
  member_name,
  shirt_number,
  role_primary,
  role_secondary,
  role_tertiary,
  position_primary,
  position_secondary,
  membership_discount,
  created_at,
  updated_at
)
select
  tp.source_team_player_id,
  tp.source_team_id,
  tp.team_name,
  tp.source_member_id,
  tp.member_name,
  tp.shirt_number,
  tp.role_primary,
  tp.role_secondary,
  tp.role_tertiary,
  tp.position_primary,
  tp.position_secondary,
  tp.membership_discount,
  tp.created_at,
  tp.updated_at
from public.team_players tp
left join public.teams t
  on t.source_team_id = tp.source_team_id
where tp.source_team_id is not null
  and t.source_team_id is null
on conflict (source_team_player_id) do update
set
  source_team_id = excluded.source_team_id,
  team_name = excluded.team_name,
  source_member_id = excluded.source_member_id,
  member_name = excluded.member_name,
  shirt_number = excluded.shirt_number,
  role_primary = excluded.role_primary,
  role_secondary = excluded.role_secondary,
  role_tertiary = excluded.role_tertiary,
  position_primary = excluded.position_primary,
  position_secondary = excluded.position_secondary,
  membership_discount = excluded.membership_discount,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  backed_up_at = now();

-- Optional: inspect latest backed up orphan rows.
select *
from public.team_players_backup_missing_team
order by backed_up_at desc, source_team_player_id desc;

-- Delete orphan rows from the original team_players table.
delete from public.team_players tp
where tp.source_team_id is not null
  and not exists (
    select 1
    from public.teams t
    where t.source_team_id = tp.source_team_id
  );

-- Optional: verify that no orphan rows remain in team_players.
select count(*) as remaining_orphan_team_players
from public.team_players tp
where tp.source_team_id is not null
  and not exists (
    select 1
    from public.teams t
    where t.source_team_id = tp.source_team_id
  );
