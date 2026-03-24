import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      if (!hasSupabaseEnv || !supabase) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const nextSession = data?.session ?? null;

      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    }

    loadInitialSession();

    if (!hasSupabaseEnv || !supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!hasSupabaseEnv || !supabase || !user?.id) {
        if (mounted) {
          setProfile(null);
          setProfileError("");
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setProfile(data ?? null);
        if (error) {
          setProfileError(error.message || "Kon profiel niet lezen.");
        } else if (!data) {
          setProfileError("Geen profielrij gevonden voor ingelogde gebruiker.");
        } else {
          setProfileError("");
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function signIn(email, password) {
    if (!hasSupabaseEnv || !supabase) {
      return { error: new Error("Supabase is not configured.") };
    }
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    if (!hasSupabaseEnv || !supabase) return;
    await supabase.auth.signOut();
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      profileError,
      role: profile?.role || "viewer",
      isAuthenticated: Boolean(user),
      loading,
      signIn,
      signOut,
      hasSupabaseEnv,
    }),
    [session, user, profile, profileError, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return ctx;
}
