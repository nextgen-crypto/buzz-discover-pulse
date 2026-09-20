import { s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Route } from "./u._username.followers-CMOGpYEk.mjs";
import { t as FollowListScreen } from "./FollowListScreen-DU86tWzk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/u._username.followers-Cbs__LBP.js
var import_jsx_runtime = require_jsx_runtime();
function RouteComponent() {
	const { username } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FollowListScreen, {
		username,
		kind: "followers"
	});
}
//#endregion
export { RouteComponent as component };
