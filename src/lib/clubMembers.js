import { hasSupabaseEnv, supabase } from "./supabase";

export const CLUB_MEMBERS_PAGE_SIZE = 50;

function buildClubMembersSelect(includeMemberNumber = true) {
  const fields = [
    "source_member_id",
    "first_name",
    "last_name",
    "birth_date",
    "gender",
    "membership_role",
    "postcode",
    "email_primary",
    "email_secondary",
    "relations",
    "joined_at",
  ];

  if (includeMemberNumber) {
    fields.splice(3, 0, "member_number");
  }

  return fields.join(", ");
}

function buildSearchFilter(searchTerm, includeMemberNumber = true) {
  const term = (searchTerm || "").trim();
  if (!term) return "";

  const escaped = term.replace(/,/g, " ");
  const filters = [
    `first_name.ilike.%${escaped}%`,
    `last_name.ilike.%${escaped}%`,
    `email_primary.ilike.%${escaped}%`,
    `email_secondary.ilike.%${escaped}%`,
    `postcode.ilike.%${escaped}%`,
  ];

  if (includeMemberNumber) {
    filters.splice(2, 0, `member_number.ilike.%${escaped}%`);
  }

  return filters.join(",");
}

function compareSeasons(left, right) {
  return String(left || "").localeCompare(String(right || ""), "nl-BE", { numeric: true });
}

const ACTIVE_SEASON = "2025 2026";

function buildClubMembersQuery({ from, to, searchFilter, includeLastActive, includeMemberNumber, activeOnly }) {
  let query = supabase
    .from("club_members")
    .select(
      includeLastActive
        ? `${buildClubMembersSelect(includeMemberNumber)}, last_active`
        : buildClubMembersSelect(includeMemberNumber),
      { count: "exact" }
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  if (searchFilter) {
    query = query.or(searchFilter);
  }

  if (activeOnly && includeLastActive) {
    query = query.eq("last_active", ACTIVE_SEASON);
  }

  return query;
}

async function getLastActiveMap(sourceMemberIds) {
  const memberIds = [...new Set((sourceMemberIds || []).filter(Boolean))];
  if (memberIds.length === 0) {
    return { data: {}, error: null };
  }

  const { data: playerRows, error: playerError } = await supabase
    .from("team_players")
    .select("source_member_id, source_team_id")
    .in("source_member_id", memberIds);

  if (playerError) {
    return { data: {}, error: playerError };
  }

  const teamIds = [...new Set((playerRows || []).map((row) => row.source_team_id).filter(Boolean))];
  if (teamIds.length === 0) {
    return { data: {}, error: null };
  }

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("source_team_id, season")
    .in("source_team_id", teamIds);

  if (teamError) {
    return { data: {}, error: teamError };
  }

  const teamSeasonById = Object.fromEntries(
    (teamRows || []).map((team) => [team.source_team_id, team.season])
  );

  const lastActiveByMemberId = {};
  for (const row of playerRows || []) {
    const season = teamSeasonById[row.source_team_id];
    if (!season) continue;

    const currentSeason = lastActiveByMemberId[row.source_member_id];
    if (!currentSeason || compareSeasons(season, currentSeason) > 0) {
      lastActiveByMemberId[row.source_member_id] = season;
    }
  }

  return { data: lastActiveByMemberId, error: null };
}

export async function getClubMembers({ page = 1, pageSize = CLUB_MEMBERS_PAGE_SIZE, searchTerm = "", activeOnly = false } = {}) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], count: 0, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const searchFilter = buildSearchFilter(searchTerm, true);

  let { data, error, count } = await buildClubMembersQuery({
    from,
    to,
    searchFilter,
    includeLastActive: true,
    includeMemberNumber: true,
    activeOnly,
  });

  const missingMemberNumberColumn = Boolean(error?.message && /member_number/i.test(error.message));
  const missingLastActiveColumn = Boolean(error?.message && /last_active/i.test(error.message));

  if (missingMemberNumberColumn || missingLastActiveColumn) {
    ({ data, error, count } = await buildClubMembersQuery({
      from,
      to,
      searchFilter: buildSearchFilter(searchTerm, !missingMemberNumberColumn),
      includeLastActive: !missingLastActiveColumn,
      includeMemberNumber: !missingMemberNumberColumn,
      activeOnly: !missingLastActiveColumn && activeOnly,
    }));
  }

  let members = Array.isArray(data) ? data : [];

  if (!error && members.length > 0) {
    const shouldHydrateLastActive = missingLastActiveColumn || members.some((member) => !member.last_active);

    if (shouldHydrateLastActive) {
      const { data: lastActiveByMemberId } = await getLastActiveMap(
        members.map((member) => member.source_member_id)
      );

      members = members.map((member) => ({
        ...member,
        last_active: lastActiveByMemberId[member.source_member_id] || member.last_active || "",
      }));

      // When the column didn't exist, filter in memory after hydration.
      if (missingLastActiveColumn && activeOnly) {
        members = members.filter((member) => member.last_active === ACTIVE_SEASON);
        count = members.length;
      }
    }
  }

  return {
    data: members,
    count: typeof count === "number" ? count : 0,
    error,
  };
}

export async function getMemberTeams(sourceMemberId) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const { data: playerRows, error: playerError } = await supabase
    .from("team_players")
    .select("source_team_id, team_name, shirt_number, role_primary, position_primary")
    .eq("source_member_id", sourceMemberId);

  if (playerError) return { data: [], error: playerError };
  if (!playerRows || playerRows.length === 0) return { data: [], error: null };

  const teamIds = [...new Set(playerRows.map((r) => r.source_team_id).filter(Boolean))];

  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("source_team_id, season, category, team_name, gender, age_category")
    .in("source_team_id", teamIds);

  if (teamError) return { data: [], error: teamError };

  const teamMap = Object.fromEntries((teamRows || []).map((t) => [t.source_team_id, t]));

  const combined = playerRows.map((p) => ({
    ...p,
    team: teamMap[p.source_team_id] || null,
  }));

  return { data: combined, error: null };
}