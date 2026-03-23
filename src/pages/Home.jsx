import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CLUB_GUID = "BVBL1197";
const MATCHES_API_BASE = "https://vblcb.wisseq.eu";

function parseApiDate(value) {
  if (!value) return null;
  const [day, month, year] = value.split("-").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function thisWeekend() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0=Sun,6=Sat
  const sat = new Date(now);
  sat.setDate(now.getDate() + ((6 - day + 7) % 7));
  const fri = new Date(sat);
  fri.setDate(sat.getDate() - 1);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return { fri, sat, sun, start: fri, end: sun };
}

function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return rows.map(row => {
    // Split on comma but only for the number of headers (last field may contain commas)
    const cols = row.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (cols[i] ?? "").trim() || null;
    });
    return obj;
  });
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function activityPath(activity) {
  if (!activity) return "/agenda";
  if ((activity.active || "").toUpperCase() !== "Y") return "/agenda";
  const slug = slugify(activity.title);
  return slug ? `/agenda/activiteit/${slug}` : "/agenda";
}

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [newsItems, setNewsItems] = useState([]);
  const [weekendMatches, setWeekendMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");
  const [matchDayFilter, setMatchDayFilter] = useState("fri-sat");
  const total = activities.length;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${MATCHES_API_BASE}/VBLCB_WebService/data/OrgMatchesByGuid?issguid=${CLUB_GUID}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const { start, end } = thisWeekend();
        const filtered = data
          .filter(m => {
            const d = parseApiDate(m.datumString);
            return d && d >= start && d <= end;
          })
          .sort((a, b) => {
            const da = parseApiDate(a.datumString);
            const db = parseApiDate(b.datumString);
            const diff = da - db;
            return diff !== 0 ? diff : (a.beginTijd || "").localeCompare(b.beginTijd || "");
          });
        setWeekendMatches(filtered);
      })
      .catch(err => { if (err.name !== "AbortError") setMatchesError("Kon wedstrijden niet laden."); })
      .finally(() => setMatchesLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetch("/activities.csv")
      .then(r => r.text())
      .then(text => setActivities(parseCsv(text)));
  }, []);

  useEffect(() => {
    fetch("/news.csv")
      .then(r => r.text())
      .then(text => {
        const rows = parseCsv(text);
        const items = rows
          .filter(row => (row.active || "Y").toUpperCase() === "Y")
          .map(row => row.message || row.text || row.item || "")
          .filter(Boolean);
        setNewsItems(items);
      })
      .catch(() => setNewsItems([]));
  }, []);

  const goTo = (index) => setActiveSlide((index + total) % total);

  useEffect(() => {
    if (total === 0) return;
    const timer = setInterval(() => {
      setActiveSlide(i => (i + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlide, total]);

  const tickerItems = newsItems.length > 0 ? newsItems : ["Geen nieuws momenteel"];

  return (
    <div className="page-content">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>WELKOM BIJ BASICS MELSELE</h1>
          <p>Basketball club · Melsele</p>
        </div>
        <div className="hero-ball">🏀</div>
      </section>

      {/* Two-column: Activiteiten + Wedstrijdkalender */}
      <div className="home-columns">

        {/* Left: Opkomende Activiteiten */}
        <section className="upcoming-section">
          <h2 className="upcoming-title">📅 Opkomende Activiteiten</h2>
          <div className="upcoming-carousel">
            {activities.map((act, i) => (
              <Link
                key={i}
                to={activityPath(act)}
                aria-label={`Open activiteit ${act.title || i + 1}`}
                className={`upcoming-slide${i === activeSlide ? " active" : ""}`}
              >
                {act.image ? (
                  <img src={act.image} alt={act.title} className="upcoming-slide-img" />
                ) : (
                  <>
                    <div className="upcoming-slide-placeholder" />
                    <div className="upcoming-slide-overlay">
                      <div className="upcoming-slide-badge">
                        <span className="upcoming-day">{act.day}</span>
                        <span className="upcoming-num">
                          {act.enddate ? `${act.date} – ${act.enddate}` : act.date}
                        </span>
                      </div>
                      <div className="upcoming-slide-text">
                        <strong>{act.title}</strong>
                        <span>{act.detail}</span>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
            <button className="upcoming-arrow upcoming-arrow-prev" onClick={() => goTo(activeSlide - 1)} aria-label="Vorige">&#8249;</button>
            <button className="upcoming-arrow upcoming-arrow-next" onClick={() => goTo(activeSlide + 1)} aria-label="Volgende">&#8250;</button>
            <div className="upcoming-dots">
              {activities.map((_, i) => (
                <button
                  key={i}
                  className={`upcoming-dot${i === activeSlide ? " active" : ""}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Activiteit ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Right: Wedstrijdkalender dit weekend */}
        <section className="match-calendar-section">
          <div className="match-calendar-header">
            <h2 className="upcoming-title">🏀 Wedstrijden dit weekend</h2>
            <div className="match-day-filter">
              <button
                className={`match-day-btn${matchDayFilter === "fri-sat" ? " active" : ""}`}
                onClick={() => setMatchDayFilter("fri-sat")}
              >Vr – Za</button>
              <button
                className={`match-day-btn${matchDayFilter === "sun" ? " active" : ""}`}
                onClick={() => setMatchDayFilter("sun")}
              >Zo</button>
            </div>
          </div>
          <div className="match-calendar">
            {matchesLoading && <p className="agenda-state">Wedstrijden laden...</p>}
            {matchesError && <p className="agenda-state agenda-state-error">{matchesError}</p>}
            {!matchesLoading && !matchesError && weekendMatches.filter(m => {
              const d = parseApiDate(m.datumString);
              if (!d) return false;
              return matchDayFilter === "sun" ? d.getDay() === 0 : d.getDay() === 5 || d.getDay() === 6;
            }).length === 0 && (
              <p className="agenda-state">Geen wedstrijden op {matchDayFilter === "sun" ? "zondag" : "vrijdag of zaterdag"}.</p>
            )}
            {weekendMatches.filter(m => {
              const d = parseApiDate(m.datumString);
              if (!d) return false;
              return matchDayFilter === "sun" ? d.getDay() === 0 : d.getDay() === 5 || d.getDay() === 6;
            }).map((m, i) => {
              const isHome = m.tTNaam === "Basics Melsele-Beveren";
              const d = parseApiDate(m.datumString);
              const dayLabel = d ? d.toLocaleDateString("nl-BE", { weekday: "short" }) : "";
              const dateLabel = d ? d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" }) : m.datumString;
              return (
                <div key={m.guid || i} className="match-row">
                  <div className="match-date-badge">
                    <span className="upcoming-day">{dayLabel}</span>
                    <span className="upcoming-num">{dateLabel}</span>
                  </div>
                  <div className="match-info">
                    <div className="match-teams">
                      <span className={isHome ? "match-team home" : "match-team"}>{m.tTNaam || "-"}</span>
                      <span className="match-vs">vs</span>
                      <span className={!isHome ? "match-team home" : "match-team"}>{m.tUNaam || "-"}</span>
                    </div>
                    <span className="match-detail">{m.beginTijd || ""}{m.accNaam ? ` · ${m.accNaam}` : ""}</span>
                  </div>
                  <span className={`match-badge ${isHome ? "thuis" : "uit"}`}>{isHome ? "THUIS" : "UIT"}</span>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* News Ticker */}
      <div className="news-ticker">
        <span className="news-ticker-label">NIEUWS</span>
        <div className="news-ticker-track">
          <div className="news-ticker-content">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="news-ticker-item">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
