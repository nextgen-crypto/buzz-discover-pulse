globalThis.__nitro_main__ = import.meta.url;
import { i as HTTPError, n as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-19T06:06:28.743Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/AppShell-DcxwkQLD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5cf-5eZtJT2Y//Srh3myGtyxwGbc6cI\"",
		"mtime": "2026-09-19T06:06:26.141Z",
		"size": 1487,
		"path": "../public/assets/AppShell-DcxwkQLD.js"
	},
	"/assets/FollowListScreen-BTi9HBcL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a7e-sAYJAFyTQSNl2nZaMR4HDlY4rXk\"",
		"mtime": "2026-09-19T06:06:26.142Z",
		"size": 2686,
		"path": "../public/assets/FollowListScreen-BTi9HBcL.js"
	},
	"/assets/BottomNav-DlxyUboM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7684-hbeJz0jiDC01hcsDXLIQLtkexs0\"",
		"mtime": "2026-09-19T06:06:26.141Z",
		"size": 30340,
		"path": "../public/assets/BottomNav-DlxyUboM.js"
	},
	"/assets/TopBar-DLKHZXba.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"503d-TJrymoGw+zb0vDTvjnXkZgX3D3g\"",
		"mtime": "2026-09-19T06:06:26.143Z",
		"size": 20541,
		"path": "../public/assets/TopBar-DLKHZXba.js"
	},
	"/assets/PaymentSheet-Cp6ehIyU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e71-C3iRuM2yBz9Vk4zxhsT8i6abkiQ\"",
		"mtime": "2026-09-19T06:06:26.142Z",
		"size": 3697,
		"path": "../public/assets/PaymentSheet-Cp6ehIyU.js"
	},
	"/assets/auth-DehNMIkR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"21ef-YFjJtxgCLtjD5UOKa3fQ/RPoK2U\"",
		"mtime": "2026-09-19T06:06:26.144Z",
		"size": 8687,
		"path": "../public/assets/auth-DehNMIkR.js"
	},
	"/assets/arrow-left-DQOu9h-m.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5-4nvqwr8fHXz+i46EHLguBT4OdcQ\"",
		"mtime": "2026-09-19T06:06:26.143Z",
		"size": 165,
		"path": "../public/assets/arrow-left-DQOu9h-m.js"
	},
	"/assets/link-BBx7z2RV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"888d-dpuAIxTHE/TQvOZsxxWvv/94Oqg\"",
		"mtime": "2026-09-19T06:06:26.145Z",
		"size": 34957,
		"path": "../public/assets/link-BBx7z2RV.js"
	},
	"/assets/createLucideIcon-BIHbgiCn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4cb-z4AhMxoYnm9K2o5AUMT60sMTMRs\"",
		"mtime": "2026-09-19T06:06:26.145Z",
		"size": 1227,
		"path": "../public/assets/createLucideIcon-BIHbgiCn.js"
	},
	"/assets/media-C6gq5Q9s.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ce-PDYqJS5o4oYbFg3U9BqazwivsV8\"",
		"mtime": "2026-09-19T06:06:26.146Z",
		"size": 1230,
		"path": "../public/assets/media-C6gq5Q9s.js"
	},
	"/assets/news-CDxBwodJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"125e-x+mWwV6rDIc0Iq+8z8pf6cqSkEI\"",
		"mtime": "2026-09-19T06:06:26.146Z",
		"size": 4702,
		"path": "../public/assets/news-CDxBwodJ.js"
	},
	"/assets/profile-DP1hdjr6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300e-Onsb269RoDjtWbBgrQ3DAl/pxZ4\"",
		"mtime": "2026-09-19T06:06:26.146Z",
		"size": 12302,
		"path": "../public/assets/profile-DP1hdjr6.js"
	},
	"/assets/routes-CUbrvFed.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"295-zwKuvKgtHoGVAtZPD/rOJSUz1Wc\"",
		"mtime": "2026-09-19T06:06:26.149Z",
		"size": 661,
		"path": "../public/assets/routes-CUbrvFed.js"
	},
	"/assets/queryOptions-wdSDNjrq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b52-9B7/YfDnvBEx1SPw7UzM8q01Ne8\"",
		"mtime": "2026-09-19T06:06:26.146Z",
		"size": 39762,
		"path": "../public/assets/queryOptions-wdSDNjrq.js"
	},
	"/assets/routes-DbbJjjke.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ede-t1X1BSb+Xtoiy3x+X3GcAVXFVxU\"",
		"mtime": "2026-09-19T06:06:26.149Z",
		"size": 11998,
		"path": "../public/assets/routes-DbbJjjke.js"
	},
	"/assets/redirect-Dhm19zUi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f4-ePZWCXP5uehkmkGMkMl5xDch+/Y\"",
		"mtime": "2026-09-19T06:06:26.147Z",
		"size": 500,
		"path": "../public/assets/redirect-Dhm19zUi.js"
	},
	"/assets/seed-bGP4Vh1T.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2019-KdYcNDOl6K4/+MZkd0zh2OIHe2k\"",
		"mtime": "2026-09-19T06:06:26.150Z",
		"size": 8217,
		"path": "../public/assets/seed-bGP4Vh1T.js"
	},
	"/assets/share-2-Bu991Xdp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"165-pPLAF9AfHYAlm4u8sg5idf4BZRY\"",
		"mtime": "2026-09-19T06:06:26.150Z",
		"size": 357,
		"path": "../public/assets/share-2-Bu991Xdp.js"
	},
	"/assets/shorts-DH90x535.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dbd-L88W6N/MZHECy7IzcNVLWCTtoZ4\"",
		"mtime": "2026-09-19T06:06:26.150Z",
		"size": 3517,
		"path": "../public/assets/shorts-DH90x535.js"
	},
	"/assets/u._username.followers-vEmJyWgY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"106-hMkm/E0HEABjjxYL6fk1qysBxAw\"",
		"mtime": "2026-09-19T06:06:26.151Z",
		"size": 262,
		"path": "../public/assets/u._username.followers-vEmJyWgY.js"
	},
	"/assets/u._username.following-BMP9r30q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"101-uDC09MOAT+6CDonQUL9BuUqchLg\"",
		"mtime": "2026-09-19T06:06:26.151Z",
		"size": 257,
		"path": "../public/assets/u._username.following-BMP9r30q.js"
	},
	"/assets/jsx-runtime-BkSabwWG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c1-VkW1xFbt56H2FC99QIi6PTzaFIo\"",
		"mtime": "2026-09-19T06:06:26.145Z",
		"size": 961,
		"path": "../public/assets/jsx-runtime-BkSabwWG.js"
	},
	"/assets/styles-BjwTEy7j.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"16d63-khxHgbvFNHcqAmf2AS01eHsXOzA\"",
		"mtime": "2026-09-19T06:06:26.154Z",
		"size": 93539,
		"path": "../public/assets/styles-BjwTEy7j.css"
	},
	"/assets/index-Mn6UBYut.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8adfd-f1E4go+PmWc6PGUuKpmRE89X2pw\"",
		"mtime": "2026-09-19T06:06:26.139Z",
		"size": 568829,
		"path": "../public/assets/index-Mn6UBYut.js"
	},
	"/assets/u._username.index-SgTaA0hq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b2-2ypDl7fc5SIIi44RLnCGJbl0LbE\"",
		"mtime": "2026-09-19T06:06:26.151Z",
		"size": 5810,
		"path": "../public/assets/u._username.index-SgTaA0hq.js"
	},
	"/assets/useSession-BEMy-cuM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30b-4Wj6KiHCiOQOStuu/bcuJHGQyUY\"",
		"mtime": "2026-09-19T06:06:26.152Z",
		"size": 779,
		"path": "../public/assets/useSession-BEMy-cuM.js"
	},
	"/assets/useSuspenseQuery-CDeFYCiB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ab-p4sjC1ahuyRVmK6TS+EdvI0qQYg\"",
		"mtime": "2026-09-19T06:06:26.152Z",
		"size": 171,
		"path": "../public/assets/useSuspenseQuery-CDeFYCiB.js"
	},
	"/assets/users-B8mZV7Bl.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"132-BtyC/zi0CAV0h+8n13CfrHjjHOA\"",
		"mtime": "2026-09-19T06:06:26.152Z",
		"size": 306,
		"path": "../public/assets/users-B8mZV7Bl.js"
	},
	"/assets/utils-ClgBrqTa.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6be6-LTdvIzJ6TDb7ZBeeQLe82+YkY3g\"",
		"mtime": "2026-09-19T06:06:26.153Z",
		"size": 27622,
		"path": "../public/assets/utils-ClgBrqTa.js"
	},
	"/assets/videos-W3OB4-qy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1066-TvDz67f6zDPEay9v0sN1m3qkLFU\"",
		"mtime": "2026-09-19T06:06:26.153Z",
		"size": 4198,
		"path": "../public/assets/videos-W3OB4-qy.js"
	},
	"/assets/videos._videoId-BomeHkmK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10bb-7AeCEeg2Fr/UREAc8nnEUbwucoY\"",
		"mtime": "2026-09-19T06:06:26.153Z",
		"size": 4283,
		"path": "../public/assets/videos._videoId-BomeHkmK.js"
	},
	"/assets/welcome-CwpNVJ97.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ea0-7tJY46FuAlKyI/2h2xtBv4XOnfc\"",
		"mtime": "2026-09-19T06:06:26.153Z",
		"size": 3744,
		"path": "../public/assets/welcome-CwpNVJ97.js"
	},
	"/assets/usePublicProfile-cUGVLiKq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12f9-9uuLN9BCOr5+GYYT2yZsKEx0kd0\"",
		"mtime": "2026-09-19T06:06:26.152Z",
		"size": 4857,
		"path": "../public/assets/usePublicProfile-cUGVLiKq.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_3_mMJ4 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_3_mMJ4
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
