import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, r as useSuspenseQuery, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as creators, r as explorePhotos } from "./seed-oF1kQ_Ut.mjs";
import { t as newsQueryOptions } from "./sections-BDFOwV8K.mjs";
import { n as imageUrl } from "./media-szkvQkos.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/news-CnsQV3Rl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REFERENCE_NOW = Date.parse("2026-08-27T12:00:00.000Z");
function timeAgo(iso) {
	const mins = Math.max(1, Math.round((REFERENCE_NOW - Date.parse(iso)) / 6e4));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}
var tabs = [
	"Latest",
	"Technology",
	"Sports",
	"Entertainment",
	"Travel"
];
var discoverFilters = [
	"All",
	"Travel",
	"Design",
	"Food",
	"Sports"
];
function NewsScreen() {
	const { data: articles } = useSuspenseQuery(newsQueryOptions);
	const [tab, setTab] = (0, import_react.useState)("Latest");
	const [discover, setDiscover] = (0, import_react.useState)("All");
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const scoped = (0, import_react.useMemo)(() => tab === "Latest" ? articles : articles.filter((a) => a.category === tab), [articles, tab]);
	const hero = scoped.find((a) => a.live) ?? scoped[0] ?? articles[0];
	const stories = (hero ? scoped.filter((a) => a.id !== hero.id) : scoped).slice(0, expanded ? 12 : 3);
	const photos = (0, import_react.useMemo)(() => discover === "All" ? explorePhotos : explorePhotos.filter((p) => p.category === discover), [discover]);
	const byId = (0, import_react.useMemo)(() => new Map(creators.map((c) => [c.id, c])), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Explore",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "px-4 pt-4 sm:px-6 sm:pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-extrabold tracking-tight text-foreground",
					children: "Explore"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "What's happening right now."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:px-6",
				children: tabs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t),
					className: cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors", tab === t ? "bg-brand text-primary-foreground" : "border border-border bg-transparent text-foreground"),
					children: t
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "px-4 pb-2 text-lg font-extrabold tracking-tight text-foreground",
					children: "What's happening"
				}), hero && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "relative mx-4 overflow-hidden rounded-2xl bg-surface-strong sm:mx-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: imageUrl(hero.imageKey, "large", 16 / 10),
							alt: hero.title,
							className: "aspect-[16/10] w-full object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-scrim via-scrim/25 to-transparent" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-x-0 bottom-0 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1.5 rounded-md bg-on-media/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-media backdrop-blur",
									children: [hero.category, hero.live && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-live",
										children: "· LIVE"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "mt-2 text-lg font-bold leading-snug text-on-media",
									children: hero.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-on-media/80",
									children: [
										hero.sourceName,
										" · ",
										timeAgo(hero.publishedAt)
									]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-1 grid md:grid-cols-2 md:px-2",
				children: stories.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-3 px-4 py-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									a.category,
									" · ",
									a.sourceName
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1 text-[15px] font-bold leading-snug text-foreground",
								children: a.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: [
									timeAgo(a.publishedAt),
									" · ",
									2 + a.summary.length % 6,
									" min read"
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageUrl(a.imageKey, "thumbnail", .8),
						alt: a.title,
						loading: "lazy",
						className: "size-16 shrink-0 rounded-xl object-cover"
					})]
				}, a.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setExpanded((v) => !v),
				className: "px-4 pb-2 pt-1 text-sm font-bold text-brand",
				children: expanded ? "Show less" : "Show more"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-extrabold tracking-tight text-foreground",
						children: "Discover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-w-0 justify-end gap-3 overflow-x-auto no-scrollbar",
						children: discoverFilters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDiscover(f),
							className: cn("shrink-0 text-sm font-semibold", discover === f ? "text-brand" : "text-muted-foreground"),
							children: f
						}, f))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid auto-rows-[110px] grid-cols-2 gap-1 px-1 sm:auto-rows-[140px] sm:grid-cols-3",
					children: photos.map((p, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
						className: cn("overflow-hidden rounded-sm", index % 7 === 0 && "row-span-2", index % 7 === 3 && "col-span-2 row-span-2 sm:col-span-1", index % 7 === 5 && "sm:col-span-2"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: imageUrl(p.key, "medium", p.aspect),
							alt: `${p.category} photo by ${byId.get(p.authorId)?.displayName ?? "BUZZ creator"}`,
							loading: "lazy",
							className: "h-full w-full object-cover"
						})
					}, p.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-28",
				"aria-hidden": "true"
			})
		]
	});
}
var SplitComponent = NewsScreen;
//#endregion
export { SplitComponent as component };
