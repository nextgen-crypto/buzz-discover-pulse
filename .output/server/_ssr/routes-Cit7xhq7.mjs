import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react, i as useQuery, r as useSuspenseQuery, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { k as isRedirect, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Check, C as Play, D as MessageSquare, F as Link2, J as Ellipsis, O as MessageCircle, P as LoaderCircle, V as Heart, X as Copy, _ as Send, h as Share2, it as BadgeCheck, tt as Bookmark } from "../_libs/lucide-react.mjs";
import { i as videoUrl, n as imageUrl, r as placeholderUrl, t as imageSrcSet } from "./media-szkvQkos.mjs";
import { n as Sheet, t as BottomNav } from "./BottomNav-CKjeo2P-.mjs";
import { t as TopBar } from "./TopBar-CY7eXg8a.mjs";
import { n as homeQueryOptions, t as fetchFeedPage } from "./home-C-hjL-Dw.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as useFollowList } from "./usePublicProfile-DCFLa5Jx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cit7xhq7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
function StoryRail({ currentUser, stories }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Stories",
		className: "bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rail flex gap-4 px-4 py-3",
			children: stories.map(({ story, author }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "flex w-16 shrink-0 flex-col items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("block rounded-full p-[2px]", story.viewed ? "bg-border" : "bg-brand"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageUrl(author.avatarKey, "thumbnail"),
						alt: author.displayName,
						loading: "lazy",
						className: "size-[58px] rounded-full border-2 border-background object-cover"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-full truncate text-center text-[11px] text-muted-foreground",
					children: author.username
				})]
			}, story.id))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: currentUser.username
		})]
	});
}
/** Everyone on WIZZ, used to build the "not following you" list. */
function useAllProfiles(enabled) {
	return useQuery({
		queryKey: ["all-profiles-share"],
		enabled,
		staleTime: 6e4,
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url, verified").limit(50);
			if (error) throw error;
			return data ?? [];
		}
	});
}
function ShareSheet({ open, onClose, url, message }) {
	const { user } = useSession();
	const [tab, setTab] = (0, import_react.useState)("followers");
	const [sent, setSent] = (0, import_react.useState)([]);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const { data: followers = [] } = useFollowList(user?.id ?? null, "followers");
	const { data: everyone = [] } = useAllProfiles(open);
	const others = (0, import_react.useMemo)(() => {
		const followerIds = new Set(followers.map((f) => f.id));
		return everyone.filter((p) => p.id !== user?.id && !followerIds.has(p.id));
	}, [
		everyone,
		followers,
		user?.id
	]);
	const people = tab === "followers" ? followers : others;
	const shareText = `${message} ${url}`.trim();
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			toast.success("Link copied");
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Could not copy the link");
		}
	}
	function sendTo(person) {
		setSent((prev) => prev.includes(person.id) ? prev : [...prev, person.id]);
		navigator.clipboard.writeText(url).catch(() => void 0);
		toast.success(`Link ready to send to @${person.username}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onClose,
		title: "Share",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2 pb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
						target: "_blank",
						rel: "noreferrer",
						className: "flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 place-items-center rounded-full bg-brand-soft",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-5 text-brand" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-foreground",
							children: "WhatsApp"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: copyLink,
						className: "flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 place-items-center rounded-full bg-brand-soft",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5 text-brand" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-5 text-brand" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-foreground",
							children: "Copy link"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							if (typeof navigator !== "undefined" && navigator.share) navigator.share({
								text: message,
								url
							}).catch(() => void 0);
							else copyLink();
						},
						className: "flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-11 place-items-center rounded-full bg-brand-soft",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-5 text-brand" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-foreground",
							children: "More"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 pb-3",
				children: ["followers", "others"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t),
					className: cn("rounded-full px-4 py-1.5 text-xs font-bold", tab === t ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground"),
					children: t === "followers" ? "Followers" : "Not following you"
				}, t))
			}),
			!user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-6 text-center text-sm text-muted-foreground",
				children: "Sign in to send this straight to people on WIZZ."
			}) : people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-6 text-center text-sm text-muted-foreground",
				children: tab === "followers" ? "No followers yet." : "No other accounts to show."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border",
				children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 py-2.5",
					children: [
						person.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: person.avatar_url,
							alt: person.display_name,
							className: "size-10 rounded-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground",
							children: person.display_name.slice(0, 1).toUpperCase()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-semibold text-foreground",
								children: person.display_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "truncate text-xs text-muted-foreground",
								children: ["@", person.username]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => sendTo(person),
							className: cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold", sent.includes(person.id) ? "bg-secondary text-muted-foreground" : "bg-brand text-brand-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-3.5" }), sent.includes(person.id) ? "Sent" : "Send"]
						})
					]
				}, person.id))
			})
		]
	});
}
var compact = new Intl.NumberFormat("en", { notation: "compact" });
/** Deterministic clock so SSR markup and hydrated markup agree exactly. */
var REFERENCE_NOW = Date.parse("2026-08-27T12:00:00.000Z");
function timeAgo(iso) {
	const mins = Math.max(1, Math.round((REFERENCE_NOW - Date.parse(iso)) / 6e4));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}
function FeedCard({ item }) {
	const { post, author, clipObjectKey } = item;
	const [liked, setLiked] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [following, setFollowing] = (0, import_react.useState)(false);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [sharing, setSharing] = (0, import_react.useState)(false);
	const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/u/${author.username}` : "";
	const image = post.media.find((m) => m.kind === "image");
	const aspect = image ? image.width / image.height : 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border-b border-border bg-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-2 px-3 pt-3 sm:gap-3 sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageUrl(author.avatarKey, "thumbnail"),
						alt: author.displayName,
						loading: "lazy",
						className: "size-9 shrink-0 rounded-full object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm font-bold text-foreground",
								children: author.displayName
							}), author.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4 shrink-0 text-brand" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: [
								"@",
								author.username,
								" · ",
								timeAgo(post.createdAt)
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFollowing((v) => !v),
						className: "shrink-0 pt-0.5 text-sm font-semibold text-brand",
						children: following ? "Following" : "Follow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "More options",
						className: "-mr-1 shrink-0 rounded-full p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5 text-muted-foreground" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "break-words px-3 py-3 text-[15px] leading-snug text-foreground sm:px-5",
				children: [post.caption, post.hashtags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-brand",
					children: [" ", post.hashtags.map((h) => `#${h}`).join(" ")]
				})]
			}),
			clipObjectKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative bg-surface-strong",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					className: "aspect-[4/5] w-full object-cover",
					src: videoUrl(clipObjectKey),
					poster: imageUrl(image?.objectKey ?? post.id, "large", .8),
					playsInline: true,
					loop: true,
					muted: true,
					controls: playing,
					preload: "none",
					onPlay: () => setPlaying(true)
				}), !playing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": "Play video",
					onClick: (e) => {
						const video = e.currentTarget.previousElementSibling;
						setPlaying(true);
						video?.play();
					},
					className: "absolute inset-0 grid place-items-center bg-scrim/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-14 place-items-center rounded-full bg-on-media/90",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-6 translate-x-0.5 fill-foreground text-foreground" })
					})
				})]
			}) : image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: imageUrl(image.objectKey, "large", aspect),
				srcSet: imageSrcSet(image.objectKey, aspect),
				sizes: "(max-width: 768px) 100vw, 768px",
				alt: image.alt,
				width: image.width,
				height: image.height,
				loading: "lazy",
				decoding: "async",
				style: {
					backgroundImage: `url(${placeholderUrl(image.objectKey)})`,
					backgroundSize: "cover"
				},
				className: "w-full bg-surface-strong object-cover"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 px-3 py-3 sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setLiked((v) => !v),
						"aria-pressed": liked,
						"aria-label": "Like",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-5", liked ? "fill-live text-live" : "text-foreground") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-foreground",
							children: compact.format(post.metrics.likes + (liked ? 1 : 0))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						"aria-label": "Comment",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-5 text-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-foreground",
							children: compact.format(post.metrics.comments)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						"aria-label": "Share",
						onClick: () => setSharing(true),
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-5 text-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-foreground",
							children: compact.format(post.metrics.shares)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSaved((v) => !v),
						"aria-pressed": saved,
						"aria-label": "Save",
						className: "",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: cn("size-5", saved ? "fill-brand text-brand" : "text-foreground") })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShareSheet, {
				open: sharing,
				onClose: () => setSharing(false),
				url: shareUrl,
				message: `${author.displayName} on WIZZ: ${post.caption}`
			})
		]
	});
}
function HomeScreen() {
	const { data } = useSuspenseQuery(homeQueryOptions);
	const loadPage = useServerFn(fetchFeedPage);
	const [extra, setExtra] = (0, import_react.useState)([]);
	const [cursor, setCursor] = (0, import_react.useState)(data.feed.nextCursor);
	const [hasMore, setHasMore] = (0, import_react.useState)(data.feed.hasMore);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const sentinel = (0, import_react.useRef)(null);
	const loadMore = (0, import_react.useCallback)(async () => {
		if (loading || !hasMore || !cursor) return;
		setLoading(true);
		try {
			const page = await loadPage({ data: { cursor } });
			setExtra((prev) => [...prev, ...page.items]);
			setCursor(page.nextCursor);
			setHasMore(page.hasMore);
		} catch {
			setHasMore(false);
		} finally {
			setLoading(false);
		}
	}, [
		cursor,
		hasMore,
		loading,
		loadPage
	]);
	(0, import_react.useEffect)(() => {
		const node = sentinel.current;
		if (!node) return;
		const io = new IntersectionObserver((entries) => {
			if (entries.some((e) => e.isIntersecting)) loadMore();
		}, { rootMargin: "600px 0px" });
		io.observe(node);
		return () => io.disconnect();
	}, [loadMore]);
	const items = [...data.feed.items, ...extra];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "min-w-0 flex-1 pb-24 sm:pb-28",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "sr-only",
						children: "WIZZ home feed"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoryRail, {
						currentUser: data.currentUser,
						stories: data.stories
					}),
					items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-6 py-12 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-foreground",
							children: "No posts yet"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "Be the first to share something on WIZZ."
						})]
					}),
					items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedCard, { item }, item.post.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: sentinel,
						className: "grid h-16 place-items-center",
						children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin text-muted-foreground" }), !hasMore && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "You're all caught up"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var SplitComponent = HomeScreen;
//#endregion
export { SplitComponent as component };
