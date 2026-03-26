import { hasSupabaseEnv, supabase } from "./supabase";

export const TEAM_AGE_ORDER = [
  "seniors",
  "U21",
  "U19",
  "U18",
  "U16",
  "U14",
  "U12",
  "U10",
  "U8",
  "basketschool",
];

function sortSeasons(seasons) {
  return [...seasons].sort((left, right) => right.localeCompare(left, "nl-BE", { numeric: true }));
}

export function getUpcomingSeason(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentSeasonStartYear = month >= 7 ? currentYear : currentYear - 1;
  const upcomingSeasonStartYear = currentSeasonStartYear + 1;

  return `${upcomingSeasonStartYear} ${upcomingSeasonStartYear + 1}`;
}

export function getCurrentSeason(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentSeasonStartYear = month >= 7 ? currentYear : currentYear - 1;

  return `${currentSeasonStartYear} ${currentSeasonStartYear + 1}`;
}

export function sortTeamsByAgeOrder(teams) {
  return [...teams].sort((left, right) => {
    const leftIndex = TEAM_AGE_ORDER.indexOf(left.age_category);
    const rightIndex = TEAM_AGE_ORDER.indexOf(right.age_category);
    const safeLeftIndex = leftIndex === -1 ? TEAM_AGE_ORDER.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? TEAM_AGE_ORDER.length : rightIndex;

    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }

    return String(left.team_name || "").localeCompare(String(right.team_name || ""), "nl-BE", {
      numeric: true,
    });
  });
}

export async function getTeamSeasons() {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const { data, error } = await supabase
    .from("teams")
    .select("season")
    .not("season", "is", null);

  if (error) {
    return { data: [], error };
  }

  const seasons = sortSeasons(
    [...new Set((data || []).map((item) => item.season).filter(Boolean))]
  );

  return { data: seasons, error: null };
}

export async function getTeams({ season = "" } = {}) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  let query = supabase
    .from("teams")
    .select("source_team_id, season, category, team_name, rank, gender, membership_fee, age_category")
    .order("season", { ascending: false })
    .order("category", { ascending: true })
    .order("team_name", { ascending: true });

  if (season) {
    query = query.eq("season", season);
  }

  const { data, error } = await query;
  return {
    data: Array.isArray(data) ? data : [],
    error,
  };
}

export async function createTeam(team) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const payload = {
    season: team.season || null,
    category: team.category || null,
    team_name: team.team_name || null,
    gender: team.gender ?? null,
    age_category: team.age_category || null,
    rank: null,
    membership_fee: null,
    photo_path: null,
  };

  const { data, error } = await supabase
    .from("teams")
    .insert([payload])
    .select("source_team_id, season, category, team_name, rank, gender, membership_fee, age_category")
    .single();

  return {
    data: error ? null : data,
    error,
  };
}

export async function getTeamPlayers(sourceTeamId) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const { data, error } = await supabase
    .from("team_players")
    .select("source_team_player_id, source_member_id, member_name, shirt_number, role_primary, role_secondary, role_tertiary, position_primary, position_secondary")
    .eq("source_team_id", sourceTeamId)
    .order("shirt_number", { ascending: true, nullsFirst: false })
    .order("member_name", { ascending: true });

  return {
    data: Array.isArray(data) ? data : [],
    error,
  };
}

export async function updateTeam(sourceTeamId, updates) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("source_team_id", sourceTeamId)
    .select("source_team_id, season, category, team_name, rank, gender, membership_fee, age_category")
    .single();

  return {
    data: error ? null : data,
    error,
  };
}