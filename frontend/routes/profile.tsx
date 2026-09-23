import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/frontend/screens/ProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "WIZZ — Your profile" },
      { name: "description", content: "Your WIZZ account: posts, followers and saves." },
      { property: "og:title", content: "WIZZ — Your profile" },
      { property: "og:description", content: "Your WIZZ account: posts, followers and saves." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfileScreen,
});
