import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react, o as useQueryClient, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as MapPin, B as House, C as Play, E as Minimize2, K as Film, P as LoaderCircle, R as Image, S as Plus, b as RefreshCw, d as Square, et as Camera, i as Video, k as Maximize2, n as X, o as User, w as Newspaper, x as Radio, z as ImagePlus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BottomNav-CKjeo2P-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Lightweight bottom sheet / overlay.
* Bottom sheets open at half height and can be expanded to cover the whole screen
* by tapping the grabber, the expand button, or dragging upwards.
*/
function Sheet({ open, onClose, title, children, side = "bottom" }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) setExpanded(false);
	}, [open]);
	if (!open) return null;
	const isBottom = side === "bottom";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 mx-auto w-full max-w-3xl",
		role: "dialog",
		"aria-label": title,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			"aria-label": "Close",
			onClick: onClose,
			className: "absolute inset-0 bg-scrim backdrop-blur-[2px]"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${isBottom ? expanded ? "absolute inset-x-0 bottom-0 top-0 rounded-none sm:inset-x-4 sm:top-4 sm:rounded-t-3xl" : "absolute inset-x-0 bottom-0 max-h-[65dvh] rounded-t-3xl sm:inset-x-4 sm:max-h-[70dvh]" : side === "top" ? "absolute inset-x-0 top-0 rounded-b-3xl" : "absolute inset-y-0 left-0 w-[78%] max-w-[320px]"} flex flex-col border border-border bg-background p-4 pb-safe shadow-raise transition-all duration-200 sm:p-5`,
			children: [
				isBottom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					"aria-label": expanded ? "Collapse sheet" : "Expand sheet to full screen",
					onClick: () => setExpanded((v) => !v),
					onTouchStart: (e) => {
						const startY = e.touches[0]?.clientY ?? 0;
						const onEnd = (ev) => {
							const endY = ev.changedTouches[0]?.clientY ?? startY;
							if (startY - endY > 40) setExpanded(true);
							if (endY - startY > 40) setExpanded(false);
							window.removeEventListener("touchend", onEnd);
						};
						window.addEventListener("touchend", onEnd);
					},
					className: "mx-auto -mt-1 mb-2 h-6 w-full max-w-24 shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-auto block h-1.5 w-12 rounded-full bg-border" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center justify-between pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-base font-bold tracking-tight text-foreground",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [isBottom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": expanded ? "Collapse sheet" : "Full screen",
							onClick: () => setExpanded((v) => !v),
							className: "rounded-full p-1.5 hover:bg-secondary",
							children: expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4 text-muted-foreground" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Close",
							onClick: onClose,
							className: "rounded-full p-1.5 hover:bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4 text-muted-foreground" })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children
				})
			]
		})]
	});
}
var defaultBeauty = {
	smooth: 35,
	glow: 25,
	warmth: 15
};
var filterPresets = [
	{
		id: "none",
		label: "Original",
		settings: {
			smooth: 0,
			glow: 0,
			warmth: 0
		}
	},
	{
		id: "natural",
		label: "Natural",
		settings: {
			smooth: 25,
			glow: 15,
			warmth: 10
		}
	},
	{
		id: "smooth",
		label: "Smooth",
		settings: {
			smooth: 60,
			glow: 25,
			warmth: 12
		}
	},
	{
		id: "glow",
		label: "Glow",
		settings: {
			smooth: 45,
			glow: 55,
			warmth: 20
		}
	},
	{
		id: "soft",
		label: "Soft light",
		settings: {
			smooth: 55,
			glow: 40,
			warmth: -10
		}
	},
	{
		id: "warm",
		label: "Sunkissed",
		settings: {
			smooth: 35,
			glow: 25,
			warmth: 60
		}
	},
	{
		id: "cool",
		label: "Cool",
		settings: {
			smooth: 35,
			glow: 20,
			warmth: -55
		}
	},
	{
		id: "mono",
		label: "Mono",
		settings: {
			smooth: 30,
			glow: 20,
			warmth: 0
		},
		extra: "grayscale(1)"
	},
	{
		id: "film",
		label: "Film",
		settings: {
			smooth: 20,
			glow: 10,
			warmth: 25
		},
		extra: "contrast(1.12) saturate(0.85)"
	}
];
/** Builds a CSS `filter` value usable on both <video> and canvas 2D contexts. */
function filterCss(settings, extra, strength = 1) {
	const s = Math.max(0, Math.min(1, strength));
	const smooth = settings.smooth / 100 * s;
	const glow = settings.glow / 100 * s;
	const warmth = settings.warmth / 100 * s;
	const parts = [
		`blur(${(smooth * 1.1).toFixed(2)}px)`,
		`contrast(${(1 + smooth * .12).toFixed(3)})`,
		`brightness(${(1 + glow * .18).toFixed(3)})`,
		`saturate(${(1 + glow * .12 + Math.max(0, warmth) * .15).toFixed(3)})`
	];
	if (warmth > 0) parts.push(`sepia(${(warmth * .35).toFixed(3)})`);
	if (warmth < 0) parts.push(`hue-rotate(${(warmth * 12).toFixed(1)}deg)`);
	if (extra) parts.push(extra);
	return parts.join(" ");
}
/** Bakes the chosen look into a new JPEG file (used for uploads and captures). */
async function applyFilterToFile(file, settings, extra, strength = 1) {
	const bitmap = await createImageBitmap(file);
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return file;
	ctx.filter = filterCss(settings, extra, strength);
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close?.();
	const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", .92));
	if (!blob) return file;
	return new File([blob], file.name.replace(/\.\w+$/, "") + "-filtered.jpg", { type: "image/jpeg" });
}
var titles = {
	photo: "Photo with filters",
	short: "Record a short",
	live: "Go live"
};
function BeautyCameraSheet({ open, mode, onClose, onCapture }) {
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const recorderRef = (0, import_react.useRef)(null);
	const chunksRef = (0, import_react.useRef)([]);
	const [facing, setFacing] = (0, import_react.useState)("user");
	const [preset, setPreset] = (0, import_react.useState)(filterPresets[1] ?? filterPresets[0]);
	const [custom, setCustom] = (0, import_react.useState)(defaultBeauty);
	const [useCustom, setUseCustom] = (0, import_react.useState)(false);
	const [strength, setStrength] = (0, import_react.useState)(1);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const [seconds, setSeconds] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const css = filterCss(useCustom ? custom : preset.settings, useCustom ? void 0 : preset.extra, strength);
	const stop = (0, import_react.useCallback)(() => {
		recorderRef.current?.state === "recording" && recorderRef.current.stop();
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		setReady(false);
		setRecording(false);
		setSeconds(0);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open) {
			stop();
			return;
		}
		let cancelled = false;
		setError(null);
		navigator.mediaDevices?.getUserMedia({
			video: { facingMode: facing },
			audio: mode !== "photo"
		}).then((stream) => {
			if (cancelled) {
				stream.getTracks().forEach((t) => t.stop());
				return;
			}
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.play();
			}
			setReady(true);
		}).catch(() => setError("Camera access was blocked. Allow the camera to use face filters."));
		return () => {
			cancelled = true;
			stop();
		};
	}, [
		open,
		facing,
		mode,
		stop
	]);
	(0, import_react.useEffect)(() => {
		if (!recording) return;
		const id = window.setInterval(() => setSeconds((s) => s + 1), 1e3);
		return () => window.clearInterval(id);
	}, [recording]);
	(0, import_react.useEffect)(() => {
		if (recording && seconds >= 60) stopRecording();
	}, [seconds, recording]);
	async function takePhoto() {
		const video = videoRef.current;
		if (!video) return;
		setBusy(true);
		try {
			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.filter = css;
			if (facing === "user") {
				ctx.translate(canvas.width, 0);
				ctx.scale(-1, 1);
			}
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", .92));
			if (!blob) return;
			onCapture?.(new File([blob], `wizz-${Date.now()}.jpg`, { type: "image/jpeg" }));
			onClose();
		} finally {
			setBusy(false);
		}
	}
	function startRecording() {
		const stream = streamRef.current;
		if (!stream) return;
		chunksRef.current = [];
		const recorder = new MediaRecorder(stream);
		recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
		recorder.onstop = () => {
			const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
			onCapture?.(new File([blob], `wizz-short-${Date.now()}.webm`, { type: blob.type }));
			onClose();
		};
		recorderRef.current = recorder;
		recorder.start();
		setRecording(true);
		setSeconds(0);
	}
	function stopRecording() {
		if (recorderRef.current?.state === "recording") recorderRef.current.stop();
		setRecording(false);
	}
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex flex-col bg-media",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 pt-safe",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Close camera",
						onClick: onClose,
						className: "grid size-10 place-items-center rounded-full bg-scrim",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5 text-media-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold text-media-foreground",
						children: titles[mode]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Flip camera",
						onClick: () => setFacing((f) => f === "user" ? "environment" : "user"),
						className: "grid size-10 place-items-center rounded-full bg-scrim",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-5 text-media-foreground" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mt-3 flex-1 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: videoRef,
						playsInline: true,
						muted: true,
						className: "size-full object-cover",
						style: {
							filter: css,
							transform: facing === "user" ? "scaleX(-1)" : void 0
						}
					}),
					!ready && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 grid place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-media-foreground" })
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 grid place-items-center px-8 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-media-foreground",
							children: error
						})
					}),
					recording && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "absolute left-4 top-4 rounded-full bg-live px-3 py-1 text-xs font-bold text-white",
						children: [
							String(Math.floor(seconds / 60)).padStart(2, "0"),
							":",
							String(seconds % 60).padStart(2, "0"),
							" / 01:00"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 bg-media px-4 pb-safe pt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rail flex gap-2 overflow-x-auto pb-1",
						children: [filterPresets.map((p) => {
							const active = !useCustom && p.id === preset.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setUseCustom(false);
									setPreset(p);
								},
								className: active ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground" : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground",
								children: p.label
							}, p.id);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setUseCustom(true),
							className: useCustom ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground" : "shrink-0 rounded-full bg-scrim px-4 py-1.5 text-xs font-medium text-media-foreground",
							children: "Custom"
						})]
					}),
					useCustom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: [
							[
								"smooth",
								"Skin smoothing",
								0,
								100
							],
							[
								"glow",
								"Glow",
								0,
								100
							],
							[
								"warmth",
								"Warmth",
								-100,
								100
							]
						].map(([key, label, min, max]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-28 shrink-0 text-[11px] text-media-foreground/80",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min,
								max,
								value: custom[key],
								onChange: (e) => setCustom((c) => ({
									...c,
									[key]: Number(e.target.value)
								})),
								className: "w-full accent-[hsl(var(--brand))]"
							})]
						}, key))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-28 shrink-0 text-[11px] text-media-foreground/80",
							children: "Intensity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 0,
							max: 100,
							value: Math.round(strength * 100),
							onChange: (e) => setStrength(Number(e.target.value) / 100),
							className: "w-full accent-[hsl(var(--brand))]"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-center py-2",
						children: [
							mode === "photo" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"aria-label": "Take photo",
								disabled: !ready || busy,
								onClick: takePhoto,
								className: "grid size-16 place-items-center rounded-full bg-brand shadow-create disabled:opacity-50",
								children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-white" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-7 text-white" })
							}),
							mode === "short" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								"aria-label": recording ? "Stop recording" : "Start recording",
								disabled: !ready,
								onClick: recording ? stopRecording : startRecording,
								className: "grid size-16 place-items-center rounded-full bg-live shadow-create disabled:opacity-50",
								children: recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {
									className: "size-6 text-white",
									fill: "currentColor"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-6 rounded-full bg-white" })
							}),
							mode === "live" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									disabled: !ready,
									className: "flex items-center gap-2 rounded-full bg-live px-6 py-3 text-sm font-bold text-white disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4" }), " Go live"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-media-foreground/70",
									children: "Live streaming opens soon — your filter is saved for it."
								})]
							})
						]
					})
				]
			})
		]
	});
}
var TEN_YEARS = 31536e4;
var categories = [
	"For You",
	"Trending",
	"Sports",
	"Music",
	"Tech",
	"Style",
	"Food",
	"Travel"
];
function CreatePostSheet({ open, onClose }) {
	const { user, loading } = useSession();
	const queryClient = useQueryClient();
	const fileRef = (0, import_react.useRef)(null);
	const [photo, setPhoto] = (0, import_react.useState)(null);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [preset, setPreset] = (0, import_react.useState)(filterPresets[0]);
	const [camera, setCamera] = (0, import_react.useState)(false);
	const [caption, setCaption] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)(categories[0] ?? "For You");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [posting, setPosting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setPhoto(null);
		setPreview(null);
		setPreset(filterPresets[0]);
		setCaption("");
		setTags("");
		setLocation("");
		setCategory("For You");
		setError(null);
	}, [open]);
	function pickImage(file) {
		if (file.size > 10485760) {
			setError("Photos must be under 10 MB.");
			return;
		}
		setError(null);
		setPhoto(file);
		setPreview(URL.createObjectURL(file));
	}
	async function uploadPhoto() {
		if (!photo || !user) return null;
		setUploading(true);
		try {
			const baked = preset.id === "none" ? photo : await applyFilterToFile(photo, preset.settings, preset.extra);
			const path = `${user.id}/post-${Date.now()}.jpg`;
			const up = await supabase.storage.from("post-images").upload(path, baked);
			if (up.error) throw up.error;
			const signed = await supabase.storage.from("post-images").createSignedUrl(path, TEN_YEARS);
			if (signed.error) throw signed.error;
			return signed.data.signedUrl;
		} finally {
			setUploading(false);
		}
	}
	async function publish() {
		if (!user) return;
		setPosting(true);
		setError(null);
		try {
			const text = caption.trim();
			if (!text) throw new Error("Write a caption first.");
			const hashtags = [...new Set(tags.split(/[\s,]+/).map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))];
			const uploadedUrl = await uploadPhoto();
			const { error: insertError } = await supabase.from("posts").insert({
				author_id: user.id,
				caption: text,
				image_url: uploadedUrl,
				hashtags,
				location: location.trim() || null,
				category
			});
			if (insertError) throw insertError;
			await Promise.all([queryClient.invalidateQueries({ queryKey: ["my-posts"] }), queryClient.invalidateQueries({ queryKey: ["my-stats"] })]);
			onClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not publish your post.");
		} finally {
			setPosting(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onClose,
		title: "New post",
		children: !loading && !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center px-4 py-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-12 place-items-center rounded-2xl bg-brand-soft",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5 text-brand" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-semibold text-foreground",
					children: "Log in to share a post"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Your posts are saved to your account and appear on your profile."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground",
					children: "Log in or create account"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 pb-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: "image/*",
					className: "hidden",
					onChange: (e) => {
						const file = e.target.files?.[0];
						if (file) pickImage(file);
						e.target.value = "";
					}
				}),
				preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: preview,
							alt: "Photo to post",
							style: { filter: filterCss(preset.settings, preset.extra) },
							className: "max-h-72 w-full rounded-2xl border border-border object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Remove photo",
							onClick: () => {
								setPhoto(null);
								setPreview(null);
							},
							className: "absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-scrim",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4 text-white" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rail flex gap-2 overflow-x-auto pb-1",
						children: filterPresets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPreset(p),
							className: p.id === preset.id ? "shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground" : "shrink-0 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground",
							children: p.label
						}, p.id))
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setCamera(true),
						className: "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-6 text-brand" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-foreground",
								children: "Camera + filters"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Beautify your face"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => fileRef.current?.click(),
						className: "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary py-8",
						children: [
							uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-brand" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-6 text-brand" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-semibold text-foreground",
								children: "Add a photo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "JPG or PNG, 10 MB"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeautyCameraSheet, {
					open: camera,
					mode: "photo",
					onClose: () => setCamera(false),
					onCapture: pickImage
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Caption"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: caption,
							onChange: (e) => setCaption(e.target.value),
							rows: 3,
							maxLength: 500,
							placeholder: "What's happening?",
							className: "mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 block text-right text-[11px] text-muted-foreground",
							children: [caption.length, "/500"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Hashtags"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: tags,
						onChange: (e) => setTags(e.target.value),
						placeholder: "travel, food, livemusic",
						className: "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Location"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: location,
								onChange: (e) => setLocation(e.target.value),
								placeholder: "Dar es Salaam",
								className: "w-full bg-transparent text-sm text-foreground outline-none"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Category"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: category,
							onChange: (e) => setCategory(e.target.value),
							className: "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand",
							children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: c,
								children: c
							}, c))
						})]
					})]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-live",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-foreground",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: publish,
						disabled: posting || uploading || !caption.trim(),
						className: "flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60",
						children: posting ? "Posting…" : "Post"
					})]
				})
			]
		})
	});
}
var left = [{
	to: "/",
	label: "Home",
	Icon: House,
	exact: true
}, {
	to: "/news",
	label: "News",
	Icon: Newspaper,
	exact: false
}];
var right = [
	{
		to: "/shorts",
		label: "Shorts",
		Icon: Play,
		exact: false
	},
	{
		to: "/videos",
		label: "Videos",
		Icon: Film,
		exact: false
	},
	{
		to: "/profile",
		label: "Profile",
		Icon: User,
		exact: false
	}
];
var createActions = [
	{
		label: "Post a photo",
		hint: "Share to your feed",
		Icon: Image
	},
	{
		label: "Record a short",
		hint: "Vertical clip up to 60s",
		Icon: Video
	},
	{
		label: "Upload a video",
		hint: "Long-form for your channel",
		Icon: Camera
	},
	{
		label: "Go live",
		hint: "Start a live room now",
		Icon: Radio
	}
];
function Tab({ to, label, Icon, exact }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		activeOptions: { exact },
		className: "flex min-w-0 flex-1 flex-col items-center gap-1 py-2",
		activeProps: { "aria-current": "page" },
		children: ({ isActive }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: isActive ? "size-5 text-brand" : "size-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: isActive ? "max-w-full truncate text-[9px] font-semibold text-brand min-[390px]:text-[10px]" : "max-w-full truncate text-[9px] font-medium text-muted-foreground min-[390px]:text-[10px]",
			children: label
		})] })
	});
}
function BottomNav() {
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [posting, setPosting] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			"aria-label": "Primary",
			className: "pointer-events-none sticky bottom-0 z-40 px-2 pb-safe sm:px-4 md:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto mx-auto mb-2 flex w-full max-w-2xl items-center rounded-3xl border border-border bg-background/90 px-1 shadow-raise backdrop-blur-xl sm:px-2",
				children: [
					left.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, { ...item }, item.to)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"aria-label": "Create",
						onClick: () => setCreating(true),
						className: "mx-1 grid size-11 place-items-center rounded-full bg-brand shadow-create transition-transform active:scale-95 min-[390px]:mx-2 min-[390px]:size-12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "size-6 text-white",
							strokeWidth: 2.5
						})
					}),
					right.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, { ...item }, item.to))
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
			open: creating,
			onClose: () => setCreating(false),
			title: "Create",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-1",
				children: createActions.map(({ label, hint, Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						if (label === "Post a photo") {
							setCreating(false);
							setPosting(true);
						}
					},
					className: "flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-secondary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-full bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-brand" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex min-w-0 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold text-foreground",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: hint
						})]
					})]
				}, label))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatePostSheet, {
			open: posting,
			onClose: () => setPosting(false)
		})
	] });
}
//#endregion
export { right as i, Sheet as n, left as r, BottomNav as t };
