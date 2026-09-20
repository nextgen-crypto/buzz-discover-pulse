import { s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Users, it as BadgeCheck, st as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
import { r as useProfileByUsername, t as useFollowList } from "./usePublicProfile-DCFLa5Jx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FollowListScreen-DU86tWzk.js
var import_jsx_runtime = require_jsx_runtime();
function FollowListScreen({ username, kind }) {
	const { data: profile, isLoading } = useProfileByUsername(username);
	const { data: people = [], isLoading: loadingPeople } = useFollowList(profile?.id ?? null, kind);
	const heading = kind === "followers" ? "Followers" : "Following";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: `${heading} — @${username}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 pt-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/u/$username",
				params: { username },
				"aria-label": "Back to profile",
				className: "grid size-9 place-items-center rounded-full bg-secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4 text-foreground" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "truncate text-lg font-bold tracking-tight text-foreground",
					children: heading
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate text-xs text-muted-foreground",
					children: ["@", username]
				})]
			})]
		}), isLoading || loadingPeople ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2 px-4 pt-5",
			children: [
				0,
				1,
				2
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-14 w-full animate-pulse rounded-2xl bg-secondary" }, i))
		}) : people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center px-6 pt-16 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-14 place-items-center rounded-2xl bg-secondary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-6 text-muted-foreground" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm font-semibold text-foreground",
				children: kind === "followers" ? "No followers yet" : "Not following anyone yet"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0",
			children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/u/$username",
				params: { username: person.username },
				className: "flex items-center gap-3 px-4 py-3",
				children: [person.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: person.avatar_url,
					alt: person.display_name,
					loading: "lazy",
					className: "size-11 rounded-2xl object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-11 place-items-center rounded-2xl bg-brand text-sm font-bold text-brand-foreground",
					children: person.display_name.slice(0, 1).toUpperCase()
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1 truncate text-sm font-semibold text-foreground",
							children: [person.display_name, person.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-3.5 shrink-0 text-brand" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: ["@", person.username]
						}),
						person.bio.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: person.bio
						})
					]
				})]
			}) }, person.id))
		})]
	});
}
//#endregion
export { FollowListScreen as t };
