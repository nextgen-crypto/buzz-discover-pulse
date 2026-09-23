import { useState } from "react";
import { Bookmark, Music, Search, X } from "lucide-react";
import { TRACKS } from "@/frontend/components/create/creationEngine";
import { openCreate } from "@/frontend/components/home/nav-items";
import { cn } from "@/lib/utils";

const SAVED_KEY = "wizz:saved-sounds";

function loadSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Transparent sound browser: search trending sounds, save them,
 * or drop one straight into Create → Video as background audio.
 */
export function MusicSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [tab, setTab] = useState<"trending" | "saved">("trending");

  if (!open) return null;
  const q = query.trim().toLowerCase();
  const pool = (tab === "saved" ? TRACKS.filter((t) => saved.includes(t.id)) : TRACKS).filter(
    (t) => !q || t.title.toLowerCase().includes(q) || t.creator.toLowerCase().includes(q),
  );

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function handleUseSound(id: string) {
    try {
      localStorage.setItem("wizz:pending-track", id);
    } catch {
      // ignore
    }
    onClose();
    openCreate("video");
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto w-full max-w-3xl" role="dialog" aria-label="Sounds">
      <button
        aria-label="Close sounds"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[72dvh] flex-col rounded-t-3xl border-t border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-white/25" />
        <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Music className="size-4" /> Sounds
          </p>
          <button
            aria-label="Close sounds"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10"
          >
            <X className="size-4 text-white" />
          </button>
        </div>
        <div className="shrink-0 px-4 pb-2">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Search className="size-4 shrink-0 text-white/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sounds"
              aria-label="Search sounds"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
          </div>
          <div className="mt-2 flex gap-1.5">
            {(["trending", "saved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-bold capitalize",
                  tab === t ? "bg-white text-black" : "bg-white/10 text-white/70",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto px-2 pb-3">
          {pool.length === 0 && (
            <p className="py-8 text-center text-sm text-white/60">
              {tab === "saved"
                ? "No saved sounds yet — tap the bookmark."
                : `No sounds for “${query}”.`}
            </p>
          )}
          {pool.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-2 py-2.5">
              <span className="flex h-8 w-20 shrink-0 items-end gap-0.5" aria-hidden="true">
                {t.bars.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 10}%` }}
                    className="w-full rounded-sm bg-white/40"
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{t.title}</span>
                <span className="block truncate text-xs text-white/60">
                  {t.creator} · {t.duration}
                </span>
              </span>
              <button
                aria-label={saved.includes(t.id) ? "Unsave sound" : "Save sound"}
                onClick={() => toggleSave(t.id)}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Bookmark
                  className={cn(
                    "size-4",
                    saved.includes(t.id) ? "fill-white text-white" : "text-white/60",
                  )}
                />
              </button>
              <button
                onClick={() => handleUseSound(t.id)}
                className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black"
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
