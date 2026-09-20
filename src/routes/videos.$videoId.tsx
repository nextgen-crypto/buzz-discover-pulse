import { createFileRoute } from "@tanstack/react-router";
import { videosQueryOptions } from "@/frontend/queries/sections";
import { WatchScreen } from "@/frontend/screens/WatchScreen";

export const Route = createFileRoute("/videos/$videoId")({
  head: () => ({
    meta: [
      { title: "WIZZ — Watch" },
      { name: "description", content: "Watch long-form videos from WIZZ creators." },
      { property: "og:title", content: "WIZZ — Watch" },
      { property: "og:description", content: "Watch long-form videos from WIZZ creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions),
  component: WatchScreen,
});
