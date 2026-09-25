import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/frontend/hooks/useSession";
import { useTheme, type Theme } from "@/frontend/hooks/useTheme";
import { useFeedPrefs } from "@/frontend/hooks/useFeedPrefs";
import { useMyPosts, useMyStats } from "@/frontend/hooks/useMyProfileData";
import { useSavedPosts, useToggleSave } from "@/frontend/hooks/useSavedPosts";
import { useFollowList } from "@/frontend/hooks/usePublicProfile";

/** Persistent local preference backed by localStorage. */
export function useLocalSetting<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`wizz:setting:${key}`);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`wizz:setting:${key}`, JSON.stringify(value));
    } catch {
      // storage unavailable — keep in-memory only
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  control,
}: {
  title: string;
  desc?: string;
  control?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight text-foreground">
          {title}
        </span>
        {desc && (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{desc}</span>
        )}
      </span>
      {control}
    </div>
  );
}

function Empty({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="px-2 py-8 text-center">
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

export const SETTING_TITLES: Record<string, string> = {
  "edit-profile": "Edit profile",
  appearance: "Appearance",
  payments: "Payments",
  "account-centre": "Account centre",
  saved: "Saved",
  archive: "Archive",
  activity: "Your activity",
  notifications: "Notifications",
  "time-management": "Time management",
  privacy: "Account privacy",
  "close-friends": "Close friends",
  blocked: "Blocked accounts",
  messages: "Messages and story replies",
  tags: "Tags and mentions",
  comments: "Comments",
  sharing: "Sharing and reuse",
  "hidden-words": "Hidden words",
  invite: "Follow and invite friends",
  favourites: "Favourites",
  muted: "Muted accounts",
  "muted-creators": "Muted creators",
  "content-prefs": "Content preferences",
  "like-counts": "Like and share counts",
  premium: "WIZZ Premium",
  verified: "Verified",
  help: "Help",
  "privacy-centre": "Privacy centre",
  "account-status": "Account status",
  about: "About",
};

export function SettingsDetail({ id, userId }: { id: string; userId: string | null }) {
  switch (id) {
    case "account-centre":
      return <AccountCentre userId={userId} />;
    case "appearance":
      return <AppearanceDetail />;
    case "saved":
      return <SavedDetail userId={userId} />;
    case "archive":
      return <ArchiveDetail userId={userId} />;
    case "activity":
      return <ActivityDetail userId={userId} />;
    case "notifications":
      return <NotificationsDetail />;
    case "time-management":
      return <TimeDetail />;
    case "privacy":
      return <PrivacyDetail />;
    case "close-friends":
      return <CloseFriendsDetail userId={userId} />;
    case "blocked":
      return <BlockedDetail />;
    case "messages":
      return <MessagesDetail />;
    case "tags":
      return <TagsDetail />;
    case "comments":
      return <CommentsDetail />;
    case "sharing":
      return <SharingDetail />;
    case "hidden-words":
      return <HiddenWordsDetail />;
    case "invite":
      return <InviteDetail />;
    case "favourites":
      return <FavouritesDetail />;
    case "muted":
      return <MutedDetail />;
    case "muted-creators":
      return <MutedCreatorsDetail userId={userId} />;
    case "content-prefs":
      return <ContentPrefsDetail />;
    case "like-counts":
      return <LikeCountsDetail />;
    case "premium":
      return <PremiumDetail />;
    case "verified":
      return <VerifiedDetail />;
    case "help":
      return <HelpDetail />;
    case "privacy-centre":
      return <PrivacyCentreDetail />;
    case "account-status":
      return <AccountStatusDetail userId={userId} />;
    case "about":
      return <AboutDetail />;
    default:
      return <Empty title="Coming soon" desc="This setting is not available yet." />;
  }
}

function AccountCentre({ userId }: { userId: string | null }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function updatePassword() {
    if (password.length < 6) {
      setMsg("Use at least 6 characters.");
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Password updated.");
      setPassword("");
    }
  }

  return (
    <div>
      <Row title="Email" desc={email ?? "Not signed in"} />
      <Row title="User ID" desc={userId ?? "Not signed in"} />
      <div className="px-2 py-2">
        <p className="text-[15px] font-semibold text-foreground">New password</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Password, security and personal details live here.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
          />
          <button
            onClick={updatePassword}
            disabled={saving}
            className="shrink-0 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update"}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs font-semibold text-muted-foreground">{msg}</p>}
        <Link
          to="/profile"
          className="mt-3 block rounded-xl bg-secondary px-3 py-2.5 text-center text-sm font-semibold text-foreground"
        >
          Edit personal details
        </Link>
      </div>
    </div>
  );
}

function AppearanceDetail() {
  const { theme, applyTheme } = useTheme();
  const options: { value: Theme; title: string; desc: string }[] = [
    { value: "light", title: "Light", desc: "Bright background, always" },
    { value: "dark", title: "Dark", desc: "Dark background, easy at night" },
    { value: "system", title: "System", desc: "Follow your device setting" },
  ];
  return (
    <div>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => applyTheme(o.value)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-tight text-foreground">
              {o.title}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {o.desc}
            </span>
          </span>
          {theme === o.value && <Check className="size-5 shrink-0 text-brand" />}
        </button>
      ))}
      <p className="px-2 pb-1 pt-3 text-xs leading-relaxed text-muted-foreground">
        Your choice is saved on this device.
      </p>
    </div>
  );
}

function SavedDetail({ userId }: { userId: string | null }) {
  const { data = [], isLoading } = useSavedPosts(userId);
  const toggle = useToggleSave(userId);
  if (!userId)
    return <Empty title="Sign in to see saves" desc="Posts you save will be collected here." />;
  if (isLoading) return <Empty title="Loading…" desc="Fetching your saved posts." />;
  if (data.length === 0)
    return <Empty title="Nothing saved yet" desc="Tap the bookmark on any post to save it here." />;
  return (
    <ul className="divide-y divide-border">
      {data.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
          {p.image_url ? (
            <img src={p.image_url} alt="" className="size-11 rounded-xl object-cover" />
          ) : (
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-[11px] text-muted-foreground">
              Post
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {p.caption || "Untitled post"}
          </span>
          <button
            onClick={() => toggle.mutate({ postId: p.id, save: false })}
            className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            Unsave
          </button>
        </li>
      ))}
    </ul>
  );
}

function ArchiveDetail({ userId }: { userId: string | null }) {
  const { data = [] } = useMyPosts(userId);
  const [archived, setArchived] = useLocalSetting<string[]>("archived", []);
  const archivedSet = new Set(archived);
  const shown = data.filter((p) => archivedSet.has(p.id));
  if (!userId)
    return <Empty title="Sign in to use archive" desc="Archived posts are only visible to you." />;
  return (
    <div>
      {shown.length === 0 && (
        <Empty
          title="No archived posts"
          desc="Archive a post from the list below to hide it from your profile."
        />
      )}
      {shown.length > 0 && (
        <ul className="divide-y divide-border">
          {shown.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {p.caption || "Untitled"}
              </span>
              <button
                onClick={() => setArchived(archived.filter((a) => a !== p.id))}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Unarchive
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="px-2 pb-1 pt-3 text-sm font-semibold text-muted-foreground">Your posts</p>
      <ul className="divide-y divide-border">
        {data.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {p.caption || "Untitled"}
            </span>
            <button
              onClick={() =>
                setArchived(
                  archivedSet.has(p.id) ? archived.filter((a) => a !== p.id) : [...archived, p.id],
                )
              }
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              {archivedSet.has(p.id) ? "Archived" : "Archive"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityDetail({ userId }: { userId: string | null }) {
  const { data: posts = [] } = useMyPosts(userId);
  const { data: saved = [] } = useSavedPosts(userId);
  const { data: stats } = useMyStats(userId);
  return (
    <div>
      <Row title="Posts" desc={`${stats?.posts ?? posts.length} total`} />
      <Row title="Saved" desc={`${saved.length} saved`} />
      <Row title="Followers" desc={`${stats?.followers ?? 0}`} />
      <Row title="Following" desc={`${stats?.following ?? 0}`} />
      <p className="px-2 pb-1 pt-2 text-sm font-semibold text-muted-foreground">Recent posts</p>
      {posts.slice(0, 5).map((p) => (
        <Row
          key={p.id}
          title={p.caption?.slice(0, 60) || "Untitled post"}
          desc={new Date(p.created_at).toLocaleDateString()}
        />
      ))}
      {posts.length === 0 && (
        <Empty title="No activity yet" desc="Posts, saves and follows will show up here." />
      )}
    </div>
  );
}

function NotificationsDetail() {
  const [push, setPush] = useLocalSetting("notif-push", true);
  const [likes, setLikes] = useLocalSetting("notif-likes", true);
  const [comments, setComments] = useLocalSetting("notif-comments", true);
  const [follows, setFollows] = useLocalSetting("notif-follows", true);
  return (
    <div>
      <Row
        title="Push notifications"
        desc="Get alerts on this device"
        control={<Toggle checked={push} onChange={setPush} label="Push notifications" />}
      />
      <Row
        title="Likes"
        desc="Someone likes your post"
        control={<Toggle checked={likes} onChange={setLikes} label="Likes" />}
      />
      <Row
        title="Comments"
        desc="Someone comments"
        control={<Toggle checked={comments} onChange={setComments} label="Comments" />}
      />
      <Row
        title="New followers"
        desc="Someone follows you"
        control={<Toggle checked={follows} onChange={setFollows} label="New followers" />}
      />
    </div>
  );
}

function TimeDetail() {
  const [limit, setLimit] = useLocalSetting("time-limit", 60);
  const [reminder, setReminder] = useLocalSetting("time-reminder", true);
  return (
    <div>
      <Row
        title="Daily reminder"
        desc="Nudge when you hit your limit"
        control={<Toggle checked={reminder} onChange={setReminder} label="Daily reminder" />}
      />
      <div className="px-2 py-2.5">
        <p className="text-[15px] font-semibold text-foreground">Daily limit: {limit} min</p>
        <input
          type="range"
          min={15}
          max={240}
          step={15}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="mt-3 w-full accent-black dark:accent-white"
          aria-label="Daily limit"
        />
      </div>
    </div>
  );
}

function PrivacyDetail() {
  const [isPrivate, setPrivate] = useLocalSetting("private-account", false);
  return (
    <div>
      <Row
        title="Private account"
        desc={isPrivate ? "Only followers can see your posts" : "Anyone can see your posts"}
        control={<Toggle checked={isPrivate} onChange={setPrivate} label="Private account" />}
      />
      <Row
        title="Current visibility"
        desc={isPrivate ? "Private" : "Public"}
        control={
          <span className="text-[13px] text-muted-foreground">
            {isPrivate ? "Private" : "Public"}
          </span>
        }
      />
    </div>
  );
}

function CloseFriendsDetail({ userId }: { userId: string | null }) {
  const { data = [] } = useFollowList(userId, "following", userId);
  const [close, setClose] = useLocalSetting<string[]>("close-friends", []);
  const set = new Set(close);
  if (!userId)
    return (
      <Empty
        title="Sign in required"
        desc="Add close friends to share stories with a smaller group."
      />
    );
  if (data.length === 0)
    return (
      <Empty title="No friends yet" desc="Follow people first, then add them to close friends." />
    );
  return (
    <ul className="divide-y divide-border">
      {data.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
            {p.display_name}
          </span>
          <button
            onClick={() =>
              setClose(set.has(p.id) ? close.filter((c) => c !== p.id) : [...close, p.id])
            }
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${set.has(p.id) ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"}`}
          >
            {set.has(p.id) ? "Close friend" : "Add"}
          </button>
        </li>
      ))}
    </ul>
  );
}

function BlockedDetail() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-blocks", user?.id],
    enabled: Boolean(user),
    staleTime: 15_000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("blocks")
        .select("blocked_id, profiles!blocks_blocked_id_fkey(username, display_name)")
        .eq("blocker_id", user.id);
      if (error) throw error;
      return (data ?? []) as {
        blocked_id: string;
        profiles: { username: string; display_name: string } | null;
      }[];
    },
  });

  async function unblock(id: string) {
    if (!user) return;
    await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", id);
    void queryClient.invalidateQueries({ queryKey: ["my-blocks", user?.id] });
  }

  if (!user) {
    return <Empty title="Sign in required" desc="Your blocked list lives on your account." />;
  }
  if (isLoading) {
    return <Empty title="Loading…" desc="Fetching your blocked accounts." />;
  }
  if (rows.length === 0) {
    return (
      <Empty
        title="No blocked accounts"
        desc="Blocked people can't see your profile or content, and you won't see theirs. Block from any profile's ••• menu."
      />
    );
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((b) => (
        <li key={b.blocked_id} className="flex items-center gap-3 px-2 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {b.profiles?.display_name ?? "?"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              @{b.profiles?.username ?? "?"}
            </span>
          </span>
          <button
            onClick={() => void unblock(b.blocked_id)}
            className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
          >
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}

function segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${value === o ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function MessagesDetail() {
  const [dms, setDms] = useLocalSetting("msg-who", "everyone");
  const [replies, setReplies] = useLocalSetting("story-replies", "followers");
  return (
    <div>
      <Row
        title="Who can message you"
        control={segmented({
          value: dms,
          options: ["everyone", "followers", "nobody"],
          onChange: setDms,
        })}
      />
      <Row
        title="Story replies"
        control={segmented({
          value: replies,
          options: ["everyone", "followers", "off"],
          onChange: setReplies,
        })}
      />
    </div>
  );
}

function TagsDetail() {
  const [tags, setTags] = useLocalSetting("tags-who", "everyone");
  const [mentions, setMentions] = useLocalSetting("mentions-who", "everyone");
  return (
    <div>
      <Row
        title="Who can tag you"
        control={segmented({
          value: tags,
          options: ["everyone", "followers", "nobody"],
          onChange: setTags,
        })}
      />
      <Row
        title="Who can mention you"
        control={segmented({
          value: mentions,
          options: ["everyone", "followers", "nobody"],
          onChange: setMentions,
        })}
      />
    </div>
  );
}

function CommentsDetail() {
  const [who, setWho] = useLocalSetting("comments-who", "everyone");
  const [filter, setFilter] = useLocalSetting("comments-filter", true);
  return (
    <div>
      <Row
        title="Who can comment"
        control={segmented({
          value: who,
          options: ["everyone", "followers", "off"],
          onChange: setWho,
        })}
      />
      <Row
        title="Hide offensive comments"
        desc="Auto-filtered"
        control={<Toggle checked={filter} onChange={setFilter} label="Hide offensive comments" />}
      />
    </div>
  );
}

function SharingDetail() {
  const [remix, setRemix] = useLocalSetting("share-remix", true);
  const [download, setDownload] = useLocalSetting("share-download", false);
  return (
    <div>
      <Row
        title="Allow reuse"
        desc="Let others reuse your clips"
        control={<Toggle checked={remix} onChange={setRemix} label="Allow reuse" />}
      />
      <Row
        title="Allow downloads"
        desc="Let others save your videos"
        control={<Toggle checked={download} onChange={setDownload} label="Allow downloads" />}
      />
    </div>
  );
}

function HiddenWordsDetail() {
  const [words, setWords] = useLocalSetting<string[]>("hidden-words", []);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex gap-2 px-2 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a word or emoji"
          className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={() => {
            const v = draft.trim().toLowerCase();
            if (v && !words.includes(v)) setWords([...words, v]);
            setDraft("");
          }}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
        >
          Add
        </button>
      </div>
      {words.length === 0 ? (
        <Empty
          title="No hidden words"
          desc="Comments with these words are filtered automatically."
        />
      ) : (
        <div className="flex flex-wrap gap-2 px-2 py-2">
          {words.map((w) => (
            <button
              key={w}
              onClick={() => setWords(words.filter((x) => x !== w))}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              title="Tap to remove"
            >
              {w} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteDetail() {
  const [copied, setCopied] = useState(false);
  const link = "https://wizz.app/invite";
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Join WIZZ", url: link });
      else await copy();
    } catch {
      // dismissed
    }
  }
  return (
    <div className="px-2 py-2">
      <p className="text-[15px] font-semibold text-foreground">Invite friends to WIZZ</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Share your link anywhere.</p>
      <p className="mt-2 truncate rounded-xl bg-secondary px-3 py-2.5 text-sm">{link}</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-sm font-semibold"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={share}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
        >
          <Share2 className="size-4" /> Share
        </button>
      </div>
    </div>
  );
}

function FavouritesDetail() {
  const [favs, setFavs] = useLocalSetting<string[]>("favourites", []);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex gap-2 px-2 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add username to favourites"
          className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={() => {
            const v = draft.trim().replace(/^@/, "");
            if (v && !favs.includes(v)) setFavs([...favs, v]);
            setDraft("");
          }}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
        >
          Add
        </button>
      </div>
      {favs.length === 0 ? (
        <Empty title="No favourites" desc="Their posts show higher in your feed." />
      ) : (
        <ul className="divide-y divide-border">
          {favs.map((f) => (
            <li key={f} className="flex items-center gap-3 px-2 py-2.5">
              <span className="flex-1 text-sm font-semibold">@{f}</span>
              <button
                onClick={() => setFavs(favs.filter((x) => x !== f))}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MutedDetail() {
  const [muted, setMuted] = useLocalSetting<string[]>("muted", []);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex gap-2 px-2 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mute a username"
          className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={() => {
            const v = draft.trim().replace(/^@/, "");
            if (v && !muted.includes(v)) setMuted([...muted, v]);
            setDraft("");
          }}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground"
        >
          Mute
        </button>
      </div>
      {muted.length === 0 ? (
        <Empty title="Nothing muted" desc="You won't see their posts or stories." />
      ) : (
        <ul className="divide-y divide-border">
          {muted.map((m) => (
            <li key={m} className="flex items-center gap-3 px-2 py-2.5">
              <span className="flex-1 text-sm font-semibold">@{m}</span>
              <button
                onClick={() => setMuted(muted.filter((x) => x !== m))}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Unmute
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MutedCreatorsDetail({ userId }: { userId: string | null }) {
  const { muted, mutedNames, unmuteAuthor } = useFeedPrefs(userId);
  const [, force] = useState(0);
  if (muted.length === 0) {
    return (
      <Empty
        title="Nobody muted"
        desc="Muted creators disappear from your feed — but their profiles still open, and unmuting brings them straight back."
      />
    );
  }
  return (
    <div>
      <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
        Muting only filters recommendations. Profiles stay visitable, and unmuting restores them
        fully.
      </p>
      <ul className="divide-y divide-border">
        {muted.map((id) => (
          <li key={id} className="flex items-center gap-3 px-2 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
              {(mutedNames[id] ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {mutedNames[id] ? `@${mutedNames[id]}` : id.slice(0, 8)}
            </span>
            <button
              onClick={() => {
                unmuteAuthor(id);
                force((n) => n + 1);
              }}
              className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              Unmute
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContentPrefsDetail() {
  const [topics, setTopics] = useLocalSetting<string[]>("topics", ["For You"]);
  const all = ["For You", "Music", "Comedy", "News", "Sports", "Food", "Travel"];
  const set = new Set(topics);
  return (
    <div className="flex flex-wrap gap-2 px-2 py-3">
      {all.map((t) => (
        <button
          key={t}
          onClick={() => setTopics(set.has(t) ? topics.filter((x) => x !== t) : [...topics, t])}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${set.has(t) ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function LikeCountsDetail() {
  const [hide, setHide] = useLocalSetting("hide-likes", false);
  return (
    <div>
      <Row
        title="Hide like and share counts"
        desc="You won't see totals on posts"
        control={<Toggle checked={hide} onChange={setHide} label="Hide counts" />}
      />
    </div>
  );
}

function PremiumDetail() {
  const [sub, setSub] = useLocalSetting("premium-sub", false);
  return (
    <div className="px-2 py-2">
      <p className="text-[15px] font-semibold text-foreground">
        {sub ? "You're on Premium" : "WIZZ Premium"}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ad-free feed, priority upload, exclusive filters.
      </p>
      <button
        onClick={() => setSub(!sub)}
        className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
      >
        {sub ? "Cancel subscription" : "Subscribe"}
      </button>
    </div>
  );
}

function VerifiedDetail() {
  const [req, setReq] = useLocalSetting("verified-req", false);
  return (
    <div className="px-2 py-2">
      <p className="text-[15px] font-semibold text-foreground">Get verified</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Prove you're a notable creator or brand.
      </p>
      <button
        onClick={() => setReq(!req)}
        className="mt-3 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold text-foreground"
      >
        {req ? "Request pending — withdraw" : "Request verification"}
      </button>
    </div>
  );
}

function HelpDetail() {
  return (
    <div>
      <Row title="Help centre" desc="Guides and troubleshooting" />
      <Row title="Report a problem" desc="Tell us what went wrong" />
      <Row title="Contact support" desc="support@wizz.app" />
    </div>
  );
}

function PrivacyCentreDetail() {
  return (
    <div>
      <Row title="Privacy policy" desc="How we handle your data" />
      <Row title="Terms of use" desc="The rules of WIZZ" />
      <Row title="Data download" desc="Request a copy of your data" />
    </div>
  );
}

function AccountStatusDetail({ userId }: { userId: string | null }) {
  const { data: stats } = useMyStats(userId);
  return (
    <div>
      <Row
        title="Account standing"
        desc="No violations — you're good to post"
        control={<Check className="size-5 text-brand" />}
      />
      <Row title="Posts" desc={`${stats?.posts ?? 0}`} />
      <Row title="Followers" desc={`${stats?.followers ?? 0}`} />
      <Row title="Following" desc={`${stats?.following ?? 0}`} />
    </div>
  );
}

function AboutDetail() {
  return (
    <div>
      <Row title="WIZZ" desc="Version 1.0.0 — Stories, trends and creators" />
      <Row title="Made with TanStack Start + Supabase" />
    </div>
  );
}
