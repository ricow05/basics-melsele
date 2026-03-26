create table public.club_members (
  source_member_id bigint not null,
  first_name text null,
  last_name text null,
  birth_date date null,
  gender text null,
  membership_role text null,
  postcode text null,
  email_primary text null,
  email_secondary text null,
  relations text null,
  joined_at date null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_active text null,
  constraint club_members_pkey primary key (source_member_id),
  constraint club_members_gender_check check (
    (
      (gender = any (array['M'::text, 'V'::text]))
      or (gender is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists club_members_last_name_idx on public.club_members using btree (last_name) TABLESPACE pg_default;

create unique INDEX IF not exists club_members_source_member_id_idx on public.club_members using btree (source_member_id) TABLESPACE pg_default
where
  (source_member_id is not null);