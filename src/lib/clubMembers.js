import { hasSupabaseEnv, supabase } from "./supabase";

export const CLUB_MEMBERS_PAGE_SIZE = 50;

function buildSearchFilter(searchTerm) {
  const term = (searchTerm || "").trim();
  if (!term) return "";

  const escaped = term.replace(/,/g, " ");
  return [
    `first_name.ilike.%${escaped}%`,
    `last_name.ilike.%${escaped}%`,
    `member_number.ilike.%${escaped}%`,
    `email_primary.ilike.%${escaped}%`,
    `email_secondary.ilike.%${escaped}%`,
    `postcode.ilike.%${escaped}%`,
  ].join(",");
}

export async function getClubMembers({ page = 1, pageSize = CLUB_MEMBERS_PAGE_SIZE, searchTerm = "" } = {}) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], count: 0, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const searchFilter = buildSearchFilter(searchTerm);

  let query = supabase
    .from("club_members")
    .select(
      "source_member_id, first_name, last_name, member_number, birth_date, gender, membership_role, postcode, email_primary, email_secondary, relations, joined_at",
      { count: "exact" }
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(from, to);

  if (searchFilter) {
    query = query.or(searchFilter);
  }

  const { data, error, count } = await query;
  return {
    data: Array.isArray(data) ? data : [],
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