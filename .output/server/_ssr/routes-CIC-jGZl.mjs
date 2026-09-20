import { s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CIC-jGZl.js
var import_jsx_runtime = require_jsx_runtime();
function HomeError({ reset }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto grid min-h-screen w-full max-w-[480px] place-items-center gap-4 p-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold text-foreground",
				children: "Feed unavailable"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "We couldn't reach WIZZ. Check your connection and try again."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: reset,
				className: "mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground",
				children: "Retry"
			})
		] })
	});
}
//#endregion
export { HomeError as errorComponent };
