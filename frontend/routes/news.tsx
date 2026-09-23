import { createFileRoute } from "@tanstack/react-router";
import { newsStoriesQueryOptions } from "@/frontend/hooks/useNewsStories";
import { trendingTopicsQueryOptions } from "@/frontend/hooks/useTrendingTopics";
import { NewsError, NewsPending, NewsScreen } from "@/frontend/screens/NewsScreen";

export const Route = createFileRoute("/news")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "WIZZ — News" },
      { name: "description", content: "Live and breaking stories curated for your WIZZ feed." },
      { property: "og:title", content: "WIZZ — News" },
      {
        property: "og:description",
        content: "Live and breaking stories curated for your WIZZ feed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(newsStoriesQueryOptions).catch(() => null),
      context.queryClient.ensureQueryData(trendingTopicsQueryOptions).catch(() => null),
    ]),
  pendingComponent: NewsPending,
  errorComponent: NewsError,
  component: NewsScreen,
});
