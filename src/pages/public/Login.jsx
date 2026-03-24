import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Login page — only accessible to authorized users (admins).
// Handles Supabase email/password sign-in and redirects to the admin area on success.
export default function Login() {
  const { signIn, isAuthenticated, hasSupabaseEnv, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled inputs for the login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Tracks whether a sign-in request is in flight to prevent duplicate submissions
  const [submitting, setSubmitting] = useState(false);
  // Holds any error message to display below the form
  const [error, setError] = useState("");

  // After a successful login, redirect to the page the user was trying to reach,
  // or fall back to /admin if no previous location is stored.
  const redirectTo = useMemo(() => {
    return location.state?.from || "/admin";
  }, [location.state]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Basic client-side validation — both fields are required
    if (!email.trim() || !password.trim()) {
      setError("Vul e-mail en wachtwoord in.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      // Show the error from Supabase (e.g. wrong credentials) and re-enable the form
      setError(signInError.message || "Aanmelden mislukt.");
      setSubmitting(false);
      return;
    }

    // Sign-in succeeded — navigate to the intended destination
    navigate(redirectTo, { replace: true });
  }

  // Show a loading state while the auth context is initialising
  if (loading) {
    return (
      <div className="page-content">
        <section className="text-section">
          <p>Authenticatie laden...</p>
        </section>
      </div>
    );
  }

  // If the user is already signed in, show a short message with a link to admin
  if (isAuthenticated) {
    return (
      <div className="page-content">
        <section className="page-hero">
          <h1>AANGEMELD</h1>
          <p>Je bent al aangemeld.</p>
          <p>
            <NavLink to="/admin">Ga naar admin</NavLink>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section className="page-hero">
        <h1>LOGIN</h1>
        <p>Alleen geautoriseerde gebruikers hebben toegang tot admin pagina's.</p>
      </section>

      <section className="text-section">
        {/* Warn the admin if the required Supabase environment variables are missing */}
        {!hasSupabaseEnv && (
          <p>Supabase is niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe.</p>
        )}

        <form onSubmit={handleSubmit}>
          <p>
            <label htmlFor="email">E-mail</label>
            <br />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Disable inputs while submitting or when Supabase is not configured
              disabled={submitting || !hasSupabaseEnv}
            />
          </p>

          <p>
            <label htmlFor="password">Wachtwoord</label>
            <br />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || !hasSupabaseEnv}
            />
          </p>

          <button type="submit" disabled={submitting || !hasSupabaseEnv}>
            {/* Show a loading label while the sign-in request is pending */}
            {submitting ? "Aanmelden..." : "Aanmelden"}
          </button>
        </form>

        {/* Display sign-in errors (e.g. wrong password) in red below the form */}
        {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      </section>
    </div>
  );
}
