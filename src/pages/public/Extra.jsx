import { useState } from "react";
import { createNewsItem } from "../../lib/contentApi";
import { hasSupabaseEnv } from "../../lib/supabase";

export default function Extra() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      setFeedback("Vul een titel en bericht in.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const { error } = await createNewsItem({ title, content: message, summary: message });

    if (error) {
      setFeedback("Opslaan in de database is mislukt. Controleer tabel/policies en login.");
    } else {
      setFeedback("Nieuws werd toegevoegd in Supabase.");
      setTitle("");
      setMessage("");
    }

    setSaving(false);
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>EXTRA</h1>
        <p>Handige links en extra informatie</p>
      </section>
      <section className="text-section">
        <h2>Nuttige links</h2>
        <ul className="link-list">
          <li>
            <a href="https://www.basketbal.vlaanderen" target="_blank" rel="noreferrer">
              Basketbal Vlaanderen
            </a>
          </li>
          <li>
            <a href="https://www.sport.vlaanderen" target="_blank" rel="noreferrer">
              Sport Vlaanderen
            </a>
          </li>
        </ul>
        <h2>Clubreglement</h2>
        <p>
          Alle leden worden geacht het clubreglement te kennen en te respecteren. Het reglement is
          op te vragen bij het secretariaat.
        </p>
        <h2>Verzekering</h2>
        <p>
          Alle leden zijn verzekerd via de aansluiting bij Basketbal Vlaanderen. Meer info bij het
          secretariaat.
        </p>

        <h2>Nieuws toevoegen (database test)</h2>
        {!hasSupabaseEnv && (
          <p>Supabase is nog niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in .env.local.</p>
        )}
        <form onSubmit={handleSubmit}>
          <p>
            <label htmlFor="news-title">Titel</label>
            <br />
            <input
              id="news-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving || !hasSupabaseEnv}
            />
          </p>
          <p>
            <label htmlFor="news-message">Bericht</label>
            <br />
            <textarea
              id="news-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={saving || !hasSupabaseEnv}
              rows={4}
            />
          </p>
          <button type="submit" disabled={saving || !hasSupabaseEnv}>
            {saving ? "Opslaan..." : "Nieuws opslaan"}
          </button>
          {feedback ? <p>{feedback}</p> : null}
        </form>
      </section>
    </div>
  );
}
