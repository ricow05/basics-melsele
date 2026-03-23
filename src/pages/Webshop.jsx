const products = [
  { name: "Club T-shirt", price: "€20", description: "Officieel clubshirt met logo, unisex." },
  { name: "Club Hoodie", price: "€40", description: "Warme hoodie met Basics Melsele borduursel." },
  { name: "Basketbal", price: "€30", description: "Officiële trainingsbal met clublogo." },
  { name: "Drinkfles", price: "€12", description: "BPA-vrije drinkfles, 750 ml." },
  { name: "Cap", price: "€15", description: "Verstelbare cap met geborduurd logo." },
  { name: "Sportzak", price: "€25", description: "Ruime sportzak voor al je materiaal." },
];

export default function Webshop() {
  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>WEBSHOP</h1>
        <p>Officiële clubmerchandise</p>
      </section>
      <section className="text-section">
        <p>
          Draag de clubkleuren met trots! Bestel hieronder jouw favoriete merchandise. Bij vragen
          of bestellingen neem je contact op via de contactpagina.
        </p>
        <div className="shop-grid">
          {products.map((p) => (
            <div className="shop-card" key={p.name}>
              <div className="shop-icon">🛒</div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <span className="shop-price">{p.price}</span>
              <button type="button" className="cta-btn shop-btn">Bestellen</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
