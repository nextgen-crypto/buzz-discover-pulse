import { createFileRoute } from "@tanstack/react-router";
import { articleQueryOptions, relatedNewsQueryOptions } from "@/frontend/queries/sections";
import { NewsThreadScreen } from "@/frontend/screens/NewsThreadScreen";

export const Route = createFileRoute("/news/$articleId")({
  head: () => ({
    meta: [
      { title: "WIZZ — Story thread" },
      { name: "description", content: "Live updates, discussion and related coverage." },
      { property: "og:title", content: "WIZZ — Story thread" },
      { property: "og:type", content: "article" },
    ],
  }),
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(articleQueryOptions(params.articleId)),
      context.queryClient.ensureQueryData(relatedNewsQueryOptions(params.articleId)),
    ]),
  component: NewsThreadScreen,
});
