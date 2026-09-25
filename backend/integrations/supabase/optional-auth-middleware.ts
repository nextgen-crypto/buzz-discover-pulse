import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createKeyAwareSupabaseFetch } from "./key-aware-fetch";

type OptionalAuthContext = {
  supabase: SupabaseClient<Database> | null;
  userId: string | null;
};

function anonymousClient(): SupabaseClient<Database> | null {
  const url = process.env["SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    global: { fetch: createKeyAwareSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Attaches the signed-in Supabase user when a valid bearer token is present.
 * Invalid or absent credentials intentionally fall back to anonymous reads so
 * SSR, public profiles, and signed-out Home continue to degrade gracefully.
 */
export const optionalSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const url = process.env["SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    const request = getRequest();
    const authorization = request?.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

    if (!url || !key || !token || token.split(".").length !== 3) {
      const context: OptionalAuthContext = { supabase: anonymousClient(), userId: null };
      return next({ context });
    }

    const supabase = createClient<Database>(url, key, {
      global: {
        fetch: createKeyAwareSupabaseFetch(key),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let userId: string | null = null;
    try {
      const { data, error } = await supabase.auth.getClaims(token);
      userId = !error ? (data?.claims?.sub ?? null) : null;
    } catch {
      // A claims endpoint outage degrades to public reads; it must not blank
      // the entire Home route.
    }
    if (!userId) {
      const context: OptionalAuthContext = { supabase: anonymousClient(), userId: null };
      return next({ context });
    }

    const context: OptionalAuthContext = { supabase, userId };
    return next({ context });
  },
);
