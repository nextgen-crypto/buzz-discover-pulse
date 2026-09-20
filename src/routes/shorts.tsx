import { createFileRoute } from "@tanstack/react-router";
import { shortsQueryOptions } from "@/frontend/queries/sections";
import { ShortsScreen } from "@/frontend/screens/ShortsScreen";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "WIZZ — Shorts" },
      { name: "description", content: "Vertical short-form videos from WIZZ creators." },
      { property: "og:title", content: "WIZZ — Shorts" },
      { property: "og:description", content: "Vertical short-form videos from WIZZ creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shortsQueryOptions),
  component: ShortsScreen,
});
