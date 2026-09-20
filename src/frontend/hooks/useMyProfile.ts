import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MyProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  verified: boolean;
};

/** The signed-in user's editable profile row; null while signed out. */
export function useMyProfile(userId: string | null) {
  return useQuery({
    queryKey: ["my-profile", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<MyProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as MyProfile | null;
    },
  });
}
