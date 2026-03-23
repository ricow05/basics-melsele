const partners = [
  { name: "Partner 1", type: "Hoofdsponsor", url: "#" },
  { name: "Partner 2", type: "Goud-sponsor", url: "#" },
  { name: "Partner 3", type: "Goud-sponsor", url: "#" },
  { name: "Partner 4", type: "Zilver-sponsor", url: "#" },
  { name: "Partner 5", type: "Zilver-sponsor", url: "#" },
  { name: "Partner 6", type: "Brons-sponsor", url: "#" },
];

export default function Partners() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>PARTNERS</h1>
        <p>Onze sponsors en partners</p>
      </section>
      <section className="text-section">
        <p>
          Basics Melsele kan niet zonder de steun van haar trouwe partners. Wil jij ook partner
          worden? Neem contact op via de contactpagina.
        </p>
        <div className="partners-grid">
          {partners.map((p) => (
            <div className="partner-card" key={p.name}>
              <div className="partner-badge">{p.type}</div>
              <div className="partner-name">{p.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
