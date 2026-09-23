-- WIZZ chunk 6/6: own-content management columns. Run on its own.
-- Fully re-runnable. Expected: "Success. No rows returned".
--
-- Additive only: pin, custom thumbnail (never touches original media),
-- download/remix/duet gates. Existing owner-update policy (author_id = you)
-- already covers these columns — no policy change needed. Visitors see no
-- new indicators; enforcement stays backend-side via RLS.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS allow_downloads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_remix BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_duet BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_author_pinned_idx
  ON public.posts (author_id, created_at DESC) WHERE is_pinned = true;
