# WIZZ — agent working agreement

> [!IMPORTANT]
> Never rewrite published git history — no force pushing, rebasing, amending,
> or squashing commits that are already pushed to `main`.

Keep the branch in a working state: every commit should build (`npm run build`)
and keep the app's graceful-degradation guarantees (missing backend tables must
fall back to local/demo data, never blank screens).
