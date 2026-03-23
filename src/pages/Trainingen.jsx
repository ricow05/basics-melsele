const trainingsSchema = [
  { ploeg: "HSE A", dag: "Maandag", uur: "20:30 - 22:00", locatie: "Sporthal 't Wit Zand" },
  { ploeg: "HSE B", dag: "Dinsdag", uur: "20:30 - 22:00", locatie: "Sporthal 't Wit Zand" },
  { ploeg: "J18", dag: "Woensdag", uur: "18:30 - 20:00", locatie: "Sporthal 't Wit Zand" },
  { ploeg: "U14", dag: "Vrijdag", uur: "18:00 - 19:30", locatie: "Sporthal 't Wit Zand" },
];

export default function Trainingen() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>TRAININGEN</h1>
        <p>Overzicht van de trainingsmomenten</p>
      </section>

      <section className="text-section">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ploeg</th>
                <th>Dag</th>
                <th>Uur</th>
                <th>Locatie</th>
              </tr>
            </thead>
            <tbody>
              {trainingsSchema.map((training) => (
                <tr key={`${training.ploeg}-${training.dag}`}>
                  <td>{training.ploeg}</td>
                  <td>{training.dag}</td>
                  <td>{training.uur}</td>
                  <td>{training.locatie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
