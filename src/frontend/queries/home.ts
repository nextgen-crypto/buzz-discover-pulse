import { queryOptions } from "@tanstack/react-query";
import { fetchHome } from "@/backend/api/home.functions";

export const homeQueryOptions = queryOptions({
  queryKey: ["home", "feed", "start"],
  queryFn: () => fetchHome({ data: { cursor: null } }),
  staleTime: 30_000,
  // Transient RPC failures ("Failed to fetch" while the preview reconnects)
  // should retry instead of blanking the screen.
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
});
