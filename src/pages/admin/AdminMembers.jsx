import { useEffect, useMemo, useState } from "react";
import { CLUB_MEMBERS_PAGE_SIZE, getClubMembers, getMemberTeams } from "../../lib/clubMembers";
import { hasSupabaseEnv } from "../../lib/supabase";

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

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Separate state for the member detail modal and its linked team records.
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberTeams, setMemberTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      // Keep the list fetch tied to the current page and submitted search term.
      setLoading(true);
      setErrorMessage("");

      const result = await getClubMembers({ page, searchTerm, activeOnly });
      if (!isMounted) return;

      if (result.error) {
        setMembers([]);
        setTotalCount(0);
        setErrorMessage(result.error.message || "Kon leden niet laden.");
      } else {
        setMembers(result.data);
        setTotalCount(result.count);
      }

      setLoading(false);
    }

    if (hasSupabaseEnv) {
      loadMembers();
    } else {
      setLoading(false);
      setMembers([]);
      setTotalCount(0);
    }

    return () => {
      isMounted = false;
    };
  }, [page, searchTerm, activeOnly]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / CLUB_MEMBERS_PAGE_SIZE));
  }, [totalCount]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  }

  function handleToggleActiveOnly() {
    setPage(1);
    setActiveOnly((prev) => !prev);
  }

  async function handleMemberClick(member) {
    // Open the modal immediately, then load the team membership details for that member.
    setSelectedMember(member);
    setMemberTeams([]);
    setTeamsError("");
    setTeamsLoading(true);
    const result = await getMemberTeams(member.source_member_id);
    setTeamsLoading(false);
    if (result.error) {
      setTeamsError(result.error.message || "Kon ploegen niet laden.");
    } else {
      setMemberTeams(result.data);
    }
  }

  function handleCloseModal() {
    setSelectedMember(null);
    setMemberTeams([]);
    setTeamsError("");
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>LEDENBEHEER</h1>
        <p>Overzicht en zoeken in de sportadministratie-import</p>
      </section>

      <section className="text-section">
        {!hasSupabaseEnv && (
          <p>Supabase is nog niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in .env.local.</p>
        )}

        {hasSupabaseEnv && (
          <>
            <form className="admin-filter-bar" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Zoek op naam, lidnummer, e-mail of postcode"
                className="admin-filter-input"
              />
              <button type="submit" className="agenda-week-btn">Zoeken</button>
              <button
                type="button"
                className={`agenda-week-btn${activeOnly ? " agenda-week-btn-active" : ""}`}
                onClick={handleToggleActiveOnly}
              >
                {activeOnly ? "Alle leden" : "Actieve leden (2025 2026)"}
              </button>
            </form>

            <p className="agenda-state">
              {loading ? "Leden laden..." : `${totalCount} leden gevonden${searchTerm ? ` voor \"${searchTerm}\"` : ""}.`}
            </p>

            {errorMessage && <p className="agenda-state agenda-state-error">{errorMessage}</p>}

            {!loading && !errorMessage && members.length === 0 && (
              <p>Geen leden gevonden voor deze zoekopdracht.</p>
            )}

            {!errorMessage && members.length > 0 && (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Naam</th>
                        <th>Lidnr</th>
                        <th>Geboorte</th>
                        <th>Geslacht</th>
                        <th>Postcode</th>
                        <th>E-mail</th>
                        <th>Aansluiting</th>
                        <th>Laatst actief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr
                          key={member.source_member_id}
                          className="clickable-row"
                          onClick={() => handleMemberClick(member)}
                        >
                          {/* Clicking a row opens the member detail modal with linked team data. */}
                          <td>
                            <strong>{member.last_name}</strong>, {member.first_name}
                          </td>
                          <td>{member.member_number || member.source_member_id || "-"}</td>
                          <td>{formatDate(member.birth_date)}</td>
                          <td>{member.gender || "-"}</td>
                          <td>{member.postcode || "-"}</td>
                          <td>{member.email_primary || member.email_secondary || "-"}</td>
                          <td>{formatDate(member.joined_at)}</td>
                          <td>{member.last_active || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-pagination">
                  <button
                    type="button"
                    className="agenda-week-btn"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                  >
                    Vorige
                  </button>
                  <span className="agenda-week-label">Pagina {page} van {totalPages}</span>
                  <button
                    type="button"
                    className="agenda-week-btn"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loading}
                  >
                    Volgende
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {selectedMember && (
        <div className="member-modal-backdrop" onClick={handleCloseModal}>
          <div className="member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-modal-header">
              <div>
                <p className="member-modal-title">
                  {selectedMember.last_name}, {selectedMember.first_name}
                </p>
                <p className="member-modal-subtitle">
                  Lidnr: {selectedMember.member_number || selectedMember.source_member_id || "-"}
                </p>
              </div>
              <button className="member-modal-close" onClick={handleCloseModal} aria-label="Sluiten">✕</button>
            </div>

            {teamsLoading && <p className="agenda-state">Ploegen laden...</p>}
            {teamsError && <p className="agenda-state agenda-state-error">{teamsError}</p>}

            {!teamsLoading && !teamsError && memberTeams.length === 0 && (
              <p>Geen ploeglidmaatschappen gevonden.</p>
            )}

            {/* Team player rows are enriched with matching team records from the teams table. */}
            {!teamsLoading && !teamsError && memberTeams.length > 0 && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ploeg</th>
                      <th>Seizoen</th>
                      <th>Categorie</th>
                      <th>Geslacht</th>
                      <th>Leeftijdscat.</th>
                      <th>Shirt</th>
                      <th>Rol</th>
                      <th>Positie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTeams.map((entry, i) => (
                      <tr key={i}>
                        <td>{entry.team?.team_name || entry.team_name || "-"}</td>
                        <td>{entry.team?.season || "-"}</td>
                        <td>{entry.team?.category || "-"}</td>
                        <td>{entry.team?.gender || "-"}</td>
                        <td>{entry.team?.age_category || "-"}</td>
                        <td>{entry.shirt_number ?? "-"}</td>
                        <td>{entry.role_primary || "-"}</td>
                        <td>{entry.position_primary || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}