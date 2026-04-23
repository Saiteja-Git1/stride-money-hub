import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./auth-context";
import { supabase } from "./client";

interface ProfileSummary {
  name: string;
  avatar_url: string | null;
}

function fallbackName(user: User | null) {
  if (!user) return "";

  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  if (metadataName) return metadataName;

  if (user.email) return user.email.split("@")[0] ?? "";

  return "Lumen User";
}

function makeInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "LU";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(nextUser: User | null) {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return;
    }

    setProfile(data ?? null);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!active) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      await loadProfile(currentSession?.user ?? null);

      if (active) setLoading(false);
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((nextEvent, nextSession) => {
      void nextEvent;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void loadProfile(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const displayName = profile?.name?.trim() || fallbackName(user);
  const initials = makeInitials(displayName);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        displayName,
        initials,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refreshProfile: async () => {
          await loadProfile(user);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
