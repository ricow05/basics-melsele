import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getEligiblePlayerName(player) {
  return player.member_name || [player.first_name, player.last_name].filter(Boolean).join(" ") || `Lid ${player.source_member_id}`;
}

export default function TeamPlayersModal({
  selectedTeam,
  teamPlayers = [],
  playersLoading,
  playersError,
  eligiblePlayers = [],
  recommendedPlayers = [],
  eligiblePlayersLoading,
  eligiblePlayersError,
  addingPlayerId,
  playerFeedbackMessage,
  onAddPlayer,
  onClose,
}) {
  const [showAddPlayerPanel, setShowAddPlayerPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setShowAddPlayerPanel(false);
    setSearchTerm("");
  }, [selectedTeam?.source_team_id]);

  const filteredEligiblePlayers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const recommendedIds = new Set(recommendedPlayers.map((player) => player.source_member_id));
    const searchablePlayers = eligiblePlayers.filter((player) => !recommendedIds.has(player.source_member_id));
    if (!term) return searchablePlayers;

    return searchablePlayers.filter((player) => {
      const values = [
        getEligiblePlayerName(player),
        player.source_member_id,
        player.birth_date,
        player.gender,
      ];

      return values.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [eligiblePlayers, recommendedPlayers, searchTerm]);

  if (!selectedTeam) return null;

  return (
    <div className="member-modal-backdrop" onClick={onClose}>
      <div className="member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-modal-header">
          <div>
            <p className="member-modal-title">{selectedTeam.team_name || "Ploeg"}</p>
            <p className="member-modal-subtitle">
              {selectedTeam.season || "-"} · {selectedTeam.age_category || "-"} · {selectedTeam.gender || "-"}
            </p>
          </div>
          <button className="member-modal-close" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>

        <div className="member-modal-actions">
          <button
            type="button"
            className="agenda-week-btn"
            onClick={() => setShowAddPlayerPanel((current) => !current)}
          >
            {showAddPlayerPanel ? "Sluit speler toevoegen" : "Speler toevoegen"}
          </button>
        </div>

        {playerFeedbackMessage && <p className="agenda-state">{playerFeedbackMessage}</p>}

        {showAddPlayerPanel && (
          <section className="member-modal-section">
            <div className="member-modal-section-header">
              <div>
                <p className="member-modal-section-title">Spelers toevoegen</p>
              </div>
            </div>

            {eligiblePlayersLoading && <p className="agenda-state">Beschikbare spelers laden...</p>}
            {eligiblePlayersError && <p className="agenda-state agenda-state-error">{eligiblePlayersError}</p>}

            {!eligiblePlayersLoading && !eligiblePlayersError && recommendedPlayers.length > 0 && (
              <>
                <div className="member-modal-section-header">
                  <div>
                    <p className="member-modal-section-title">Aanbevolen spelers</p>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Naam</th>
                        <th>Lid ID</th>
                        <th>Geboortedatum</th>
                        <th>Geslacht</th>
                        <th>Actie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendedPlayers.map((player) => (
                        <tr key={`recommended-${player.source_member_id}`}>
                          <td>{getEligiblePlayerName(player)}</td>
                          <td>{player.source_member_id || "-"}</td>
                          <td>{formatDate(player.birth_date)}</td>
                          <td>{player.gender || "-"}</td>
                          <td className="member-modal-action-cell">
                            <button
                              type="button"
                              className="agenda-week-btn"
                              onClick={() => onAddPlayer(player)}
                              disabled={addingPlayerId === player.source_member_id}
                            >
                              {addingPlayerId === player.source_member_id ? "Toevoegen..." : "Voeg toe"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!eligiblePlayersLoading && !eligiblePlayersError && recommendedPlayers.length === 0 && (
              <p className="agenda-state">Geen aanbevolen spelers gevonden voor deze ploeg.</p>
            )}

            <div className="member-modal-filter-row">
              <p className="member-modal-section-title">Zoek andere beschikbare spelers</p>
              <input
                type="search"
                className="admin-filter-input"
                placeholder="Zoek op naam, lid ID, geboortedatum of geslacht"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {!eligiblePlayersLoading && !eligiblePlayersError && (
              <p className="agenda-state">
                {filteredEligiblePlayers.length} andere beschikbare spelers
                {searchTerm.trim() ? ` voor "${searchTerm.trim()}"` : ""}.
              </p>
            )}

            {!eligiblePlayersLoading && !eligiblePlayersError && filteredEligiblePlayers.length === 0 && (
              <p>Geen andere beschikbare spelers gevonden voor deze ploeg.</p>
            )}

            {!eligiblePlayersLoading && !eligiblePlayersError && filteredEligiblePlayers.length > 0 && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Naam</th>
                      <th>Lid ID</th>
                      <th>Geboortedatum</th>
                      <th>Geslacht</th>
                      <th>Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEligiblePlayers.map((player) => (
                      <tr key={player.source_member_id}>
                        <td>{getEligiblePlayerName(player)}</td>
                        <td>{player.source_member_id || "-"}</td>
                        <td>{formatDate(player.birth_date)}</td>
                        <td>{player.gender || "-"}</td>
                        <td className="member-modal-action-cell">
                          <button
                            type="button"
                            className="agenda-week-btn"
                            onClick={() => onAddPlayer(player)}
                            disabled={addingPlayerId === player.source_member_id}
                          >
                            {addingPlayerId === player.source_member_id ? "Toevoegen..." : "Voeg toe"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section className="member-modal-section">
          <div className="member-modal-section-header">
            <div>
              <p className="member-modal-section-title">Spelers in ploeg</p>
            </div>
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
        </section>
      </div>
    </div>
  );
}