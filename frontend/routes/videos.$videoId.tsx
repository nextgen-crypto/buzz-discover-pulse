import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/videos/$videoId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/watch/$videoId", params: { videoId: params.videoId } });
  },
});
