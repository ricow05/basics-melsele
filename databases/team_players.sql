create table public.team_players (
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
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint team_players_pkey primary key (source_team_player_id),
  constraint team_players_source_member_id_fkey foreign KEY (source_member_id) references club_members (source_member_id)
) TABLESPACE pg_default;

create index IF not exists team_players_team_name_idx on public.team_players using btree (team_name) TABLESPACE pg_default;

create index IF not exists team_players_source_member_id_idx on public.team_players using btree (source_member_id) TABLESPACE pg_default;

create unique INDEX IF not exists team_players_source_team_player_id_idx on public.team_players using btree (source_team_player_id) TABLESPACE pg_default
where
  (source_team_player_id is not null);

create index IF not exists team_players_source_team_id_idx on public.team_players using btree (source_team_id) TABLESPACE pg_default;