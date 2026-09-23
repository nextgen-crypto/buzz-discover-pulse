import { createFileRoute } from "@tanstack/react-router";
import { FollowListScreen } from "@/frontend/screens/FollowListScreen";

export const Route = createFileRoute("/u/$username/following")({
  head: ({ params }) => {
    const title = `Accounts @${params.username} follows — WIZZ`;
    const description = `Accounts followed by @${params.username} on WIZZ.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <FollowListScreen username={username} kind="following" />;
}
