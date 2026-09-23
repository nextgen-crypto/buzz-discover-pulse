import { createFileRoute } from "@tanstack/react-router";
import { AdminScreen } from "@/frontend/screens/AdminScreen";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "WIZZ — Admin dashboard" },
      { name: "description", content: "App metrics, creators, live activity and review queue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminScreen,
});
