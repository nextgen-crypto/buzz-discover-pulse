import { n as __toESM } from "../_runtime.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { G as Flame, K as Film, a as Users, ot as ArrowRight, x as Radio } from "../_libs/lucide-react.mjs";
import { n as creators, r as explorePhotos } from "./seed-oF1kQ_Ut.mjs";
import { n as imageUrl } from "./media-szkvQkos.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/welcome-59uj7fRa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var slides = [
	{
		Icon: Radio,
		title: "Live stories, first thing",
		body: "Open BUZZ and see who is live right now. Tap a ring to jump straight into the moment."
	},
	{
		Icon: Flame,
		title: "Trending, tuned to you",
		body: "Purple chips surface the topics moving fastest, ranked from what you actually watch."
	},
	{
		Icon: Film,
		title: "Shorts that fill the screen",
		body: "Swipe a full-screen feed of short videos with like, comment and share always in reach."
	},
	{
		Icon: Users,
		title: "Creators you keep",
		body: "Follow people, post your own photos and clips, and your feed follows you to any device."
	}
];
function WelcomeScreen() {
	const [step, setStep] = (0, import_react.useState)(0);
	const slide = slides[step];
	const last = step === slides.length - 1;
	const covers = explorePhotos.slice(step, step + 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-background px-5 pb-8 pt-6 sm:px-8 sm:pt-8 md:border-x md:border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-2xl font-extrabold tracking-tight text-title",
					children: "WIZZ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-sm font-semibold text-muted-foreground",
					children: "Skip"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative mx-auto mt-6 h-56 w-full max-w-md sm:mt-8 sm:h-64",
				children: covers.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: imageUrl(c.key, "small", c.aspect),
					alt: c.category,
					className: cn("absolute h-44 w-[38%] max-w-40 rounded-3xl border-4 border-background object-cover shadow-raise sm:h-52", i === 0 && "left-2 top-6 -rotate-6", i === 1 && "left-1/2 top-0 z-10 -translate-x-1/2", i === 2 && "right-2 top-6 rotate-6")
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex -space-x-2",
				children: [creators.slice(0, 5).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: imageUrl(c.avatarKey, "thumbnail"),
					alt: c.displayName,
					className: "size-8 rounded-full border-2 border-background object-cover"
				}, c.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-4 self-center text-xs text-muted-foreground",
					children: "Creators posting on BUZZ today"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex size-11 items-center justify-center rounded-2xl bg-brand-soft",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(slide.Icon, { className: "size-5 text-brand" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground",
						children: slide.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[15px] leading-relaxed text-muted-foreground",
						children: slide.body
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 flex gap-1.5",
				children: slides.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-brand" : "w-1.5 bg-border") }, s.title))
			}),
			last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "inline-flex items-center justify-center rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground",
					children: "Create your account"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "inline-flex items-center justify-center rounded-full border border-border py-3.5 text-sm font-semibold text-foreground",
					children: "Explore first"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setStep((s) => Math.min(s + 1, slides.length - 1)),
				className: "inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground",
				children: ["Next", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
			})
		]
	});
}
var SplitComponent = WelcomeScreen;
//#endregion
export { SplitComponent as component };
