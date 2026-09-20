import { n as queryOptions } from "../_libs/react+tanstack__react-query.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Diciz3x0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-C-hjL-Dw.js
var fetchHome = createServerFn({ method: "GET" }).inputValidator((data) => ({ cursor: data?.cursor ?? null })).handler(createSsrRpc("c767aa88534831a1cc729959885bd521c86e392cb4a5303b08cd8994d3719ba9"));
var fetchFeedPage = createServerFn({ method: "GET" }).inputValidator((data) => ({ cursor: data?.cursor ?? null })).handler(createSsrRpc("93d6630912eb37d4e10ac022dae571517a15b90d115c5d0fdac365ea0168e92d"));
var homeQueryOptions = queryOptions({
	queryKey: [
		"home",
		"feed",
		"start"
	],
	queryFn: () => fetchHome({ data: { cursor: null } }),
	staleTime: 3e4,
	retry: 3,
	retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 4e3)
});
//#endregion
export { homeQueryOptions as n, fetchFeedPage as t };
