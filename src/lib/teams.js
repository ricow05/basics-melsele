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

function compareSeasons(left, right) {
  return String(left || "").localeCompare(String(right || ""), "nl-BE", { numeric: true });
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

function getSeasonEndYear(season) {
  const matches = String(season || "").match(/(\d{4})\D+(\d{4})/);
  if (!matches) return null;
  return Number(matches[2]);
}

function getSeasonYears(season) {
  const matches = String(season || "").match(/(\d{4})\D+(\d{4})/);
  if (!matches) return null;

  return {
    startYear: Number(matches[1]),
    endYear: Number(matches[2]),
  };
}

function getPreviousSeason(season) {
  const years = getSeasonYears(season);
  if (!years) return null;
  return `${years.startYear - 1} ${years.endYear - 1}`;
}

function getAgeCategoryNumber(ageCategory) {
  const youthMatch = String(ageCategory || "").trim().match(/^U(\d+)$/i);
  if (!youthMatch) return null;
  return Number(youthMatch[1]);
}

function getBirthDateFilter(team) {
  const seasonEndYear = getSeasonEndYear(team?.season);
  const ageCategory = String(team?.age_category || "").trim();
  if (!seasonEndYear || !ageCategory) return null;

  if (ageCategory === "seniors") {
    return {
      operator: "lte",
      value: `${seasonEndYear - 15}-12-31`,
    };
  }

  const youthMatch = ageCategory.match(/^U(\d+)$/i);
  if (!youthMatch) return null;

  return {
    operator: "gte",
    value: `${seasonEndYear - Number(youthMatch[1])}-01-01`,
  };
}

function getRecommendedBirthYears(team) {
  const seasonEndYear = getSeasonEndYear(team?.season);
  const ageNumber = getAgeCategoryNumber(team?.age_category);
  if (!seasonEndYear || !ageNumber) return null;

  return [seasonEndYear - ageNumber, seasonEndYear - ageNumber + 1];
}

function normalizeTeamGender(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "M" || normalized === "V") return normalized;
  return null;
}

function matchesTeamGender(member, team) {
  const teamGender = normalizeTeamGender(team?.gender);
  if (!teamGender) return true;
  return normalizeTeamGender(member?.gender) === teamGender;
}

function formatMemberName(member) {
  const firstName = String(member?.first_name || "").trim();
  const lastName = String(member?.last_name || "").trim();
  return [firstName, lastName].filter(Boolean).join(" ");
}

function sortMembersByName(members) {
  return [...members].sort((left, right) => {
    const leftName = formatMemberName(left);
    const rightName = formatMemberName(right);
    return leftName.localeCompare(rightName, "nl-BE", { numeric: true });
  });
}

function getBirthYear(member) {
  const match = String(member?.birth_date || "").match(/^(\d{4})/);
  if (!match) return null;
  return Number(match[1]);
}

async function getSeniorRecommendedMemberIds(team) {
  const previousSeason = getPreviousSeason(team?.season);
  if (!previousSeason || !team?.team_name) {
    return { data: new Set(), error: null };
  }

  const { data: previousTeams, error: teamsError } = await supabase
    .from("teams")
    .select("source_team_id")
    .eq("season", previousSeason)
    .eq("team_name", team.team_name);

  if (teamsError) {
    return { data: new Set(), error: teamsError };
  }

  const previousTeamIds = [...new Set((previousTeams || []).map((entry) => entry.source_team_id).filter(Boolean))];
  if (previousTeamIds.length === 0) {
    return { data: new Set(), error: null };
  }

  const { data: previousPlayers, error: playersError } = await supabase
    .from("team_players")
    .select("source_member_id")
    .in("source_team_id", previousTeamIds);

  if (playersError) {
    return { data: new Set(), error: playersError };
  }

  return {
    data: new Set((previousPlayers || []).map((entry) => entry.source_member_id).filter(Boolean)),
    error: null,
  };
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
    (teamRows || []).map((entry) => [entry.source_team_id, entry.season])
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

async function getNextTeamPlayerId() {
  const { data, error } = await supabase
    .from("team_players")
    .select("source_team_player_id")
    .order("source_team_player_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  return {
    data: Number(data?.source_team_player_id || 0) + 1,
    error: null,
  };
}

function buildTeamPlayerPayload(team, member) {
  return {
    source_team_id: team.source_team_id,
    team_name: team.team_name || null,
    source_member_id: member.source_member_id,
    member_name: formatMemberName(member) || member.member_name || null,
    role_primary: "speler",
  };
}

async function insertTeamPlayer(payload) {
  const { data, error } = await supabase
    .from("team_players")
    .insert([payload])
    .select("source_team_player_id, source_member_id, member_name, shirt_number, role_primary, role_secondary, role_tertiary, position_primary, position_secondary")
    .single();

  return {
    data: error ? null : data,
    error,
  };
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

export async function getEligiblePlayersForTeam(team) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: [], error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  if (!team?.source_team_id) {
    return { data: [], error: new Error("Geen ploeg geselecteerd.") };
  }

  const previousSeason = getPreviousSeason(team.season);
  let query = supabase
    .from("club_members")
    .select("source_member_id, first_name, last_name, birth_date, gender, last_active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (previousSeason) {
    query = query.eq("last_active", previousSeason);
  }

  const birthDateFilter = getBirthDateFilter(team);
  if (birthDateFilter?.operator === "gte") {
    query = query.gte("birth_date", birthDateFilter.value);
  }

  if (birthDateFilter?.operator === "lte") {
    query = query.lte("birth_date", birthDateFilter.value);
  }

  const [{ data: memberRows, error: membersError }, { data: currentRows, error: currentError }] = await Promise.all([
    query,
    supabase
      .from("team_players")
      .select("source_member_id")
      .eq("source_team_id", team.source_team_id),
  ]);

  if (membersError) {
    const missingLastActiveColumn = Boolean(membersError?.message && /last_active/i.test(membersError.message));
    if (!missingLastActiveColumn) {
      return { data: [], error: membersError };
    }

    const { data: fallbackMembers, error: fallbackError } = await supabase
      .from("club_members")
      .select("source_member_id, first_name, last_name, birth_date, gender")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (fallbackError) {
      return { data: [], error: fallbackError };
    }

    const existingMemberIds = new Set(
      (currentRows || []).map((row) => row.source_member_id).filter(Boolean)
    );

    const { data: lastActiveByMemberId, error: lastActiveError } = await getLastActiveMap(
      (fallbackMembers || []).map((member) => member.source_member_id)
    );

    if (lastActiveError) {
      return { data: [], error: lastActiveError };
    }

    const eligiblePlayers = sortMembersByName(
      (fallbackMembers || [])
        .filter((member) => !existingMemberIds.has(member.source_member_id))
        .filter((member) => !previousSeason || lastActiveByMemberId[member.source_member_id] === previousSeason)
        .filter((member) => matchesTeamGender(member, team))
        .map((member) => ({
          ...member,
          last_active: lastActiveByMemberId[member.source_member_id] || "",
          member_name: formatMemberName(member),
        }))
    );

    let recommendedPlayers = [];

    if (String(team?.age_category || "").trim() === "seniors") {
      const seniorRecommendedResult = await getSeniorRecommendedMemberIds(team);
      if (seniorRecommendedResult.error) {
        return { data: { eligiblePlayers: [], recommendedPlayers: [] }, error: seniorRecommendedResult.error };
      }

      recommendedPlayers = eligiblePlayers.filter((member) => seniorRecommendedResult.data.has(member.source_member_id));
    } else {
      const recommendedBirthYears = getRecommendedBirthYears(team);
      recommendedPlayers = recommendedBirthYears === null
        ? []
        : eligiblePlayers.filter((member) => recommendedBirthYears.includes(getBirthYear(member)));
    }

    return {
      data: {
        eligiblePlayers,
        recommendedPlayers,
      },
      error: null,
    };
  }

  if (membersError) {
    return { data: [], error: membersError };
  }

  if (currentError) {
    return { data: [], error: currentError };
  }

  const existingMemberIds = new Set(
    (currentRows || []).map((row) => row.source_member_id).filter(Boolean)
  );

  const eligiblePlayers = sortMembersByName(
    (memberRows || [])
      .filter((member) => !existingMemberIds.has(member.source_member_id))
      .filter((member) => matchesTeamGender(member, team))
      .map((member) => ({
        ...member,
        member_name: formatMemberName(member),
      }))
  );

  let recommendedPlayers = [];

  if (String(team?.age_category || "").trim() === "seniors") {
    const seniorRecommendedResult = await getSeniorRecommendedMemberIds(team);
    if (seniorRecommendedResult.error) {
      return { data: { eligiblePlayers: [], recommendedPlayers: [] }, error: seniorRecommendedResult.error };
    }

    recommendedPlayers = eligiblePlayers.filter((member) => seniorRecommendedResult.data.has(member.source_member_id));
  } else {
    const recommendedBirthYears = getRecommendedBirthYears(team);
    recommendedPlayers = recommendedBirthYears === null
      ? []
      : eligiblePlayers.filter((member) => recommendedBirthYears.includes(getBirthYear(member)));
  }

  return {
    data: {
      eligiblePlayers,
      recommendedPlayers,
    },
    error: null,
  };
}

export async function addPlayerToTeam(team, member) {
  if (!hasSupabaseEnv || !supabase) {
    return { data: null, error: new Error("Supabase omgevingsvariabelen ontbreken.") };
  }

  if (!team?.source_team_id) {
    return { data: null, error: new Error("Geen ploeg geselecteerd.") };
  }

  if (!member?.source_member_id) {
    return { data: null, error: new Error("Geen lid geselecteerd.") };
  }

  const { data: existingRow, error: existingError } = await supabase
    .from("team_players")
    .select("source_team_player_id")
    .eq("source_team_id", team.source_team_id)
    .eq("source_member_id", member.source_member_id)
    .maybeSingle();

  if (existingError) {
    return { data: null, error: existingError };
  }

  if (existingRow) {
    return { data: null, error: new Error("Deze speler zit al in deze ploeg.") };
  }

  const payload = buildTeamPlayerPayload(team, member);
  const insertResult = await insertTeamPlayer(payload);
  if (!insertResult.error) {
    return insertResult;
  }

  const requiresExplicitId = /source_team_player_id/i.test(insertResult.error.message || "");
  if (!requiresExplicitId) {
    return insertResult;
  }

  const nextIdResult = await getNextTeamPlayerId();
  if (nextIdResult.error) {
    return { data: null, error: nextIdResult.error };
  }

  return insertTeamPlayer({
    ...payload,
    source_team_player_id: nextIdResult.data,
  });
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