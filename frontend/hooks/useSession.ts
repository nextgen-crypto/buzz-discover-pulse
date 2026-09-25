import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SessionState {
  session: Session | null;
  loading: boolean;
}

const INITIAL_STATE: SessionState = { session: null, loading: true };
let state = INITIAL_STATE;
let started = false;
let sessionGeneration = 0;
const listeners = new Set<() => void>();

function update(next: Partial<SessionState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function startSessionSync() {
  if (started) return;
  started = true;

  supabase.auth.onAuthStateChange((_event, next) => {
    sessionGeneration += 1;
    update({ session: next, loading: false });
  });

  void (async () => {
    const requestGeneration = sessionGeneration;
    try {
      const { data } = await supabase.auth.getSession();
      if (requestGeneration !== sessionGeneration) return;
      update({ session: data.session, loading: false });

      // A deleted/expired account can leave a corpse JWT in local storage.
      // Verify once, globally, so cards and route guards do not each spam 403s.
      const verificationGeneration = sessionGeneration;
      const { error } = await supabase.auth.getUser();
      if (verificationGeneration !== sessionGeneration) return;
      if (!error) return;
      const message = error.message.toLowerCase();
      const authDead =
        message.includes("invalid") ||
        message.includes("expired") ||
        message.includes("revoked") ||
        message.includes("not authenticated") ||
        error.status === 401 ||
        error.status === 403;
      const offline =
        message.includes("fetch") || message.includes("network") || message.includes("offline");
      if (authDead && !offline) {
        await supabase.auth.signOut().catch(() => {
          if (verificationGeneration === sessionGeneration)
            update({ session: null, loading: false });
        });
      }
    } catch {
      if (requestGeneration === sessionGeneration) update({ loading: false });
    }
  })();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startSessionSync();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return INITIAL_STATE;
}

/** One shared Supabase session for the entire component tree. */
export function useSession() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const meta = (current.session?.user.user_metadata ?? {}) as Record<string, string | undefined>;

  return {
    session: current.session,
    loading: current.loading,
    user: current.session?.user ?? null,
    email: current.session?.user.email ?? null,
    displayName:
      meta["full_name"] ?? meta["name"] ?? current.session?.user.email?.split("@")[0] ?? null,
    avatarUrl: meta["avatar_url"] ?? meta["picture"] ?? null,
  };
}
