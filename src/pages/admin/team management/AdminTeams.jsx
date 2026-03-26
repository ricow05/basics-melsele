import { useEffect, useMemo, useState } from "react";
import {
  addPlayerToTeam,
  createTeam,
  getCurrentSeason,
  getEligiblePlayersForTeam,
  getTeamPlayers,
  getTeams,
  getTeamSeasons,
  getUpcomingSeason,
  updateTeam,
} from "../../../lib/teams";
import { hasSupabaseEnv } from "../../../lib/supabase";
import {
  filterTeamsForRule,
  getCreatableAgeCategories,
  getRuleForAgeCategory,
  normalizeGender,
} from "../../../lib/teamCreationRules";
import TeamPlayersModal from "./components/TeamPlayersModal";
import AddTeamModal from "./components/AddTeamModal";

function formatFee(value) {
  if (value === null || value === undefined || value === "") return "-";

  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatMemberName(member) {
  const firstName = String(member?.first_name || "").trim();
  const lastName = String(member?.last_name || "").trim();
  return [firstName, lastName].filter(Boolean).join(" ");
}

const TEAM_VIEW_FILTERS = {
  seniors: "Seniors",
  highRings: "Hoge ringen",
  lowRings: "Lage ringen",
  other: "Andere",
};

function isHighRingsAge(ageCategory) {
  return ["U14", "U16", "U18", "U19", "U21"].includes(ageCategory);
}

function isLowRingsAge(ageCategory) {
  return ["U12", "U10", "U8", "basketschool"].includes(ageCategory);
}

function matchesTeamViewFilter(team, filter) {
  const ageCategory = team.age_category || "";

  if (filter === "seniors") {
    return ageCategory === "seniors";
  }

  if (filter === "highRings") {
    return isHighRingsAge(ageCategory);
  }

  if (filter === "lowRings") {
    return isLowRingsAge(ageCategory);
  }

  if (filter === "other") {
    return ageCategory !== "seniors" && !isHighRingsAge(ageCategory) && !isLowRingsAge(ageCategory);
  }

  return true;
}

const AGE_ORDER = ["seniors", "U21", "U19", "U18", "U16", "U14", "U12", "U10", "U8", "basketschool"];

function sortTeamsByAge(teams) {
  return [...teams].sort((left, right) => {
    const leftIndex = AGE_ORDER.indexOf(left.age_category || "");
    const rightIndex = AGE_ORDER.indexOf(right.age_category || "");
    const safeLeftIndex = leftIndex === -1 ? AGE_ORDER.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? AGE_ORDER.length : rightIndex;

    if (safeLeftIndex !== safeRightIndex) {
      return safeLeftIndex - safeRightIndex;
    }

    return String(left.team_name || "").localeCompare(String(right.team_name || ""), "nl-BE", {
      numeric: true,
    });
  });
}

export default function AdminTeams() {
  // Season values used in the table filter and add-team defaults.
  const currentSeason = getCurrentSeason();
  const upcomingSeason = getUpcomingSeason();

  // Main teams list and season filter state.
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [selectedViewFilter, setSelectedViewFilter] = useState("seniors");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Team players modal state.
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  const [eligiblePlayers, setEligiblePlayers] = useState([]);
  const [recommendedPlayers, setRecommendedPlayers] = useState([]);
  const [eligiblePlayersLoading, setEligiblePlayersLoading] = useState(false);
  const [eligiblePlayersError, setEligiblePlayersError] = useState("");
  const [addingPlayerId, setAddingPlayerId] = useState(null);
  const [playerFeedbackMessage, setPlayerFeedbackMessage] = useState("");

  // Inline row edit state.
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingTeamId, setSavingTeamId] = useState(null);

  // Page feedback state.
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Add-team modal state.
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [addForm, setAddForm] = useState({
    season: upcomingSeason,
    ageCategory: "seniors",
    gender: "M",
  });

  const creatableAgeCategories = useMemo(() => getCreatableAgeCategories(), []);
  const addGenderOptions = useMemo(() => {
    const rule = getRuleForAgeCategory(addForm.ageCategory);
    return rule?.genders || [""];
  }, [addForm.ageCategory]);

  const seasonOptions = useMemo(() => {
    const unique = [...new Set([...seasons, currentSeason, upcomingSeason])].filter(Boolean);
    return unique.sort((left, right) => right.localeCompare(left, "nl-BE", { numeric: true }));
  }, [seasons, currentSeason, upcomingSeason]);

  const filteredTeams = useMemo(() => {
    const visibleTeams = teams.filter((team) => matchesTeamViewFilter(team, selectedViewFilter));
    return sortTeamsByAge(visibleTeams);
  }, [teams, selectedViewFilter]);

  useEffect(() => {
    let isMounted = true;

    async function loadSeasons() {
      const result = await getTeamSeasons();
      if (!isMounted || result.error) return;

      const availableSeasons = result.data;
      setSeasons(availableSeasons);

      if (availableSeasons.length === 0) return;

      if (availableSeasons.includes(currentSeason)) {
        setSelectedSeason(currentSeason);
      } else {
        setSelectedSeason(availableSeasons[0]);
      }
    }

    if (hasSupabaseEnv) {
      loadSeasons();
    }

    return () => {
      isMounted = false;
    };
  }, [currentSeason]);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      setLoading(true);
      setErrorMessage("");
      setFeedbackMessage("");

      const result = await getTeams({ season: selectedSeason });
      if (!isMounted) return;

      if (result.error) {
        setTeams([]);
        setErrorMessage(result.error.message || "Kon ploegen niet laden.");
      } else {
        setTeams(result.data);
      }

      setLoading(false);
    }

    if (hasSupabaseEnv) {
      if (selectedSeason) {
        loadTeams();
      } else {
        setLoading(false);
        setTeams([]);
      }
    } else {
      setLoading(false);
      setTeams([]);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedSeason]);

  useEffect(() => {
    setAddForm((current) => {
      const nextSeason = current.season || upcomingSeason;
      const rule = getRuleForAgeCategory(current.ageCategory) || getRuleForAgeCategory("seniors");
      const safeGender = rule.genders.includes(current.gender) ? current.gender : rule.genders[0];

      return {
        ...current,
        season: nextSeason,
        gender: safeGender,
      };
    });
  }, [upcomingSeason]);

  async function handleTeamClick(team) {
    if (editingTeamId) return;

    setSelectedTeam(team);
    setTeamPlayers([]);
    setEligiblePlayers([]);
    setRecommendedPlayers([]);
    setPlayersError("");
    setEligiblePlayersError("");
    setPlayerFeedbackMessage("");
    setPlayersLoading(true);
    setEligiblePlayersLoading(true);

    const [playersResult, eligibleResult] = await Promise.all([
      getTeamPlayers(team.source_team_id),
      getEligiblePlayersForTeam(team),
    ]);

    setPlayersLoading(false);
    setEligiblePlayersLoading(false);

    if (playersResult.error) {
      setPlayersError(playersResult.error.message || "Kon spelers niet laden.");
    } else {
      setTeamPlayers(playersResult.data);
    }

    if (eligibleResult.error) {
      setEligiblePlayersError(eligibleResult.error.message || "Kon beschikbare spelers niet laden.");
    } else {
      setEligiblePlayers(eligibleResult.data.eligiblePlayers || []);
      setRecommendedPlayers(eligibleResult.data.recommendedPlayers || []);
    }
  }

  function handleCloseTeamModal() {
    setSelectedTeam(null);
    setTeamPlayers([]);
    setEligiblePlayers([]);
    setRecommendedPlayers([]);
    setPlayersError("");
    setEligiblePlayersError("");
    setAddingPlayerId(null);
    setPlayerFeedbackMessage("");
  }

  async function handleAddPlayer(member) {
    if (!selectedTeam) return;

    setAddingPlayerId(member.source_member_id);
    setEligiblePlayersError("");
    setPlayerFeedbackMessage("");

    const result = await addPlayerToTeam(selectedTeam, member);
    setAddingPlayerId(null);

    if (result.error) {
      setEligiblePlayersError(result.error.message || "Kon speler niet toevoegen.");
      return;
    }

    const displayName = formatMemberName(member) || member.member_name || `Lid ${member.source_member_id}`;
    setEligiblePlayers((current) => current.filter((entry) => entry.source_member_id !== member.source_member_id));
    setRecommendedPlayers((current) => current.filter((entry) => entry.source_member_id !== member.source_member_id));
    setPlayerFeedbackMessage(`${displayName} toegevoegd aan ${selectedTeam.team_name || "de ploeg"}.`);

    const refreshedPlayers = await getTeamPlayers(selectedTeam.source_team_id);
    if (refreshedPlayers.error) {
      setPlayersError(refreshedPlayers.error.message || "Kon spelers niet vernieuwen.");
      setTeamPlayers((current) => [...current, result.data]);
      return;
    }

    setPlayersError("");
    setTeamPlayers(refreshedPlayers.data);
  }

  function handleOpenAddModal() {
    const initialAgeCategory = "seniors";
    const initialRule = getRuleForAgeCategory(initialAgeCategory);
    setAddForm({
      season: upcomingSeason,
      ageCategory: initialAgeCategory,
      gender: initialRule.genders[0],
    });
    setErrorMessage("");
    setFeedbackMessage("");
    setShowAddModal(true);
  }

  function handleCloseAddModal() {
    if (creatingTeam) return;
    setShowAddModal(false);
  }

  function handleAddFormChange(field, value) {
    if (field === "ageCategory") {
      const rule = getRuleForAgeCategory(value);
      setAddForm((current) => ({
        ...current,
        ageCategory: value,
        gender: rule.genders.includes(current.gender) ? current.gender : rule.genders[0],
      }));
      return;
    }

    setAddForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateTeam(e) {
    e.preventDefault();

    const rule = getRuleForAgeCategory(addForm.ageCategory);
    if (!rule) {
      setErrorMessage("Onbekende leeftijdscategorie.");
      return;
    }

    const selectedGender = rule.genders.includes(addForm.gender) ? addForm.gender : rule.genders[0];

    setCreatingTeam(true);
    setErrorMessage("");
    setFeedbackMessage("");

    const seasonTeamsResult = await getTeams({ season: addForm.season });
    if (seasonTeamsResult.error) {
      setCreatingTeam(false);
      setErrorMessage(seasonTeamsResult.error.message || "Kon bestaande ploegen niet laden.");
      return;
    }

    const existingTeams = filterTeamsForRule(seasonTeamsResult.data, addForm.ageCategory, selectedGender);
    if (rule.maxTeams && existingTeams.length >= rule.maxTeams) {
      setCreatingTeam(false);
      setErrorMessage(`${addForm.ageCategory} heeft al het maximum aantal ploegen in seizoen ${addForm.season}.`);
      return;
    }

    const teamName = rule.nameForGender[selectedGender](existingTeams.length);
    const createResult = await createTeam({
      season: addForm.season,
      category: rule.category,
      team_name: teamName,
      gender: normalizeGender(selectedGender),
      age_category: addForm.ageCategory,
    });

    setCreatingTeam(false);

    if (createResult.error) {
      setErrorMessage(createResult.error.message || "Kon ploeg niet aanmaken.");
      return;
    }

    setFeedbackMessage(`${teamName} aangemaakt in seizoen ${addForm.season}.`);
    setShowAddModal(false);

    const seasonResult = await getTeamSeasons();
    if (!seasonResult.error) {
      setSeasons(seasonResult.data);
    }

    setSelectedSeason(addForm.season);
  }

  function startEditingTeam(team, e) {
    e.stopPropagation();

    setEditingTeamId(team.source_team_id);
    setFeedbackMessage("");
    setErrorMessage("");
    setEditForm({
      team_name: team.team_name || "",
      season: team.season || "",
      category: team.category || "",
      gender: team.gender || "",
      age_category: team.age_category || "",
      membership_fee: team.membership_fee ?? "",
    });
  }

  function cancelEditingTeam(e) {
    e.stopPropagation();
    setEditingTeamId(null);
    setEditForm(null);
  }

  function handleEditFieldChange(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveTeam(team, e) {
    e.stopPropagation();
    if (!editForm) return;

    setSavingTeamId(team.source_team_id);
    setErrorMessage("");
    setFeedbackMessage("");

    const normalizedFee = String(editForm.membership_fee).trim().replace(",", ".");

    const updates = {
      team_name: editForm.team_name.trim() || null,
      season: editForm.season.trim() || null,
      category: editForm.category.trim() || null,
      gender: editForm.gender || null,
      age_category: editForm.age_category.trim() || null,
      membership_fee: normalizedFee === "" ? null : Number(normalizedFee),
    };

    const invalidFee = updates.membership_fee !== null && Number.isNaN(updates.membership_fee);

    if (invalidFee) {
      setSavingTeamId(null);
      setErrorMessage("Lidgeld moet een numerieke waarde zijn.");
      return;
    }

    const result = await updateTeam(team.source_team_id, updates);
    setSavingTeamId(null);

    if (result.error) {
      setErrorMessage(result.error.message || "Kon ploeg niet opslaan.");
      return;
    }

    setTeams((current) => current.map((entry) => (
      entry.source_team_id === team.source_team_id ? { ...entry, ...result.data } : entry
    )));

    if (selectedTeam?.source_team_id === team.source_team_id) {
      setSelectedTeam((current) => (current ? { ...current, ...result.data } : current));
    }

    setEditingTeamId(null);
    setEditForm(null);
    setFeedbackMessage("Ploeg opgeslagen.");
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>PLOEGENBEHEER</h1>
        <p>Overzicht van alle ploegen uit de database, met filter op seizoen</p>
      </section>

      <section className="text-section">
        {!hasSupabaseEnv && (
          <p>Supabase is nog niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in .env.local.</p>
        )}

        {hasSupabaseEnv && (
          <>
            <div className="admin-filter-bar">
              <label>
                Seizoen
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="admin-filter-input"
                >
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Weergave
                <select
                  value={selectedViewFilter}
                  onChange={(e) => setSelectedViewFilter(e.target.value)}
                  className="admin-filter-input"
                >
                  {Object.entries(TEAM_VIEW_FILTERS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <div className="admin-filter-actions">
                <button type="button" className="agenda-week-btn" onClick={handleOpenAddModal}>
                  Add team
                </button>
              </div>
            </div>

            <p className="agenda-state">
              {loading
                ? "Ploegen laden..."
                : `${filteredTeams.length} ploegen gevonden voor seizoen \"${selectedSeason}\" (${TEAM_VIEW_FILTERS[selectedViewFilter]}).`}
            </p>

            {feedbackMessage && <p className="agenda-state">{feedbackMessage}</p>}
            {errorMessage && <p className="agenda-state agenda-state-error">{errorMessage}</p>}

            {!loading && !errorMessage && filteredTeams.length === 0 && (
              <p>Geen ploegen gevonden voor deze selectie.</p>
            )}

            {!errorMessage && filteredTeams.length > 0 && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ploeg</th>
                      <th>Seizoen</th>
                      <th>Categorie</th>
                      <th>Geslacht</th>
                      <th>Leeftijdscat.</th>
                      <th>Lidgeld</th>
                      <th>Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team) => (
                      <tr
                        key={team.source_team_id || `${team.season}-${team.team_name}`}
                        className={editingTeamId === team.source_team_id ? "" : "clickable-row"}
                        onClick={() => handleTeamClick(team)}
                      >
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <input
                              value={editForm?.team_name || ""}
                              onChange={(e) => handleEditFieldChange("team_name", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            />
                          ) : team.team_name || "-"}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <input
                              value={editForm?.season || ""}
                              onChange={(e) => handleEditFieldChange("season", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            />
                          ) : team.season || "-"}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <input
                              value={editForm?.category || ""}
                              onChange={(e) => handleEditFieldChange("category", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            />
                          ) : team.category || "-"}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <select
                              value={editForm?.gender || ""}
                              onChange={(e) => handleEditFieldChange("gender", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            >
                              <option value="">-</option>
                              <option value="M">M</option>
                              <option value="V">V</option>
                              <option value="G">G</option>
                            </select>
                          ) : team.gender || "-"}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <input
                              value={editForm?.age_category || ""}
                              onChange={(e) => handleEditFieldChange("age_category", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            />
                          ) : team.age_category || "-"}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editForm?.membership_fee ?? ""}
                              onChange={(e) => handleEditFieldChange("membership_fee", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="table-inline-input"
                            />
                          ) : formatFee(team.membership_fee)}
                        </td>
                        <td>
                          {editingTeamId === team.source_team_id ? (
                            <div className="table-row-actions">
                              <button
                                type="button"
                                className="agenda-week-btn"
                                onClick={(e) => handleSaveTeam(team, e)}
                                disabled={savingTeamId === team.source_team_id}
                              >
                                {savingTeamId === team.source_team_id ? "Opslaan..." : "Opslaan"}
                              </button>
                              <button
                                type="button"
                                className="agenda-week-btn"
                                onClick={cancelEditingTeam}
                                disabled={savingTeamId === team.source_team_id}
                              >
                                Annuleer
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="agenda-week-btn"
                              onClick={(e) => startEditingTeam(team, e)}
                            >
                              Bewerk
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <TeamPlayersModal
        selectedTeam={selectedTeam}
        teamPlayers={teamPlayers}
        playersLoading={playersLoading}
        playersError={playersError}
        eligiblePlayers={eligiblePlayers}
        recommendedPlayers={recommendedPlayers}
        eligiblePlayersLoading={eligiblePlayersLoading}
        eligiblePlayersError={eligiblePlayersError}
        addingPlayerId={addingPlayerId}
        playerFeedbackMessage={playerFeedbackMessage}
        onAddPlayer={handleAddPlayer}
        onClose={handleCloseTeamModal}
      />

      <AddTeamModal
        isOpen={showAddModal}
        creatingTeam={creatingTeam}
        addForm={addForm}
        seasonOptions={seasonOptions}
        creatableAgeCategories={creatableAgeCategories}
        genderOptions={addGenderOptions}
        onClose={handleCloseAddModal}
        onSubmit={handleCreateTeam}
        onChange={handleAddFormChange}
      />
    </div>
  );
}