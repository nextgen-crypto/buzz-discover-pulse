//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-C_Z4Ls6l.js
var manifest = {
	"03b44a115c63ff51e2eef3e2d2962cab6cbae93563e78b11bc15220a0dbf7915": {
		functionName: "fetchProfile_createServerFn_handler",
		importer: () => import("./_ssr/sections.functions-BJWJJ7vl.mjs")
	},
	"1555d3cfc853fc00376bf0ea8adfe839857732fdf24ca16aed5b8b1ada1659f2": {
		functionName: "fetchShorts_createServerFn_handler",
		importer: () => import("./_ssr/sections.functions-BJWJJ7vl.mjs")
	},
	"8fd72aa0d978550cb13306f7880b2b59971960991a33c1bc535cfc03a0525b49": {
		functionName: "fetchNews_createServerFn_handler",
		importer: () => import("./_ssr/sections.functions-BJWJJ7vl.mjs")
	},
	"93d6630912eb37d4e10ac022dae571517a15b90d115c5d0fdac365ea0168e92d": {
		functionName: "fetchFeedPage_createServerFn_handler",
		importer: () => import("./_ssr/home.functions-COEzye5h.mjs")
	},
	"c767aa88534831a1cc729959885bd521c86e392cb4a5303b08cd8994d3719ba9": {
		functionName: "fetchHome_createServerFn_handler",
		importer: () => import("./_ssr/home.functions-COEzye5h.mjs")
	},
	"e227bd9c0a7746bad584dc96c5aeab809c9393205d7c99d261c99aed330fa863": {
		functionName: "fetchVideos_createServerFn_handler",
		importer: () => import("./_ssr/sections.functions-BJWJJ7vl.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
