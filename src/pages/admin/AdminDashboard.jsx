import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user, role } = useAuth();

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>ADMIN DASHBOARD</h1>
        <p>Ingelogd als {user?.email || "onbekend"} ({role})</p>
      </section>

      <section className="text-section">
        <h2>Beheer</h2>
        <ul className="link-list">
          <li><NavLink to="/admin/news">Nieuws beheren</NavLink></li>
          <li><NavLink to="/admin/agenda">Agenda beheren</NavLink></li>
          <li><NavLink to="/admin/activities">Activiteiten beheren</NavLink></li>
          <li><NavLink to="/admin/members">Leden beheren</NavLink></li>
          <li><NavLink to="/admin/teams">Ploegen beheren</NavLink></li>
          <li><NavLink to="/admin/sponsors">Sponsors beheren</NavLink></li>
          <li><NavLink to="/admin/pages">Pagina-inhoud beheren</NavLink></li>
        </ul>
      </section>
    </div>
  );
}
