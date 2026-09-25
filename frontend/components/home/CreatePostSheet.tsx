import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Crop, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { CropSheet } from "@/frontend/components/create/CropSheet";
import { uploadAndSign, uploadStoredObject } from "@/frontend/lib/storageUpload";
import { IMAGE_MAX_BYTES, bakeOrOriginal, sizeError } from "@/frontend/lib/mediaFormat";
import { BeautyCameraSheet } from "@/frontend/components/camera/BeautyCameraSheet";
import {
  applyFilterToFile,
  filterCss,
  filterPresets,
  type FilterPreset,
} from "@/frontend/components/camera/beautyFilters";
import { useSession } from "@/frontend/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { fetchPostingCapabilities } from "@/backend/api/posts.functions";

const categories = ["For You", "Trending", "Sports", "Music", "Tech", "Style", "Food", "Travel"];

export function CreatePostSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const inspectPostingSchema = useServerFn(fetchPostingCapabilities);
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [preset, setPreset] = useState<FilterPreset>(filterPresets[0]!);
  const [camera, setCamera] = useState(false);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>(categories[0] ?? "For You");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setPreview(null);
    setPreset(filterPresets[0]!);
    setCaption("");
    setTags("");
    setLocation("");
    setCategory("For You");
    setError(null);
  }, [open]);

  function pickImage(file: File) {
    if (file.size > IMAGE_MAX_BYTES) {
      setError(sizeError("image"));
      return;
    }
    setError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<{ path: string; url: string | null } | null> {
    if (!photo || !user) return null;
    setUploading(true);
    try {
      // GIFs/SVGs and undecodable files upload as-is to preserve them.
      const baked =
        preset.id === "none"
          ? photo
          : await bakeOrOriginal(photo, (f) => applyFilterToFile(f, preset.settings, preset.extra));
      const path = `${user.id}/post-${Date.now()}.jpg`;
      const capabilities = await inspectPostingSchema();
      if (capabilities.media) {
        await uploadStoredObject("post-images", path, baked);
        return { path, url: null };
      }
      return {
        path,
        url: await uploadAndSign("post-images", path, baked, { width: 1280 }),
      };
    } finally {
      setUploading(false);
    }
  }

  async function publish() {
    if (!user) return;
    setPosting(true);
    setError(null);
    try {
      const text = caption.trim();
      if (!text) throw new Error("Write a caption first.");
      const hashtags = [
        ...new Set(
          tags
            .split(/[\s,]+/)
            .map((t) => t.trim().replace(/^#/, "").toLowerCase())
            .filter(Boolean),
        ),
      ];
      const uploaded = await uploadPhoto();
      const { error: insertError } = await supabase.from("posts").insert({
        author_id: user.id,
        caption: text,
        image_url: uploaded?.url ?? null,
        ...(uploaded?.path ? { image_path: uploaded.path } : {}),
        hashtags,
        location: location.trim() || null,
        category,
      });
      if (insertError) throw insertError;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["my-stats"] }),
      ]);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish your post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New post">
      {!loading && !user ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft">
            <ImagePlus className="size-5 text-brand" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">Log in to share a post</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your posts are saved to your account and appear on your profile.
          </p>
          <Link
            to="/auth"
            className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
          >
            Log in or create account
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pickImage(file);
              e.target.value = "";
            }}
          />

          {preview ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={preview}
                  alt="Photo to post"
                  style={{ filter: filterCss(preset.settings, preset.extra) }}
                  className="max-h-72 w-full rounded-2xl border border-border object-cover"
                />
                <button
                  aria-label="Remove photo"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(null);
                  }}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-scrim"
                >
                  <X className="size-4 text-white" />
                </button>
                <button
                  aria-label="Crop photo"
                  onClick={() => setCropping(true)}
                  className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-scrim px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Crop className="size-3.5" /> Crop
                </button>
              </div>
              <div className="rail flex gap-2 overflow-x-auto pb-1">
                {filterPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p)}
                    className={
                      p.id === preset.id
                        ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                        : "shrink-0 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCamera(true)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary py-8"
              >
                <Camera className="size-6 text-brand" />
                <span className="text-sm font-semibold text-foreground">Camera + filters</span>
                <span className="text-xs text-muted-foreground">Beautify your face</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary py-8"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-brand" />
                ) : (
                  <ImagePlus className="size-6 text-brand" />
                )}
                <span className="text-sm font-semibold text-foreground">Add a photo</span>
                <span className="text-xs text-muted-foreground">Any format · up to 25 MB</span>
              </button>
            </div>
          )}

          <BeautyCameraSheet
            open={camera}
            mode="photo"
            onClose={() => setCamera(false)}
            onCapture={pickImage}
          />
          {cropping && preview && (
            <CropSheet
              open
              onClose={() => setCropping(false)}
              imageSrc={preview}
              onDone={(f) => {
                pickImage(f);
                setCropping(false);
              }}
            />
          )}

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Caption</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What's happening?"
              className="mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
            />
            <span className="mt-1 block text-right text-[11px] text-muted-foreground">
              {caption.length}/500
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Hashtags</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="travel, food, livemusic"
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Location</span>
              <span className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Dar es Salaam"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-live">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={publish}
              disabled={posting || uploading || !caption.trim()}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
