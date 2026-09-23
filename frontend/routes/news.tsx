import { createFileRoute } from "@tanstack/react-router";
import { newsQueryOptions } from "@/frontend/queries/sections";
import { NewsError, NewsPending, NewsScreen } from "@/frontend/screens/NewsScreen";

export const Route = createFileRoute("/news")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(newsQueryOptions),
  pendingComponent: NewsPending,
  errorComponent: NewsError,
  component: NewsScreen,
});
