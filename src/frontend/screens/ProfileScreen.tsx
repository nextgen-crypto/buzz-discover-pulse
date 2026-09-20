import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, Grid3X3, ImagePlus, LogOut, Play, Settings, Share2, UserPlus, Wallet } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { EditProfileSheet } from "@/frontend/components/profile/EditProfileSheet";
import { PaymentSheet } from "@/frontend/components/profile/PaymentSheet";
import { useSession } from "@/frontend/hooks/useSession";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useMyPosts, useMyStats } from "@/frontend/hooks/useMyProfileData";
import { useSavedPosts } from "@/frontend/hooks/useSavedPosts";

import { supabase } from "@/integrations/supabase/client";
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

  const [editing, setEditing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("grid");

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
            Create an account or log in to see your posts, followers and saves. You can keep browsing
            other people&apos;s profiles without an account.
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

  const shownName = myProfile?.display_name ?? displayName ?? "Your profile";
  const shownAvatar = myProfile?.avatar_url ?? avatarUrl;
  const shownHandle = myProfile?.username ?? email ?? "you";
  const shownBio = myProfile?.bio?.trim() ? myProfile.bio : "";
  const gridPosts = tab === "grid" ? myPosts : tab === "saved" ? savedPosts : [];

  return (
    <AppShell title="Profile">
       <div className="h-28 bg-gradient-to-b from-brand to-brand/70 sm:h-36" />

      <div className="px-4">
         <div className="-mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
          {shownAvatar ? (
            <img
              src={shownAvatar}
              alt={shownName}
              className="size-20 rounded-2xl border-4 border-background object-cover"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-2xl border-4 border-background bg-brand text-2xl font-bold text-brand-foreground">
              {shownName.slice(0, 1).toUpperCase()}
            </span>
          )}
           <div className="mb-1 flex min-w-0 flex-wrap items-center justify-end gap-2">
            <button aria-label="Share profile" className="grid size-9 place-items-center rounded-full bg-secondary">
              <Share2 className="size-4 text-foreground" />
            </button>
            <button
              aria-label="Settings"
              onClick={() => setEditing(true)}
              className="grid size-9 place-items-center rounded-full bg-secondary"
            >
              <Settings className="size-4 text-foreground" />
            </button>
             <button
              onClick={() => setPayOpen(true)}
              className="rounded-full bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground sm:px-4"
            >
              <span className="flex items-center gap-1.5">
                <Wallet className="size-4" /> Pay
              </span>
            </button>
            <button
              onClick={() => setEditing(true)}
               className="rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-foreground sm:px-4"
            >
              Edit profile
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
           <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground">{shownName}</h2>
          {myProfile?.verified && <BadgeCheck className="size-4.5 text-brand" />}
        </div>
        <p className="text-sm text-muted-foreground">
          {shownHandle.includes("@") ? shownHandle : `@${shownHandle}`}
        </p>
        {shownBio ? (
          <p className="mt-2 text-sm leading-snug text-foreground">{shownBio}</p>
        ) : (
          <button onClick={() => setEditing(true)} className="mt-2 text-sm font-semibold text-brand">
            Add a bio
          </button>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-secondary py-3 text-center">
            <p className="text-base font-bold text-foreground">{compact.format(stats?.posts ?? 0)}</p>
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
                  {compact.format((kind === "followers" ? stats?.followers : stats?.following) ?? 0)}
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
              <Icon className={cn("size-4.5", tab === id ? "text-brand" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
      </div>

      {gridPosts.length > 0 ? (
         <div className="mt-3 grid grid-cols-3 gap-0.5 sm:grid-cols-4">
          {gridPosts.map((p) => (
            <div key={p.id} className="relative">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.caption || "Post"}
                  loading="lazy"
                  className="aspect-square w-full bg-surface-strong object-cover"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center bg-secondary p-2 text-center text-[11px] text-muted-foreground">
                  {p.caption.slice(0, 60)}
                </div>
              )}
            </div>
          ))}
        </div>

      ) : (
        <div className="mt-8 flex flex-col items-center px-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
            <ImagePlus className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {tab === "grid" ? "No posts yet" : tab === "clips" ? "No clips yet" : "Nothing saved yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tab === "saved"
              ? "Posts you save will be collected here."
              : "Anything you share will show up here."}
          </p>
        </div>

      )}

      {authUser && (
        <EditProfileSheet
          open={editing}
          onClose={() => setEditing(false)}
          userId={authUser.id}
          profile={myProfile ?? null}
          fallbackName={displayName}
        />
      )}
      <PaymentSheet open={payOpen} onClose={() => setPayOpen(false)} />
    </AppShell>
  );
}
