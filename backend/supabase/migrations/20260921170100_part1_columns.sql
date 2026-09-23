-- WIZZ chunk 1/3: new columns. Run first, on its own.
-- Expected: "Success. No rows returned".

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'followers', 'private')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'archived', 'deleted')),
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
