import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, r as useSuspenseQuery, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { h as Link, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Play, st as ArrowLeft } from "../_libs/lucide-react.mjs";
import { r as videosQueryOptions } from "./sections-BDFOwV8K.mjs";
import { i as videoUrl, n as imageUrl } from "./media-szkvQkos.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/videos._videoId-COHO-2bJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var compact = new Intl.NumberFormat("en", { notation: "compact" });
function formatDuration(seconds) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
function WatchScreen() {
	const { videoId } = useParams({ from: "/videos/$videoId" });
	const { data } = useSuspenseQuery(videosQueryOptions);
	const playerRef = (0, import_react.useRef)(null);
	const item = data.find((v) => v.video.id === videoId);
	const upNext = data.filter((v) => v.video.id !== videoId);
	if (!item) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Video not found",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid place-items-center gap-3 px-6 py-24 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold text-foreground",
				children: "This video isn't available."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/videos",
				className: "text-sm font-semibold text-brand",
				children: "Back to videos"
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: item.video.title,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-4 py-3 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/videos",
					"aria-label": "Back to videos",
					className: "grid size-9 place-items-center rounded-full hover:bg-secondary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5 text-foreground" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-semibold text-muted-foreground",
					children: "Back to videos"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-label": `Now playing: ${item.video.title}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative bg-media sm:mx-6 sm:overflow-hidden sm:rounded-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: playerRef,
						src: videoUrl(item.video.video.objectKey),
						poster: imageUrl(item.video.video.posterKey, "large", 16 / 9),
						className: "aspect-video w-full object-contain",
						controls: true,
						autoPlay: true,
						playsInline: true,
						preload: "metadata",
						onLoadedMetadata: () => {
							const player = playerRef.current;
							if (!player || !item.video.progressSeconds) return;
							player.currentTime = Math.min(item.video.progressSeconds, player.duration || item.video.progressSeconds);
						},
						children: "Your browser does not support video playback."
					}, item.video.id)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3 px-4 py-3 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageUrl(item.authorAvatarKey, "thumbnail"),
						alt: item.authorName,
						className: "size-10 shrink-0 rounded-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-bold leading-snug text-foreground",
							children: item.video.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								"@",
								item.authorUsername,
								" · ",
								compact.format(item.video.views),
								" views ·",
								" ",
								item.video.publishedAt
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "px-4 pb-2 text-sm font-bold text-foreground sm:px-6",
					children: "Up next"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid md:grid-cols-2",
					children: upNext.map((next) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
						className: "px-4 pb-4 sm:px-6 md:px-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/videos/$videoId",
							params: { videoId: next.video.id },
							"aria-label": `Play ${next.video.title}`,
							className: "block w-full text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-2xl bg-surface-strong",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: imageUrl(next.video.video.posterKey, "medium", 16 / 9),
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
										children: formatDuration(next.video.video.durationSeconds)
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2.5 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: imageUrl(next.authorAvatarKey, "thumbnail"),
									alt: next.authorName,
									className: "size-9 shrink-0 rounded-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "line-clamp-2 text-sm font-semibold leading-snug text-foreground",
										children: next.video.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 text-xs text-muted-foreground",
										children: [
											"@",
											next.authorUsername,
											" · ",
											compact.format(next.video.views),
											" views"
										]
									})]
								})]
							})]
						})
					}) }, next.video.id))
				})]
			})
		]
	});
}
var SplitComponent = WatchScreen;
//#endregion
export { SplitComponent as component };
