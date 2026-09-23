import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Ban,
  Check,
  HeartHandshake,
  ImagePlus,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Share2,
  UserX,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/frontend/components/AppShell";
import { PaymentSheet } from "@/frontend/components/profile/PaymentSheet";
import { ReportDialog } from "@/frontend/components/moderation/ReportDialog";
import { useSession } from "@/frontend/hooks/useSession";
import { useAuthGate } from "@/frontend/hooks/useAuthGate";
import {
  useFollowState,
  useProfileByUsername,
  useProfilePosts,
  useProfileStats,
} from "@/frontend/hooks/usePublicProfile";
import {
  mutedUsernames,
  toggleMutedUsername,
  useBlockState,
  useOutgoingRequest,
} from "@/frontend/hooks/useSocial";
import { getOrCreateConversation } from "@/frontend/hooks/useMessages";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export function PublicProfileScreen({ username }: { username: string }) {
  const { user } = useSession();
  const requireAuth = useAuthGate();
  const navigate = useNavigate();
  const viewerId = user?.id ?? null;
  const { data: profile, isLoading } = useProfileByUsername(username);
  const profileId = profile?.id ?? null;
  const { data: posts = [] } = useProfilePosts(profileId);
  const { data: stats } = useProfileStats(profileId);
  const { isFollowing, canFollow, toggle } = useFollowState(viewerId, profileId);
  const { requested, send, withdraw } = useOutgoingRequest(viewerId, profileId);
  const { blockedByMe, blocksMe, setBlock } = useBlockState(viewerId, profileId);
  const [payOpen, setPayOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [mutedTick, setMutedTick] = useState(0);
  void mutedTick;

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

  // RLS hides blocked / removed profiles uniformly — never leak which.
  if (!profile || blocksMe) {
    return (
      <AppShell title="Profile not available">
        <div className="flex flex-col items-center px-6 pt-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-secondary">
            <UserX className="size-7 text-muted-foreground" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            This profile isn&apos;t available
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            It may be private, blocked, renamed or removed.
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
  const isPrivate = profile.is_private === true;
  const locked = isPrivate && !isFollowing && !isMe;
  const muted = mutedUsernames().includes(profile.username.toLowerCase());
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/u/${profile.username}` : "";

  async function shareProfile() {
    try {
      if (navigator.share) {
        await navigator.share({ title: profile!.display_name, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast("Profile link copied");
      }
    } catch {
      // dismissed
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast("Profile link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function message() {
    if (!requireAuth()) return;
    if (!viewerId) return;
    try {
      const id = await getOrCreateConversation(viewerId, profile!.id);
      void navigate({ to: "/messages", search: { c: id } });
    } catch {
      toast.error("Could not open chat. Try again.");
    }
  }

  function followButton() {
    if (isMe) {
      return (
        <Link
          to="/profile"
          className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
        >
          Your profile
        </Link>
      );
    }
    if (!viewerId) {
      return (
        <Link
          to="/auth"
          className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground"
        >
          Follow
        </Link>
      );
    }
    if (isPrivate && !isFollowing) {
      return requested ? (
        <button
          onClick={() => withdraw()}
          className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground"
        >
          Requested
        </button>
      ) : (
        <button
          onClick={() => send()}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background"
        >
          Request to follow
        </button>
      );
    }
    return (
      <button
        onClick={() => toggle.mutate(!isFollowing)}
        disabled={!canFollow || toggle.isPending}
        className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground disabled:opacity-60"
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
    );
  }

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
            {!isMe && (
              <>
                <button
                  onClick={() => setPayOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
                >
                  <HeartHandshake className="size-4" /> Support
                </button>
                {followButton()}
                <button
                  onClick={message}
                  aria-label="Message"
                  className="grid size-9 place-items-center rounded-full bg-secondary"
                >
                  <MessageCircle className="size-4 text-foreground" />
                </button>
              </>
            )}
            {isMe && (
              <Link
                to="/profile"
                className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
              >
                Your profile
              </Link>
            )}
            <span className="relative">
              <button
                aria-label="Profile options"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid size-9 place-items-center rounded-full bg-secondary"
              >
                <MoreHorizontal className="size-4 text-foreground" />
              </button>
              {menuOpen && (
                <>
                  <button
                    aria-label="Close menu"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmBlock(false);
                    }}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-raise">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        void shareProfile();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                    >
                      <Share2 className="size-4 text-muted-foreground" /> Share profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        void copyLink();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                    >
                      <Link2 className="size-4 text-muted-foreground" /> Copy profile link
                    </button>
                    {!isMe && (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            const nowMuted = toggleMutedUsername(profile.username);
                            toast(
                              nowMuted
                                ? `Muted @${profile.username}`
                                : `Unmuted @${profile.username}`,
                            );
                            setMutedTick((n) => n + 1);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                        >
                          <VolumeX className="size-4 text-muted-foreground" />
                          {muted ? "Unmute" : "Mute"}
                        </button>
                        {!confirmBlock ? (
                          <button
                            onClick={() => setConfirmBlock(true)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-live hover:bg-secondary"
                          >
                            <Ban className="size-4" /> Block @{profile.username}?
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirmBlock(false);
                              setBlock(true);
                              toast(`Blocked @${profile.username}`);
                            }}
                            className="flex w-full items-center gap-3 bg-live/10 px-3 py-2.5 text-left text-sm font-bold text-live"
                          >
                            <Check className="size-4" /> Confirm block
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setReporting(true);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary"
                        >
                          <UserX className="size-4 text-muted-foreground" /> Report
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <h2 className="min-w-0 break-words text-xl font-bold tracking-tight text-foreground">
            {profile.display_name}
          </h2>
          {profile.verified && <BadgeCheck className="size-4.5 text-brand" />}
          {isPrivate && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Private
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio.trim() && (
          <p className="mt-2 text-sm leading-snug text-foreground">{profile.bio}</p>
        )}

        {blockedByMe ? (
          <div className="mt-4 rounded-2xl bg-secondary p-4 text-center">
            <p className="text-sm font-bold">You blocked @{profile.username}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You won&apos;t see each other&apos;s content.
            </p>
            <button
              onClick={() => {
                setBlock(false);
                toast(`Unblocked @${profile.username}`);
              }}
              className="mt-3 rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background"
            >
              Unblock
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-secondary py-3 text-center">
              <p className="text-base font-bold text-foreground">
                {compact.format(stats?.posts ?? 0)}
              </p>
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
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                FOLLOWERS
              </p>
            </Link>
            <Link
              to="/u/$username/following"
              params={{ username: profile.username }}
              className="rounded-2xl bg-secondary py-3 text-center"
            >
              <p className="text-base font-bold text-foreground">
                {compact.format(stats?.following ?? 0)}
              </p>
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                FOLLOWING
              </p>
            </Link>
          </div>
        )}
      </div>

      {!blockedByMe &&
        (locked ? (
          <div className="mt-8 flex flex-col items-center px-6 text-center">
            <p className="text-sm font-bold text-foreground">This account is private</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow @{profile.username} to see their posts.
            </p>
          </div>
        ) : posts.length > 0 ? (
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
            <p className="mt-3 text-sm font-semibold text-foreground">No public posts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              When {profile.display_name} shares something it will show up here.
            </p>
          </div>
        ))}
      <PaymentSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        creatorName={profile.display_name}
      />
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        target={{
          kind: "user",
          refId: profile.id,
          refTitle: `@${profile.username}`,
          targetUserId: profile.id,
        }}
      />
    </AppShell>
  );
}
