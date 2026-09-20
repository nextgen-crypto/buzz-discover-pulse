import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._username.following-BZKQep_G.js
var $$splitComponentImporter = () => import("./u._username.following-bqhQ60zw.mjs");
var Route = createFileRoute("/u/$username/following")({
	head: ({ params }) => {
		const title = `Accounts @${params.username} follows — WIZZ`;
		const description = `Accounts followed by @${params.username} on WIZZ.`;
		return { meta: [
			{ title },
			{
				name: "description",
				content: description
			},
			{
				property: "og:title",
				content: title
			},
			{
				property: "og:description",
				content: description
			},
			{
				property: "og:type",
				content: "profile"
			},
			{
				name: "twitter:card",
				content: "summary"
			}
		] };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
