import { useState, useEffect } from "react";
import { getPublishedActivities } from "../../lib/activities";
import { createActivity, updateActivity, deleteActivity } from "../../lib/activitiesApi";
import { hasSupabaseEnv } from "../../lib/supabase";

/**
 * Admin page for managing activities.
 * Currently public, but should be protected by authentication in future.
 * Allows creating, editing, and deleting activities stored in Supabase.
 */
export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    day: "",
    date: "",
    enddate: "",
    detail: "",
    image: "",
    active: "Y",
    published: true,
  });

  /**
   * Load all activities from Supabase on mount
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPublishedActivities();
      setActivities(data || []);
      setLoading(false);
    }

    if (hasSupabaseEnv) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Reset form to empty state
   */
  function resetForm() {
    setFormData({
      title: "",
      day: "",
      date: "",
      enddate: "",
      detail: "",
      image: "",
      active: "Y",
      published: true,
    });
    setEditingId(null);
  }

  /**
   * Load activity into form for editing
   */
  function startEdit(activity) {
    setFormData({
      title: activity.title || "",
      day: activity.day || "",
      date: activity.date || "",
      enddate: activity.enddate || "",
      detail: activity.detail || "",
      image: activity.image || "",
      active: activity.active || "Y",
      published: activity.published !== false,
    });
    setEditingId(activity.id);
    setFeedback("");
  }

  /**
   * Handle form field changes
   */
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /**
   * Submit form: create new or update existing activity
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim()) {
      setFeedback("Titel is verplicht.");
      return;
    }

    setSaving(true);
    setFeedback("");

    let result;
    if (editingId) {
      result = await updateActivity(editingId, formData);
    } else {
      result = await createActivity(formData);
    }

    if (result.error) {
      setFeedback(`Fout: ${result.error.message}`);
    } else {
      setFeedback(editingId ? "Activiteit bijgewerkt." : "Activiteit aangemaakt.");
      resetForm();
      // Reload activities
      const updated = await getPublishedActivities();
      setActivities(updated || []);
    }

    setSaving(false);
  }

  /**
   * Delete an activity after confirmation
   */
  async function handleDelete(id) {
    if (!window.confirm("Weet je zeker dat je deze activiteit wilt verwijderen?")) {
      return;
    }

    setSaving(true);
    const result = await deleteActivity(id);

    if (result.error) {
      setFeedback(`Verwijderingsfout: ${result.error.message}`);
    } else {
      setFeedback("Activiteit verwijderd.");
      const updated = await getPublishedActivities();
      setActivities(updated || []);
    }

    setSaving(false);
  }

  if (!hasSupabaseEnv) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>ACTIVITEITEN BEHEREN</h1>
          <p>(Admin)</p>
        </section>
        <section className="text-section">
          <p>
            Supabase is nog niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in .env.local.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>ACTIVITEITEN BEHEREN</h1>
        <p>(Admin - Momenteel publiek toegankelijk)</p>
      </section>

      <section className="text-section">
        <h2>Activiteit toevoegen/bewerken</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="title">Titel *</label>
            <br />
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={saving}
              placeholder="bijv. Zomer Training"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="day">Dag</label>
            <br />
            <input
              id="day"
              type="text"
              name="day"
              value={formData.day}
              onChange={handleChange}
              disabled={saving}
              placeholder="bijv. Zaterdag"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="date">Datum</label>
            <br />
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={saving}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="enddate">Eind datum</label>
            <br />
            <input
              id="enddate"
              type="date"
              name="enddate"
              value={formData.enddate}
              onChange={handleChange}
              disabled={saving}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="detail">Details</label>
            <br />
            <textarea
              id="detail"
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              disabled={saving}
              placeholder="Beschrijving van de activiteit"
              rows="4"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="image">Afbeelding URL</label>
            <br />
            <input
              id="image"
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              disabled={saving}
              placeholder="bijv. https://..."
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="active">Actief</label>
            <br />
            <select
              id="active"
              name="active"
              value={formData.active}
              onChange={handleChange}
              disabled={saving}
              style={{ padding: "8px" }}
            >
              <option value="Y">Ja</option>
              <option value="N">Nee</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleChange}
                disabled={saving}
              />
              Gepubliceerd
            </label>
          </div>

          <div>
            <button type="submit" disabled={saving} style={{ marginRight: "10px" }}>
              {saving ? "Bezig..." : editingId ? "Bijwerken" : "Toevoegen"}
            </button>
            <button type="button" onClick={resetForm} disabled={saving}>
              Rechtszetten
            </button>
          </div>

          {feedback && (
            <p style={{ marginTop: "15px", color: feedback.includes("Fout") ? "red" : "green" }}>
              {feedback}
            </p>
          )}
        </form>

        <h2 style={{ marginTop: "40px" }}>Bestaande activiteiten</h2>

        {loading && <p>Laden...</p>}

        {!loading && activities.length === 0 && (
          <p style={{ color: "#999" }}>Geen activiteiten gevonden in Supabase.</p>
        )}

        {activities.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Titel</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Datum</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Actief</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Gepubliceerd</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Acties</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{activity.title}</td>
                  <td style={{ padding: "10px" }}>{activity.date || "-"}</td>
                  <td style={{ padding: "10px" }}>{activity.active === "Y" ? "Ja" : "Nee"}</td>
                  <td style={{ padding: "10px" }}>{activity.published ? "Ja" : "Nee"}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => startEdit(activity)}
                      disabled={saving}
                      style={{ marginRight: "8px" }}
                    >
                      Bewerk
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      disabled={saving}
                      style={{ color: "red" }}
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
