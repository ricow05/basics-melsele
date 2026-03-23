const teams = [
  { name: "Heren 1", level: "Nationaal", coach: "TBA", training: "ma & do 20:00" },
  { name: "Heren 2", level: "Provinciaal", coach: "TBA", training: "di & vr 19:30" },
  { name: "Dames 1", level: "Provinciaal", coach: "TBA", training: "wo & za 10:00" },
];

export default function Seniors() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>SENIORS</h1>
        <p>Onze seniorenploegen</p>
      </section>
      <section className="text-section">
        <h2>Ploegen</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ploeg</th>
                <th>Niveau</th>
                <th>Coach</th>
                <th>Training</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>{t.level}</td>
                  <td>{t.coach}</td>
                  <td>{t.training}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Inschrijven</h2>
        <p>
          Wil je mee trainen? Neem contact op via de contactpagina of kom gerust een training
          meepikken.
        </p>
      </section>
    </div>
  );
}
