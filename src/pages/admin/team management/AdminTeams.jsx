import { useEffect, useMemo, useState } from "react";
import {
  createTeam,
  getCurrentSeason,
  getTeamPlayers,
  getTeams,
  getTeamSeasons,
  getUpcomingSeason,
  updateTeam,
} from "../../../lib/teams";
import { hasSupabaseEnv } from "../../../lib/supabase";

function formatFee(value) {
  if (value === null || value === undefined || value === "") return "-";

  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const TEAM_CREATE_RULES = {
  seniors: {
    category: "seniors",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `HSE ${toAlphabeticSuffix(count)}`,
      V: (count) => `DSE ${toAlphabeticSuffix(count)}`,
    },
  },
  U19: {
    category: "jeugd",
    genders: ["V"],
    nameForGender: {
      V: (count) => (count === 0 ? "U19 M" : `U19 M ${toAlphabeticSuffix(count)}`),
    },
  },
  U18: {
    category: "jeugd",
    genders: ["M"],
    nameForGender: {
      M: (count) => `U18 ${toAlphabeticSuffix(count)}`,
    },
  },
  U16: {
    category: "jeugd",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `U16 ${toAlphabeticSuffix(count)}`,
      V: (count) => `U16 M ${toAlphabeticSuffix(count)}`,
    },
  },
  U14: {
    category: "jeugd",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `U14 ${toAlphabeticSuffix(count)}`,
      V: (count) => `U14 M ${toAlphabeticSuffix(count)}`,
    },
  },
  U12: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U12 ${toAlphabeticSuffix(count)}`,
    },
  },
  U10: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U10 ${toAlphabeticSuffix(count)}`,
    },
  },
  U8: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U8 ${toAlphabeticSuffix(count)}`,
    },
  },
  basketschool: {
    category: "jeugd",
    genders: [""],
    maxTeams: 1,
    nameForGender: {
      "": () => "basketschool",
    },
  },
};

function toAlphabeticSuffix(index) {
  let value = index;
  let result = "";

  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return result;
}

function normalizeGender(value) {
  return value === "" || value == null ? null : value;
}

function filterTeamsForRule(teams, ageCategory, gender) {
  return teams.filter((team) => {
    if (team.age_category !== ageCategory) return false;
    if (normalizeGender(gender) === null) return true;
    return normalizeGender(team.gender) === normalizeGender(gender);
  });
}

export default function AdminTeams() {
  const currentSeason = getCurrentSeason();
  const upcomingSeason = getUpcomingSeason();
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingTeamId, setSavingTeamId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [addForm, setAddForm] = useState({
    season: upcomingSeason,
    ageCategory: "seniors",
    gender: "M",
  });

  const creatableAgeCategories = useMemo(() => Object.keys(TEAM_CREATE_RULES), []);

  const seasonOptions = useMemo(() => {
    const unique = [...new Set([...seasons, currentSeason, upcomingSeason])].filter(Boolean);
    return unique.sort((left, right) => right.localeCompare(left, "nl-BE", { numeric: true }));
  }, [seasons, currentSeason, upcomingSeason]);

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
      const rule = TEAM_CREATE_RULES[current.ageCategory] || TEAM_CREATE_RULES.seniors;
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
    setPlayersError("");
    setPlayersLoading(true);

    const result = await getTeamPlayers(team.source_team_id);
    setPlayersLoading(false);

    if (result.error) {
      setPlayersError(result.error.message || "Kon spelers niet laden.");
      return;
    }

    setTeamPlayers(result.data);
  }

  function handleCloseTeamModal() {
    setSelectedTeam(null);
    setTeamPlayers([]);
    setPlayersError("");
  }

  function handleOpenAddModal() {
    const initialAgeCategory = "seniors";
    const initialRule = TEAM_CREATE_RULES[initialAgeCategory];
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
      const rule = TEAM_CREATE_RULES[value];
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

    const rule = TEAM_CREATE_RULES[addForm.ageCategory];
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

              <div className="admin-filter-actions">
                <button type="button" className="agenda-week-btn" onClick={handleOpenAddModal}>
                  Add team
                </button>
              </div>
            </div>

            <p className="agenda-state">
              {loading
                ? "Ploegen laden..."
                : `${teams.length} ploegen gevonden voor seizoen \"${selectedSeason}\".`}
            </p>

            {feedbackMessage && <p className="agenda-state">{feedbackMessage}</p>}
            {errorMessage && <p className="agenda-state agenda-state-error">{errorMessage}</p>}

            {!loading && !errorMessage && teams.length === 0 && (
              <p>Geen ploegen gevonden voor deze selectie.</p>
            )}

            {!errorMessage && teams.length > 0 && (
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
                    {teams.map((team) => (
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

      {selectedTeam && (
        <div className="member-modal-backdrop" onClick={handleCloseTeamModal}>
          <div className="member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-modal-header">
              <div>
                <p className="member-modal-title">{selectedTeam.team_name || "Ploeg"}</p>
                <p className="member-modal-subtitle">
                  {selectedTeam.season || "-"} · {selectedTeam.age_category || "-"} · {selectedTeam.gender || "-"}
                </p>
              </div>
              <button className="member-modal-close" onClick={handleCloseTeamModal} aria-label="Sluiten">✕</button>
            </div>

            {playersLoading && <p className="agenda-state">Spelers laden...</p>}
            {playersError && <p className="agenda-state agenda-state-error">{playersError}</p>}

            {!playersLoading && !playersError && teamPlayers.length === 0 && (
              <p>Geen spelers gevonden voor deze ploeg.</p>
            )}

            {!playersLoading && !playersError && teamPlayers.length > 0 && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Naam</th>
                      <th>Lid ID</th>
                      <th>Shirt</th>
                      <th>Rol 1</th>
                      <th>Rol 2</th>
                      <th>Positie 1</th>
                      <th>Positie 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPlayers.map((player) => (
                      <tr key={player.source_team_player_id || `${player.source_member_id}-${player.member_name}`}>
                        <td>{player.member_name || "-"}</td>
                        <td>{player.source_member_id || "-"}</td>
                        <td>{player.shirt_number ?? "-"}</td>
                        <td>{player.role_primary || "-"}</td>
                        <td>{player.role_secondary || player.role_tertiary || "-"}</td>
                        <td>{player.position_primary || "-"}</td>
                        <td>{player.position_secondary || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="member-modal-backdrop" onClick={handleCloseAddModal}>
          <div className="member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-modal-header">
              <div>
                <p className="member-modal-title">Team toevoegen</p>
                <p className="member-modal-subtitle">Kies seizoen, leeftijdsgroep en geslacht.</p>
              </div>
              <button className="member-modal-close" onClick={handleCloseAddModal} aria-label="Sluiten">✕</button>
            </div>

            <form className="admin-form-grid" onSubmit={handleCreateTeam}>
              <label>
                Seizoen
                <select
                  className="admin-filter-input"
                  value={addForm.season}
                  onChange={(e) => handleAddFormChange("season", e.target.value)}
                  disabled={creatingTeam}
                >
                  {seasonOptions.map((season) => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </label>

              <label>
                Leeftijdsgroep
                <select
                  className="admin-filter-input"
                  value={addForm.ageCategory}
                  onChange={(e) => handleAddFormChange("ageCategory", e.target.value)}
                  disabled={creatingTeam}
                >
                  {creatableAgeCategories.map((ageCategory) => (
                    <option key={ageCategory} value={ageCategory}>{ageCategory}</option>
                  ))}
                </select>
              </label>

              <label>
                Geslacht
                <select
                  className="admin-filter-input"
                  value={addForm.gender}
                  onChange={(e) => handleAddFormChange("gender", e.target.value)}
                  disabled={creatingTeam}
                >
                  {(TEAM_CREATE_RULES[addForm.ageCategory]?.genders || [""]).map((gender) => (
                    <option key={gender || "none"} value={gender}>
                      {gender || "Geen / gemengd"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="table-row-actions">
                <button type="submit" className="agenda-week-btn" disabled={creatingTeam}>
                  {creatingTeam ? "Bezig..." : "Add team"}
                </button>
                <button type="button" className="agenda-week-btn" onClick={handleCloseAddModal} disabled={creatingTeam}>
                  Annuleer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}