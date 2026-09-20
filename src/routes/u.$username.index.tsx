import { createFileRoute } from "@tanstack/react-router";
import { PublicProfileScreen } from "@/frontend/screens/PublicProfileScreen";

export const Route = createFileRoute("/u/$username/")({
  head: ({ params }) => {
    const title = `@${params.username} on WIZZ`;
    const description = `See posts, followers and following for @${params.username} on WIZZ.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <PublicProfileScreen username={username} />;
}
