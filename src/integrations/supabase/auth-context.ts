import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

interface ProfileSummary {
  name: string;
  avatar_url: string | null;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileSummary | null;
  loading: boolean;
  displayName: string;
  initials: string;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
