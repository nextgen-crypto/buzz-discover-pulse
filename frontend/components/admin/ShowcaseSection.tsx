import { useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Panel, Field, Toggle, Empty, inputCls } from "@/frontend/components/admin/ui";
import { getSlides, saveSlides, type ShowcaseSlide } from "@/frontend/components/showcase/showcase";
import { ShowcaseCarousel } from "@/frontend/components/showcase/ShowcaseCarousel";
import { uploadAndSign } from "@/frontend/lib/storageUpload";
import { cn } from "@/lib/utils";


const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  bgFrom: "#171208",
  bgTo: "#4a3413",
  accent: "#f59e0b",
  cta: "Play now",
  linkUrl: "",
};

/**
 * Showcase manager: upload artwork (own folder — RLS-safe), restyle colors,
 * copy and CTA anytime, toggle slides live. Preview animates exactly as users see it.
 */
export function ShowcaseSection({ userId }: { userId: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<ShowcaseSlide[]>(() => getSlides());
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function persist(next: ShowcaseSlide[]) {
    setSlides(next);
    saveSlides(next);
  }

  async function uploadArt(file: File) {
    if (!userId) {
      setError("Sign in to upload artwork.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAndSign(
        "post-images",
        `${userId}/showcase-${Date.now()}.jpg`,
        file,
        { width: 1280 },
      );
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    if (!form.title.trim()) {
      setError("Give the slide a title.");
      return;
    }
    setError(null);
    if (editingId) {
      persist(
        slides.map((s) => (s.id === editingId ? { ...s, ...form, title: form.title.trim() } : s)),
      );
      setEditingId(null);
    } else {
      const slide: ShowcaseSlide = {
        id: `show-${Date.now()}`,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        imageUrl: form.imageUrl,
        bgFrom: form.bgFrom,
        bgTo: form.bgTo,
        accent: form.accent,
        cta: form.cta.trim(),
        linkUrl: form.linkUrl.trim(),
        active: true,
        createdAt: new Date().toISOString(),
      };
      persist([slide, ...slides]);
    }
    setForm(EMPTY_FORM);
  }

  function startEdit(s: ShowcaseSlide) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      subtitle: s.subtitle,
      imageUrl: s.imageUrl,
      bgFrom: s.bgFrom,
      bgTo: s.bgTo,
      accent: s.accent,
      cta: s.cta,
      linkUrl: s.linkUrl,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const preview: ShowcaseSlide[] =
    form.title.trim() || form.imageUrl
      ? [
          {
            id: "preview",
            title: form.title.trim() || "Your title",
            subtitle: form.subtitle,
            imageUrl: form.imageUrl,
            bgFrom: form.bgFrom,
            bgTo: form.bgTo,
            accent: form.accent,
            cta: form.cta,
            linkUrl: form.linkUrl,
            active: true,
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

  return (
    <div className="space-y-4">
      <Panel
        title={editingId ? "Edit slide" : "New slide"}
        hint="Artwork uploads to your own folder · colors update live"
      >
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="space-y-2">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Season 19 is live"
                className={inputCls}
              />
            </Field>
            <Field label="Subtitle">
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Drop in with your squad tonight"
                className={inputCls}
              />
            </Field>
            <Field label="Artwork">
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {form.imageUrl ? "Replace" : "Upload"}
                </button>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="…or paste image URL"
                  className={cn(inputCls, "min-w-0 flex-1")}
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadArt(f);
                  e.target.value = "";
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Call to action">
                <input
                  value={form.cta}
                  onChange={(e) => setForm({ ...form, cta: e.target.value })}
                  placeholder="Play now"
                  className={inputCls}
                />
              </Field>
              <Field label="Link">
                <input
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["bgFrom", "Back 1"],
                  ["bgTo", "Back 2"],
                  ["accent", "Accent"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <span className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-2 py-1.5">
                    <input
                      type="color"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      aria-label={label}
                      className="size-7 cursor-pointer rounded bg-transparent"
                    />
                    <span className="text-xs font-mono">{form[key]}</span>
                  </span>
                </Field>
              ))}
            </div>
            {preview.length > 0 && (
              <div>
                <p className="pb-1 text-xs font-semibold text-muted-foreground">Live preview</p>
                <div className="[&>div]:px-0 [&>div]:pt-0">
                  <ShowcaseCarousel slides={preview} />
                </div>
              </div>
            )}
            {error && <p className="text-xs font-semibold text-live">{error}</p>}
            <div className="flex gap-2">
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={save}
                disabled={uploading}
                className="flex-1 rounded-full bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-60"
              >
                {editingId ? "Save changes" : "Add slide"}
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={`Slides (${slides.length})`} hint="Only active slides show in the app feed">
        {slides.length === 0 ? (
          <Empty text="No slides yet — build your first animated banner above." />
        ) : (
          <ul className="divide-y divide-border">
            {slides.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span
                    className="size-12 shrink-0 rounded-xl"
                    style={{ backgroundImage: `linear-gradient(120deg, ${s.bgFrom}, ${s.bgTo})` }}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {s.title}
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.accent }}
                    />
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.active ? "live in feed" : "paused"}
                  </span>
                </span>
                <Toggle
                  checked={s.active}
                  onChange={(v) =>
                    persist(slides.map((x) => (x.id === s.id ? { ...x, active: v } : x)))
                  }
                  label={`Show ${s.title}`}
                />
                <button
                  aria-label={`Edit ${s.title}`}
                  onClick={() => startEdit(s)}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label={`Delete ${s.title}`}
                  onClick={() => persist(slides.filter((x) => x.id !== s.id))}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
