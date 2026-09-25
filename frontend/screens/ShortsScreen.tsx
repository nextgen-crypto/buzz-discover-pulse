import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Music, PhoneOff, Plus, Share2, Users, Check } from "lucide-react";
import { imageUrl, videoUrl } from "@/backend/domain/media";
import type { ShortItem } from "@/backend/api/sections.functions";
import { shortsQueryOptions } from "@/frontend/queries/sections";
import { useSession } from "@/frontend/hooks/useSession";
import { useAuthGate } from "@/frontend/hooks/useAuthGate";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useFollowList } from "@/frontend/hooks/usePublicProfile";
import { useBlend, type BlendRemoteState } from "@/frontend/hooks/useBlend";
import { BlendSheet } from "@/frontend/components/shorts/BlendSheet";
import { CommentsSheet } from "@/frontend/components/shorts/CommentsSheet";
import { MusicSheet } from "@/frontend/components/shorts/MusicSheet";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/frontend/components/home/BottomNav";

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const DOUBLE_TAP_MS = 280;
const FOLLOWS_KEY = "wizz:short-follows";

function loadFollows(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FOLLOWS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function ShortCard({
  item,
  onToggle,
  onBlend,
  register,
}: {
  item: ShortItem;
  onToggle: (id: string) => void;
  onBlend: () => void;
  register: (id: string, video: HTMLVideoElement | null, section: HTMLElement | null) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [following, setFollowing] = useState(() => loadFollows().includes(item.short.authorId));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [extraComments, setExtraComments] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const requireAuth = useAuthGate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    register(item.short.id, videoRef.current, sectionRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.short.id]);

  function toggleFollow() {
    if (!requireAuth()) return;
    setFollowing((v) => {
      const next = !v;
      try {
        const ids = loadFollows();
        localStorage.setItem(
          FOLLOWS_KEY,
          JSON.stringify(
            next
              ? [...new Set([...ids, item.short.authorId])]
              : ids.filter((id) => id !== item.short.authorId),
          ),
        );
      } catch {
        // ignore
      }
      return next;
    });
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/shorts` : "";

  function handleTap() {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      if (!requireAuth()) return;
      if (!liked) setLiked(true);
      setBurst((n) => n + 1);
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        void v.play();
        onToggle(item.short.id);
      } else {
        v.pause();
        onToggle("");
      }
    }, DOUBLE_TAP_MS);
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[100dvh] min-h-[32rem] w-full snap-start items-end bg-media"
    >
      <video
        ref={videoRef}
        src={videoUrl(item.short.video.objectKey)}
        poster={imageUrl(item.short.video.posterKey, "medium", 0.5625)}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        loop
        muted
        preload="metadata"
        onClick={handleTap}
        onEnded={() => onToggle("")}
      />
      {burst > 0 && (
        <span key={burst} className="pointer-events-none absolute inset-0 grid place-items-center">
          <Heart className="animate-heart-burst size-24 fill-white text-white drop-shadow-lg" />
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim to-transparent pb-32 pt-24 sm:pb-36">
        <div className="max-w-[calc(100%-5rem)] px-4 sm:px-6">
          <p className="text-base font-bold text-on-media">@{item.authorUsername}</p>
          <p className="mt-1.5 line-clamp-3 text-sm text-on-media/95">{item.short.caption}</p>
          <button
            onClick={() => setMusicOpen(true)}
            className="pointer-events-auto mt-1.5 flex max-w-full items-center gap-1.5 rounded-full bg-black/35 py-1 pl-1.5 pr-3 text-left backdrop-blur"
          >
            <Music className="size-3.5 shrink-0 text-on-media" />
            <span className="truncate text-xs text-on-media/90">{item.short.soundtrack}</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-36 right-3 flex flex-col items-center gap-4 sm:bottom-40 sm:right-5 sm:gap-5">
        <button
          onClick={toggleFollow}
          aria-label={following ? "Unfollow" : "Follow"}
          className="relative mb-1"
        >
          <img
            src={imageUrl(item.authorAvatarKey, "thumbnail")}
            alt={item.authorName}
            className="size-11 rounded-full border-2 border-on-media object-cover"
          />
          <span
            className={cn(
              "absolute -bottom-2 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full",
              following ? "bg-white" : "bg-brand",
            )}
          >
            {following ? (
              <Check className="size-3 text-black" strokeWidth={3} />
            ) : (
              <Plus className="size-3 text-brand-foreground" />
            )}
          </span>
        </button>
        <button
          aria-label="Like"
          aria-pressed={liked}
          onClick={() => {
            if (!requireAuth()) return;
            setLiked((v) => !v);
          }}
          className="press flex flex-col items-center gap-1"
        >
          <Heart
            key={liked ? "liked" : "unliked"}
            className={cn("size-7", liked ? "animate-pop fill-live text-live" : "text-on-media")}
          />
          <span className="text-[11px] font-semibold text-on-media">
            {compact.format(item.short.metrics.likes + (liked ? 1 : 0))}
          </span>
        </button>
        <button
          aria-label="Comments"
          onClick={() => {
            if (!requireAuth()) return;
            setCommentsOpen(true);
          }}
          className="press flex flex-col items-center gap-1"
        >
          <MessageCircle className="size-7 text-on-media" />
          <span className="text-[11px] font-semibold text-on-media">
            {compact.format(item.short.metrics.comments + extraComments)}
          </span>
        </button>
        <button
          aria-label="Watch together"
          onClick={onBlend}
          className="press flex flex-col items-center gap-1"
        >
          <Users className="size-7 text-on-media" />
          <span className="text-[11px] font-semibold text-on-media">Blend</span>
        </button>
        <button
          aria-label="Share"
          onClick={() => setSharing(true)}
          className="press flex flex-col items-center gap-1"
        >
          <Share2 className="size-7 text-on-media" />
          <span className="text-[11px] font-semibold text-on-media">
            {compact.format(item.short.metrics.shares)}
          </span>
        </button>
        <img
          src={imageUrl(item.authorAvatarKey, "thumbnail")}
          alt=""
          className="size-9 rounded-full border border-on-media/50 object-cover"
        />
      </div>

      <CommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        shortId={item.short.id}
        baseCount={item.short.metrics.comments}
        onCount={setExtraComments}
      />
      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        message={`${item.authorName} on WIZZ: ${item.short.caption}`}
      />
      <MusicSheet open={musicOpen} onClose={() => setMusicOpen(false)} />
    </section>
  );
}

export function ShortsScreen() {
  const { data } = useSuspenseQuery(shortsQueryOptions);
  const [playingId, setPlayingId] = useState("");
  const [blendOpen, setBlendOpen] = useState(false);

  const { user, displayName } = useSession();
  const requireAuth = useAuthGate();
  const userId = user?.id ?? null;
  const { data: myProfile } = useMyProfile(userId);
  const { data: followers = [], isLoading: loadingFollowers } = useFollowList(
    myProfile?.id ?? null,
    "followers",
    userId,
  );

  const videoEls = useRef(new Map<string, HTMLVideoElement>());
  const sectionEls = useRef(new Map<string, HTMLElement>());
  const activeId = useRef(data[0]?.short.id ?? "");

  const register = useCallback(
    (id: string, video: HTMLVideoElement | null, section: HTMLElement | null) => {
      if (video) videoEls.current.set(id, video);
      if (section) sectionEls.current.set(id, section);
    },
    [],
  );

  const applyRemote = useCallback((s: BlendRemoteState) => {
    const el = videoEls.current.get(s.shortId);
    const section = sectionEls.current.get(s.shortId);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    activeId.current = s.shortId;
    setPlayingId(s.playing ? s.shortId : "");
    if (el) {
      if (Math.abs(el.currentTime - s.time) > 2.5 && Number.isFinite(s.time)) {
        try {
          el.currentTime = s.time;
        } catch {
          // not ready — ignore
        }
      }
      if (s.playing && el.paused) void el.play().catch(() => undefined);
      if (!s.playing && !el.paused) el.pause();
    }
  }, []);

  const {
    incoming,
    requesting,
    requestFailed,
    session,
    peerHere,
    reactions,
    sendInvite,
    replyInvite,
    leaveSession,
    cancelRequest,
    broadcastState,
    sendReaction,
  } = useBlend({ userId, displayName: displayName ?? "Someone", onRemoteState: applyRemote });

  function currentState(id: string, playing: boolean): BlendRemoteState {
    const el = videoEls.current.get(id || activeId.current);
    return { shortId: id || activeId.current, playing, time: el?.currentTime ?? 0 };
  }

  function handleToggle(id: string) {
    if (id) activeId.current = id;
    setPlayingId(id);
    if (session) void broadcastState(currentState(id, id !== ""));
  }

  // Host shares full state the moment the room opens.
  useEffect(() => {
    if (session?.isHost) {
      const id = activeId.current;
      const el = videoEls.current.get(id);
      void broadcastState({ shortId: id, playing: playingId === id, time: el?.currentTime ?? 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.roomId]);

  // Host heartbeat keeps the room in sync.
  useEffect(() => {
    if (!session?.isHost || !playingId) return;
    const t = window.setInterval(() => {
      const el = videoEls.current.get(playingId);
      void broadcastState({ shortId: playingId, playing: true, time: el?.currentTime ?? 0 });
    }, 5000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.roomId, playingId]);

  // Incoming invite surfaces immediately.
  useEffect(() => {
    if (incoming && !session) setBlendOpen(true);
  }, [incoming, session]);

  return (
    <div className="relative mx-auto flex h-[100dvh] min-h-[32rem] w-full max-w-3xl flex-col overflow-hidden bg-media md:border-x md:border-border">
      <h1 className="sr-only">Shorts</h1>

      {session && (
        <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-2 px-3 pt-safe">
          <div className="mx-auto mt-2 flex items-center gap-2 rounded-full bg-black/55 py-1.5 pl-3 pr-1.5 backdrop-blur">
            <span
              className={cn(
                "size-2 rounded-full",
                peerHere ? "animate-pulse bg-live" : "bg-white/50",
              )}
            />
            <span className="max-w-36 truncate text-xs font-bold text-white">
              Watching with {session.peerName}
            </span>
            <button
              aria-label="Send laugh"
              onClick={() => void sendReaction("😂")}
              className="press rounded-full bg-white/15 px-2.5 py-1 text-sm"
            >
              😂
            </button>
            <button
              aria-label="Leave watch party"
              onClick={leaveSession}
              className="grid size-7 place-items-center rounded-full bg-white/15"
            >
              <PhoneOff className="size-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {reactions.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
          {reactions.map((r) => (
            <span key={r.id} className="animate-heart-burst absolute text-6xl drop-shadow-lg">
              {r.emoji}
            </span>
          ))}
        </div>
      )}

      <main className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto">
        {data.map((item) => (
          <ShortCard
            key={item.short.id}
            item={item}
            onToggle={handleToggle}
            onBlend={() => {
              if (!requireAuth()) return;
              setBlendOpen(true);
            }}
            register={register}
          />
        ))}
      </main>
      <div className="absolute inset-x-0 bottom-0 z-40">
        <BottomNav />
      </div>

      <BlendSheet
        open={blendOpen}
        onClose={() => setBlendOpen(false)}
        followers={followers}
        loadingFollowers={loadingFollowers}
        requesting={requesting}
        requestFailed={requestFailed}
        incoming={incoming ? { fromName: incoming.fromName } : null}
        onInvite={(toId, toName) => void sendInvite(toId, toName, activeId.current)}
        onAccept={() => {
          void replyInvite(true).then(() => setBlendOpen(false));
        }}
        onDecline={() => void replyInvite(false)}
        onCancelRequest={() => {
          cancelRequest();
          setBlendOpen(false);
        }}
      />
      {!session && !user && (
        <Link
          to="/auth"
          className="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-black"
        >
          Sign in to Blend with followers
        </Link>
      )}
    </div>
  );
}
