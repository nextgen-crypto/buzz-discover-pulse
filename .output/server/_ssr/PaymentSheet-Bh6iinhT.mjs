import { s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { H as HeartHandshake, Y as Crown, it as BadgeCheck, m as ShieldCheck, r as Wallet, t as Zap } from "../_libs/lucide-react.mjs";
import { n as Sheet } from "./BottomNav-CKjeo2P-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PaymentSheet-Bh6iinhT.js
var import_jsx_runtime = require_jsx_runtime();
/** Reasons a payment matters on WIZZ, shown inside the payment sheet. */
var reasons = [
	{
		Icon: HeartHandshake,
		title: "Support creators directly",
		body: "Send a tip to reward the people whose posts, clips and videos you love."
	},
	{
		Icon: Crown,
		title: "Unlock WIZZ Premium",
		body: "Go ad-free, get a premium badge, and post longer videos and clips."
	},
	{
		Icon: Zap,
		title: "Boost your reach",
		body: "Promote a post so it appears in more feeds, trending lists and searches."
	},
	{
		Icon: ShieldCheck,
		title: "Safe and secure",
		body: "Payments are processed by a trusted provider — your card details never touch WIZZ."
	}
];
function PaymentSheet({ open, onClose, creatorName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onClose,
		title: creatorName ? `Support ${creatorName}` : "Payments",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 pb-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded-2xl bg-brand-soft p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 shrink-0 place-items-center rounded-xl bg-brand",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-5 text-brand-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold text-foreground",
						children: creatorName ? `Tip ${creatorName}` : "Why pay on WIZZ?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: creatorName ? "Your tip goes straight to this creator to keep them posting." : "Payments keep WIZZ running and reward the creators you love."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: reasons.map(({ Icon, title, body }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 shrink-0 place-items-center rounded-xl bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4.5 text-brand" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-foreground",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs leading-snug text-muted-foreground",
								children: body
							})]
						})]
					}, title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border p-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4 text-brand" }), " Checkout coming soon"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] text-muted-foreground",
						children: "Secure checkout is being set up. Once live, this button will open card and mobile-money payment options."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "w-full rounded-full bg-brand py-3 text-sm font-bold text-brand-foreground",
					children: "Got it"
				})
			]
		})
	});
}
//#endregion
export { PaymentSheet as t };
