import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as HeartHandshake, it as BadgeCheck, s as UserX, z as ImagePlus } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
import { t as PaymentSheet } from "./PaymentSheet-Bh6iinhT.mjs";
import { t as Route } from "./u._username.index-lTERG-ms.mjs";
import { a as useProfileStats, i as useProfilePosts, n as useFollowState, r as useProfileByUsername } from "./usePublicProfile-DCFLa5Jx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._username.index-DVjM94xC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var compact = new Intl.NumberFormat("en", { notation: "compact" });
function PublicProfileScreen({ username }) {
	const { user } = useSession();
	const viewerId = user?.id ?? null;
	const { data: profile, isLoading } = useProfileByUsername(username);
	const profileId = profile?.id ?? null;
	const { data: posts = [] } = useProfilePosts(profileId);
	const { data: stats } = useProfileStats(profileId);
	const { isFollowing, canFollow, toggle } = useFollowState(viewerId, profileId);
	const [payOpen, setPayOpen] = (0, import_react.useState)(false);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 px-4 pt-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 w-full animate-pulse rounded-2xl bg-secondary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 w-full animate-pulse rounded-2xl bg-secondary" })]
		})
	});
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile not found",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center px-6 pt-20 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-16 place-items-center rounded-2xl bg-secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, { className: "size-7 text-muted-foreground" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "mt-4 text-xl font-bold tracking-tight text-foreground",
					children: ["No account called @", username]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "This profile may have been renamed or removed."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-5 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground",
					children: "Back to feed"
				})
			]
		})
	});
	const isMe = viewerId === profile.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `${profile.display_name} on WIZZ`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 bg-gradient-to-b from-brand to-brand/70 sm:h-36" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "-mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3",
						children: [profile.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: profile.avatar_url,
							alt: profile.display_name,
							className: "size-20 rounded-2xl border-4 border-background object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-20 place-items-center rounded-2xl border-4 border-background bg-brand text-2xl font-bold text-brand-foreground",
							children: profile.display_name.slice(0, 1).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 flex min-w-0 flex-wrap items-center justify-end gap-2",
							children: isMe ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/profile",
								className: "rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground",
								children: "Your profile"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setPayOpen(true),
								className: "flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, { className: "size-4" }), " Support"]
							}), viewerId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => toggle.mutate(!isFollowing),
								disabled: !canFollow || toggle.isPending,
								className: cn("rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground disabled:opacity-60"),
								children: isFollowing ? "Following" : "Follow"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/auth",
								className: "rounded-full bg-secondary px-5 py-2 text-sm font-bold text-foreground",
								children: "Follow"
							})] })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "min-w-0 break-words text-xl font-bold tracking-tight text-foreground",
							children: profile.display_name
						}), profile.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4.5 text-brand" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: ["@", profile.username]
					}),
					profile.bio.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-snug text-foreground",
						children: profile.bio
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-secondary py-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base font-bold text-foreground",
									children: compact.format(stats?.posts ?? 0)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-medium tracking-wider text-muted-foreground",
									children: "POSTS"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/u/$username/followers",
								params: { username: profile.username },
								className: "rounded-2xl bg-secondary py-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base font-bold text-foreground",
									children: compact.format(stats?.followers ?? 0)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-medium tracking-wider text-muted-foreground",
									children: "FOLLOWERS"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/u/$username/following",
								params: { username: profile.username },
								className: "rounded-2xl bg-secondary py-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-base font-bold text-foreground",
									children: compact.format(stats?.following ?? 0)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-medium tracking-wider text-muted-foreground",
									children: "FOLLOWING"
								})]
							})
						]
					})
				]
			}),
			posts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-3 gap-0.5 sm:grid-cols-4",
				children: posts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children: p.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.image_url,
						alt: p.caption || "Post",
						loading: "lazy",
						className: "aspect-square w-full bg-surface-strong object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid aspect-square w-full place-items-center bg-secondary p-2 text-center text-[11px] text-muted-foreground",
						children: p.caption.slice(0, 60)
					})
				}, p.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col items-center px-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-14 place-items-center rounded-2xl bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-6 text-muted-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm font-semibold text-foreground",
						children: "No posts yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: [
							"When ",
							profile.display_name,
							" shares something it will show up here."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentSheet, {
				open: payOpen,
				onClose: () => setPayOpen(false),
				creatorName: profile.display_name
			})
		]
	});
}
function RouteComponent() {
	const { username } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicProfileScreen, { username });
}
//#endregion
export { RouteComponent as component };
