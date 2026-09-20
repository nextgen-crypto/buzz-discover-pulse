import { createFileRoute } from "@tanstack/react-router";
import { homeQueryOptions } from "@/frontend/queries/home";
import { HomeScreen } from "@/frontend/screens/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WIZZ — Stories, trends and creators" },
      {
        name: "description",
        content:
          "WIZZ is a social discovery app with live stories, trending topics, photos and short videos from creators you follow.",
      },
      { property: "og:title", content: "WIZZ — Stories, trends and creators" },
      {
        property: "og:description",
        content:
          "Live stories, trending topics and an endless feed of photos and short videos from the creators you follow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
  component: HomeScreen,
  errorComponent: HomeError,
});

function HomeError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[480px] place-items-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Feed unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
           We couldn't reach WIZZ. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
