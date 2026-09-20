import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { _ as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as LoaderCircle, st as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as createLovableAuth } from "../_libs/lovable.dev__cloud-auth-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-Dj8n2PNI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var lovableAuth = createLovableAuth();
var lovable = { auth: { signInWithOAuth: async (provider, opts) => {
	const result = await lovableAuth.signInWithOAuth(provider, {
		...opts,
		extraParams: { ...opts?.extraParams }
	});
	if (result.redirected) return result;
	if (result.error) return result;
	try {
		await supabase.auth.setSession(result.tokens);
	} catch (e) {
		return { error: e instanceof Error ? e : new Error(String(e)) };
	}
	return result;
} } };
function AuthScreen() {
	const navigate = useNavigate();
	const { session, loading: sessionLoading } = useSession();
	const [mode, setMode] = (0, import_react.useState)("signup");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!sessionLoading && session) navigate({
			to: "/",
			replace: true
		});
	}, [
		session,
		sessionLoading,
		navigate
	]);
	async function submit(e) {
		e.preventDefault();
		setError(null);
		setNotice(null);
		setBusy(true);
		try {
			if (mode === "signup") {
				const { data, error: err } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: window.location.origin,
						data: { full_name: name || email.split("@")[0] }
					}
				});
				if (err) throw err;
				if (!data.session) setNotice("Check your inbox and tap the confirmation link to finish creating your account.");
			} else {
				const { error: err } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (err) throw err;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
		} finally {
			setBusy(false);
		}
	}
	async function google() {
		setError(null);
		setBusy(true);
		const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
		if (result.error) {
			setError("Google sign-in didn't complete. Try again.");
			setBusy(false);
			return;
		}
		if (result.redirected) return;
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-background px-5 pb-10 pt-6 sm:px-8 sm:pt-8 md:justify-center md:border-x md:border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/welcome",
				className: "mb-6 inline-flex size-9 items-center justify-center rounded-full bg-secondary",
				"aria-label": "Back",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4 text-foreground" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-3xl font-extrabold tracking-tight text-title",
				children: "WIZZ"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-2xl font-bold tracking-tight text-foreground",
				children: mode === "signup" ? "Create your account" : "Welcome back"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: mode === "signup" ? "Follow creators, post photos and shorts, and keep your feed in sync." : "Sign in to pick up your feed where you left off."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex rounded-full bg-secondary p-1",
				children: ["signup", "signin"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setMode(m);
						setError(null);
						setNotice(null);
					},
					className: cn("flex-1 rounded-full py-2 text-sm font-semibold", mode === m ? "bg-background text-foreground shadow-raise" : "text-muted-foreground"),
					children: m === "signup" ? "Sign up" : "Sign in"
				}, m))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "mt-5 flex flex-col gap-3",
				children: [
					mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "Display name",
						autoComplete: "name",
						className: "w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "Email",
						autoComplete: "email",
						className: "w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						required: true,
						type: "password",
						minLength: 6,
						value: password,
						onChange: (e) => setPassword(e.target.value),
						placeholder: "Password",
						autoComplete: mode === "signup" ? "new-password" : "current-password",
						className: "w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-live",
						children: error
					}),
					notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-brand",
						children: notice
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: busy,
						className: "mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-brand-foreground disabled:opacity-60",
						children: [busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), mode === "signup" ? "Create account" : "Sign in"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "my-5 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "or"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: google,
				disabled: busy,
				className: "inline-flex items-center justify-center gap-3 rounded-full border border-border bg-background py-3 text-sm font-semibold text-foreground disabled:opacity-60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleMark, {}), "Continue with Google"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-xs leading-relaxed text-muted-foreground",
				children: "By continuing you agree to the WIZZ community guidelines and privacy policy."
			})
		]
	});
}
function GoogleMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		className: "size-4.5",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#EA4335",
				d: "M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.9 17.7 9.5 24 9.5z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#4285F4",
				d: "M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.7c-.3 2.1-1.6 5.3-4.7 7.4l7.6 5.9c4.5-4.2 6.9-10.3 6.9-17.3z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#FBBC05",
				d: "M10.4 28.4a14.8 14.8 0 0 1 0-8.8l-7.8-6.1a23.6 23.6 0 0 0 0 21l7.8-6.1z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#34A853",
				d: "M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2 1.4-4.8 2.4-7.7 2.4-6.3 0-11.7-4.4-13.6-10.4l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
			})
		]
	});
}
var SplitComponent = AuthScreen;
//#endregion
export { SplitComponent as component };
