const teams = [
  "U21 A",
  "U21 B",
  "U19 M",
  "U18 A",
  "U18 B",
  "U18 C",
  "U16 A",
  "U16 B",
  "U16 M",
  "U14 A",
  "U14 B",
  "U14 C",
  "U14 D",
  "U14 M",
  "U12 A",
  "U12 B",
  "U12 C",
  "U12 D",
  "U10 A",
  "U10 B",
  "U10 C",
  "U8",
  "Basketschool",
];

export default function Jeugd() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>JEUGD</h1>
        <p>Basketbal voor elk jong talent</p>
      </section>
      <section className="text-section">
        <p>
          Onze jeugdwerking staat voor kwaliteitsvolle begeleiding, plezier en ontwikkeling.
          Opgeleide coaches begeleiden elk kind stap voor stap in hun basketbalgroei.
        </p>
        <h2>Teams</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team}>
                  <td>{team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
