import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, role, user, profile, profileError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-content">
        <section className="text-section">
          <p>Authenticatie laden...</p>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>GEEN TOEGANG</h1>
          <p>Je hebt geen rechten om deze pagina te bekijken.</p>
          <p>Aangemeld als: {user?.email || "onbekend"}</p>
          <p>Gedetecteerde rol: {role}</p>
          <p>Profiel aanwezig: {profile ? "ja" : "nee"}</p>
          {profileError ? <p>Profielfout: {profileError}</p> : null}
          <p>Vereiste rol(len): {allowedRoles.join(", ")}</p>
          <p>Doelroute: {location.pathname}</p>
        </section>
      </div>
    );
  }

  return children;
}
