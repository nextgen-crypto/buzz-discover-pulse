import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, r as useSuspenseQuery, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { O as MessageCircle, S as Plus, T as Music, V as Heart, h as Share2 } from "../_libs/lucide-react.mjs";
import { n as shortsQueryOptions } from "./sections-BDFOwV8K.mjs";
import { i as videoUrl, n as imageUrl } from "./media-szkvQkos.mjs";
import { t as BottomNav } from "./BottomNav-CKjeo2P-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shorts-DMGQf0ma.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var compact = new Intl.NumberFormat("en", { notation: "compact" });
function ShortCard({ item, playing, onToggle }) {
	const [liked, setLiked] = (0, import_react.useState)(false);
	const videoRef = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative flex h-[100dvh] min-h-[32rem] w-full snap-start items-end bg-media",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				src: videoUrl(item.short.video.objectKey),
				poster: imageUrl(item.short.video.posterKey, "medium", .5625),
				className: "absolute inset-0 h-full w-full object-cover",
				playsInline: true,
				loop: true,
				muted: true,
				preload: "metadata",
				onClick: () => {
					const v = videoRef.current;
					if (!v) return;
					if (playing) {
						v.pause();
						onToggle("");
					} else {
						v.play();
						onToggle(item.short.id);
					}
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim to-transparent pb-32 pt-24 sm:pb-36",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[calc(100%-5rem)] px-4 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-base font-bold text-on-media",
							children: ["@", item.authorUsername]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 line-clamp-3 text-sm text-on-media/95",
							children: item.short.caption
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1.5 flex items-center gap-1.5 text-xs text-on-media/80",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { className: "size-3.5" }),
								" ",
								item.short.soundtrack
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-36 right-3 flex flex-col items-center gap-4 sm:bottom-40 sm:right-5 sm:gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: imageUrl(item.authorAvatarKey, "thumbnail"),
							alt: item.authorName,
							className: "size-11 rounded-full border-2 border-on-media object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -bottom-2 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-brand",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3 text-brand-foreground" })
						})]
					}),
					[
						{
							Icon: Heart,
							label: "Like",
							count: item.short.metrics.likes + (liked ? 1 : 0),
							onClick: () => setLiked((v) => !v),
							active: liked
						},
						{
							Icon: MessageCircle,
							label: "Comments",
							count: item.short.metrics.comments
						},
						{
							Icon: Share2,
							label: "Share",
							count: item.short.metrics.shares
						}
					].map(({ Icon, label, count, onClick, active }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						"aria-label": label,
						onClick,
						className: "flex flex-col items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-7", active ? "fill-live text-live" : "text-on-media") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-on-media",
							children: compact.format(count)
						})]
					}, label)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: imageUrl(item.authorAvatarKey, "thumbnail"),
						alt: "",
						className: "size-9 rounded-full border border-on-media/50 object-cover"
					})
				]
			})
		]
	});
}
function ShortsScreen() {
	const { data } = useSuspenseQuery(shortsQueryOptions);
	const [playingId, setPlayingId] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex h-[100dvh] min-h-[32rem] w-full max-w-3xl flex-col overflow-hidden bg-media md:border-x md:border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Shorts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto",
				children: data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortCard, {
					item,
					playing: playingId === item.short.id,
					onToggle: setPlayingId
				}, item.short.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-x-0 bottom-0 z-40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
			})
		]
	});
}
var SplitComponent = ShortsScreen;
//#endregion
export { SplitComponent as component };
