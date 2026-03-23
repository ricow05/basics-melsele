import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // In a real implementation this would send to a backend or email service.
    setSent(true);
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>CONTACT</h1>
        <p>Neem gerust contact op</p>
      </section>
      <section className="text-section">
        <div className="contact-grid">
          <div>
            <h2>Gegevens</h2>
            <p>
              <strong>Basics Melsele Basketball Club</strong>
              <br />
              Sporthal Melsele
              <br />
              Melsele, Beveren
            </p>
            <p>
              📧 <a href="mailto:info@basicsmelsele.be">info@basicsmelsele.be</a>
            </p>
          </div>
          <div>
            <h2>Stuur een bericht</h2>
            {sent ? (
              <p className="success-msg">✅ Bericht verzonden! We nemen spoedig contact op.</p>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label>
                  Naam
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </label>
                <label>
                  E-mail
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Bericht
                  <textarea
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </label>
                <button type="submit" className="cta-btn">Verstuur</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
