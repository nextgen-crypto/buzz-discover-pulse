import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
  Repeat2,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  User,
  UserPlus,
  UserX,
} from "lucide-react";
import { creators, notifications, trending } from "@/backend/database/seed";
import { imageUrl } from "@/backend/domain/media";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { useSession } from "@/frontend/hooks/useSession";
import { useMyProfile } from "@/frontend/hooks/useMyProfile";
import { useMyStats } from "@/frontend/hooks/useMyProfileData";
import { supabase } from "@/integrations/supabase/client";

const compactCount = new Intl.NumberFormat("en", { notation: "compact" });

type SettingsRow = {
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
        label: "Account centre",
        hint: "Password, security, personal details",
        Icon: ShieldCheck,
      },
    ],
  },
  {
    title: "How you use WIZZ",
    rows: [
      { label: "Saved", Icon: Bookmark },
      { label: "Archive", Icon: Archive },
      { label: "Your activity", Icon: Activity },
      { label: "Notifications", Icon: Bell },
      { label: "Time management", Icon: Clock },
    ],
  },
  {
    title: "Who can see your content",
    rows: [
      { label: "Account privacy", value: "Public", Icon: Lock },
      { label: "Close friends", value: "0", Icon: Star },
      { label: "Blocked accounts", value: "0", Icon: UserX },
    ],
  },
  {
    title: "How others can interact with you",
    rows: [
      { label: "Messages and story replies", Icon: MessageCircle },
      { label: "Tags and mentions", Icon: AtSign },
      { label: "Comments", Icon: MessageSquare },
      { label: "Sharing and reuse", Icon: Repeat2 },
      { label: "Hidden words", Icon: EyeOff },
      { label: "Follow and invite friends", Icon: UserPlus },
    ],
  },
  {
    title: "What you see",
    rows: [
      { label: "Favourites", value: "0", Icon: Star },
      { label: "Muted accounts", value: "0", Icon: BellOff },
      { label: "Content preferences", Icon: SlidersHorizontal },
      { label: "Like and share counts", Icon: Heart },
    ],
  },
  {
    title: "Subscriptions",
    rows: [
      { label: "WIZZ Premium", value: "Not subscribed", Icon: Gem },
      { label: "Verified", value: "Not subscribed", Icon: BadgeCheck },
    ],
  },
  {
    title: "More info and support",
    rows: [
      { label: "Help", Icon: LifeBuoy },
      { label: "Privacy centre", Icon: ShieldCheck },
      { label: "Account status", Icon: User },
      { label: "About", Icon: Info },
    ],
  },
];

const menuLinks = [
  { to: "/profile", label: "Your profile", Icon: User },
  { to: "/news", label: "News", Icon: Newspaper },
  { to: "/videos", label: "Videos", Icon: Film },
] as const;

export function TopBar() {
  const [open, setOpen] = useState<
    null | "account" | "search" | "alerts" | "messages" | "settings"
  >(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  function applyTheme(next: "light" | "dark" | "system") {
    setTheme(next);
    if (typeof document === "undefined") return;
    const prefersDark =
      next === "dark" ||
      (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", prefersDark);
  }
  const [query, setQuery] = useState("");
  const [settingsQuery, setSettingsQuery] = useState("");
  const close = () => setOpen(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { people: creators.slice(0, 4), topics: trending.slice(0, 6) };
    return {
      people: creators.filter(
        (c) => c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q),
      ),
      topics: trending.filter((t) => t.label.toLowerCase().includes(q)),
    };
  }, [query]);

  const unread = notifications.filter((n) => !n.read).length;
  const byId = new Map(creators.map((c) => [c.id, c]));

  const { session, user, displayName, email, avatarUrl } = useSession();
  const { data: myProfile } = useMyProfile(user?.id ?? null);
  const { data: myStats } = useMyStats(user?.id ?? null);
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
          <Link to="/" aria-label="WIZZ home" className="min-w-0 truncate text-xl font-black text-title">
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
              {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-live" />}
            </button>
            <button
              aria-label="Messages"
              onClick={() => setOpen("messages")}
              className="rounded-full p-2 hover:bg-secondary"
            >
              <MessageCircle className="size-5 text-foreground" />
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
            <>
              <div className="flex items-start justify-between gap-3 px-1">
                <Link to="/profile" onClick={close} className="min-w-0">
                  {accountAvatar ? (
                    <img
                      src={accountAvatar}
                      alt={accountName}
                      className="size-12 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-full bg-brand text-base font-bold text-brand-foreground">
                      {accountName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <p className="mt-2 truncate text-base font-bold text-foreground">{accountName}</p>
                  <p className="truncate text-sm text-muted-foreground">@{accountHandle}</p>
                </Link>
                <button
                  onClick={() => setOpen("settings")}
                  aria-label="Settings"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
                >
                  <Settings className="size-4 text-foreground" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-5 px-1 text-sm">
                <Link
                  to="/u/$username/following"
                  params={{ username: accountHandle }}
                  onClick={close}
                  className="text-muted-foreground"
                >
                  <span className="font-bold text-foreground">
                    {compactCount.format(myStats?.following ?? 0)}
                  </span>{" "}
                  Following
                </Link>
                <Link
                  to="/u/$username/followers"
                  params={{ username: accountHandle }}
                  onClick={close}
                  className="text-muted-foreground"
                >
                  <span className="font-bold text-foreground">
                    {compactCount.format(myStats?.followers ?? 0)}
                  </span>{" "}
                  Followers
                </Link>
              </div>
            </>
          ) : (
            <div className="px-1">
              <p className="text-base font-bold text-foreground">Welcome to WIZZ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to see your profile, saves and followers.
              </p>
            </div>
          )}

          <nav className="mt-4 flex flex-col gap-0.5 border-t border-border pt-3">
            {menuLinks.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className="flex items-center gap-4 rounded-xl px-2 py-3 text-base font-semibold text-foreground hover:bg-secondary"
              >
                <Icon className="size-5.5 text-foreground" />
                {label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={close}
              className="flex items-center gap-4 rounded-xl px-2 py-3 text-base font-semibold text-foreground hover:bg-secondary"
            >
              <Bookmark className="size-5.5 text-foreground" />
              Saved
            </Link>
          </nav>

          <div className="mt-3 flex flex-col gap-0.5 border-t border-border pt-3">
            <button
              onClick={() => setOpen("settings")}
              className="flex items-center gap-4 rounded-xl px-2 py-3 text-left text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <Settings className="size-5 text-muted-foreground" />
              Settings and privacy
            </button>
            {session ? (
              <button
                onClick={signOut}
                className="flex items-center gap-4 rounded-xl px-2 py-3 text-left text-sm font-semibold text-foreground hover:bg-secondary"
              >
                <LogOut className="size-5 text-muted-foreground" />
                Log out @{accountHandle}
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={close}
                  className="flex items-center gap-4 rounded-xl px-2 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  <LogIn className="size-5 text-brand" />
                  Sign in or sign up
                </Link>
                <Link
                  to="/welcome"
                  onClick={close}
                  className="flex items-center gap-4 rounded-xl px-2 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  <Sparkles className="size-5 text-muted-foreground" />
                  Take the tour
                </Link>
              </>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet open={open === "settings"} onClose={close} title="Settings and activity">
        <div className="pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={settingsQuery}
              onChange={(e) => setSettingsQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {!settingsQuery.trim() && (
            <div className="mt-5">
              <p className="pb-2 text-sm font-semibold text-muted-foreground">Appearance</p>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => applyTheme(option)}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold capitalize ${
                      theme === option
                        ? "bg-brand text-brand-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {settingsGroups
            .map((group) => ({
              ...group,
              rows: group.rows.filter((r) =>
                r.label.toLowerCase().includes(settingsQuery.trim().toLowerCase()),
              ),
            }))
            .filter((group) => group.rows.length > 0)
            .map((group) => (
              <section key={group.title} className="mt-5 border-t border-border pt-4">
                <p className="pb-1 text-sm font-semibold text-muted-foreground">{group.title}</p>
                {group.rows.map(({ label, hint, value, Icon }) => (
                  <button
                    key={label}
                    className="flex w-full items-center gap-4 rounded-xl px-1 py-3 text-left hover:bg-secondary"
                  >
                    <Icon className="size-5 shrink-0 text-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-foreground">{label}</span>
                      {hint && (
                        <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
                      )}
                    </span>
                    {value && <span className="text-sm text-muted-foreground">{value}</span>}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </section>
            ))}

          <section className="mt-5 border-t border-border pt-4">
            <p className="pb-1 text-sm font-semibold text-muted-foreground">Login</p>
            {session ? (
              <button
                onClick={signOut}
                className="w-full rounded-xl px-1 py-3 text-left text-[15px] font-semibold text-live hover:bg-secondary"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={close}
                className="block rounded-xl px-1 py-3 text-[15px] font-semibold text-brand hover:bg-secondary"
              >
                Log in or add profile
              </Link>
            )}
            <button
              onClick={() => setOpen("account")}
              className="mt-3 w-full rounded-full bg-secondary py-3 text-sm font-semibold text-foreground"
            >
              Back to account
            </button>
          </section>
        </div>
      </Sheet>

      <Sheet open={open === "search"} onClose={close} title="Search" side="top">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators and topics"
          className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
        />
        <div className="max-h-[55dvh] overflow-y-auto pt-3">
          {results.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3">
              {results.topics.map((t) => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
                >
                  <TrendingUp className="size-3" />
                  {t.label}
                </span>
              ))}
            </div>
          )}
          <ul className="divide-y divide-border">
            {results.people.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <img
                  src={imageUrl(c.avatarKey, "thumbnail")}
                  alt={c.displayName}
                  className="size-9 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                </div>
              </li>
            ))}
          </ul>
          {results.people.length === 0 && results.topics.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No matches for “{query}”.</p>
          )}
        </div>
      </Sheet>

      <Sheet open={open === "alerts"} onClose={close} title="Notifications">
        <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
          {notifications.map((n) => {
            const actor = byId.get(n.actorId);
            return (
              <li key={n.id} className="flex items-start gap-3 py-3">
                {actor && (
                  <img
                    src={imageUrl(actor.avatarKey, "thumbnail")}
                    alt={actor.displayName}
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                )}
                <p className="text-sm leading-snug text-foreground">
                  <span className="font-semibold">{actor?.displayName}</span> {n.body}
                </p>
                {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
              </li>
            );
          })}
        </ul>
      </Sheet>

      <Sheet open={open === "messages"} onClose={close} title="Messages">
        <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
          {creators.slice(0, 5).map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <img
                src={imageUrl(c.avatarKey, "thumbnail")}
                alt={c.displayName}
                className="size-10 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{c.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {i % 2 === 0 ? "Sent you a photo" : "See you at the shoot tomorrow"}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground">{i + 1}h</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
