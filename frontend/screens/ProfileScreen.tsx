import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bookmark,
  Grid3X3,
  ImagePlus,
  LogOut,
  MoreHorizontal,
  Pin,
  Play,
  Share2,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { PostManageSheet } from "@/frontend/components/profile/PostManageSheet";
import { useFollowRequests } from "@/frontend/hooks/useSocial";
import type { ProfilePost } from "@/frontend/hooks/useMyProfileData";
import { EmptyPostsArt } from "@/frontend/components/profile/EmptyPostsArt";
import { useSession } from "@/frontend/hooks/useSession";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useMyPosts, useMyStats } from "@/frontend/hooks/useMyProfileData";
import { useSavedPosts } from "@/frontend/hooks/useSavedPosts";

import { supabase } from "@/integrations/supabase/client";
import { openCreate } from "@/frontend/components/home/nav-items";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

const tabs = [
  { id: "grid", label: "Posts", Icon: Grid3X3 },
  { id: "clips", label: "Clips", Icon: Play },
  { id: "saved", label: "Saved", Icon: Bookmark },
] as const;

export function ProfileScreen() {
  const { session, loading, user: authUser, displayName, email, avatarUrl } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = authUser?.id ?? null;
  const { data: myProfile } = useMyProfile(userId);
  const { data: myPosts = [] } = useMyPosts(userId);
  const { data: stats } = useMyStats(userId);
  const { data: savedPosts = [] } = useSavedPosts(userId);

  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("grid");
  const [shared, setShared] = useState(false);
  const [managing, setManaging] = useState<ProfilePost | null>(null);
  const { requests, respond } = useFollowRequests(userId);

  const shownName = myProfile?.display_name ?? displayName ?? "Your profile";

  async function shareProfile() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: shownName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      }
    } catch {
      // dismissed — ignore
    }
  }

  function openSettings() {
    window.dispatchEvent(new CustomEvent("open-settings"));
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/welcome", replace: true });
  }

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="px-4 pt-10">
          <div className="h-24 w-full animate-pulse rounded-2xl bg-secondary" />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Profile">
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft">
            <UserPlus className="size-7 text-brand" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Sign in to view your profile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account or log in to see your posts, followers and saves. You can keep
            browsing other people&apos;s profiles without an account.
          </p>
          <Link
            to="/auth"
            className="mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            className="mt-2 w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground"
          >
            Create account
          </Link>
        </div>
      </AppShell>
    );
  }

  const shownAvatar = myProfile?.avatar_url ?? avatarUrl;
  const shownHandle = myProfile?.username ?? email ?? "you";
  const shownBio = myProfile?.bio?.trim() ? myProfile.bio : "";
  // Owner grid shows published posts only; archived/deleted live in Manage.
  // Pinned first, then newest. Badges below are owner-only (this is the
  // owner's own profile — visitors never render this screen).
  const publishedPosts = myPosts
    .filter((p) => (p.status ?? "published") === "published")
    .sort((a, b) => Number(b.is_pinned ?? false) - Number(a.is_pinned ?? false));
  const clipPosts = publishedPosts.filter((p) => p.video_url);
  const archivedPosts = myPosts.filter((p) => p.status === "archived");
  const deletedPosts = myPosts.filter((p) => p.status === "deleted");
  const gridPosts =
    tab === "grid" ? publishedPosts : tab === "clips" ? clipPosts : savedPosts;

  return (
    <AppShell title="Profile">
      <div className="animate-gradient-pan h-28 bg-gradient-to-r from-brand via-fuchsia-500 to-brand sm:h-36" />

      <div className="animate-fade-up px-4">
        <div className="-mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
          {shownAvatar ? (
            <img
              src={shownAvatar}
              alt={shownName}
              className="animate-scale-in size-20 rounded-2xl border-4 border-background object-cover"
            />
          ) : (
            <span className="animate-scale-in grid size-20 place-items-center rounded-2xl border-4 border-background bg-brand text-2xl font-bold text-brand-foreground">
              {shownName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="mb-1 flex min-w-0 flex-wrap items-center justify-end gap-2">
            <button
              aria-label={shared ? "Link copied" : "Share profile"}
              title={shared ? "Link copied" : "Share profile"}
              onClick={shareProfile}
              className="grid size-9 place-items-center rounded-full bg-secondary"
            >
              <Share2 className="size-4 text-foreground" />
            </button>
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-full bg-secondary"
            >
              <LogOut className="size-4 text-foreground" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground">
            {shownName}
          </h2>
          {myProfile?.verified && <BadgeCheck className="size-4.5 text-brand" />}
        </div>
        <p className="text-sm text-muted-foreground">
          {shownHandle.includes("@") ? shownHandle : `@${shownHandle}`}
        </p>
        {shownBio ? (
          <p className="mt-2 text-sm leading-snug text-foreground">{shownBio}</p>
        ) : (
          <button onClick={openSettings} className="mt-2 text-sm font-semibold text-brand">
            Add a bio
          </button>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-secondary py-3 text-center">
            <p className="text-base font-bold text-foreground">
              {compact.format(stats?.posts ?? 0)}
            </p>
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground">POSTS</p>
          </div>
          {(["followers", "following"] as const).map((kind) =>
            myProfile?.username ? (
              <Link
                key={kind}
                to={kind === "followers" ? "/u/$username/followers" : "/u/$username/following"}
                params={{ username: myProfile.username }}
                className="rounded-2xl bg-secondary py-3 text-center"
              >
                <p className="text-base font-bold text-foreground">
                  {compact.format(
                    (kind === "followers" ? stats?.followers : stats?.following) ?? 0,
                  )}
                </p>
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                  {kind.toUpperCase()}
                </p>
              </Link>
            ) : (
              <div key={kind} className="rounded-2xl bg-secondary py-3 text-center">
                <p className="text-base font-bold text-foreground">0</p>
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                  {kind.toUpperCase()}
                </p>
              </div>
            ),
          )}
        </div>

        <div className="mt-4 flex rounded-full bg-secondary p-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              className={cn(
                "flex flex-1 items-center justify-center rounded-full py-2",
                tab === id && "bg-background shadow-raise",
              )}
            >
              <Icon
                className={cn("size-4.5", tab === id ? "text-brand" : "text-muted-foreground")}
              />
            </button>
          ))}
        </div>
      </div>

      {requests.length > 0 && (
        <div className="mx-4 mt-4 rounded-2xl border border-border p-3">
          <p className="text-sm font-bold">Follow requests ({requests.length})</p>
          <ul className="mt-2 divide-y divide-border">
            {requests.map((r) => (
              <li key={r.requester_id} className="flex items-center gap-2.5 py-2">
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt={r.display_name}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold">
                    {r.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.display_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{r.username}
                  </span>
                </span>
                <button
                  onClick={() => respond({ requesterId: r.requester_id, accept: false })}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                >
                  Delete
                </button>
                <button
                  onClick={() => respond({ requesterId: r.requester_id, accept: true })}
                  className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {gridPosts.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-0.5 sm:grid-cols-4">
          {gridPosts.map((p) => (
            <div key={p.id} className="relative">
              {"video_url" in p && p.video_url ? (
                <video
                  src={p.video_url}
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-square w-full bg-surface-strong object-cover"
                />
              ) : (("thumbnail_url" in p && p.thumbnail_url) || p.image_url) ? (
                <img
                  src={("thumbnail_url" in p && p.thumbnail_url) || p.image_url!}
                  alt={p.caption || "Post"}
                  loading="lazy"
                  className="aspect-square w-full bg-surface-strong object-cover"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center bg-secondary p-2 text-center text-[11px] text-muted-foreground">
                  {p.caption.slice(0, 60)}
                </div>
              )}
              {(("is_pinned" in p && p.is_pinned) ||
                ("visibility" in p && p.visibility === "private")) && (
                <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {"is_pinned" in p && p.is_pinned && <Pin className="size-3" />}
                  {"is_pinned" in p && p.is_pinned ? "Pinned" : "Private"}
                </span>
              )}
              {tab !== "saved" && "status" in p && (
                <button
                  aria-label="Manage post"
                  onClick={() => setManaging(p as unknown as ProfilePost)}
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/55 text-white"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : tab === "saved" ? (
        <div className="animate-fade-up mt-8 flex flex-col items-center px-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
            <ImagePlus className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing saved yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Posts you save will be collected here.
          </p>
        </div>
      ) : (
        <div className="animate-fade-up mt-6 flex flex-col items-center px-6 text-center">
          <span className="animate-scale-in block">
            <EmptyPostsArt />
          </span>
          <p className="mt-3 text-base font-bold text-foreground">
            {tab === "clips" ? "Share your first clip" : "Create your first post"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Make this space your own.</p>
          <button
            onClick={() => openCreate(tab === "clips" ? "video" : "photo")}
            className="press mt-4 rounded-full bg-brand px-8 py-2.5 text-sm font-bold text-brand-foreground"
          >
            Create
          </button>
        </div>
      )}
      {tab === "grid" && archivedPosts.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Archived ({archivedPosts.length})
          </p>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
            {archivedPosts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {p.caption.slice(0, 60) || "Untitled"}
                </span>
                <button
                  onClick={() => setManaging(p)}
                  className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                >
                  Manage
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === "grid" && deletedPosts.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recently deleted ({deletedPosts.length})
          </p>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
            {deletedPosts.map((p) => {
              const days = Math.max(
                0,
                Math.round((Date.now() - Date.parse(p.created_at)) / 86_400_000),
              );
              return (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {p.caption.slice(0, 60) || "Untitled"}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      Deleted · {days === 0 ? "today" : `${days}d ago`}
                    </span>
                  </span>
                  <button
                    onClick={() => setManaging(p)}
                    className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                  >
                    Manage
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {authUser && managing && (
        <PostManageSheet
          open
          onClose={() => setManaging(null)}
          userId={authUser.id}
          post={managing}
          username={myProfile?.username ?? undefined}
        />
      )}
    </AppShell>
  );
}
