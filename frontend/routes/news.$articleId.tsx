import { createFileRoute } from "@tanstack/react-router";
import { storyQueryOptions } from "@/frontend/hooks/useStoryDetail";
import { NewsThreadPending, NewsThreadScreen } from "@/frontend/screens/NewsThreadScreen";

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
    context.queryClient.ensureQueryData(storyQueryOptions(params.articleId)).catch(() => null),
  pendingComponent: NewsThreadPending,
  component: NewsThreadScreen,
});
