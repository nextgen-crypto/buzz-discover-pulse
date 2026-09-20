import { n as queryOptions } from "../_libs/react+tanstack__react-query.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Diciz3x0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sections-BDFOwV8K.js
var fetchNews = createServerFn({ method: "GET" }).handler(createSsrRpc("8fd72aa0d978550cb13306f7880b2b59971960991a33c1bc535cfc03a0525b49"));
var fetchShorts = createServerFn({ method: "GET" }).handler(createSsrRpc("1555d3cfc853fc00376bf0ea8adfe839857732fdf24ca16aed5b8b1ada1659f2"));
var fetchVideos = createServerFn({ method: "GET" }).handler(createSsrRpc("e227bd9c0a7746bad584dc96c5aeab809c9393205d7c99d261c99aed330fa863"));
var fetchProfile = createServerFn({ method: "GET" }).handler(createSsrRpc("03b44a115c63ff51e2eef3e2d2962cab6cbae93563e78b11bc15220a0dbf7915"));
var newsQueryOptions = queryOptions({
	queryKey: ["news"],
	queryFn: () => fetchNews(),
	staleTime: 6e4,
	retry: 2,
	retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 5e3)
});
var shortsQueryOptions = queryOptions({
	queryKey: ["shorts"],
	queryFn: () => fetchShorts(),
	staleTime: 3e4,
	retry: 2,
	retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 5e3)
});
var videosQueryOptions = queryOptions({
	queryKey: ["videos"],
	queryFn: () => fetchVideos(),
	staleTime: 6e4,
	retry: 2,
	retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 5e3)
});
queryOptions({
	queryKey: ["profile"],
	queryFn: () => fetchProfile(),
	staleTime: 6e4,
	retry: 2,
	retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 5e3)
});
//#endregion
export { shortsQueryOptions as n, videosQueryOptions as r, newsQueryOptions as t };
