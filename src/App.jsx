import { useEffect, useMemo, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { loadActivities, toActivitiesWithSlug } from "./lib/activities";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/public/Home";
import Club from "./pages/public/Club";
import Seniors from "./pages/public/Seniors";
import Jeugd from "./pages/public/Jeugd";
import Bewegingsschool from "./pages/public/Bewegingsschool";
import Agenda from "./pages/public/Agenda";
import Trainingen from "./pages/public/Trainingen";
import AgendaActivity from "./pages/public/AgendaActivity";
import Tombola from "./pages/public/Tombola";
import Partners from "./pages/public/Partners";
import Extra from "./pages/public/Extra";
import Contact from "./pages/public/Contact";
import Webshop from "./pages/public/Webshop";
import AdminActivities from "./pages/admin/AdminActivities";
import Login from "./pages/public/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNews from "./pages/admin/AdminNews";
import AdminAgenda from "./pages/admin/AdminAgenda";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminPages from "./pages/admin/AdminPages";
import AdminMembers from "./pages/admin/AdminMembers";

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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeActivities, setActiveActivities] = useState([]);
  const { isAuthenticated, signOut, loading } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function loadActiveActivities() {
      const items = await loadActivities();
      if (!isMounted) return;
      setActiveActivities(toActivitiesWithSlug(items));
    }

    loadActiveActivities();

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
          <div className="header-auth">
            {!loading && !isAuthenticated && (
              <NavLink
                to="/login"
                className={({ isActive }) => `header-auth-item${isActive ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                LOGIN
              </NavLink>
            )}

            {!loading && isAuthenticated && (
              <>
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `header-auth-item${isActive ? " active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  ADMIN
                </NavLink>
                <button
                  type="button"
                  className="header-auth-item"
                  onClick={async () => {
                    await signOut();
                    setMenuOpen(false);
                  }}
                >
                  LOGOUT
                </button>
              </>
            )}
          </div>
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
          <Route path="/login"             element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminNews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agenda"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminAgenda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sponsors"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminSponsors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pages"
            element={
              <ProtectedRoute allowedRoles={["admin", "editor"]}>
                <AdminPages />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Basics Melsele Basketball Club</span>
      </footer>
    </div>
  );
}

