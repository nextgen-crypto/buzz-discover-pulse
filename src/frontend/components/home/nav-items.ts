import { Camera, Film, Home, Image, Newspaper, Play, Radio, User, Video } from "lucide-react";

export const left = [
  { to: "/", label: "Home", Icon: Home, exact: true },
  { to: "/news", label: "News", Icon: Newspaper, exact: false },
] as const;

export const right = [
  { to: "/shorts", label: "Shorts", Icon: Play, exact: false },
  { to: "/videos", label: "Videos", Icon: Film, exact: false },
  { to: "/profile", label: "Profile", Icon: User, exact: false },
] as const;

export const createActions = [
  { label: "Post a photo", hint: "Share to your feed", Icon: Image },
  { label: "Record a short", hint: "Vertical clip up to 60s", Icon: Video },
  { label: "Upload a video", hint: "Long-form for your channel", Icon: Camera },
  { label: "Go live", hint: "Start a live room now", Icon: Radio },
] as const;