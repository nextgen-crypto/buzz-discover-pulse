import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  AtSign,
  BadgeCheck,
  Bell,
  BellOff,
  Bookmark,
  ChevronRight,
  Clock,
  EyeOff,
  Film,
  Gem,
  Heart,
  Info,
  LifeBuoy,
  Lock,
  LogIn,
  LogOut,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Pencil,
  Repeat2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Palette,
  TrendingUp,
  User,
  UserPlus,
  Users,
  UserX,
  Wallet,
} from "lucide-react";
import { creators, news, trending, videos } from "@/backend/database/seed";
import { imageUrl } from "@/backend/domain/media";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { isAdminEmail } from "@/frontend/components/admin/admin";
import { EditProfileSheet } from "@/frontend/components/profile/EditProfileSheet";
import { PaymentSheet } from "@/frontend/components/profile/PaymentSheet";
import { SETTING_TITLES, SettingsDetail } from "@/frontend/components/settings/SettingsDetails";
import { useSession } from "@/frontend/hooks/useSession";
import { useConversations } from "@/frontend/hooks/useMessages";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useNotifications } from "@/frontend/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";

type SettingsRow = {
  id: string;
  label: string;
  hint?: string;
  value?: string;
  Icon: typeof Bell;
};

const settingsGroups: { title: string; rows: SettingsRow[] }[] = [
  {
    title: "Your account",
    rows: [
      {
        id: "edit-profile",
        label: "Edit profile",
        hint: "Name, photo, bio",
        Icon: Pencil,
      },
      {
        id: "appearance",
        label: "Appearance",
        hint: "Light, dark or system",
        Icon: Palette,
      },
      {
        id: "payments",
        label: "Payments",
        hint: "Tips, Premium, boosts",
        Icon: Wallet,
      },
      {
        id: "account-centre",
        label: "Account centre",
        hint: "Password, security, personal details",
        Icon: ShieldCheck,
      },
    ],
  },
  {
    title: "How you use WIZZ",
    rows: [
      { id: "saved", label: "Saved", Icon: Bookmark },
      { id: "archive", label: "Archive", Icon: Archive },
      { id: "activity", label: "Your activity", Icon: Activity },
      { id: "notifications", label: "Notifications", Icon: Bell },
      { id: "time-management", label: "Time management", Icon: Clock },
    ],
  },
  {
    title: "Who can see your content",
    rows: [
      { id: "privacy", label: "Account privacy", value: "Public", Icon: Lock },
      { id: "close-friends", label: "Close friends", value: "0", Icon: Star },
      { id: "blocked", label: "Blocked accounts", value: "0", Icon: UserX },
    ],
  },
  {
    title: "How others can interact with you",
    rows: [
      { id: "messages", label: "Messages and story replies", Icon: MessageCircle },
      { id: "tags", label: "Tags and mentions", Icon: AtSign },
      { id: "comments", label: "Comments", Icon: MessageSquare },
      { id: "sharing", label: "Sharing and reuse", Icon: Repeat2 },
      { id: "hidden-words", label: "Hidden words", Icon: EyeOff },
      { id: "invite", label: "Follow and invite friends", Icon: UserPlus },
    ],
  },
  {
    title: "What you see",
    rows: [
      { id: "favourites", label: "Favourites", value: "0", Icon: Star },
      { id: "muted", label: "Muted accounts", value: "0", Icon: BellOff },
      {
        id: "muted-creators",
        label: "Muted creators",
        hint: "Hidden from your feed",
        Icon: BellOff,
      },
      { id: "content-prefs", label: "Content preferences", Icon: SlidersHorizontal },
      { id: "like-counts", label: "Like and share counts", Icon: Heart },
    ],
  },
  {
    title: "Subscriptions",
    rows: [
      { id: "premium", label: "WIZZ Premium", value: "Not subscribed", Icon: Gem },
      { id: "verified", label: "Verified", value: "Not subscribed", Icon: BadgeCheck },
    ],
  },
  {
    title: "More info and support",
    rows: [
      { id: "help", label: "Help", Icon: LifeBuoy },
      { id: "privacy-centre", label: "Privacy centre", Icon: ShieldCheck },
      { id: "account-status", label: "Account status", Icon: User },
      { id: "about", label: "About", Icon: Info },
    ],
  },
];

const menuLinks = [
  { to: "/news", label: "News", Icon: Newspaper },
  { to: "/videos", label: "Videos", Icon: Film },
] as const;

function InboxIcon({ kind }: { kind: string }) {
  const cls = "size-4 shrink-0";
  if (kind === "follow") return <UserPlus className={`${cls} text-brand`} />;
  if (kind === "like" || kind === "comment_like") return <Heart className={`${cls} text-live`} />;
  if (kind === "blend_invite") return <Users className={`${cls} text-brand`} />;
  return <MessageCircle className={`${cls} text-foreground`} />;
}

function InboxRow({
  n,
  close,
  onRead,
  ago,
}: {
  n: import("@/frontend/hooks/useNotifications").AppNotification;
  close: () => void;
  onRead: () => void;
  ago: string;
}) {
  const body = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary">
        <InboxIcon kind={n.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug text-foreground">
          <span className="font-bold">@{n.actor_username}</span> {n.text}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{ago}</span>
      </span>
      {!n.is_read && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" />}
    </>
  );
  const cls = "flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary";
  if (n.kind === "follow") {
    return (
      <li>
        <Link
          to="/u/$username"
          params={{ username: n.actor_username }}
          onClick={() => {
            onRead();
            close();
          }}
          className={cls}
        >
          {body}
        </Link>
      </li>
    );
  }
  if (n.kind === "blend_invite") {
    return (
      <li>
        <Link
          to="/shorts"
          onClick={() => {
            onRead();
            close();
          }}
          className={cls}
        >
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button onClick={onRead} className={cls}>
        {body}
      </button>
    </li>
  );
}

function MessagePreviewList({
  userId,
  onOpen,
  onClose,
}: {
  userId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const { data: convos = [], isLoading } = useConversations(userId);
  const unread = convos.reduce((s, c) => s + c.unread, 0);
  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }
  if (convos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No conversations yet. Visit someone&apos;s profile and tap Message.
      </p>
    );
  }
  return (
    <>
      {unread > 0 && (
        <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">{unread} unread</p>
      )}
      <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
        {convos.slice(0, 8).map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onOpen(c.id)}
              className="flex w-full items-center gap-3 py-2.5 text-left"
            >
              {c.peer.avatar_url ? (
                <img
                  src={c.peer.avatar_url}
                  alt={c.peer.display_name}
                  className="size-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                  {c.peer.display_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.peer.display_name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.lastMessage}
                </span>
              </span>
              {c.unread > 0 && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                  {c.unread > 9 ? "9+" : c.unread}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <Link
        to="/messages"
        search={{}}
        onClick={onClose}
        className="mt-2 block rounded-full bg-secondary py-2.5 text-center text-sm font-semibold"
      >
        Open all messages
      </Link>
    </>
  );
}

function MessageBadge({ userId }: { userId: string | null }) {
  const { data: convos = [] } = useConversations(userId);
  const unread = convos.reduce((s, c) => s + c.unread, 0);
  if (unread === 0) return null;
  return (
    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">
      {unread > 9 ? "9+" : unread}
    </span>
  );
}

export function TopBar() {
  const [open, setOpen] = useState<null | "account" | "search" | "alerts" | "messages">(null);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpen("account");
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, []);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [recentTick, setRecentTick] = useState(0);
  const [settingsQuery, setSettingsQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const close = () => {
    setQuery("");
    setOpen(null);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  /** Edit profile + Payments open their own sheets instead of a detail page. */
  function openSetting(id: string) {
    if (id === "edit-profile") {
      setActiveSetting(null);
      setOpen(null);
      setEditingProfile(true);
      return;
    }
    if (id === "payments") {
      setActiveSetting(null);
      setOpen(null);
      setPayOpen(true);
      return;
    }
    setActiveSetting(id);
  }

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return { people: creators.slice(0, 4), topics: trending.slice(0, 6) };
    return {
      people: creators.filter(
        (c) => c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q),
      ),
      topics: trending.filter((t) => t.label.toLowerCase().includes(q)),
    };
  }, [debounced]);

  const searchText = debounced.trim();
  const { data: realPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["search-posts", searchText],
    enabled: open === "search" && searchText.length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<
      {
        id: string;
        caption: string;
        image_url: string | null;
        category: string;
        author_id: string;
        username: string;
      }[]
    > => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, image_url, category, author_id, profiles!inner(username)")
        .or(`caption.ilike.%${searchText}%,category.ilike.%${searchText}%`)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (
        (data ?? []) as {
          id: string;
          caption: string;
          image_url: string | null;
          category: string;
          author_id: string;
          profiles: { username: string } | null;
        }[]
      ).map((p) => ({
        id: p.id,
        caption: p.caption,
        image_url: p.image_url,
        category: p.category,
        author_id: p.author_id,
        username: p.profiles?.username ?? "?",
      }));
    },
  });

  const videoHits = useMemo(() => {
    const q = searchText.toLowerCase();
    if (q.length < 2) return [];
    return videos
      .filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 4);
  }, [searchText]);

  const storyHits = useMemo(() => {
    const q = searchText.toLowerCase();
    if (q.length < 2) return [];
    return news
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.sourceName.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 4);
  }, [searchText]);

  const RECENT_KEY = "wizz:recent-search";
  function loadRecent(): string[] {
    try {
      const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
      return Array.isArray(raw)
        ? raw.filter((x): x is string => typeof x === "string").slice(0, 8)
        : [];
    } catch {
      return [];
    }
  }
  function rememberRecent(term: string) {
    const clean = term.trim().slice(0, 60);
    if (clean.length < 2) return;
    try {
      const next = [
        clean,
        ...loadRecent().filter((x) => x.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setRecentTick((n) => n + 1);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recents = useMemo(loadRecent, [recentTick, open]);
  const { data: realPeople = [] } = useQuery({
    queryKey: ["search-profiles", searchText],
    enabled: open === "search" && searchText.length >= 2,
    staleTime: 30_000,
    queryFn: async (): Promise<
      { id: string; username: string; display_name: string; avatar_url: string | null }[]
    > => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchText}%,display_name.ilike.%${searchText}%`)
        .limit(8);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
      }[];
    },
  });

  const people = useMemo(() => {
    const seen = new Set(results.people.map((c) => c.username.toLowerCase()));
    const real = realPeople
      .filter((p) => !seen.has(p.username.toLowerCase()))
      .map((p) => ({
        id: `real-${p.id}`,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
      }));
    return [
      ...results.people.map((c) => ({
        id: c.id,
        username: c.username,
        displayName: c.displayName,
        avatarUrl: imageUrl(c.avatarKey, "thumbnail"),
      })),
      ...real,
    ];
  }, [results.people, realPeople]);

  const { session, user, displayName, email, avatarUrl } = useSession();
  const {
    items: inbox,
    unread: inboxUnread,
    markAllRead,
    markOneRead,
    timeAgo: inboxAgo,
  } = useNotifications(user?.id ?? null);
  const { data: myProfile } = useMyProfile(user?.id ?? null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const accountName = myProfile?.display_name ?? displayName ?? "Your account";
  const accountHandle = myProfile?.username ?? email?.split("@")[0] ?? "you";
  const accountAvatar = myProfile?.avatar_url ?? avatarUrl;

  async function signOut() {
    close();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/welcome", replace: true });
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-safe backdrop-blur">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5">
          <Link
            to="/"
            aria-label="WIZZ home"
            className="min-w-0 truncate text-xl font-black text-title"
          >
            WIZZ
          </Link>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              aria-label="Search"
              onClick={() => setOpen("search")}
              className="rounded-full p-2 hover:bg-secondary"
            >
              <Search className="size-5 text-foreground" />
            </button>
            <button
              aria-label="Notifications"
              onClick={() => setOpen("alerts")}
              className="relative rounded-full p-2 hover:bg-secondary"
            >
              <Bell className="size-5 text-foreground" />
              {inboxUnread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-live text-[9px] font-bold text-white">
                  {inboxUnread > 9 ? "9+" : inboxUnread}
                </span>
              )}
            </button>
            <button
              aria-label="Messages"
              onClick={() => setOpen("messages")}
              className="relative rounded-full p-2 hover:bg-secondary"
            >
              <MessageCircle className="size-5 text-foreground" />
              <MessageBadge userId={user?.id ?? null} />
            </button>
            {session ? (
              <button onClick={() => setOpen("account")} aria-label="Your account" className="ml-1">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName ?? "Your account"}
                    className="size-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                    {(displayName ?? "B").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <Link
                to="/auth"
                className="ml-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <Sheet open={open === "account"} onClose={close} title="Account & settings">
        <div className="flex max-h-[72dvh] flex-col overflow-y-auto">
          {session ? (
            <Link
              to="/profile"
              onClick={close}
              className="flex items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5"
            >
              {accountAvatar ? (
                <img
                  src={accountAvatar}
                  alt={accountName}
                  className="size-10 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                  {accountName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">
                  {accountName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{accountHandle}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            <div className="rounded-2xl bg-secondary px-3 py-2.5">
              <p className="text-[15px] font-semibold text-foreground">Welcome to WIZZ</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sign in to see your profile, saves and followers.
              </p>
            </div>
          )}

          <nav className="mt-3 flex flex-col gap-0.5 border-t border-border pt-3">
            {menuLinks.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
              >
                <Icon className="size-5 shrink-0 text-foreground" />
                <span className="block text-[15px] font-semibold leading-tight text-foreground">
                  {label}
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            <button
              onClick={() => openSetting("saved")}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
            >
              <Bookmark className="size-5 shrink-0 text-foreground" />
              <span className="block text-[15px] font-semibold leading-tight text-foreground">
                Saved
              </span>
              <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </button>
          </nav>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={settingsQuery}
                onChange={(e) => setSettingsQuery(e.target.value)}
                placeholder="Search settings"
                aria-label="Search settings"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {settingsGroups
            .map((group) => ({
              ...group,
              rows: group.rows.filter((r) =>
                r.label.toLowerCase().includes(settingsQuery.trim().toLowerCase()),
              ),
            }))
            .filter((group) => group.rows.length > 0)
            .map((group) => (
              <section key={group.title} className="mt-4 border-t border-border pt-3">
                <p className="pb-1 text-sm font-semibold text-muted-foreground">{group.title}</p>
                {group.rows.map(({ id, label, hint, value, Icon }) => (
                  <button
                    key={id}
                    onClick={() => openSetting(id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                  >
                    <Icon className="size-5 shrink-0 text-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-tight text-foreground">
                        {label}
                      </span>
                      {hint && (
                        <span className="block text-xs leading-snug text-muted-foreground">
                          {hint}
                        </span>
                      )}
                    </span>
                    {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </section>
            ))}

          <div className="mt-4 flex flex-col gap-0.5 border-t border-border pb-2 pt-3">
            <p className="pb-1 text-sm font-semibold text-muted-foreground">Login</p>
            {session ? (
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
              >
                <LogOut className="size-5 shrink-0 text-live" />
                <span className="block text-[15px] font-semibold leading-tight text-live">
                  Log out @{accountHandle}
                </span>
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={close}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <LogIn className="size-5 shrink-0 text-brand" />
                  <span className="block text-[15px] font-semibold leading-tight text-foreground">
                    Sign in or sign up
                  </span>
                  <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </Link>
                <Link
                  to="/welcome"
                  onClick={close}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                >
                  <Sparkles className="size-5 shrink-0 text-foreground" />
                  <span className="block text-[15px] font-semibold leading-tight text-foreground">
                    Take the tour
                  </span>
                  <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </Link>
              </>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet
        open={activeSetting !== null}
        onClose={() => setActiveSetting(null)}
        title={activeSetting ? (SETTING_TITLES[activeSetting] ?? "Settings") : "Settings"}
      >
        <div className="pb-4">
          <button
            onClick={() => setActiveSetting(null)}
            className="mb-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-foreground"
          >
            ← All settings
          </button>
          {activeSetting && <SettingsDetail id={activeSetting} userId={user?.id ?? null} />}
          {activeSetting === "account-status" && isAdminEmail(email) && (
            <Link
              to="/admin"
              onClick={() => {
                setActiveSetting(null);
                setOpen(null);
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-xl bg-brand-soft px-3 py-2.5 text-left"
            >
              <ShieldCheck className="size-5 shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-tight text-foreground">
                  Admin dashboard
                </span>
                <span className="block text-xs text-muted-foreground">
                  Metrics, creators, live activity
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </div>
      </Sheet>

      {user && (
        <EditProfileSheet
          open={editingProfile}
          onClose={() => setEditingProfile(false)}
          userId={user.id}
          profile={myProfile ?? null}
          fallbackName={displayName}
        />
      )}
      <PaymentSheet open={payOpen} onClose={() => setPayOpen(false)} />

      <Sheet open={open === "search"} onClose={close} title="Search" side="top">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") rememberRecent(query);
          }}
          placeholder="Search people, posts, videos, stories"
          className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
        />
        <div className="max-h-[55dvh] overflow-y-auto pt-3">
          {!searchText && (
            <>
              {recents.length > 0 && (
                <div className="pb-3">
                  <div className="flex items-center justify-between pb-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Recent
                    </p>
                    <button
                      onClick={() => {
                        try {
                          localStorage.removeItem(RECENT_KEY);
                        } catch {
                          // ignore
                        }
                        setRecentTick((n) => n + 1);
                      }}
                      className="text-xs font-semibold text-brand"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((r) => (
                      <button
                        key={r}
                        onClick={() => setQuery(r)}
                        className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                      >
                        <Clock className="size-3 text-muted-foreground" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.topics.length > 0 && (
                <div>
                  <p className="pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Trending now
                  </p>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {results.topics.map((t) => (
                      <Link
                        key={t.id}
                        to="/news"
                        onClick={close}
                        className="press flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
                      >
                        <TrendingUp className="size-3" />
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <p className="pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Suggested people
              </p>
            </>
          )}

          {searchText.length >= 2 && postsLoading && (
            <div className="space-y-2 py-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          )}

          {people.length > 0 && (
            <>
              <p className="pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                People
              </p>
              <ul className="divide-y divide-border">
                {people.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/u/$username"
                      params={{ username: c.username }}
                      onClick={() => {
                        rememberRecent(c.username);
                        close();
                      }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.displayName}
                          className="size-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                          {c.displayName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {c.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {realPosts.length > 0 && (
            <>
              <p className="pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Posts
              </p>
              <ul className="divide-y divide-border">
                {realPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/u/$username"
                      params={{ username: p.username }}
                      onClick={() => {
                        rememberRecent(p.caption.slice(0, 40) || p.category);
                        close();
                      }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="size-11 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary px-1 text-center text-[10px] text-muted-foreground">
                          {p.category}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.caption || "Photo post"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{p.username} · {p.category}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {videoHits.length > 0 && (
            <>
              <p className="pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Videos
              </p>
              <ul className="divide-y divide-border">
                {videoHits.map((v) => (
                  <li key={v.id}>
                    <Link
                      to="/watch/$videoId"
                      params={{ videoId: v.id }}
                      onClick={() => {
                        rememberRecent(v.title.slice(0, 40));
                        close();
                      }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
                        <Film className="size-4 text-brand" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{v.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{v.category}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {storyHits.length > 0 && (
            <>
              <p className="pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stories
              </p>
              <ul className="divide-y divide-border">
                {storyHits.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/news/$articleId"
                      params={{ articleId: a.id }}
                      onClick={() => {
                        rememberRecent(a.title.slice(0, 40));
                        close();
                      }}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
                        <Newspaper className="size-4 text-brand" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.sourceName} · {a.category}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {searchText.length >= 2 &&
            !postsLoading &&
            people.length === 0 &&
            realPosts.length === 0 &&
            videoHits.length === 0 &&
            storyHits.length === 0 &&
            results.topics.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matches for “{searchText}”.
              </p>
            )}
        </div>
      </Sheet>

      <Sheet open={open === "alerts"} onClose={close} title="Notifications">
        {!session ? (
          <div className="px-2 py-8 text-center">
            <p className="text-[15px] font-semibold text-foreground">
              Sign in to see notifications
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Likes, follows, comments and Blend invites land here.
            </p>
            <Link
              to="/auth"
              onClick={close}
              className="mt-4 block rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-xs text-muted-foreground">
                {inboxUnread > 0 ? `${inboxUnread} unread` : "You're all caught up"}
              </p>
              {inboxUnread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  Mark all read
                </button>
              )}
            </div>
            {inbox.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet — likes, follows and comments show up here.
              </p>
            ) : (
              <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
                {inbox.map((n) => (
                  <InboxRow
                    key={n.id}
                    n={n}
                    close={close}
                    onRead={() => markOneRead(n.id)}
                    ago={inboxAgo(n.created_at)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Sheet>

      <Sheet open={open === "messages"} onClose={close} title="Messages">
        {!session ? (
          <div className="px-2 py-8 text-center">
            <p className="text-[15px] font-semibold">Sign in to message</p>
            <p className="mt-1 text-xs text-muted-foreground">Your conversations live here.</p>
            <Link
              to="/auth"
              onClick={close}
              className="mt-4 block rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <MessagePreviewList
            userId={user?.id ?? null}
            onOpen={(id) => {
              close();
              void navigate({ to: "/messages", search: { c: id } });
            }}
            onClose={close}
          />
        )}
      </Sheet>
    </>
  );
}
