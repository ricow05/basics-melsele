function formatDateRange(date, enddate) {
  if (!date) return "Datum volgt";
  if (enddate) return `${date} - ${enddate}`;
  return date;
}

export default function AgendaActivity({ activity }) {
  if (!activity) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>ACTIVITEIT</h1>
          <p>Geen activiteit gevonden.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>{activity.title?.toUpperCase()}</h1>
        <p>{formatDateRange(activity.date, activity.enddate)}</p>
      </section>

      <section className="text-section">
        <div className="highlight-box">
          <strong>{activity.day || "Dag"}</strong>
          {" · "}
          {formatDateRange(activity.date, activity.enddate)}
        </div>

        {activity.detail ? <p>{activity.detail}</p> : <p>Meer info volgt binnenkort.</p>}

        {activity.image ? (
          <div className="activity-image-wrap">
            <img src={activity.image} alt={activity.title || "Activiteit"} className="activity-image" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
