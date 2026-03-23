import { useEffect, useMemo, useState } from "react";

const CLUB_GUID = "BVBL1197";
const MATCHES_API_BASE = "https://vblcb.wisseq.eu";

function startOfWeek(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

function endOfWeek(date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseApiDate(value) {
  if (!value) return null;
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  const parsed = parseApiDate(value);
  if (!parsed) return value || "-";

  return parsed.toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Agenda() {
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatches() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${MATCHES_API_BASE}/VBLCB_WebService/data/OrgMatchesByGuid?issguid=${CLUB_GUID}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const apiMatches = await response.json();

        const upcoming = apiMatches
          .filter((match) => {
            const gameDate = parseApiDate(match.datumString);
            return gameDate;
          })
          .sort((a, b) => {
            const aDate = parseApiDate(a.datumString);
            const bDate = parseApiDate(b.datumString);
            if (!aDate || !bDate) return 0;

            const dateDiff = aDate.getTime() - bDate.getTime();
            if (dateDiff !== 0) return dateDiff;

            return (a.beginTijd || "").localeCompare(b.beginTijd || "");
          });

        setAllMatches(upcoming);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Wedstrijden konden niet geladen worden. Probeer later opnieuw.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadMatches();

    return () => controller.abort();
  }, []);

  const weekMatches = useMemo(() => {
    const weekEnd = endOfWeek(weekStart);
    return allMatches.filter((match) => {
      const gameDate = parseApiDate(match.datumString);
      return gameDate && gameDate >= weekStart && gameDate <= weekEnd;
    });
  }, [allMatches, weekStart]);

  const weekLabel = useMemo(() => {
    const weekEnd = endOfWeek(weekStart);
    const formatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    return `${weekStart.toLocaleDateString("nl-BE", formatOptions)} - ${weekEnd.toLocaleDateString("nl-BE", formatOptions)}`;
  }, [weekStart]);

  const subtitle = useMemo(() => {
    if (loading) return "Wedstrijden laden...";
    if (error) return "Live data tijdelijk niet beschikbaar";
    return `${weekMatches.length} wedstrijden deze week voor Basics Melsele-Beveren`;
  }, [error, loading, weekMatches.length]);

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>AGENDA &amp; ACTIVITEITEN</h1>
        <p>{subtitle}</p>
      </section>
      <section className="text-section">
        {loading && <p className="agenda-state">Wedstrijden worden opgehaald...</p>}
        {error && <p className="agenda-state agenda-state-error">{error}</p>}

        {!error && (
          <div className="agenda-week-nav">
            <button
              className="agenda-week-btn"
              type="button"
              onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            >
              Vorige week
            </button>
            <p className="agenda-week-label">Week: {weekLabel}</p>
            <button
              className="agenda-week-btn"
              type="button"
              onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            >
              Volgende week
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Tijd</th>
                <th>Thuis</th>
                <th>Uit</th>
                <th>Locatie</th>
                <th>Reeks</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !error && weekMatches.length === 0 && (
                <tr>
                  <td colSpan={7}>Geen wedstrijden gevonden voor deze week.</td>
                </tr>
              )}

              {!error &&
                weekMatches.map((match) => (
                  <tr key={match.guid || `${match.datumString}-${match.wedID}`}>
                    <td>{formatDate(match.datumString)}</td>
                    <td>{match.beginTijd || "-"}</td>
                    <td>{match.tTNaam || "-"}</td>
                    <td>{match.tUNaam || "-"}</td>
                    <td>{match.accNaam || "-"}</td>
                    <td>{match.pouleNaam || "-"}</td>
                    <td>{match.uitslag?.trim() || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
