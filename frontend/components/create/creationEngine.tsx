import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { invalidateHomeCache } from "@/backend/api/home.functions";
import {
  AtSign,
  Camera,
  Check,
  ChevronRight,
  Clock,
  FolderOpen,
  ImagePlus,
  Link2,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Music,
  RefreshCw,
  Share2,
  Square,
  Users,
  Video,
  X,
} from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { uploadAndSign } from "@/frontend/lib/storageUpload";
import { BeautyCameraSheet } from "@/frontend/components/camera/BeautyCameraSheet";
import {
  applyFilterToFile,
  filterCss,
  filterPresets,
} from "@/frontend/components/camera/beautyFilters";
import { useSession } from "@/frontend/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import type { CreateKind } from "@/frontend/components/home/nav-items";
import { createActions } from "@/frontend/components/home/nav-items";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const DRAFT_KEY = "wizz:create:drafts";
const CATEGORIES = ["For You", "Trending", "Sports", "Music", "Tech", "Style", "Food", "Travel"];
const AUDIENCES = ["Public", "Followers", "Private"] as const;
const SPEEDS = [0.5, 1, 1.5, 2] as const;
const TEXT_BACKGROUNDS = ["#7c3aed", "#0f766e", "#1d4ed8", "#b45309", "#be123c", "#111827"];
export const TRACKS = [
  {
    id: "t1",
    title: "Midnight Drive",
    creator: "Neon Coast",
    duration: "0:29",
    bars: [3, 6, 9, 5, 8, 4, 7, 10, 6, 5, 8, 3],
  },
  {
    id: "t2",
    title: "Soft Morning",
    creator: "Ayo Beats",
    duration: "0:15",
    bars: [4, 5, 6, 7, 5, 4, 6, 8, 5, 4, 3, 5],
  },
  {
    id: "t3",
    title: "Street Pulse",
    creator: "DJ Mara",
    duration: "0:22",
    bars: [8, 4, 9, 3, 10, 5, 7, 4, 9, 6, 5, 8],
  },
  {
    id: "t4",
    title: "Golden Hour",
    creator: "Luna Waves",
    duration: "0:18",
    bars: [5, 7, 4, 8, 6, 9, 5, 7, 4, 6, 8, 5],
  },
  {
    id: "t5",
    title: "Original audio",
    creator: "You",
    duration: "0:00",
    bars: [2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 2, 3],
  },
];

type Step =
  | "hub"
  | "photo"
  | "video"
  | "story"
  | "text"
  | "live-setup"
  | "live-room"
  | "composer"
  | "publishing"
  | "success"
  | "drafts";

interface Draft {
  id: string;
  kind: Exclude<CreateKind, "more">;
  caption: string;
  location: string;
  tags: string;
  category: string;
  audience: (typeof AUDIENCES)[number];
  createdAt: string;
}

function loadDrafts(): Draft[] {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]") as Draft[];
  } catch {
    return [];
  }
}

const TITLES: Record<Step, string> = {
  hub: "Create",
  photo: "Photo",
  video: "Video",
  story: "Story",
  text: "Text",
  "live-setup": "Live setup",
  "live-room": "Live",
  composer: "New post",
  publishing: "Publishing",
  success: "Published",
  drafts: "Drafts",
};

export function CreationEngine({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: CreateKind | null;
  onClose: () => void;
}) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const bustCache = useServerFn(invalidateHomeCache);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("hub");
  const [kind, setKind] = useState<Exclude<CreateKind, "more">>("photo");

  // media
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [presetId, setPresetId] = useState("none");
  const [intensity, setIntensity] = useState(100);
  const [adjust, setAdjust] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
  });
  const [camera, setCamera] = useState<null | "photo" | "short">(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trim, setTrim] = useState<[number, number]>([0, 100]);
  const [speed, setSpeed] = useState<number>(1);
  const [muted, setMuted] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [textBody, setTextBody] = useState("");
  const [textBg, setTextBg] = useState(TEXT_BACKGROUNDS[0]!);
  const [storyOverlays, setStoryOverlays] = useState<string[]>([]);

  // composer
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0] ?? "For You");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Public");
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [schedule, setSchedule] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // live
  const [liveTitle, setLiveTitle] = useState("");
  const [liveCategory, setLiveCategory] = useState(CATEGORIES[1] ?? "Trending");
  const [liveMic, setLiveMic] = useState(true);
  const [liveBeauty, setLiveBeauty] = useState(40);
  const [liveComments, setLiveComments] = useState(true);
  const [viewers, setViewers] = useState(12);
  const [liveChat, setLiveChat] = useState<string[]>(["Welcome to the stream!"]);
  const [liveReacts, setLiveReacts] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(initial && initial !== "more" ? mapKind(initial) : "hub");
    if (initial && initial !== "more") setKind(initial);
    setError(null);
    try {
      const pending = localStorage.getItem("wizz:pending-track");
      if (pending && TRACKS.some((t) => t.id === pending)) {
        setTrackId(pending);
        localStorage.removeItem("wizz:pending-track");
      }
    } catch {
      // storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (step !== "live-room") return;
    const v = window.setInterval(() => setViewers((x) => x + Math.floor(Math.random() * 4)), 2500);
    const c = window.setInterval(
      () =>
        setLiveChat((prev) =>
          ["Nice!", "Love this", "Hello from Dar", "Big fan", "Waaaa"]
            .slice(0, 1)
            .concat(prev)
            .slice(0, 8),
        ),
      4000,
    );
    return () => {
      window.clearInterval(v);
      window.clearInterval(c);
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [photoUrl, videoUrl]);

  function mapKind(k: CreateKind): Step {
    if (k === "photo" || k === "video" || k === "story" || k === "text") return k;
    if (k === "live") return "live-setup";
    return "hub";
  }

  function pick(kindNext: Exclude<CreateKind, "more">) {
    setKind(kindNext);
    setError(null);
    setStep(mapKind(kindNext));
  }

  function attachPhoto(file: File) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function attachVideo(file: File) {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setTrim([0, 100]);
  }

  const preset = filterPresets.find((p) => p.id === presetId) ?? filterPresets[0]!;
  const photoFilter = useMemo(() => {
    const base = filterCss(preset.settings, preset.extra, intensity / 100);
    const extra = [
      adjust.brightness ? `brightness(${(1 + adjust.brightness / 100).toFixed(2)})` : "",
      adjust.contrast ? `contrast(${(1 + adjust.contrast / 100).toFixed(2)})` : "",
      adjust.saturation ? `saturate(${(1 + adjust.saturation / 100).toFixed(2)})` : "",
      adjust.temperature > 0 ? `sepia(${(adjust.temperature / 250).toFixed(2)})` : "",
      adjust.temperature < 0 ? `hue-rotate(${(adjust.temperature / 2).toFixed(0)}deg)` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return [base, extra].filter(Boolean).join(" ");
  }, [preset, intensity, adjust]);

  function goComposer() {
    if (kind === "text" && !textBody.trim() && !caption.trim()) {
      setError("Write something first.");
      return;
    }
    if (kind === "photo" && !photo) {
      setError("Add a photo first — camera or gallery.");
      return;
    }
    if (kind === "video" && !videoFile) {
      setError("Record or upload a clip first.");
      return;
    }
    setError(null);
    setCaption((c) => c || textBody.trim());
    setStep("composer");
  }

  function saveDraft() {
    const drafts = loadDrafts();
    const draft: Draft = {
      id: `d-${Date.now()}`,
      kind,
      caption: caption || textBody,
      location,
      tags,
      category,
      audience,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify([draft, ...drafts].slice(0, 20)));
    onClose();
  }

  async function publish() {
    if (!user) {
      setError("Sign in to publish.");
      return;
    }
    const text = (kind === "text" ? textBody || caption : caption).trim();
    if (!text) {
      setError("Write a caption first.");
      return;
    }
    setBusy(true);
    setError(null);
    setStep("publishing");
    setProgress(8);
    try {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
      if (photo && (kind === "photo" || kind === "story")) {
        const baked = await applyFilterToFile(
          photo,
          preset.settings,
          preset.extra,
          intensity / 100,
        );
        setProgress(35);
        imageUrl = await uploadAndSign("post-images", `${user.id}/post-${Date.now()}.jpg`, baked, {
          width: 1280,
        });
        setProgress(65);
      }
      if (videoFile && kind === "video") {
        setProgress(35);
        const ext = (videoFile.name.split(".").pop() ?? "mp4").slice(0, 8).toLowerCase();
        const path = `${user.id}/video-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("post-images").upload(path, videoFile, {
          contentType: videoFile.type || "video/mp4",
        });
        if (up.error) throw up.error;
        setProgress(65);
        const signed = await supabase.storage.from("post-images").createSignedUrl(path, TEN_YEARS);
        if (signed.error) throw signed.error;
        videoUrl = signed.data.signedUrl;
      }
      setProgress(82);
      const hashtags = [
        ...new Set(
          `${text} ${tags}`
            .split(/[\s,]+/)
            .map((t) => t.trim().replace(/^#/, "").toLowerCase())
            .filter((t) => t && /[a-z0-9]/.test(t))
            .slice(0, 8),
        ),
      ].filter((t) => text.toLowerCase().includes(`#${t}`) || tags.toLowerCase().includes(t));
      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        caption: schedule ? `${text}\n\n(Scheduled ${schedule})` : text,
        image_url: imageUrl,
        hashtags,
        location: location.trim() || null,
        category: kind === "story" ? "For You" : category,
        ...(videoUrl ? { video_url: videoUrl } : {}),
      });
      if (insertError) {
        if (videoUrl && insertError.message.includes("video_url")) {
          throw new Error("Video posts need part7 SQL (video_url) — run it in Supabase first.");
        }
        throw insertError;
      }
      setProgress(100);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["my-stats"] }),
      ]);
      // Bust server caches so the post appears in feeds instantly.
      try {
        await bustCache();
      } catch {
        // TTLs expire it anyway
      }
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish. Try again.");
      setStep("composer");
    } finally {
      setBusy(false);
    }
  }

  const drafts = step === "drafts" ? loadDrafts() : [];

  return (
    <>
      <Sheet
        open={open && !camera}
        onClose={onClose}
        title={step === "hub" ? "Create" : TITLES[step]}
      >
        {step !== "hub" && step !== "publishing" && step !== "success" && (
          <button
            onClick={() => setStep("hub")}
            className="mb-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-foreground"
          >
            ← All options
          </button>
        )}

        {step === "hub" && (
          <div className="flex flex-col gap-0.5">
            {createActions.map(({ kind: k, label, hint, Icon }) =>
              k === "more" ? (
                <button
                  key={k}
                  onClick={() => setStep("drafts")}
                  className="press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary">
                    <Icon className="size-5 text-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-tight text-foreground">
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <button
                  key={k}
                  onClick={() => pick(k)}
                  className="press flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary">
                    <Icon className="size-5 text-brand" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-tight text-foreground">
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ),
            )}
          </div>
        )}

        {step === "photo" && (
          <PhotoStep
            photoUrl={photoUrl}
            photoFilter={photoFilter}
            presetId={presetId}
            setPresetId={setPresetId}
            intensity={intensity}
            setIntensity={setIntensity}
            adjust={adjust}
            setAdjust={setAdjust}
            onCamera={() => setCamera("photo")}
            onUpload={() => fileRef.current?.click()}
            onContinue={goComposer}
            error={error}
          />
        )}

        {step === "video" && (
          <VideoStep
            videoUrl={videoUrl}
            trim={trim}
            setTrim={setTrim}
            speed={speed}
            setSpeed={setSpeed}
            muted={muted}
            setMuted={setMuted}
            trackId={trackId}
            setTrackId={setTrackId}
            onRecord={() => setCamera("short")}
            onUpload={() => videoRef.current?.click()}
            onContinue={goComposer}
            error={error}
          />
        )}

        {step === "story" && (
          <StoryStep
            photoUrl={photoUrl}
            videoUrl={videoUrl}
            textBody={textBody}
            textBg={textBg}
            overlays={storyOverlays}
            toggleOverlay={(o) =>
              setStoryOverlays((prev) =>
                prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
              )
            }
            onPhoto={() => fileRef.current?.click()}
            onVideo={() => videoRef.current?.click()}
            onText={() => {
              setKind("story");
              setStep("text");
            }}
            onContinue={goComposer}
            error={error}
          />
        )}

        {step === "text" && (
          <div>
            <div className="grid grid-cols-6 gap-2 px-2 py-2">
              {TEXT_BACKGROUNDS.map((bg) => (
                <button
                  key={bg}
                  aria-label={`Background ${bg}`}
                  onClick={() => setTextBg(bg)}
                  style={{ backgroundColor: bg }}
                  className={`size-9 rounded-full ${textBg === bg ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""}`}
                />
              ))}
            </div>
            <div className="px-2 py-1">
              <div
                className="animate-scale-in grid min-h-44 place-items-center rounded-2xl p-5"
                style={{ backgroundColor: textBg }}
              >
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Say something…"
                  className="w-full resize-none bg-transparent text-center text-lg font-bold text-white outline-none placeholder:text-white/60"
                />
              </div>
              {error && <p className="mt-2 text-xs font-semibold text-live">{error}</p>}
              <button
                onClick={goComposer}
                disabled={!textBody.trim()}
                className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "live-setup" && (
          <div className="space-y-3 px-1 py-1">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Title</span>
              <input
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="Friday night hangout"
                className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Category</span>
                <select
                  value={liveCategory}
                  onChange={(e) => setLiveCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Microphone</span>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setLiveMic(true)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold ${liveMic ? "bg-brand text-brand-foreground" : "bg-secondary"}`}
                  >
                    <Mic className="size-4" /> On
                  </button>
                  <button
                    onClick={() => setLiveMic(false)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold ${!liveMic ? "bg-brand text-brand-foreground" : "bg-secondary"}`}
                  >
                    <MicOff className="size-4" /> Off
                  </button>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                Beauty {liveBeauty}%
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={liveBeauty}
                onChange={(e) => setLiveBeauty(Number(e.target.value))}
                className="w-full"
                aria-label="Beauty level"
              />
            </label>
            <ToggleRow
              title="Allow comments"
              desc="Viewers can chat"
              checked={liveComments}
              onChange={setLiveComments}
            />
            <button
              onClick={() => setStep("live-room")}
              disabled={!liveTitle.trim()}
              className="w-full rounded-full bg-live py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Start live
            </button>
          </div>
        )}

        {step === "live-room" && (
          <div className="overflow-hidden rounded-2xl bg-media">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="rounded-full bg-live px-3 py-1 text-xs font-bold text-white">
                LIVE · {viewers}
              </span>
              <span className="truncate px-2 text-xs font-semibold text-white">
                {liveTitle || "Untitled live"}
              </span>
              <button
                aria-label="End live"
                onClick={() => setStep("success")}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white"
              >
                End
              </button>
            </div>
            <div className="grid h-56 place-items-center">
              <Camera className="size-10 text-white/40" />
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto px-3 py-2">
              {liveChat.map((m, i) => (
                <p key={i} className="text-xs text-white/90">
                  <span className="font-bold">Guest:</span> {m}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 pb-3">
              <button
                onClick={() => setLiveReacts((n) => n + 1)}
                className="press flex-1 rounded-full bg-white/15 py-2 text-sm font-bold text-white"
              >
                React {liveReacts > 0 ? `· ${liveReacts}` : ""}
              </button>
              <button
                aria-label="Share live"
                onClick={() => setLiveReacts((n) => n + 1)}
                className="grid size-10 place-items-center rounded-full bg-white/15"
              >
                <Share2 className="size-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {step === "composer" && (
          <div className="space-y-3 pb-2">
            {(photoUrl || videoUrl || (kind === "text" && textBody)) && (
              <div className="flex items-center gap-3 rounded-2xl bg-secondary p-2.5">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    style={{ filter: photoFilter }}
                    className="size-14 rounded-xl object-cover"
                  />
                )}
                {videoUrl && !photoUrl && (
                  <video
                    src={videoUrl}
                    muted
                    playsInline
                    className="size-14 rounded-xl object-cover"
                  />
                )}
                {kind === "text" && !photoUrl && (
                  <span
                    className="grid size-14 place-items-center rounded-xl p-1 text-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: textBg }}
                  >
                    {textBody.slice(0, 24)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize">{kind} preview</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {kind === "story" ? "Disappears after 24 hours" : `Audience: ${audience}`}
                  </p>
                </div>
              </div>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Caption</span>
              <textarea
                value={kind === "text" ? textBody : caption}
                onChange={(e) =>
                  kind === "text" ? setTextBody(e.target.value) : setCaption(e.target.value)
                }
                rows={3}
                maxLength={500}
                placeholder="Write a caption…"
                className="mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Location</span>
                <span className="mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Tags & hashtags</span>
              <span className="mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5">
                <AtSign className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="travel, @friend"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
            </label>
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Audience</span>
              <div className="mt-1 flex gap-1.5">
                {AUDIENCES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`flex-1 rounded-full py-2 text-xs font-semibold ${audience === a ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <ToggleRow title="Allow comments" checked={allowComments} onChange={setAllowComments} />
            <ToggleRow title="Allow sharing" checked={allowSharing} onChange={setAllowSharing} />
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                Schedule (optional)
              </span>
              <span className="mt-1 flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
            </label>
            {error && <p className="text-xs font-semibold text-live">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveDraft}
                className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
              >
                Save draft
              </button>
              <button
                onClick={publish}
                disabled={busy}
                className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
              >
                {busy ? "Publishing…" : schedule ? "Schedule" : "Publish"}
              </button>
            </div>
          </div>
        )}

        {step === "publishing" && (
          <div className="px-2 py-10 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-brand" />
            <p className="mt-3 text-[15px] font-semibold">Publishing your {kind}…</p>
            <div className="mx-auto mt-4 h-2 max-w-56 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="px-2 py-8 text-center">
            <span className="animate-scale-in mx-auto grid size-14 place-items-center rounded-full bg-brand">
              <Check className="size-7 text-brand-foreground" />
            </span>
            <p className="mt-3 text-[15px] font-semibold">
              {kind === "live" ? "Stream ended" : "You're live on WIZZ"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kind === "story"
                ? "Your story disappears in 24 hours."
                : "Thanks for sharing with your people."}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/profile"
                onClick={onClose}
                className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
              >
                View profile
              </Link>
              <button
                onClick={() => {
                  setStep("hub");
                  setPhoto(null);
                  setVideoFile(null);
                  setTextBody("");
                  setCaption("");
                }}
                className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
              >
                Create more
              </button>
            </div>
          </div>
        )}

        {step === "drafts" && (
          <div>
            {drafts.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <FolderOpen className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-[15px] font-semibold">No drafts yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Unfinished posts wait for you here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-2 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold capitalize">
                        {d.kind} · {d.caption.slice(0, 40) || "Untitled"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        setKind(d.kind);
                        setCaption(d.caption);
                        setTextBody(d.kind === "text" ? d.caption : "");
                        setLocation(d.location);
                        setTags(d.tags);
                        setCategory(d.category);
                        setAudience(d.audience);
                        setStep("composer");
                      }}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                    >
                      Resume
                    </button>
                    <button
                      aria-label="Delete draft"
                      onClick={() =>
                        localStorage.setItem(
                          DRAFT_KEY,
                          JSON.stringify(loadDrafts().filter((x) => x.id !== d.id)),
                        )
                      }
                      className="rounded-full p-1.5 hover:bg-secondary"
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              attachPhoto(f);
              if (step === "hub") {
                setKind("photo");
                setStep("photo");
              }
            }
            e.target.value = "";
          }}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              attachVideo(f);
              if (step === "hub" || step === "story") {
                setKind(step === "story" ? "story" : "video");
                setStep("video");
              }
            }
            e.target.value = "";
          }}
        />
      </Sheet>

      <BeautyCameraSheet
        open={camera !== null}
        mode={camera === "short" ? "short" : "photo"}
        onClose={() => setCamera(null)}
        onCapture={(f) => {
          if (f.type.startsWith("video")) attachVideo(f);
          else attachPhoto(f);
          setCamera(null);
        }}
      />
    </>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight">{title}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function PhotoStep({
  photoUrl,
  photoFilter,
  presetId,
  setPresetId,
  intensity,
  setIntensity,
  adjust,
  setAdjust,
  onCamera,
  onUpload,
  onContinue,
  error,
}: {
  photoUrl: string | null;
  photoFilter: string;
  presetId: string;
  setPresetId: (v: string) => void;
  intensity: number;
  setIntensity: (v: number) => void;
  adjust: { brightness: number; contrast: number; saturation: number; temperature: number };
  setAdjust: (v: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
  }) => void;
  onCamera: () => void;
  onUpload: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const [tab, setTab] = useState<"filters" | "adjust">("filters");
  if (!photoUrl) {
    return (
      <div className="grid grid-cols-2 gap-3 px-1 py-1">
        <button
          onClick={onCamera}
          className="press flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary py-7"
        >
          <Camera className="size-6 text-brand" />
          <span className="text-sm font-semibold">Camera</span>
          <span className="text-xs text-muted-foreground">Capture with filters</span>
        </button>
        <button
          onClick={onUpload}
          className="press flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary py-7"
        >
          <ImagePlus className="size-6 text-brand" />
          <span className="text-sm font-semibold">Gallery</span>
          <span className="text-xs text-muted-foreground">JPG or PNG, 10 MB</span>
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <img
        src={photoUrl}
        alt="Edit preview"
        style={{ filter: photoFilter }}
        className="max-h-72 w-full rounded-2xl border border-border object-cover"
      />
      <div className="flex rounded-full bg-secondary p-1">
        {(["filters", "adjust"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-background shadow-raise" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "filters" ? (
        <div>
          <div className="rail flex gap-2 overflow-x-auto pb-1">
            {filterPresets.map((p) => (
              <button key={p.id} onClick={() => setPresetId(p.id)} className="w-16 shrink-0">
                <img
                  src={photoUrl}
                  alt={p.label}
                  style={{ filter: filterCss(p.settings, p.extra, intensity / 100) }}
                  className={`size-16 rounded-xl object-cover ${presetId === p.id ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : "opacity-80"}`}
                />
                <span
                  className={`mt-1 block truncate text-center text-[11px] ${presetId === p.id ? "font-bold text-foreground" : "text-muted-foreground"}`}
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-3 px-1">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              Intensity {intensity}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full"
              aria-label="Filter intensity"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-1 px-1">
          {(
            [
              ["brightness", "Brightness"],
              ["contrast", "Contrast"],
              ["saturation", "Saturation"],
              ["temperature", "Temperature"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
              <input
                type="range"
                min={-50}
                max={50}
                value={adjust[k]}
                onChange={(e) => setAdjust({ ...adjust, [k]: Number(e.target.value) })}
                className="w-full"
                aria-label={label}
              />
            </label>
          ))}
        </div>
      )}
      {error && <p className="text-xs font-semibold text-live">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onUpload}
          className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
        >
          Replace
        </button>
        <button
          onClick={onContinue}
          className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function VideoStep({
  videoUrl,
  trim,
  setTrim,
  speed,
  setSpeed,
  muted,
  setMuted,
  trackId,
  setTrackId,
  onRecord,
  onUpload,
  onContinue,
  error,
}: {
  videoUrl: string | null;
  trim: [number, number];
  setTrim: (v: [number, number]) => void;
  speed: number;
  setSpeed: (v: number) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  trackId: string | null;
  setTrackId: (v: string | null) => void;
  onRecord: () => void;
  onUpload: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const [tab, setTab] = useState<"trim" | "sound" | "style">("trim");
  if (!videoUrl) {
    return (
      <div className="grid grid-cols-2 gap-3 px-1 py-1">
        <button
          onClick={onRecord}
          className="press flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary py-7"
        >
          <Video className="size-6 text-brand" />
          <span className="text-sm font-semibold">Record</span>
          <span className="text-xs text-muted-foreground">Clip up to 60s</span>
        </button>
        <button
          onClick={onUpload}
          className="press flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary py-7"
        >
          <ImagePlus className="size-6 text-brand" />
          <span className="text-sm font-semibold">Upload</span>
          <span className="text-xs text-muted-foreground">From your gallery</span>
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <video
        key={`${speed}-${muted}`}
        src={videoUrl}
        controls
        playsInline
        muted={muted}
        className="max-h-72 w-full rounded-2xl border border-border bg-media object-cover"
      />
      <div className="rounded-2xl bg-secondary p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Trim</span>
          <span>
            {trim[0]}% – {trim[1]}%
          </span>
        </div>
        <div className="relative mt-2 flex h-10 items-center gap-1">
          {Array.from({ length: 12 }).map((_, i) => {
            const active = i >= (trim[0] / 100) * 12 && i <= (trim[1] / 100) * 12;
            return (
              <span
                key={i}
                className={`h-full flex-1 rounded ${active ? "bg-brand" : "bg-border"}`}
                style={{ height: `${55 + ((i * 37) % 45)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="range"
            min={0}
            max={trim[1] - 1}
            value={trim[0]}
            onChange={(e) => setTrim([Number(e.target.value), trim[1]])}
            className="w-full"
            aria-label="Trim start"
          />
          <input
            type="range"
            min={trim[0] + 1}
            max={100}
            value={trim[1]}
            onChange={(e) => setTrim([trim[0], Number(e.target.value)])}
            className="w-full"
            aria-label="Trim end"
          />
        </div>
      </div>
      <div className="flex rounded-full bg-secondary p-1">
        {(["trim", "sound", "style"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-background shadow-raise" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "trim" && (
        <div>
          <span className="px-1 text-xs font-semibold text-muted-foreground">Speed</span>
          <div className="mt-1 flex gap-1.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 rounded-full py-2 text-xs font-semibold ${speed === s ? "bg-brand text-brand-foreground" : "bg-secondary"}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === "sound" && (
        <div>
          <ToggleRow
            title={muted ? "Muted" : "Original sound on"}
            checked={!muted}
            onChange={(v) => setMuted(!v)}
          />
          <p className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
            <Music className="size-3.5" /> Music
          </p>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {TRACKS.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex h-7 flex-1 items-end gap-0.5">
                  {t.bars.map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h * 10}%` }}
                      className={`w-full rounded-sm ${trackId === t.id ? "bg-brand" : "bg-border"}`}
                    />
                  ))}
                </span>
                <span className="w-28 shrink-0">
                  <span className="block truncate text-xs font-semibold">{t.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {t.creator} · {t.duration}
                  </span>
                </span>
                <button
                  onClick={() => setTrackId(trackId === t.id ? null : t.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${trackId === t.id ? "bg-brand text-brand-foreground" : "bg-secondary"}`}
                >
                  {trackId === t.id ? "Added" : "Use"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === "style" && (
        <div className="rounded-2xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
          Filters and cover frames apply at publish. Your {speed}× speed
          {muted ? ", muted" : ""} and trim {trim[0]}–{trim[1]}% are kept with this draft.
        </div>
      )}
      {error && <p className="text-xs font-semibold text-live">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onUpload}
          className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
        >
          Replace
        </button>
        <button
          onClick={onContinue}
          className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StoryStep({
  photoUrl,
  videoUrl,
  textBody,
  textBg,
  overlays,
  toggleOverlay,
  onPhoto,
  onVideo,
  onText,
  onContinue,
  error,
}: {
  photoUrl: string | null;
  videoUrl: string | null;
  textBody: string;
  textBg: string;
  overlays: string[];
  toggleOverlay: (o: string) => void;
  onPhoto: () => void;
  onVideo: () => void;
  onText: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const has = Boolean(photoUrl || videoUrl || textBody.trim());
  return (
    <div className="space-y-3">
      <div className="mx-auto grid aspect-[9/16] max-h-80 w-52 place-items-center overflow-hidden rounded-2xl border border-border bg-media">
        {photoUrl ? (
          <img src={photoUrl} alt="Story preview" className="size-full object-cover" />
        ) : videoUrl ? (
          <video src={videoUrl} muted playsInline className="size-full object-cover" />
        ) : textBody.trim() ? (
          <div
            className="grid size-full place-items-center p-4"
            style={{ backgroundColor: textBg }}
          >
            <p className="text-center text-sm font-bold text-white">{textBody}</p>
          </div>
        ) : (
          <p className="px-6 text-center text-xs text-white/60">Preview — pick a base below</p>
        )}
        {has && overlays.length > 0 && (
          <div className="pointer-events-none absolute flex max-h-80 w-52 flex-col items-center gap-1.5 p-3">
            {overlays.map((o) => (
              <span
                key={o}
                className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white"
              >
                {o}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={onPhoto} className="rounded-full bg-secondary py-2 text-xs font-semibold">
          Photo
        </button>
        <button onClick={onVideo} className="rounded-full bg-secondary py-2 text-xs font-semibold">
          Video
        </button>
        <button onClick={onText} className="rounded-full bg-secondary py-2 text-xs font-semibold">
          Text
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Mention", "Location", "Poll", "Question", "Link"].map((o) => (
          <button
            key={o}
            onClick={() => toggleOverlay(o)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${overlays.includes(o) ? "bg-brand text-brand-foreground" : "bg-secondary"}`}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
        <Users className="size-3.5" /> Visible to your audience for 24 hours.
      </p>
      {error && <p className="text-xs font-semibold text-live">{error}</p>}
      <button
        onClick={onContinue}
        disabled={!has}
        className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

// Re-exported so tree-shaken icon imports stay referenced in one place.
export { AtSign, Clock, FolderOpen, Link2, MapPin, Mic, Music, RefreshCw, Users };
