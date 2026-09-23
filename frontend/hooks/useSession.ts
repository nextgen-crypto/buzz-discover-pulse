import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Live Supabase session for the browser; null while signed out. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    // Self-heal corpse sessions: a stored session whose token the server
    // rejects (expired/revoked) breaks every write with 403s. Verify once;
    // on a hard auth rejection (never on plain network failure) clear it so
    // the UI honestly shows logged-out instead of silently failing writes.
    supabase.auth.getUser().then(({ error }) => {
      if (!active || !error) return;
      const msg = error.message.toLowerCase();
      const authDead =
        msg.includes("invalid") ||
        msg.includes("expired") ||
        msg.includes("revoked") ||
        msg.includes("not authenticated") ||
        error.status === 401 ||
        error.status === 403;
      const offline = msg.includes("fetch") || msg.includes("network") || msg.includes("offline");
      if (authDead && !offline) void supabase.auth.signOut();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;

  return {
    session,
    loading,
    user: session?.user ?? null,
    email: session?.user.email ?? null,
    displayName:
      meta['full_name'] ?? meta['name'] ?? session?.user.email?.split("@")[0] ?? null,
    avatarUrl: meta['avatar_url'] ?? meta['picture'] ?? null,
  };
}
