-- WIZZ chunk 7/7: video posts. Run on its own, after chunk 6.
-- Fully re-runnable. Expected: "Success. No rows returned".
--
-- The composer already let users attach videos, but publish() silently
-- dropped them (posts had nowhere to store a video). video_url holds a
-- long-lived signed URL to the private post-images bucket, same as
-- image_url. No policy change: existing select/update policies cover it.
-- Clients must read/write it defensively (fallback when the column is
-- absent) so old app versions keep working.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';
