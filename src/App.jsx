import { useEffect, useMemo, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";

import Home from "./pages/Home";
import Club from "./pages/Club";
import Seniors from "./pages/Seniors";
import Jeugd from "./pages/Jeugd";
import Bewegingsschool from "./pages/Bewegingsschool";
import Agenda from "./pages/Agenda";
import Trainingen from "./pages/Trainingen";
import AgendaActivity from "./pages/AgendaActivity";
import Tombola from "./pages/Tombola";
import Partners from "./pages/Partners";
import Extra from "./pages/Extra";
import Contact from "./pages/Contact";
import Webshop from "./pages/Webshop";

const navItems = [
  { label: "HOME",                          path: "/" },
  { label: "CLUB",                          path: "/club" },
  { label: "SENIORS",                       path: "/seniors" },
  { label: "JEUGD",                         path: "/jeugd" },
  { label: "BEWEGINGS- & BASKETSCHOOL",     path: "/bewegingsschool" },
  { label: "AGENDA EN ACTIVITEITEN",        path: "/agenda" },
  { label: "BASICS TOMBOLA 2025",           path: "/tombola" },
  { label: "PARTNERS",                      path: "/partners" },
  { label: "EXTRA",                         path: "/extra" },
  { label: "CONTACT",                       path: "/contact" },
  { label: "WEBSHOP",                       path: "/webshop" },
];

function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows
    .map((row) => {
      const cols = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (cols[i] ?? "").trim();
      });
      return obj;
    })
    .filter((row) => row.title);
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeActivities, setActiveActivities] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch("/activities.csv")
      .then((r) => r.text())
      .then((text) => {
        if (!isMounted) return;
        const items = parseCsv(text)
          .filter((row) => (row.active || "").toUpperCase() === "Y")
          .map((row) => ({
            ...row,
            slug: slugify(row.title),
          }))
          .filter((row) => row.slug);

        setActiveActivities(items);
      })
      .catch(() => {
        if (isMounted) {
          setActiveActivities([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const agendaMenuItems = useMemo(() => {
    return [
      { label: "Wedstrijden", path: "/agenda" },
      { label: "Trainingen", path: "/agenda/trainingen" },
      ...activeActivities.map((item) => ({
        label: item.title,
        path: `/agenda/activiteit/${item.slug}`,
      })),
    ];
  }, [activeActivities]);

  return (
    <div className="site">
      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="header-brand" onClick={() => setMenuOpen(false)}>
            <img
              src="/logo-15683c6a5a2dda85d1060b89efe1a23f.png"
              alt="Basics Melsele logo"
              className="header-logo"
            />
            <span className="header-title">BASICS MELSELE</span>
          </NavLink>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
        <nav className={`main-nav${menuOpen ? " open" : ""}`}>
          {navItems.map((item) => (
            item.path === "/agenda" ? (
              <div className="nav-dropdown" key={item.path}>
                <NavLink
                  to="/agenda"
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
                <div className="nav-submenu">
                  {agendaMenuItems.map((menuItem) => (
                    <NavLink
                      key={menuItem.path}
                      to={menuItem.path}
                      end={menuItem.path === "/agenda"}
                      className={({ isActive }) => `nav-subitem${isActive ? " active" : ""}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {menuItem.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            )
          ))}
        </nav>
      </header>

      {/* Page content */}
      <main>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/club"              element={<Club />} />
          <Route path="/seniors"           element={<Seniors />} />
          <Route path="/jeugd"             element={<Jeugd />} />
          <Route path="/bewegingsschool"   element={<Bewegingsschool />} />
          <Route path="/agenda"            element={<Agenda />} />
          <Route path="/agenda/trainingen" element={<Trainingen />} />
          {activeActivities.map((item) => (
            <Route
              key={item.slug}
              path={`/agenda/activiteit/${item.slug}`}
              element={<AgendaActivity activity={item} />}
            />
          ))}
          <Route path="/tombola"           element={<Tombola />} />
          <Route path="/partners"          element={<Partners />} />
          <Route path="/extra"             element={<Extra />} />
          <Route path="/contact"           element={<Contact />} />
          <Route path="/webshop"           element={<Webshop />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Basics Melsele Basketball Club</span>
      </footer>
    </div>
  );
}

