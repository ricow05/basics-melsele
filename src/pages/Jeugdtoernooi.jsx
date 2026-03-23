const jeugdtoernooiInfo = [
  "Inschrijving opent jaarlijks in mei.",
  "U8 t.e.m. U16 ploegen kunnen deelnemen.",
  "Wedstrijden worden gespeeld op 2 terreinen.",
  "Elke ploeg ontvangt een fair-play trofee.",
];

export default function Jeugdtoernooi() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>JEUGDTOERNOOI</h1>
        <p>Praktische informatie en planning</p>
      </section>

      <section className="text-section">
        <h2>Info</h2>
        <ul className="link-list">
          {jeugdtoernooiInfo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="highlight-box">
          Meer details volgen binnenkort via deze pagina.
        </div>
      </section>
    </div>
  );
}
