import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Radio, RefreshCw, Square, X } from "lucide-react";
import {
  defaultBeauty,
  filterCss,
  filterPresets,
  type BeautySettings,
  type FilterPreset,
} from "@/frontend/components/camera/beautyFilters";

export type CameraMode = "photo" | "short" | "live";

interface Props {
  open: boolean;
  mode: CameraMode;
  onClose: () => void;
  /** Photo mode: the beautified still. Short mode: the recorded clip. */
  onCapture?: (file: File) => void;
}

const titles: Record<CameraMode, string> = {
  photo: "Photo with filters",
  short: "Record a short",
  live: "Go live",
};

export function BeautyCameraSheet({ open, mode, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [preset, setPreset] = useState<FilterPreset>(filterPresets[1] ?? filterPresets[0]!);
  const [custom, setCustom] = useState<BeautySettings>(defaultBeauty);
  const [useCustom, setUseCustom] = useState(false);
  const [strength, setStrength] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  const settings = useCustom ? custom : preset.settings;
  const css = filterCss(settings, useCustom ? undefined : preset.extra, strength);

  const stop = useCallback(() => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
    setRecording(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    let cancelled = false;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: mode !== "photo" })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        setReady(true);
      })
      .catch(() => setError("Camera access was blocked. Allow the camera to use face filters."));
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, mode, stop]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= 60) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording]);

  async function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = css;
      if (facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
      if (!blob) return;
      onCapture?.(new File([blob], `wizz-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      onCapture?.(new File([blob], `wizz-short-${Date.now()}.webm`, { type: blob.type }));
      onClose();
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setSeconds(0);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-media">
      <div className="flex items-center justify-between px-4 pt-safe">
        <button
          aria-label="Close camera"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-scrim"
        >
          <X className="size-5 text-media-foreground" />
        </button>
        <span className="text-sm font-semibold text-media-foreground">{titles[mode]}</span>
        <button
          aria-label="Flip camera"
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="grid size-10 place-items-center rounded-full bg-scrim"
        >
          <RefreshCw className="size-5 text-media-foreground" />
        </button>
      </div>

      <div className="relative mt-3 flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full object-cover"
          style={{ filter: css, transform: facing === "user" ? "scaleX(-1)" : undefined }}
        />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-media-foreground" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <p className="text-sm font-semibold text-media-foreground">{error}</p>
          </div>
        )}
        {recording && (
          <span className="absolute left-4 top-4 rounded-full bg-live px-3 py-1 text-xs font-bold text-white">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")} / 01:00
          </span>
        )}
      </div>

      <div className="space-y-3 bg-media px-4 pb-safe pt-3">
        <div className="rail flex gap-2 overflow-x-auto pb-1">
          {filterPresets.map((p) => {
            const active = !useCustom && p.id === preset.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setUseCustom(false);
                  setPreset(p);
                }}
                className={
                  active
                    ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                    : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground"
                }
              >
                {p.label}
              </button>
            );
          })}
          <button
            onClick={() => setUseCustom(true)}
            className={
              useCustom
                ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground"
            }
          >
            Custom
          </button>
        </div>

        {useCustom ? (
          <div className="space-y-2">
            {(
              [
                ["smooth", "Skin smoothing", 0, 100],
                ["glow", "Glow", 0, 100],
                ["warmth", "Warmth", -100, 100],
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-[11px] text-media-foreground/80">{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={custom[key]}
                  onChange={(e) => setCustom((c) => ({ ...c, [key]: Number(e.target.value) }))}
                  className="w-full accent-[hsl(var(--brand))]"
                />
              </label>
            ))}
          </div>
        ) : (
          <label className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[11px] text-media-foreground/80">Intensity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(strength * 100)}
              onChange={(e) => setStrength(Number(e.target.value) / 100)}
              className="w-full accent-[hsl(var(--brand))]"
            />
          </label>
        )}

        <div className="flex items-center justify-center py-2">
          {mode === "photo" && (
            <button
              aria-label="Take photo"
              disabled={!ready || busy}
              onClick={takePhoto}
              className="grid size-16 place-items-center rounded-full bg-brand shadow-create disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <Camera className="size-7 text-white" />
              )}
            </button>
          )}

          {mode === "short" && (
            <button
              aria-label={recording ? "Stop recording" : "Start recording"}
              disabled={!ready}
              onClick={recording ? stopRecording : startRecording}
              className="grid size-16 place-items-center rounded-full bg-live shadow-create disabled:opacity-50"
            >
              {recording ? (
                <Square className="size-6 text-white" fill="currentColor" />
              ) : (
                <span className="size-6 rounded-full bg-white" />
              )}
            </button>
          )}

          {mode === "live" && (
            <div className="flex flex-col items-center gap-2">
              <button
                disabled={!ready}
                className="flex items-center gap-2 rounded-full bg-live px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Radio className="size-4" /> Go live
              </button>
              <span className="text-[11px] text-media-foreground/70">
                Live streaming opens soon — your filter is saved for it.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
