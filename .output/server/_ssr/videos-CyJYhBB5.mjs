import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, r as useSuspenseQuery, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Play } from "../_libs/lucide-react.mjs";
import { r as videosQueryOptions } from "./sections-BDFOwV8K.mjs";
import { n as imageUrl } from "./media-szkvQkos.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/videos-CyJYhBB5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var compact = new Intl.NumberFormat("en", { notation: "compact" });
function formatDuration(seconds) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
function VideosScreen() {
	const { data } = useSuspenseQuery(videosQueryOptions);
	const [category, setCategory] = (0, import_react.useState)("For You");
	const categories = Array.from(/* @__PURE__ */ new Set(["For You", ...data.map((v) => v.video.category)]));
	const filtered = category === "For You" ? data : data.filter((v) => v.video.category === category);
	const continueWatching = data.filter((v) => v.video.progressSeconds);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Videos",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rail flex gap-2 px-4 py-3 sm:px-6",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setCategory(c),
					className: cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", c === category ? "bg-brand text-brand-foreground" : "border border-border bg-background text-foreground"),
					children: c
				}, c))
			}),
			continueWatching.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "px-4 pb-2 text-sm font-bold text-foreground sm:px-6",
					children: "Continue watching"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rail flex gap-3 px-4 pb-2 sm:px-6",
					children: continueWatching.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
						className: "w-[68vw] max-w-[260px] shrink-0 sm:w-[260px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/videos/$videoId",
							params: { videoId: item.video.id },
							"aria-label": `Play ${item.video.title}`,
							className: "block w-full text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-xl bg-surface-strong",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: imageUrl(item.video.video.posterKey, "medium", 16 / 9),
										alt: "",
										loading: "lazy",
										className: "aspect-video w-full object-cover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-0 grid place-items-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-10 place-items-center rounded-full bg-on-media/80",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4 translate-x-0.5 fill-foreground text-foreground" })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute bottom-2 right-2 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media",
										children: formatDuration(item.video.video.durationSeconds)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute bottom-0 left-0 h-1 bg-brand",
										style: { width: `${Math.min(100, (item.video.progressSeconds ?? 0) / item.video.video.durationSeconds * 100)}%` }
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-1.5 line-clamp-1 text-sm font-semibold text-foreground",
								children: item.video.title
							})]
						})
					}, item.video.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "px-4 pb-2 text-sm font-bold text-foreground sm:px-6",
					children: "Recommended"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid md:grid-cols-2",
					children: filtered.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
						className: "px-4 pb-4 sm:px-6 md:px-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/videos/$videoId",
							params: { videoId: item.video.id },
							"aria-label": `Play ${item.video.title}`,
							className: "block w-full text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-2xl bg-surface-strong",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: imageUrl(item.video.video.posterKey, "medium", 16 / 9),
										alt: "",
										loading: "lazy",
										className: "aspect-video w-full object-cover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-0 grid place-items-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-12 place-items-center rounded-full bg-on-media/25 backdrop-blur",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5 translate-x-0.5 fill-on-media text-on-media" })
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute bottom-2 right-2 rounded bg-scrim px-1.5 py-0.5 text-[11px] font-medium text-on-media",
										children: formatDuration(item.video.video.durationSeconds)
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2.5 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: imageUrl(item.authorAvatarKey, "thumbnail"),
									alt: item.authorName,
									className: "size-9 shrink-0 rounded-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "line-clamp-2 text-sm font-semibold leading-snug text-foreground",
										children: item.video.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 text-xs text-muted-foreground",
										children: [
											"@",
											item.authorUsername,
											" · ",
											compact.format(item.video.views),
											" views"
										]
									})]
								})]
							})]
						})
					}) }, item.video.id))
				})]
			})
		]
	});
}
var SplitComponent = VideosScreen;
//#endregion
export { SplitComponent as component };
