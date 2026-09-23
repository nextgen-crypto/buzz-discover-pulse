import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { recordClick, recordImpression, type Ad } from "@/frontend/components/ads/ads";

/**
 * Sponsored unit injected into feeds. Strictly monochrome — the only brand
 * color is the tiny "Ad" marker dot.
 */
export function SponsoredCard({ ad }: { ad: Ad }) {
  const seen = useRef(false);
  useEffect(() => {
    if (!seen.current) {
      seen.current = true;
      recordImpression(ad.id);
    }
  }, [ad.id]);

  return (
    <article className="animate-fade-up border-b border-border bg-card">
      <div className="flex items-center gap-2 px-3 pt-3 sm:px-5">
        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Sponsored
        </span>
      </div>
      <div className="px-3 py-3 sm:px-5">
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            loading="lazy"
            className="aspect-[16/9] w-full rounded-2xl border border-border bg-secondary object-cover"
          />
        )}
        <p className="mt-2.5 text-[15px] font-bold leading-snug text-foreground">{ad.title}</p>
        {ad.subtitle && (
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{ad.subtitle}</p>
        )}
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => recordClick(ad.id)}
          className="press mt-3 flex items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-sm font-bold text-background"
        >
          Learn more <ArrowUpRight className="size-4" />
        </a>
      </div>
    </article>
  );
}
