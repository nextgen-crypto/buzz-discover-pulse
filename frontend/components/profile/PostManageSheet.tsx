import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Download,
  ImagePlus,
  Link2,
  Loader2,
  Megaphone,
  Pin,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { ShareSheet } from "@/frontend/components/overlays/ShareSheet";
import { PromoteSheet } from "@/frontend/components/ads/PromoteSheet";
import { PostAnalyticsSheet } from "@/frontend/components/profile/PostAnalyticsSheet";
import type { ProfilePost } from "@/frontend/hooks/useMyProfileData";
import { supabase } from "@/integrations/supabase/client";
import {
  removeStoredObjects,
  uploadAndSign,
  uploadStoredObject,
} from "@/frontend/lib/storageUpload";
import { extractHashtags } from "@/frontend/lib/hashtags";
import { invalidateHomeCache } from "@/backend/api/home.functions";
import {
  deleteOwnedPost,
  fetchPostingCapabilities,
  setOwnedPostStatus,
} from "@/backend/api/posts.functions";
import { cn } from "@/lib/utils";

async function audit(userId: string, action: string, refId: string) {
  await supabase.from("content_audit").insert({ actor_id: userId, action, ref_id: refId });
}

/**
 * Owner-only post management. Every write hits RLS-checked queries
 * (author_id = you) — the backend rejects anything else independently.
 */
export function PostManageSheet({
  open,
  onClose,
  userId,
  post,
  username,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  post: ProfilePost;
  username?: string;
}) {
  const queryClient = useQueryClient();
  const bustCache = useServerFn(invalidateHomeCache);
  const inspectPostingSchema = useServerFn(fetchPostingCapabilities);
  const updateOwnedStatus = useServerFn(setOwnedPostStatus);
  const deleteOwned = useServerFn(deleteOwnedPost);
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<string | null>(null);
  const [commentsOn, setCommentsOn] = useState<boolean | null>(null);
  const [downloadsOn, setDownloadsOn] = useState<boolean | null>(null);
  const [remixOn, setRemixOn] = useState<boolean | null>(null);
  const [duetOn, setDuetOn] = useState<boolean | null>(null);
  const [sharingOn, setSharingOn] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState<null | "archive" | "delete" | "wipe">(null);
  const [promoting, setPromoting] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const editCaption = caption ?? post.caption;
  const editVisibility = visibility ?? post.visibility;
  const editComments = commentsOn ?? post.comments_enabled;
  const editDownloads = downloadsOn ?? post.allow_downloads ?? true;
  const editRemix = remixOn ?? post.allow_remix ?? true;
  const editDuet = duetOn ?? post.allow_duet ?? false;
  const editSharing = sharingOn ?? post.allow_sharing ?? true;
  const dirty =
    editCaption !== post.caption ||
    editVisibility !== post.visibility ||
    editComments !== post.comments_enabled ||
    editDownloads !== (post.allow_downloads ?? true) ||
    editRemix !== (post.allow_remix ?? true) ||
    editDuet !== (post.allow_duet ?? false) ||
    editSharing !== (post.allow_sharing ?? true);

  const shareUrl =
    typeof window !== "undefined" && username ? `${window.location.origin}/u/${username}` : "";
  const thumb = post.thumbnail_url || post.image_url;
  const hasMedia = Boolean(post.video_url || post.image_url);

  async function refresh() {
    try {
      await bustCache();
    } catch {
      // Server cache TTLs remain the fallback.
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["home"] }),
      queryClient.invalidateQueries({ queryKey: ["my-posts"] }),
      queryClient.invalidateQueries({ queryKey: ["my-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] }),
    ]);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const originalCaptionTags = new Set(extractHashtags(post.caption));
      const metadataTags = post.hashtags
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter((tag) => tag && !originalCaptionTags.has(tag));
      const full = {
        caption: editCaption.trim(),
        hashtags: extractHashtags(editCaption, metadataTags.join(" ")),
        visibility: editVisibility,
        comments_enabled: editComments,
        allow_downloads: editDownloads,
        allow_remix: editRemix,
        allow_duet: editDuet,
        allow_sharing: editSharing,
        is_edited: true,
      };
      let { error: err } = await supabase
        .from("posts")
        .update(full)
        .eq("id", post.id)
        .eq("author_id", userId);
      if (err && err.message.includes("column") && editSharing) {
        // Pre-part6/new-posting backend: persist the legacy fields so editing
        // keeps working. A disabled sharing control is never silently dropped.
        ({ error: err } = await supabase
          .from("posts")
          .update({
            caption: full.caption,
            hashtags: full.hashtags,
            visibility: full.visibility,
            comments_enabled: full.comments_enabled,
            is_edited: true,
          })
          .eq("id", post.id)
          .eq("author_id", userId));
      }
      if (err) throw err;
      await audit(userId, "post_edited", post.id);
      await refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
      setCaption(null);
      setVisibility(null);
      setCommentsOn(null);
      setDownloadsOn(null);
      setRemixOn(null);
      setDuetOn(null);
      setSharingOn(null);
    }
  }

  async function setStatus(status: "archived" | "published" | "deleted") {
    setBusy(true);
    setError(null);
    try {
      await updateOwnedStatus({ data: { postId: post.id, status } });
      await refresh();
      setConfirm(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from("posts")
        .update({ is_pinned: !post.is_pinned })
        .eq("id", post.id)
        .eq("author_id", userId);
      if (err) throw err;
      await audit(userId, post.is_pinned ? "post_unpinned" : "post_pinned", post.id);
      await refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update pin.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadThumbnail(file: File) {
    setThumbBusy(true);
    setError(null);
    const path = `${userId}/thumb-${post.id}-${Date.now()}.jpg`;
    let committed = false;
    try {
      const capabilities = await inspectPostingSchema();
      const update = capabilities.media
        ? await uploadStoredObject("post-images", path, file).then(() => ({
            thumbnail_path: path,
            thumbnail_url: "",
          }))
        : {
            thumbnail_url: await uploadAndSign("post-images", path, file, { width: 800 }),
          };
      const { error: err } = await supabase
        .from("posts")
        .update(update)
        .eq("id", post.id)
        .eq("author_id", userId);
      if (err) throw err;
      committed = true;
      await removeStoredObjects("post-images", [post.thumbnail_url, post.thumbnail_path]).catch(
        () => undefined,
      );
      await audit(userId, "post_thumbnail_changed", post.id);
      await refresh();
      onClose();
      toast("Thumbnail updated.");
    } catch (e) {
      if (!committed) await removeStoredObjects("post-images", [path]).catch(() => undefined);
      setError(e instanceof Error ? e.message : "Thumbnail upload failed.");
    } finally {
      setThumbBusy(false);
    }
  }

  async function clearThumbnail() {
    setThumbBusy(true);
    setError(null);
    try {
      const capabilities = await inspectPostingSchema();
      let { error: err } = await supabase
        .from("posts")
        .update(
          capabilities.media ? { thumbnail_path: "", thumbnail_url: "" } : { thumbnail_url: "" },
        )
        .eq("id", post.id)
        .eq("author_id", userId);
      if (err && capabilities.media) {
        ({ error: err } = await supabase
          .from("posts")
          .update({ thumbnail_url: "" })
          .eq("id", post.id)
          .eq("author_id", userId));
      }
      if (err) throw err;
      await removeStoredObjects("post-images", [post.thumbnail_url, post.thumbnail_path]).catch(
        () => undefined,
      );
      await refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset thumbnail.");
    } finally {
      setThumbBusy(false);
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    try {
      void navigator.clipboard.writeText(shareUrl);
      toast("Link copied.");
    } catch {
      toast("Could not copy link.");
    }
  }

  async function wipe() {
    setBusy(true);
    setError(null);
    try {
      await deleteOwned({ data: { postId: post.id } });
      await removeStoredObjects("post-images", [
        post.thumbnail_url,
        post.thumbnail_path,
        post.image_url,
        post.image_path,
        post.video_url,
        post.video_path,
      ]).catch(() => undefined);
      await refresh();
      setConfirm(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!busy && !thumbBusy) onClose();
      }}
      title="Manage post"
    >
      <div className="space-y-3 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-2.5">
          {post.video_url ? (
            <video
              src={post.video_url}
              muted
              playsInline
              preload="metadata"
              className="size-14 rounded-xl bg-black object-cover"
            />
          ) : thumb ? (
            <img src={thumb} alt="" className="size-14 rounded-xl object-cover" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-border text-[10px] text-muted-foreground">
              Text
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {post.caption.slice(0, 60) || "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {post.status}
              {post.is_edited ? " · edited" : ""} · {post.comments_count ?? 0} comments
            </p>
            <p className="mt-1 flex flex-wrap gap-1">
              {post.is_pinned && (
                <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                  Pinned
                </span>
              )}
              {post.visibility === "private" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold ring-1 ring-border">
                  Private
                </span>
              )}
              {post.visibility === "followers" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold ring-1 ring-border">
                  Followers
                </span>
              )}
              {post.status === "archived" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold ring-1 ring-border">
                  Archived
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <QuickAction Icon={BarChart3} label="Analytics" onClick={() => setAnalyticsOpen(true)} />
          {hasMedia ? (
            <a
              href={post.video_url || post.image_url!}
              download
              aria-label="Download original"
              className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-2.5 text-[11px] font-bold"
            >
              <Download className="size-4" /> Save
            </a>
          ) : (
            <QuickAction Icon={Download} label="Save" onClick={() => toast("No media to save.")} />
          )}
          <QuickAction Icon={Link2} label="Copy link" onClick={copyLink} />
          <QuickAction Icon={Share2} label="Share" onClick={() => setSharing(true)} />
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Caption</span>
          <textarea
            value={editCaption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Audience</span>
          <select
            value={editVisibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none"
          >
            <option value="public">Public</option>
            <option value="followers">Followers</option>
            <option value="private">Only me</option>
          </select>
        </label>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Settings
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <MiniToggle
              label="Comments"
              on={editComments}
              onFlip={() => setCommentsOn(!editComments)}
            />
            <MiniToggle
              label="Sharing"
              on={editSharing}
              onFlip={() => setSharingOn(!editSharing)}
            />
            <MiniToggle
              label="Downloads"
              on={editDownloads}
              onFlip={() => setDownloadsOn(!editDownloads)}
            />
            <MiniToggle label="Remix" on={editRemix} onFlip={() => setRemixOn(!editRemix)} />
            <MiniToggle label="Duet" on={editDuet} onFlip={() => setDuetOn(!editDuet)} />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Thumbnail
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            {post.thumbnail_url && (
              <img src={post.thumbnail_url} alt="" className="size-12 rounded-xl object-cover" />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={thumbBusy}
              className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {thumbBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {post.thumbnail_url ? "Replace" : "Upload custom"}
            </button>
            {post.thumbnail_url && (
              <button
                onClick={() => void clearThumbnail()}
                disabled={thumbBusy}
                className="rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                Reset
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadThumbnail(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Original media is never modified — only the cover changes.
          </p>
        </div>

        <button
          onClick={save}
          disabled={busy || !dirty || !editCaption.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => void togglePin()}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-sm font-bold disabled:opacity-60"
          >
            <Pin className="size-4" /> {post.is_pinned ? "Unpin" : "Pin to profile"}
          </button>
          <button
            onClick={() => setPromoting(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary py-2.5 text-sm font-bold"
          >
            <Megaphone className="size-4" /> Promote
          </button>
        </div>

        <div className="border-t border-border pt-3">
          {confirm === null && (
            <div className="flex gap-2">
              {post.status === "scheduled" ? (
                <button
                  onClick={() => void setStatus("published")}
                  disabled={busy}
                  className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-foreground"
                >
                  Publish now
                </button>
              ) : post.status === "archived" || post.status === "deleted" ? (
                <button
                  onClick={() => void setStatus("published")}
                  disabled={busy}
                  className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
                >
                  Restore
                </button>
              ) : (
                <button
                  onClick={() => setConfirm("archive")}
                  disabled={busy}
                  className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => setConfirm("delete")}
                disabled={busy}
                className="flex-1 rounded-full bg-live/10 py-2.5 text-sm font-bold text-live"
              >
                Delete
              </button>
            </div>
          )}
          {confirm === "archive" && (
            <ConfirmBox
              title="Move this post to your archive?"
              body="It leaves your public profile but stays recoverable."
              confirmLabel="Archive"
              busy={busy}
              onCancel={() => setConfirm(null)}
              onConfirm={() => void setStatus("archived")}
            />
          )}
          {confirm === "delete" && (
            <ConfirmBox
              title="Delete this post?"
              body="It will be soft-deleted first. You can still wipe it permanently below."
              confirmLabel="Soft-delete"
              busy={busy}
              onCancel={() => setConfirm(null)}
              onConfirm={() => void setStatus("deleted")}
            />
          )}
          {confirm === null && (
            <button
              onClick={() => setConfirm("wipe")}
              disabled={busy}
              className="mt-2 w-full rounded-full py-2.5 text-xs font-semibold text-muted-foreground"
            >
              Delete permanently…
            </button>
          )}
          {confirm === "wipe" && (
            <ConfirmBox
              title="Delete this post permanently?"
              body="This cannot be undone. Media and comments go with it."
              confirmLabel="Delete forever"
              busy={busy}
              onCancel={() => setConfirm(null)}
              onConfirm={() => void wipe()}
            />
          )}
        </div>

        {error && <p className="text-xs font-semibold text-live">{error}</p>}
      </div>
      {promoting && (
        <PromoteSheet open onClose={() => setPromoting(false)} userId={userId} post={post} />
      )}
      {analyticsOpen && (
        <PostAnalyticsSheet open onClose={() => setAnalyticsOpen(false)} post={post} />
      )}
      {sharing && (
        <ShareSheet
          open
          onClose={() => setSharing(false)}
          url={shareUrl}
          message={`${username ?? "Someone"} on WIZZ: ${post.caption}`}
        />
      )}
    </Sheet>
  );
}

function QuickAction({
  Icon,
  label,
  onClick,
}: {
  Icon: typeof BarChart3;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-2.5 text-[11px] font-bold"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function MiniToggle({ label, on, onFlip }: { label: string; on: boolean; onFlip: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onFlip}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold"
    >
      {label}
      <span
        className={cn("relative h-6 w-11 shrink-0 rounded-full", on ? "bg-brand" : "bg-border")}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function ConfirmBox({
  title,
  body,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-2xl border border-live/30 bg-live/5 p-3">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full bg-secondary py-2 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-live py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
