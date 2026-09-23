import { createFileRoute } from "@tanstack/react-router";
import { relatedQueryOptions, videoQueryOptions } from "@/frontend/queries/sections";
import { WatchScreen } from "@/frontend/screens/WatchScreen";

export const Route = createFileRoute("/watch/$videoId")({
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
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(videoQueryOptions(params.videoId)),
      context.queryClient.ensureQueryData(relatedQueryOptions(params.videoId)),
    ]),
  component: WatchScreen,
});
