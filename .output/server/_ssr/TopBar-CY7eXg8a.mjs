import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react, i as useQuery, o as useQueryClient, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { _ as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as MessageSquare, I as LifeBuoy, K as Film, L as Info, M as LogIn, N as Lock, O as MessageCircle, Q as ChevronRight, V as Heart, W as Gem, Z as Clock, at as AtSign, c as UserPlus, ct as Archive, f as Sparkles, g as Settings, it as BadgeCheck, j as LogOut, l as TrendingUp, lt as Activity, m as ShieldCheck, nt as Bell, o as User, p as SlidersHorizontal, q as EyeOff, rt as BellOff, s as UserX, tt as Bookmark, u as Star, v as Search, w as Newspaper, y as Repeat2 } from "../_libs/lucide-react.mjs";
import { n as creators, o as notifications, u as trending } from "./seed-oF1kQ_Ut.mjs";
import { n as imageUrl } from "./media-szkvQkos.mjs";
import { n as Sheet } from "./BottomNav-CKjeo2P-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/TopBar-CY7eXg8a.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** The signed-in user's editable profile row; null while signed out. */
function useMyProfile(userId) {
	return useQuery({
		queryKey: ["my-profile", userId],
		enabled: Boolean(userId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!userId) return null;
			const { data, error } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url, verified").eq("id", userId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
}
/** Real posts authored by the signed-in user. */
function useMyPosts(userId) {
	return useQuery({
		queryKey: ["my-posts", userId],
		enabled: Boolean(userId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!userId) return [];
			const { data, error } = await supabase.from("posts").select("id, caption, image_url, created_at").eq("author_id", userId).order("created_at", { ascending: false });
			if (error) throw error;
			return data ?? [];
		}
	});
}
/** Real post / follower / following counts for the signed-in user. */
function useMyStats(userId) {
	return useQuery({
		queryKey: ["my-stats", userId],
		enabled: Boolean(userId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!userId) return {
				posts: 0,
				followers: 0,
				following: 0
			};
			const [posts, followers, following] = await Promise.all([
				supabase.from("posts").select("id", {
					count: "exact",
					head: true
				}).eq("author_id", userId),
				supabase.from("follows").select("follower_id", {
					count: "exact",
					head: true
				}).eq("followee_id", userId),
				supabase.from("follows").select("followee_id", {
					count: "exact",
					head: true
				}).eq("follower_id", userId)
			]);
			return {
				posts: posts.count ?? 0,
				followers: followers.count ?? 0,
				following: following.count ?? 0
			};
		}
	});
}
var compactCount = new Intl.NumberFormat("en", { notation: "compact" });
var settingsGroups = [
	{
		title: "Your account",
		rows: [{
			label: "Account centre",
			hint: "Password, security, personal details",
			Icon: ShieldCheck
		}]
	},
	{
		title: "How you use WIZZ",
		rows: [
			{
				label: "Saved",
				Icon: Bookmark
			},
			{
				label: "Archive",
				Icon: Archive
			},
			{
				label: "Your activity",
				Icon: Activity
			},
			{
				label: "Notifications",
				Icon: Bell
			},
			{
				label: "Time management",
				Icon: Clock
			}
		]
	},
	{
		title: "Who can see your content",
		rows: [
			{
				label: "Account privacy",
				value: "Public",
				Icon: Lock
			},
			{
				label: "Close friends",
				value: "0",
				Icon: Star
			},
			{
				label: "Blocked accounts",
				value: "0",
				Icon: UserX
			}
		]
	},
	{
		title: "How others can interact with you",
		rows: [
			{
				label: "Messages and story replies",
				Icon: MessageCircle
			},
			{
				label: "Tags and mentions",
				Icon: AtSign
			},
			{
				label: "Comments",
				Icon: MessageSquare
			},
			{
				label: "Sharing and reuse",
				Icon: Repeat2
			},
			{
				label: "Hidden words",
				Icon: EyeOff
			},
			{
				label: "Follow and invite friends",
				Icon: UserPlus
			}
		]
	},
	{
		title: "What you see",
		rows: [
			{
				label: "Favourites",
				value: "0",
				Icon: Star
			},
			{
				label: "Muted accounts",
				value: "0",
				Icon: BellOff
			},
			{
				label: "Content preferences",
				Icon: SlidersHorizontal
			},
			{
				label: "Like and share counts",
				Icon: Heart
			}
		]
	},
	{
		title: "Subscriptions",
		rows: [{
			label: "WIZZ Premium",
			value: "Not subscribed",
			Icon: Gem
		}, {
			label: "Verified",
			value: "Not subscribed",
			Icon: BadgeCheck
		}]
	},
	{
		title: "More info and support",
		rows: [
			{
				label: "Help",
				Icon: LifeBuoy
			},
			{
				label: "Privacy centre",
				Icon: ShieldCheck
			},
			{
				label: "Account status",
				Icon: User
			},
			{
				label: "About",
				Icon: Info
			}
		]
	}
];
var menuLinks = [
	{
		to: "/profile",
		label: "Your profile",
		Icon: User
	},
	{
		to: "/news",
		label: "News",
		Icon: Newspaper
	},
	{
		to: "/videos",
		label: "Videos",
		Icon: Film
	}
];
function TopBar() {
	const [open, setOpen] = (0, import_react.useState)(null);
	const [theme, setTheme] = (0, import_react.useState)("system");
	function applyTheme(next) {
		setTheme(next);
		if (typeof document === "undefined") return;
		const prefersDark = next === "dark" || next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
		document.documentElement.classList.toggle("dark", prefersDark);
	}
	const [query, setQuery] = (0, import_react.useState)("");
	const [settingsQuery, setSettingsQuery] = (0, import_react.useState)("");
	const close = () => setOpen(null);
	const results = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return {
			people: creators.slice(0, 4),
			topics: trending.slice(0, 6)
		};
		return {
			people: creators.filter((c) => c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)),
			topics: trending.filter((t) => t.label.toLowerCase().includes(q))
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
		navigate({
			to: "/welcome",
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-30 border-b border-border bg-background/90 pt-safe backdrop-blur",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					"aria-label": "WIZZ home",
					className: "min-w-0 truncate text-xl font-black text-title",
					children: "WIZZ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center gap-0.5 sm:gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Search",
							onClick: () => setOpen("search"),
							className: "rounded-full p-2 hover:bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-5 text-foreground" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							"aria-label": "Notifications",
							onClick: () => setOpen("alerts"),
							className: "relative rounded-full p-2 hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5 text-foreground" }), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 size-2 rounded-full bg-live" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Messages",
							onClick: () => setOpen("messages"),
							className: "rounded-full p-2 hover:bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-5 text-foreground" })
						}),
						session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOpen("account"),
							"aria-label": "Your account",
							className: "ml-1",
							children: avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatarUrl,
								alt: displayName ?? "Your account",
								className: "size-8 rounded-full border border-border object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-8 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground",
								children: (displayName ?? "B").slice(0, 1).toUpperCase()
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							className: "ml-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground",
							children: "Sign in"
						})
					]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: open === "account",
			onClose: close,
			title: "Account & settings",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex max-h-[72dvh] flex-col overflow-y-auto",
				children: [
					session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3 px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/profile",
							onClick: close,
							className: "min-w-0",
							children: [
								accountAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: accountAvatar,
									alt: accountName,
									className: "size-12 rounded-full border border-border object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-12 place-items-center rounded-full bg-brand text-base font-bold text-brand-foreground",
									children: accountName.slice(0, 1).toUpperCase()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 truncate text-base font-bold text-foreground",
									children: accountName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-sm text-muted-foreground",
									children: ["@", accountHandle]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOpen("settings"),
							"aria-label": "Settings",
							className: "grid size-9 shrink-0 place-items-center rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4 text-foreground" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-5 px-1 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$username/following",
							params: { username: accountHandle },
							onClick: close,
							className: "text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-foreground",
									children: compactCount.format(myStats?.following ?? 0)
								}),
								" ",
								"Following"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/u/$username/followers",
							params: { username: accountHandle },
							onClick: close,
							className: "text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-foreground",
									children: compactCount.format(myStats?.followers ?? 0)
								}),
								" ",
								"Followers"
							]
						})]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-base font-bold text-foreground",
							children: "Welcome to WIZZ"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Sign in to see your profile, saves and followers."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "mt-4 flex flex-col gap-0.5 border-t border-border pt-3",
						children: [menuLinks.map(({ to, label, Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to,
							onClick: close,
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-base font-semibold text-foreground hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5.5 text-foreground" }), label]
						}, to)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/profile",
							onClick: close,
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-base font-semibold text-foreground hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-5.5 text-foreground" }), "Saved"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-0.5 border-t border-border pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setOpen("settings"),
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-left text-sm font-semibold text-foreground hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5 text-muted-foreground" }), "Settings and privacy"]
						}), session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: signOut,
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-left text-sm font-semibold text-foreground hover:bg-secondary",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-5 text-muted-foreground" }),
								"Log out @",
								accountHandle
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/auth",
							onClick: close,
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-sm font-semibold text-foreground hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "size-5 text-brand" }), "Sign in or sign up"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/welcome",
							onClick: close,
							className: "flex items-center gap-4 rounded-xl px-2 py-3 text-sm font-semibold text-foreground hover:bg-secondary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5 text-muted-foreground" }), "Take the tour"]
						})] })]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: open === "settings",
			onClose: close,
			title: "Settings and activity",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: settingsQuery,
							onChange: (e) => setSettingsQuery(e.target.value),
							placeholder: "Search",
							className: "w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
						})]
					}),
					!settingsQuery.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pb-2 text-sm font-semibold text-muted-foreground",
							children: "Appearance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								"light",
								"dark",
								"system"
							].map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => applyTheme(option),
								className: `rounded-2xl px-3 py-3 text-sm font-semibold capitalize ${theme === option ? "bg-brand text-brand-foreground" : "bg-secondary text-foreground"}`,
								children: option
							}, option))
						})]
					}),
					settingsGroups.map((group) => ({
						...group,
						rows: group.rows.filter((r) => r.label.toLowerCase().includes(settingsQuery.trim().toLowerCase()))
					})).filter((group) => group.rows.length > 0).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-5 border-t border-border pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pb-1 text-sm font-semibold text-muted-foreground",
							children: group.title
						}), group.rows.map(({ label, hint, value, Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex w-full items-center gap-4 rounded-xl px-1 py-3 text-left hover:bg-secondary",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 shrink-0 text-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[15px] font-medium text-foreground",
										children: label
									}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs leading-snug text-muted-foreground",
										children: hint
									})]
								}),
								value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted-foreground",
									children: value
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 shrink-0 text-muted-foreground" })
							]
						}, label))]
					}, group.title)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-5 border-t border-border pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "pb-1 text-sm font-semibold text-muted-foreground",
								children: "Login"
							}),
							session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: signOut,
								className: "w-full rounded-xl px-1 py-3 text-left text-[15px] font-semibold text-live hover:bg-secondary",
								children: "Log out"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/auth",
								onClick: close,
								className: "block rounded-xl px-1 py-3 text-[15px] font-semibold text-brand hover:bg-secondary",
								children: "Log in or add profile"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setOpen("account"),
								className: "mt-3 w-full rounded-full bg-secondary py-3 text-sm font-semibold text-foreground",
								children: "Back to account"
							})
						]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
			open: open === "search",
			onClose: close,
			title: "Search",
			side: "top",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Search creators and topics",
				className: "w-full rounded-full border border-border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-[55dvh] overflow-y-auto pt-3",
				children: [
					results.topics.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2 pb-3",
						children: results.topics.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3" }), t.label]
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border",
						children: results.people.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: imageUrl(c.avatarKey, "thumbnail"),
								alt: c.displayName,
								className: "size-9 rounded-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold text-foreground",
									children: c.displayName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-muted-foreground",
									children: ["@", c.username]
								})]
							})]
						}, c.id))
					}),
					results.people.length === 0 && results.topics.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "py-6 text-center text-sm text-muted-foreground",
						children: [
							"No matches for “",
							query,
							"”."
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: open === "alerts",
			onClose: close,
			title: "Notifications",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-[60dvh] divide-y divide-border overflow-y-auto",
				children: notifications.map((n) => {
					const actor = byId.get(n.actorId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-3 py-3",
						children: [
							actor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: imageUrl(actor.avatarKey, "thumbnail"),
								alt: actor.displayName,
								className: "size-9 shrink-0 rounded-full object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm leading-snug text-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: actor?.displayName
									}),
									" ",
									n.body
								]
							}),
							!n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 size-2 shrink-0 rounded-full bg-brand" })
						]
					}, n.id);
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: open === "messages",
			onClose: close,
			title: "Messages",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-[60dvh] divide-y divide-border overflow-y-auto",
				children: creators.slice(0, 5).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: imageUrl(c.avatarKey, "thumbnail"),
							alt: c.displayName,
							className: "size-10 rounded-full object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-semibold text-foreground",
								children: c.displayName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs text-muted-foreground",
								children: i % 2 === 0 ? "Sent you a photo" : "See you at the shoot tomorrow"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-muted-foreground",
							children: [i + 1, "h"]
						})
					]
				}, c.id))
			})
		})
	] });
}
//#endregion
export { useMyStats as i, useMyPosts as n, useMyProfile as r, TopBar as t };
