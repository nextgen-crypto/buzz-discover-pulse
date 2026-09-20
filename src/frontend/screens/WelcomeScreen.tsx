import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Film, Flame, Radio, Users } from "lucide-react";
import { imageUrl } from "@/backend/domain/media";
import { explorePhotos, creators } from "@/backend/database/seed";
import { cn } from "@/lib/utils";

const slides = [
  {
    Icon: Radio,
    title: "Live stories, first thing",
    body: "Open BUZZ and see who is live right now. Tap a ring to jump straight into the moment.",
  },
  {
    Icon: Flame,
    title: "Trending, tuned to you",
    body: "Purple chips surface the topics moving fastest, ranked from what you actually watch.",
  },
  {
    Icon: Film,
    title: "Shorts that fill the screen",
    body: "Swipe a full-screen feed of short videos with like, comment and share always in reach.",
  },
  {
    Icon: Users,
    title: "Creators you keep",
    body: "Follow people, post your own photos and clips, and your feed follows you to any device.",
  },
] as const;

export function WelcomeScreen() {
  const [step, setStep] = useState(0);
  const slide = slides[step]!;
  const last = step === slides.length - 1;
  const covers = explorePhotos.slice(step, step + 3);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-background px-5 pb-8 pt-6 sm:px-8 sm:pt-8 md:border-x md:border-border">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-title">WIZZ</span>
        <Link to="/" className="text-sm font-semibold text-muted-foreground">
          Skip
        </Link>
      </div>

       <div className="relative mx-auto mt-6 h-56 w-full max-w-md sm:mt-8 sm:h-64">
        {covers.map((c, i) => (
          <img
            key={c.id}
            src={imageUrl(c.key, "small", c.aspect)}
            alt={c.category}
            className={cn(
               "absolute h-44 w-[38%] max-w-40 rounded-3xl border-4 border-background object-cover shadow-raise sm:h-52",
              i === 0 && "left-2 top-6 -rotate-6",
              i === 1 && "left-1/2 top-0 z-10 -translate-x-1/2",
              i === 2 && "right-2 top-6 rotate-6",
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex -space-x-2">
        {creators.slice(0, 5).map((c) => (
          <img
            key={c.id}
            src={imageUrl(c.avatarKey, "thumbnail")}
            alt={c.displayName}
            className="size-8 rounded-full border-2 border-background object-cover"
          />
        ))}
        <span className="ml-4 self-center text-xs text-muted-foreground">
          Creators posting on BUZZ today
        </span>
      </div>

      <div className="mt-8 flex-1">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft">
          <slide.Icon className="size-5 text-brand" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground">
          {slide.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{slide.body}</p>
      </div>

      <div className="mb-5 flex gap-1.5">
        {slides.map((s, i) => (
          <span
            key={s.title}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === step ? "w-6 bg-brand" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>

      {last ? (
        <div className="flex flex-col gap-2">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground"
          >
            Create your account
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-border py-3.5 text-sm font-semibold text-foreground"
          >
            Explore first
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(s + 1, slides.length - 1))}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground"
        >
          Next
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}
