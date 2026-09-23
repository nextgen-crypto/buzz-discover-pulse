import { queryOptions } from "@tanstack/react-query";
import {
  fetchArticle,
  fetchNews,
  fetchNewsTopics,
  fetchProfile,
  fetchRelated,
  fetchRelatedNews,
  fetchShorts,
  fetchVideo,
  fetchVideos,
} from "@/backend/api/sections.functions";

export const newsQueryOptions = queryOptions({
  queryKey: ["news"],
  queryFn: () => fetchNews(),
  staleTime: 60_000,
  retry: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
});

export const articleQueryOptions = (articleId: string) =>
  queryOptions({
    queryKey: ["news-article", articleId],
    queryFn: () => fetchArticle({ data: { articleId } }),
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

export const relatedNewsQueryOptions = (articleId: string) =>
  queryOptions({
    queryKey: ["news-related", articleId],
    queryFn: () => fetchRelatedNews({ data: { articleId } }),
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

export const newsTopicsQueryOptions = queryOptions({
  queryKey: ["news-topics"],
  queryFn: () => fetchNewsTopics(),
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

export const videoQueryOptions = (videoId: string) =>
  queryOptions({
    queryKey: ["video", videoId],
    queryFn: () => fetchVideo({ data: { videoId } }),
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

export const relatedQueryOptions = (videoId: string) =>
  queryOptions({
    queryKey: ["related", videoId],
    queryFn: () => fetchRelated({ data: { videoId } }),
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
