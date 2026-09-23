import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { ShowcaseSlide } from "@/frontend/components/showcase/showcase";
import { cn } from "@/lib/utils";

/**
 * PUBG-style animated showcase: smoky animated gradient, rising embers,
 * floating artwork, glowing CTA, shine sweep, auto-rotating slides.
 */
export function ShowcaseCarousel({ slides }: { slides: ShowcaseSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(t);
  }, [slides.length]);

  const slide = slides[Math.min(index, slides.length - 1)];
  if (!slide) return null;

  return (
    <div className="px-3 pt-3 sm:px-5">
      <div
        key={slide.id}
        className="animate-scale-in relative overflow-hidden rounded-3xl border border-border"
        style={{ backgroundImage: `linear-gradient(120deg, ${slide.bgFrom}, ${slide.bgTo})` }}
      >
        {/* animated sheen */}
        <span
          aria-hidden="true"
          className="animate-gradient-pan pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.14) 48%, transparent 62%)",
          }}
        />
        {/* rising embers */}
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="animate-float pointer-events-none absolute rounded-full"
            style={{
              left: `${8 + i * 13}%`,
              bottom: "-6px",
              width: i % 3 === 0 ? 5 : 3,
              height: i % 3 === 0 ? 5 : 3,
              backgroundColor: slide.accent,
              opacity: 0.55,
              animationDelay: `${i * 0.45}s`,
              animationDuration: `${2.4 + (i % 3) * 0.7}s`,
            }}
          />
        ))}

        <div className="relative flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black"
              style={{ backgroundColor: slide.accent }}
            >
              Featured
            </span>
            <p className="mt-1.5 truncate text-lg font-black leading-tight text-white drop-shadow">
              {slide.title}
            </p>
            {slide.subtitle && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/75">
                {slide.subtitle}
              </p>
            )}
            {slide.cta && (
              <a
                href={slide.linkUrl || "#"}
                target={slide.linkUrl ? "_blank" : undefined}
                rel="noreferrer"
                className="press mt-2.5 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-black text-black"
                style={{ backgroundColor: slide.accent, boxShadow: `0 0 18px ${slide.accent}66` }}
              >
                {slide.cta} <ArrowUpRight className="size-3.5" strokeWidth={3} />
              </a>
            )}
          </div>
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt={slide.title}
              loading="lazy"
              className="animate-float size-24 shrink-0 rounded-2xl border border-white/20 object-cover shadow-raise sm:size-28"
            />
          )}
        </div>

        {slides.length > 1 && (
          <div className="relative flex justify-center gap-1.5 pb-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
