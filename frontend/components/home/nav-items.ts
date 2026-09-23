import {
  Camera,
  Clapperboard,
  Ellipsis,
  Home,
  Image,
  Newspaper,
  Play,
  Radio,
  Type,
  User,
  Zap,
} from "lucide-react";

export const left = [
  { to: "/", label: "Home", Icon: Home, exact: true },
  { to: "/news", label: "News", Icon: Newspaper, exact: false },
] as const;

export const right = [
  { to: "/shorts", label: "Shorts", Icon: Play, exact: false },
  { to: "/videos", label: "Videos", Icon: Clapperboard, exact: false },
  { to: "/profile", label: "Profile", Icon: User, exact: false },
] as const;

export type CreateKind = "photo" | "video" | "story" | "text" | "live" | "more";

export const createActions: {
  kind: CreateKind;
  label: string;
  hint: string;
  Icon: typeof Image;
}[] = [
  { kind: "photo", label: "Photo", hint: "Create a photo post", Icon: Image },
  { kind: "video", label: "Video", hint: "Record or upload a clip", Icon: Clapperboard },
  { kind: "story", label: "Story", hint: "Share something that disappears", Icon: Zap },
  { kind: "text", label: "Text", hint: "Create a text-based post", Icon: Type },
  { kind: "live", label: "Live", hint: "Start a live session", Icon: Radio },
  { kind: "more", label: "More", hint: "Drafts and additional options", Icon: Ellipsis },
];

/** Global creation entry: any surface can dispatch this to open the same engine. */
export function openCreate(kind?: CreateKind) {
  window.dispatchEvent(new CustomEvent("open-create", { detail: { kind } }));
}

/** Camera icon kept for legacy imports. */
export { Camera };
