import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, HeartHandshake, ImagePlus, UserX } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { PaymentSheet } from "@/frontend/components/profile/PaymentSheet";
import { useSession } from "@/frontend/hooks/useSession";
import {
  useFollowState,
  useProfileByUsername,
  useProfilePosts,
  useProfileStats,
} from "@/frontend/hooks/usePublicProfile";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export function PublicProfileScreen({ username }: { username: string }) {
  const { user } = useSession();
  const viewerId = user?.id ?? null;
  const { data: profile, isLoading } = useProfileByUsername(username);
  const profileId = profile?.id ?? null;
  const { data: posts = [] } = useProfilePosts(profileId);
  const { data: stats } = useProfileStats(profileId);
  const { isFollowing, canFollow, toggle } = useFollowState(viewerId, profileId);
  const [payOpen, setPayOpen] = useState(false);

  if (isLoading) {
    return (
      <AppShell title="Profile">
        <div className="space-y-3 px-4 pt-10">
          <div className="h-24 w-full animate-pulse rounded-2xl bg-secondary" />
          <div className="h-40 w-full animate-pulse rounded-2xl bg-secondary" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Profile not found">
        <div className="flex flex-col items-center px-6 pt-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
            <UserX className="size-7 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            No account called @{username}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This profile may have been renamed or removed.
          </p>
          <Link
            to="/"
            className="mt-5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
          >
            Back to feed
          </Link>
        </div>
      </AppShell>
    );
  }

  const isMe = viewerId === profile.id;

  return (
    <AppShell title={`${profile.display_name} on WIZZ`}>
       <div className="h-28 bg-gradient-to-b from-brand to-brand/70 sm:h-36" />

      <div className="px-4">
         <div className="-mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="size-20 rounded-2xl border-4 border-background object-cover"
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-2xl border-4 border-background bg-brand text-2xl font-bold text-brand-foreground">
              {profile.display_name.slice(0, 1).toUpperCase()}
            </span>
          )}
           <div className="mb-1 flex min-w-0 flex-wrap items-center justify-end gap-2">
            {isMe ? (
              <Link
                to="/profile"
                className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
              >
                Your profile
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setPayOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
                >
                  <HeartHandshake className="size-4" /> Support
                </button>
                {viewerId ? (
                  <button
                    onClick={() => toggle.mutate(!isFollowing)}
                    disabled={!canFollow || toggle.isPending}
                    className={cn(
                      "rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground disabled:opacity-60",
                    )}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground"
                  >
                    Follow
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
           <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground">{profile.display_name}</h2>
          {profile.verified && <BadgeCheck className="size-4.5 text-brand" />}
        </div>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio.trim() && (
          <p className="mt-2 text-sm leading-snug text-foreground">{profile.bio}</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-secondary py-3 text-center">
            <p className="text-base font-bold text-foreground">{compact.format(stats?.posts ?? 0)}</p>
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground">POSTS</p>
          </div>
          <Link
            to="/u/$username/followers"
            params={{ username: profile.username }}
            className="rounded-2xl bg-secondary py-3 text-center"
          >
            <p className="text-base font-bold text-foreground">
              {compact.format(stats?.followers ?? 0)}
            </p>
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground">FOLLOWERS</p>
          </Link>
          <Link
            to="/u/$username/following"
            params={{ username: profile.username }}
            className="rounded-2xl bg-secondary py-3 text-center"
          >
            <p className="text-base font-bold text-foreground">
              {compact.format(stats?.following ?? 0)}
            </p>
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground">FOLLOWING</p>
          </Link>
        </div>
      </div>

      {posts.length > 0 ? (
         <div className="mt-4 grid grid-cols-3 gap-0.5 sm:grid-cols-4">
          {posts.map((p) => (
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
          <p className="mt-3 text-sm font-semibold text-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When {profile.display_name} shares something it will show up here.
          </p>
        </div>
      )}
      <PaymentSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        creatorName={profile.display_name}
      />
    </AppShell>
  );
}
