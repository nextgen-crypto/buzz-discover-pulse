import { createFileRoute } from "@tanstack/react-router";
import { MessagesScreen } from "@/frontend/screens/MessagesScreen";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): { c?: string | undefined } => ({
    c: typeof search["c"] === "string" ? search["c"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "WIZZ — Messages" },
      { name: "description", content: "Direct messages with people on WIZZ." },
    ],
  }),
  component: MessagesScreen,
});
