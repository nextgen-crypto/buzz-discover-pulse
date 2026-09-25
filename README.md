# WIZZ

WIZZ is a social app for creating and discovering photo and short-video posts:
a personalized home feed, videos, news, DMs, profiles with owner content
management, a native advertising platform, and a desktop admin console.

**Stack:** TanStack Start (SSR) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Storage, Realtime) · TanStack Query + Router ·
Capacitor (Android shell) · Deployed on Vercel (Nitro preset).

## Monorepo layout

```
frontend/          UI: routes, screens, components, hooks, queries, lib
  routes/          TanStack Router pages (srcDirectory for tanstackStart)
  screens/         Page-level components (Home, Videos, News, Messages, …)
  components/      home/ profile/ create/ ads/ admin/ overlays/ …
  hooks/           Data + realtime hooks (refcounted shared-channel helper)
  queries/         React Query option builders
  lib/             Client utilities (uploads, error reporting)
backend/           Server: API, services, cache, domain, integrations
  api/             Server functions (*.functions.ts — ship to handlers only)
  services/        feedService (v3 personalized ranker), …
  cache/           Redis-contract cache (Upstash when configured, memory otherwise)
  domain/          Shared types + media URL builders
  integrations/    Supabase clients (browser / server / middleware)
  supabase/        Migrations (source of truth for schema + RLS)
migration/         One-off storage-migration helpers (Node built-ins only)
```

`@/` maps to the repo root, so `@/frontend/...` and `@/backend/...` work
everywhere.

## Quick start

```sh
npm i
cp .env.example .env   # if present, otherwise create .env (see below)
npm run dev            # http://localhost:3000
npm run build          # must stay green before every commit
```

### Environment

| Variable                                                     | Where                   | Purpose                                                         |
| ------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL`                         | client + server         | Supabase project URL                                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | client + server         | Anon/publishable key                                            |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | server only, gitignored | Bypasses RLS — never use a `VITE_` prefix, never commit         |
| `VITE_ADMIN_EMAILS`                                          | client                  | Comma-separated allowlist that unlocks `/admin`                 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`        | server, optional        | Shared cache across instances (falls back to in-process memory) |

## Database

Run migrations **in order** in the Supabase dashboard → SQL editor
(each file is re-runnable and reports success independently):

1. Base tables (`20260903…`, `20260908…`, `20260910…`, `20260914…`,
   `2026092112/13/14/15/16…`) — profiles, posts, follows, saves, comments,
   events/stats, reports, likes, notifications
2. `20260921170100_part1_columns.sql` — visibility, status, privacy columns
3. `20260921170200_part2_tables.sql` — blocks, follow requests, DMs, audit
4. `20260921170300_part3_policies.sql` — RLS policies, triggers, realtime
5. `20260921170500_part5_ads.sql` — ad campaigns, events, exposures, payments
6. `20260921170600_part6_content.sql` — pin, thumbnails, remix/duet gates
7. `20260921170700_part7_video.sql` — `video_url` for video posts
8. `20260925120000_posting_integrity.sql` — private storage/RLS, post settings,
   follow-notification repair, cron-backed scheduled publishing, 24-hour stories,
   and owner recovery visibility

Schema conventions: relational tables + JSONB `metadata` for schemaless
fields, denormalized counters maintained by triggers, cursor/keyset
pagination everywhere (no `OFFSET`).

## Features

- **Home feed** — v3 ranker (personalized / fresh / discovery lanes, diversity
  interleave, stable cursors), event tracking, hide/mute/not-interested.
- **Create** — photo / video / story / text composer with filters, drafts,
  server-resized uploads. Video posts play full-form in feed and profile Clips.
- **Owner content center** — Manage sheet per post: analytics, pin, custom
  thumbnail, visibility, comment/download/remix/duet gates, archive, soft
  delete → Recently Deleted → restore / wipe. All writes verify ownership
  backend-side via RLS; the UI never relies on hidden buttons.
- **Ads platform** — owner Promote flow (objective → package → budget →
  review → approval), native sponsored slot every 5th feed item with rotation
  and frequency caps, viewport-counted impressions, Why/Hide/Report/Mute,
  advertiser campaign list, admin review console.
- **Social** — follows + private-account requests, likes, comments, saves,
  shares, DMs (conversations/messages with realtime), blocks, reports.
- **News, Videos, Watch, Blend co-watch, Showcase** sections.
- **Admin console (`/admin`, desktop-only)** — overview, users, content,
  moderation, payments, creators, advertising, showcase, notifications,
  analytics, config, roles, audit. Gated by `VITE_ADMIN_EMAILS`.

## Caching & speed

- Server: cache-aside with intentional TTLs (feed 60s, trending 45s, …);
  publishers invalidate by prefix, never flush. Admin → System health shows
  the active backend and hit/miss counters.
- Client: 30s stale / 10-min retained queries, no refetch on window focus,
  lazy media with responsive renditions, uploads request server-resized
  variants so feeds never download originals.

## Android

Capacitor shell in `android/` (not committed — local tooling only):

```sh
npx cap sync android   # copy web assets + update plugins
npx cap open android   # open in Android Studio
```

`capacitor.config.ts` may point `server.url` at the deployed site (live-load
mode); remove it to bundle local assets for offline testing.

## Scripts

| Command                           | Purpose                       |
| --------------------------------- | ----------------------------- |
| `npm run dev`                     | Local dev server              |
| `npm run build`                   | Production build (keep green) |
| `npm run preview`                 | Preview the build             |
| `npm run lint` / `npm run format` | ESLint / Prettier             |

## Working agreements

- Never rewrite published git history on `main`.
- Every commit builds and degrades gracefully when backend tables are missing.
- Admin stays desktop-only; UI stays monochrome with tiny brand accents.
