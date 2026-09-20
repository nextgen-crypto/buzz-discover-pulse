import { createFileRoute } from "@tanstack/react-router";
import { videosQueryOptions } from "@/frontend/queries/sections";
import { VideosScreen } from "@/frontend/screens/VideosScreen";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "WIZZ — Videos" },
      { name: "description", content: "Long-form videos and walkthroughs from WIZZ creators." },
      { property: "og:title", content: "WIZZ — Videos" },
      { property: "og:description", content: "Long-form videos and walkthroughs from WIZZ creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions),
  component: VideosScreen,
});
