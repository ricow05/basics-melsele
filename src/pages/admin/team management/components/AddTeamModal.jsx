export default function AddTeamModal({
  isOpen,
  creatingTeam,
  addForm,
  seasonOptions,
  creatableAgeCategories,
  genderOptions,
  onClose,
  onSubmit,
  onChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="member-modal-backdrop" onClick={onClose}>
      <div className="member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-modal-header">
          <div>
            <p className="member-modal-title">Team toevoegen</p>
            <p className="member-modal-subtitle">Kies seizoen, leeftijdsgroep en geslacht.</p>
          </div>
          <button className="member-modal-close" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>

        <form className="admin-form-grid" onSubmit={onSubmit}>
          <label>
            Seizoen
            <select
              className="admin-filter-input"
              value={addForm.season}
              onChange={(e) => onChange("season", e.target.value)}
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
              onChange={(e) => onChange("ageCategory", e.target.value)}
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
              onChange={(e) => onChange("gender", e.target.value)}
              disabled={creatingTeam}
            >
              {genderOptions.map((gender) => (
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
            <button type="button" className="agenda-week-btn" onClick={onClose} disabled={creatingTeam}>
              Annuleer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}