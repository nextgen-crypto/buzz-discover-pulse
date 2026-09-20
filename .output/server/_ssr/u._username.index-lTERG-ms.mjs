import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._username.index-lTERG-ms.js
var $$splitComponentImporter = () => import("./u._username.index-DVjM94xC.mjs");
var Route = createFileRoute("/u/$username/")({
	head: ({ params }) => {
		const title = `@${params.username} on WIZZ`;
		const description = `See posts, followers and following for @${params.username} on WIZZ.`;
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
				content: "summary_large_image"
			}
		] };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
