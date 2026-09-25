import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchPostingCapabilities, type PostingCapabilities } from "@/backend/api/posts.functions";

/**
 * Cache the authenticated server-side schema probe for the whole client.
 * The probe is deliberately server-side so legacy projects do not generate
 * noisy PostgREST errors in the browser while they are waiting for migrations.
 */
export function usePostingCapabilities(userId: string | null) {
  const inspect = useServerFn(fetchPostingCapabilities);

  return useQuery<PostingCapabilities>({
    queryKey: ["posting-capabilities-v2", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: inspect,
  });
}
