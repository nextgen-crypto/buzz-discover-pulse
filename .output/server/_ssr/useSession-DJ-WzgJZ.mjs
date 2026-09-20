import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useSession-DJ-WzgJZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/** Live Supabase session for the browser; null while signed out. */
function useSession() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let active = true;
		const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
			if (!active) return;
			setSession(next);
			setLoading(false);
		});
		supabase.auth.getSession().then(({ data }) => {
			if (!active) return;
			setSession(data.session);
			setLoading(false);
		});
		return () => {
			active = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	const meta = session?.user.user_metadata ?? {};
	return {
		session,
		loading,
		user: session?.user ?? null,
		email: session?.user.email ?? null,
		displayName: meta["full_name"] ?? meta["name"] ?? session?.user.email?.split("@")[0] ?? null,
		avatarUrl: meta["avatar_url"] ?? meta["picture"] ?? null
	};
}
//#endregion
export { useSession as t };
