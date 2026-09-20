import { n as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BGCApjy7.mjs";
import { c as require_react, i as useQuery, o as useQueryClient, s as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useSession } from "./useSession-DJ-WzgJZ.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { _ as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Play, P as LoaderCircle, U as Grid3x3, c as UserPlus, et as Camera, g as Settings, h as Share2, it as BadgeCheck, j as LogOut, r as Wallet, tt as Bookmark, z as ImagePlus } from "../_libs/lucide-react.mjs";
import { n as Sheet } from "./BottomNav-CKjeo2P-.mjs";
import { i as useMyStats, n as useMyPosts, r as useMyProfile } from "./TopBar-CY7eXg8a.mjs";
import { t as AppShell } from "./AppShell-DkIGg9aa.mjs";
import { t as PaymentSheet } from "./PaymentSheet-Bh6iinhT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-DuVRVfGB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TEN_YEARS = 31536e4;
function EditProfileSheet({ open, onClose, userId, profile, fallbackName }) {
	const queryClient = useQueryClient();
	const fileRef = (0, import_react.useRef)(null);
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [username, setUsername] = (0, import_react.useState)("");
	const [bio, setBio] = (0, import_react.useState)("");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setDisplayName(profile?.display_name ?? fallbackName ?? "");
		setUsername(profile?.username ?? "");
		setBio(profile?.bio ?? "");
		setAvatarUrl(profile?.avatar_url ?? null);
		setError(null);
		setNotice(null);
	}, [
		open,
		profile,
		fallbackName
	]);
	async function pickAvatar(file) {
		setUploading(true);
		setError(null);
		try {
			const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
			const path = `${userId}/avatar-${Date.now()}.${ext}`;
			const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
			if (up.error) throw up.error;
			const signed = await supabase.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
			if (signed.error) throw signed.error;
			setAvatarUrl(signed.data.signedUrl);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not upload that picture.");
		} finally {
			setUploading(false);
		}
	}
	async function save() {
		setSaving(true);
		setError(null);
		setNotice(null);
		const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
		try {
			if (!displayName.trim()) throw new Error("Please add a name.");
			if (!cleanUsername) throw new Error("Please add a username.");
			const payload = {
				id: userId,
				username: cleanUsername,
				display_name: displayName.trim(),
				bio: bio.trim(),
				avatar_url: avatarUrl
			};
			const { error: upsertError } = await supabase.from("profiles").upsert(payload);
			if (upsertError) throw upsertError;
			await supabase.auth.updateUser({ data: {
				full_name: displayName.trim(),
				avatar_url: avatarUrl
			} });
			await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
			setNotice("Profile updated.");
			setTimeout(onClose, 500);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Could not save your profile.";
			setError(message.includes("duplicate") ? "That username is already taken." : message);
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onClose,
		title: "Edit profile",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[70dvh] space-y-4 overflow-y-auto pb-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatarUrl,
								alt: "Your profile picture",
								className: "size-16 rounded-2xl border border-border object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-16 place-items-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground",
								children: (displayName || "B").slice(0, 1).toUpperCase()
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => fileRef.current?.click(),
								"aria-label": "Change profile picture",
								className: "absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-brand text-brand-foreground",
								children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-3.5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-foreground",
							children: "Profile picture"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "JPG or PNG, up to 5 MB."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "image/*",
							className: "hidden",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) pickAvatar(file);
								e.target.value = "";
							}
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: displayName,
						onChange: (e) => setDisplayName(e.target.value),
						placeholder: "Your name",
						className: "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-muted-foreground",
						children: "Username"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: username,
						onChange: (e) => setUsername(e.target.value),
						placeholder: "username",
						className: "mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: "Bio"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: bio,
							onChange: (e) => setBio(e.target.value),
							rows: 3,
							maxLength: 280,
							placeholder: "Tell people what you post about",
							className: "mt-1 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 block text-right text-[11px] text-muted-foreground",
							children: [bio.length, "/280"]
						})
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-live",
					children: error
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold text-brand",
					children: notice
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-foreground",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: save,
						disabled: saving || uploading,
						className: "flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60",
						children: saving ? "Saving…" : "Save changes"
					})]
				})
			]
		})
	});
}
/** Posts the signed-in user has saved. */
function useSavedPosts(userId) {
	return useQuery({
		queryKey: ["saved-posts", userId],
		enabled: Boolean(userId),
		staleTime: 3e4,
		queryFn: async () => {
			if (!userId) return [];
			const { data, error } = await supabase.from("saves").select("post_id, created_at, posts(id, caption, image_url, created_at)").eq("user_id", userId).order("created_at", { ascending: false });
			if (error) throw error;
			return (data ?? []).map((row) => row.posts).filter((p) => Boolean(p));
		}
	});
}
var compact = new Intl.NumberFormat("en", { notation: "compact" });
var tabs = [
	{
		id: "grid",
		label: "Posts",
		Icon: Grid3x3
	},
	{
		id: "clips",
		label: "Clips",
		Icon: Play
	},
	{
		id: "saved",
		label: "Saved",
		Icon: Bookmark
	}
];
function ProfileScreen() {
	const { session, loading, user: authUser, displayName, email, avatarUrl } = useSession();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const userId = authUser?.id ?? null;
	const { data: myProfile } = useMyProfile(userId);
	const { data: myPosts = [] } = useMyPosts(userId);
	const { data: stats } = useMyStats(userId);
	const { data: savedPosts = [] } = useSavedPosts(userId);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [payOpen, setPayOpen] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)("grid");
	async function signOut() {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/welcome",
			replace: true
		});
	}
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4 pt-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 w-full animate-pulse rounded-2xl bg-secondary" })
		})
	});
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Profile",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center px-6 pt-16 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-16 place-items-center rounded-2xl bg-brand-soft",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-7 text-brand" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-bold tracking-tight text-foreground",
					children: "Sign in to view your profile"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Create an account or log in to see your posts, followers and saves. You can keep browsing other people's profiles without an account."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground",
					children: "Log in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					className: "mt-2 w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground",
					children: "Create account"
				})
			]
		})
	});
	const shownName = myProfile?.display_name ?? displayName ?? "Your profile";
	const shownAvatar = myProfile?.avatar_url ?? avatarUrl;
	const shownHandle = myProfile?.username ?? email ?? "you";
	const shownBio = myProfile?.bio?.trim() ? myProfile.bio : "";
	const gridPosts = tab === "grid" ? myPosts : tab === "saved" ? savedPosts : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Profile",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 bg-gradient-to-b from-brand to-brand/70 sm:h-36" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "-mt-10 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3",
						children: [shownAvatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: shownAvatar,
							alt: shownName,
							className: "size-20 rounded-2xl border-4 border-background object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-20 place-items-center rounded-2xl border-4 border-background bg-brand text-2xl font-bold text-brand-foreground",
							children: shownName.slice(0, 1).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex min-w-0 flex-wrap items-center justify-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Share profile",
									className: "grid size-9 place-items-center rounded-full bg-secondary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4 text-foreground" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Settings",
									onClick: () => setEditing(true),
									className: "grid size-9 place-items-center rounded-full bg-secondary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4 text-foreground" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setPayOpen(true),
									className: "rounded-full bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground sm:px-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }), " Pay"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setEditing(true),
									className: "rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-foreground sm:px-4",
									children: "Edit profile"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: signOut,
									"aria-label": "Sign out",
									className: "grid size-9 place-items-center rounded-full bg-secondary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4 text-foreground" })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "min-w-0 break-words text-xl font-bold tracking-tight text-foreground",
							children: shownName
						}), myProfile?.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-4.5 text-brand" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: shownHandle.includes("@") ? shownHandle : `@${shownHandle}`
					}),
					shownBio ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-snug text-foreground",
						children: shownBio
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setEditing(true),
						className: "mt-2 text-sm font-semibold text-brand",
						children: "Add a bio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-secondary py-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base font-bold text-foreground",
								children: compact.format(stats?.posts ?? 0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium tracking-wider text-muted-foreground",
								children: "POSTS"
							})]
						}), ["followers", "following"].map((kind) => myProfile?.username ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: kind === "followers" ? "/u/$username/followers" : "/u/$username/following",
							params: { username: myProfile.username },
							className: "rounded-2xl bg-secondary py-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base font-bold text-foreground",
								children: compact.format((kind === "followers" ? stats?.followers : stats?.following) ?? 0)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium tracking-wider text-muted-foreground",
								children: kind.toUpperCase()
							})]
						}, kind) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-secondary py-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base font-bold text-foreground",
								children: "0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium tracking-wider text-muted-foreground",
								children: kind.toUpperCase()
							})]
						}, kind))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex rounded-full bg-secondary p-1",
						children: tabs.map(({ id, label, Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setTab(id),
							"aria-label": label,
							className: cn("flex flex-1 items-center justify-center rounded-full py-2", tab === id && "bg-background shadow-raise"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4.5", tab === id ? "text-brand" : "text-muted-foreground") })
						}, id))
					})
				]
			}),
			gridPosts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid grid-cols-3 gap-0.5 sm:grid-cols-4",
				children: gridPosts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children: p.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.image_url,
						alt: p.caption || "Post",
						loading: "lazy",
						className: "aspect-square w-full bg-surface-strong object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid aspect-square w-full place-items-center bg-secondary p-2 text-center text-[11px] text-muted-foreground",
						children: p.caption.slice(0, 60)
					})
				}, p.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col items-center px-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-14 place-items-center rounded-2xl bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-6 text-muted-foreground" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm font-semibold text-foreground",
						children: tab === "grid" ? "No posts yet" : tab === "clips" ? "No clips yet" : "Nothing saved yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: tab === "saved" ? "Posts you save will be collected here." : "Anything you share will show up here."
					})
				]
			}),
			authUser && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProfileSheet, {
				open: editing,
				onClose: () => setEditing(false),
				userId: authUser.id,
				profile: myProfile ?? null,
				fallbackName: displayName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentSheet, {
				open: payOpen,
				onClose: () => setPayOpen(false)
			})
		]
	});
}
var SplitComponent = ProfileScreen;
//#endregion
export { SplitComponent as component };
