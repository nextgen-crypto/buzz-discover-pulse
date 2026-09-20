import { useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Music, Plus, Share2 } from "lucide-react";
import { imageUrl, videoUrl } from "@/backend/domain/media";
import type { ShortItem } from "@/backend/api/sections.functions";
import { shortsQueryOptions } from "@/frontend/queries/sections";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/frontend/components/home/BottomNav";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function ShortCard({
  item,
  playing,
  onToggle,
}: {
  item: ShortItem;
  playing: boolean;
  onToggle: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <section className="relative flex h-[100dvh] min-h-[32rem] w-full snap-start items-end bg-media">
      <video
        ref={videoRef}
        src={videoUrl(item.short.video.objectKey)}
        poster={imageUrl(item.short.video.posterKey, "medium", 0.5625)}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        loop
        muted
        preload="metadata"
        onClick={() => {
          const v = videoRef.current;
          if (!v) return;
          if (playing) {
            v.pause();
            onToggle("");
          } else {
            void v.play();
            onToggle(item.short.id);
          }
        }}
      />

       <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim to-transparent pb-32 pt-24 sm:pb-36">
         <div className="max-w-[calc(100%-5rem)] px-4 sm:px-6">
          <p className="text-base font-bold text-on-media">@{item.authorUsername}</p>
           <p className="mt-1.5 line-clamp-3 text-sm text-on-media/95">
            {item.short.caption}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-on-media/80">
            <Music className="size-3.5" /> {item.short.soundtrack}
          </p>
        </div>
      </div>

       <div className="absolute bottom-36 right-3 flex flex-col items-center gap-4 sm:bottom-40 sm:right-5 sm:gap-5">
        <div className="relative mb-1">
          <img
            src={imageUrl(item.authorAvatarKey, "thumbnail")}
            alt={item.authorName}
            className="size-11 rounded-full border-2 border-on-media object-cover"
          />
          <span className="absolute -bottom-2 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-brand">
            <Plus className="size-3 text-brand-foreground" />
          </span>
        </div>
        {[
          {
            Icon: Heart,
            label: "Like",
            count: item.short.metrics.likes + (liked ? 1 : 0),
            onClick: () => setLiked((v) => !v),
            active: liked,
          },
          { Icon: MessageCircle, label: "Comments", count: item.short.metrics.comments },
          { Icon: Share2, label: "Share", count: item.short.metrics.shares },
        ].map(({ Icon, label, count, onClick, active }) => (
          <button
            key={label}
            aria-label={label}
            onClick={onClick}
            className="flex flex-col items-center gap-1"
          >
            <Icon className={cn("size-7", active ? "fill-live text-live" : "text-on-media")} />
            <span className="text-[11px] font-semibold text-on-media">{compact.format(count)}</span>
          </button>
        ))}
        <img
          src={imageUrl(item.authorAvatarKey, "thumbnail")}
          alt=""
          className="size-9 rounded-full border border-on-media/50 object-cover"
        />
      </div>
    </section>
  );
}

export function ShortsScreen() {
  const { data } = useSuspenseQuery(shortsQueryOptions);
  const [playingId, setPlayingId] = useState("");

  return (
    <div className="relative mx-auto flex h-[100dvh] min-h-[32rem] w-full max-w-3xl flex-col overflow-hidden bg-media md:border-x md:border-border">
      <h1 className="sr-only">Shorts</h1>
      <main className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto">
        {data.map((item) => (
          <ShortCard
            key={item.short.id}
            item={item}
            playing={playingId === item.short.id}
            onToggle={setPlayingId}
          />
        ))}
      </main>
      <div className="absolute inset-x-0 bottom-0 z-40">
        <BottomNav />
      </div>
    </div>
  );
}
