import { s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as right, r as left, t as BottomNav } from "./BottomNav-CKjeo2P-.mjs";
import { t as TopBar } from "./TopBar-CY7eXg8a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-DkIGg9aa.js
var import_jsx_runtime = require_jsx_runtime();
function RailTab({ to, label, Icon, exact }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		activeOptions: { exact },
		activeProps: { "aria-current": "page" },
		className: "flex w-full flex-col items-center gap-1 rounded-xl py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
		children: ({ isActive }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: isActive ? "size-5 text-brand" : "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: isActive ? "text-[10px] font-semibold text-brand" : "text-[10px] font-medium",
			children: label
		})] })
	});
}
/** Tablet-and-up primary nav: mirrors BottomNav's routes as a docked left rail. */
function NavigationRail() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		"aria-label": "Primary",
		className: "fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r border-border bg-background px-2 py-4 md:flex",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			"aria-label": "WIZZ home",
			className: "mb-5 text-xl font-black text-title",
			children: "W"
		}), [...left, ...right].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RailTab, { ...item }, item.to))]
	});
}
function AppShell({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-[100dvh] bg-surface-strong md:pl-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavigationRail, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "min-w-0 flex-1 pb-24 md:pb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "sr-only",
						children: title
					}), children]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
			]
		})]
	});
}
//#endregion
export { AppShell as t };
