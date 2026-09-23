import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/frontend/hooks/useSession";

/**
 * Unsigned viewers get sent to signup instead of hitting dead buttons.
 * Returns true when authed (proceed), false after redirecting.
 */
export function useAuthGate() {
  const { user } = useSession();
  const navigate = useNavigate();
  return useCallback(() => {
    if (user) return true;
    void navigate({ to: "/auth" });
    return false;
  }, [user, navigate]);
}
