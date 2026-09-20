import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._username.followers-CMOGpYEk.js
var $$splitComponentImporter = () => import("./u._username.followers-Cbs__LBP.mjs");
var Route = createFileRoute("/u/$username/followers")({
	head: ({ params }) => {
		const title = `Followers of @${params.username} — WIZZ`;
		const description = `People following @${params.username} on WIZZ.`;
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
