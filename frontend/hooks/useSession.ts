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
