import { queryOptions } from "@tanstack/react-query";
import { fetchNews, fetchProfile, fetchShorts, fetchVideos } from "@/backend/api/sections.functions";

export const newsQueryOptions = queryOptions({
  queryKey: ["news"],
  queryFn: () => fetchNews(),
  staleTime: 60_000,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
});

export const shortsQueryOptions = queryOptions({
  queryKey: ["shorts"],
  queryFn: () => fetchShorts(),
  staleTime: 30_000,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
});

export const videosQueryOptions = queryOptions({
  queryKey: ["videos"],
  queryFn: () => fetchVideos(),
  staleTime: 60_000,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
});

export const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => fetchProfile(),
  staleTime: 60_000,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
});
