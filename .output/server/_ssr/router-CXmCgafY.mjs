import { n as __toESM } from "../_runtime.mjs";
import { a as QueryClientProvider, c as require_react, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as shortsQueryOptions, r as videosQueryOptions, t as newsQueryOptions } from "./sections-BDFOwV8K.mjs";
import { n as homeQueryOptions } from "./home-C-hjL-Dw.mjs";
import { t as Route$9 } from "./u._username.index-lTERG-ms.mjs";
import { t as Route$10 } from "./u._username.followers-CMOGpYEk.mjs";
import { t as Route$11 } from "./u._username.following-BZKQep_G.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CXmCgafY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var styles_default = "/assets/styles-BjwTEy7j.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Lovable App" },
			{
				name: "description",
				content: "Lovable Generated Project"
			},
			{
				name: "author",
				content: "Lovable"
			},
			{
				property: "og:title",
				content: "Lovable App"
			},
			{
				property: "og:description",
				content: "Lovable Generated Project"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "/favicon.ico",
			type: "image/x-icon"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" })]
	});
}
var $$splitErrorComponentImporter = () => import("./routes-CIC-jGZl.mjs");
var $$splitComponentImporter$7 = () => import("./routes-Cit7xhq7.mjs");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "WIZZ — Stories, trends and creators" },
		{
			name: "description",
			content: "WIZZ is a social discovery app with live stories, trending topics, photos and short videos from creators you follow."
		},
		{
			property: "og:title",
			content: "WIZZ — Stories, trends and creators"
		},
		{
			property: "og:description",
			content: "Live stories, trending topics and an endless feed of photos and short videos from the creators you follow."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$7, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
var $$splitComponentImporter$6 = () => import("./auth-Dj8n2PNI.mjs");
var Route$6 = createFileRoute("/auth")({
	head: () => ({ meta: [
		{ title: "Join BUZZ — Create your account or sign in" },
		{
			name: "description",
			content: "Create a BUZZ account or sign in with email or Google to follow creators, post photos and shorts, and keep your feed everywhere."
		},
		{
			property: "og:title",
			content: "Join BUZZ — Create your account or sign in"
		},
		{
			property: "og:description",
			content: "Sign up or sign in to BUZZ to follow creators, post photos and shorts, and save what you love."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./news-CnsQV3Rl.mjs");
var Route$5 = createFileRoute("/news")({
	head: () => ({ meta: [
		{ title: "WIZZ — News" },
		{
			name: "description",
			content: "Live and breaking stories curated for your WIZZ feed."
		},
		{
			property: "og:title",
			content: "WIZZ — News"
		},
		{
			property: "og:description",
			content: "Live and breaking stories curated for your WIZZ feed."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(newsQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./profile-DuVRVfGB.mjs");
var Route$4 = createFileRoute("/profile")({
	head: () => ({ meta: [
		{ title: "WIZZ — Your profile" },
		{
			name: "description",
			content: "Your WIZZ account: posts, followers and saves."
		},
		{
			property: "og:title",
			content: "WIZZ — Your profile"
		},
		{
			property: "og:description",
			content: "Your WIZZ account: posts, followers and saves."
		},
		{
			property: "og:type",
			content: "profile"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./shorts-DMGQf0ma.mjs");
var Route$3 = createFileRoute("/shorts")({
	head: () => ({ meta: [
		{ title: "WIZZ — Shorts" },
		{
			name: "description",
			content: "Vertical short-form videos from WIZZ creators."
		},
		{
			property: "og:title",
			content: "WIZZ — Shorts"
		},
		{
			property: "og:description",
			content: "Vertical short-form videos from WIZZ creators."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(shortsQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./videos-CyJYhBB5.mjs");
var Route$2 = createFileRoute("/videos")({
	head: () => ({ meta: [
		{ title: "WIZZ — Videos" },
		{
			name: "description",
			content: "Long-form videos and walkthroughs from WIZZ creators."
		},
		{
			property: "og:title",
			content: "WIZZ — Videos"
		},
		{
			property: "og:description",
			content: "Long-form videos and walkthroughs from WIZZ creators."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./welcome-59uj7fRa.mjs");
var Route$1 = createFileRoute("/welcome")({
	head: () => ({ meta: [
		{ title: "Welcome to BUZZ — See what happens inside" },
		{
			name: "description",
			content: "A quick tour of BUZZ: live stories, trending topics, full-screen shorts and the creators you follow, all in one mobile feed."
		},
		{
			property: "og:title",
			content: "Welcome to BUZZ — See what happens inside"
		},
		{
			property: "og:description",
			content: "Live stories, trending topics, full-screen shorts and creators you follow — take the BUZZ tour."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./videos._videoId-COHO-2bJ.mjs");
var Route = createFileRoute("/videos/$videoId")({
	head: () => ({ meta: [
		{ title: "WIZZ — Watch" },
		{
			name: "description",
			content: "Watch long-form videos from WIZZ creators."
		},
		{
			property: "og:title",
			content: "WIZZ — Watch"
		},
		{
			property: "og:description",
			content: "Watch long-form videos from WIZZ creators."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(videosQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$8
});
var AuthRoute = Route$6.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$8
});
var NewsRoute = Route$5.update({
	id: "/news",
	path: "/news",
	getParentRoute: () => Route$8
});
var ProfileRoute = Route$4.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$8
});
var ShortsRoute = Route$3.update({
	id: "/shorts",
	path: "/shorts",
	getParentRoute: () => Route$8
});
var VideosRoute = Route$2.update({
	id: "/videos",
	path: "/videos",
	getParentRoute: () => Route$8
});
var WelcomeRoute = Route$1.update({
	id: "/welcome",
	path: "/welcome",
	getParentRoute: () => Route$8
});
var VideosVideoIdRoute = Route.update({
	id: "/$videoId",
	path: "/$videoId",
	getParentRoute: () => VideosRoute
});
var UUsernameIndexRoute = Route$9.update({
	id: "/u/$username/",
	path: "/u/$username/",
	getParentRoute: () => Route$8
});
var UUsernameFollowersRoute = Route$10.update({
	id: "/u/$username/followers",
	path: "/u/$username/followers",
	getParentRoute: () => Route$8
});
var UUsernameFollowingRoute = Route$11.update({
	id: "/u/$username/following",
	path: "/u/$username/following",
	getParentRoute: () => Route$8
});
var VideosRouteChildren = { VideosVideoIdRoute };
var rootRouteChildren = {
	IndexRoute,
	AuthRoute,
	NewsRoute,
	ProfileRoute,
	ShortsRoute,
	VideosRoute: VideosRoute._addFileChildren(VideosRouteChildren),
	WelcomeRoute,
	UUsernameFollowersRoute,
	UUsernameFollowingRoute,
	UUsernameIndexRoute
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
