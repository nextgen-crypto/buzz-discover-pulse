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
    body: "Open WIZZ and see who is live right now. Tap a ring to jump straight into the moment.",
  },
  {
    Icon: Flame,
    title: "Trending, tuned to you",
    body: "Smart chips surface the topics moving fastest, ranked from what you actually watch.",
  },
  {
    Icon: Film,
    title: "Shorts that fill the screen",
    body: "Swipe a full-screen feed of short videos — double-tap to like, Blend to watch together.",
  },
  {
    Icon: Users,
    title: "Creators you keep",
    body: "Follow people, post your own photos and clips, and your feed follows you to any device.",
  },
] as const;

export function WelcomeScreen() {
  const [step, setStep] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const slide = slides[Math.min(step, slides.length - 1)]!;
  const picking = step === slides.length;
  const done = step === slides.length + 1;
  const covers = explorePhotos.slice(
    Math.min(step, slides.length - 1),
    Math.min(step, slides.length - 1) + 3,
  );

  function next() {
    setStep((s) => Math.min(s + 1, slides.length + 1));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function togglePick(cat: string) {
    setPicked((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function savePicksAndContinue() {
    try {
      localStorage.setItem("wizz:onboard-interests", JSON.stringify({ categories: picked }));
    } catch {
      // ignore
    }
    next();
  }

  return (
    <div
      className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-background px-5 pb-8 pt-6 sm:px-8 sm:pt-8 md:border-x md:border-border"
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
        setTouchX(null);
        if (dx < -50) next();
        else if (dx > 50) prev();
      }}
    >
      <span
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-soft blur-3xl"
      />
      <span
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -left-24 top-1/3 size-56 rounded-full bg-secondary blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />
      <div className="relative flex items-center justify-between">
        <span className="animate-fade-up text-2xl font-extrabold tracking-tight text-title">
          WIZZ
        </span>
        <Link to="/" className="text-sm font-semibold text-muted-foreground">
          Skip
        </Link>
      </div>

      <div
        key={`covers-${step}`}
        className="relative mx-auto mt-6 h-56 w-full max-w-md sm:mt-8 sm:h-64"
      >
        {covers.map((c, i) => (
          <img
            key={c.id}
            src={imageUrl(c.key, "small", c.aspect)}
            alt={c.category}
            className={cn(
              "animate-scale-in absolute h-44 w-[38%] max-w-40 rounded-3xl border-4 border-background object-cover shadow-raise sm:h-52",
              i === 1 && "animate-float",
              i === 0 && "left-2 top-6 -rotate-6",
              i === 1 && "left-1/2 top-0 z-10 -translate-x-1/2",
              i === 2 && "right-2 top-6 rotate-6",
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      <div className="animate-fade-up mt-4 flex -space-x-2" style={{ animationDelay: "150ms" }}>
        {creators.slice(0, 5).map((c, i) => (
          <img
            key={c.id}
            src={imageUrl(c.avatarKey, "thumbnail")}
            alt={c.displayName}
            className="animate-scale-in size-8 rounded-full border-2 border-background object-cover"
            style={{ animationDelay: `${200 + i * 70}ms` }}
          />
        ))}
        <span className="ml-4 self-center text-xs text-muted-foreground">
          Creators posting on WIZZ today
        </span>
      </div>

      <div key={`copy-${step}`} className="animate-fade-up mt-8 flex-1">
        {picking ? (
          <>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              What are you into?
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Pick a few — your feed tunes itself from here. Skip and we&apos;ll start with
              what&apos;s trending.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Music", "Comedy", "News", "Sports", "Food", "Travel", "Tech", "Style"].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => togglePick(cat)}
                    aria-pressed={picked.includes(cat)}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                      picked.includes(cat)
                        ? "bg-brand text-brand-foreground"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>
          </>
        ) : (
          !done && (
            <>
              <span className="animate-pop inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft">
                <slide.Icon className="size-5 text-brand" />
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground">
                {slide.title}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{slide.body}</p>
            </>
          )
        )}
      </div>

      <div className="mb-5 flex items-center gap-1.5">
        <div className="flex flex-1 gap-1.5">
          {[...slides.map((s) => s.title), "interests"].map((key, i) => (
            <span
              key={key}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === Math.min(step, slides.length) ? "w-6 bg-brand" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
        {step > 0 && (
          <button
            type="button"
            onClick={prev}
            className="press rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground"
          >
            Back
          </button>
        )}
      </div>

      {done ? (
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
      ) : picking ? (
        <button
          type="button"
          onClick={savePicksAndContinue}
          className="press inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground"
        >
          {picked.length > 0 ? `Continue with ${picked.length}` : "Skip for now"}
          <ArrowRight className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          className="press inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground"
        >
          Next
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}
