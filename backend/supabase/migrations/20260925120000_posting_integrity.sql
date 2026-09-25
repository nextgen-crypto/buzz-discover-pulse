-- WIZZ posting integrity: real settings, scheduled publishing, and 24-hour stories.
-- Re-runnable. Apply after the existing part1-part10 migrations.

-- ---------------------------------------------------------------- storage
-- Buckets used to exist only when a project happened to be created manually.
-- DO UPDATE is intentional: re-applying this migration also repairs a bucket
-- that was previously created public or with an unsafe size allowance.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('post-images', 'post-images', false, 209715200, NULL),
  ('avatars', 'avatars', false, 10485760, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove the historical blanket read immediately. The replacement policy is
-- installed after post media-path columns exist further below.
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own post images" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload post images to their folder" ON storage.objects;
CREATE POLICY "Users can upload post images to their folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar images are readable by authenticated users" ON storage.objects;
CREATE POLICY "Avatar images are readable by authenticated users"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------ post settings
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS allow_sharing BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_kind TEXT NOT NULL DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS story_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS story_overlays JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS story_background TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS thumbnail_path TEXT NOT NULL DEFAULT '';

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_image_path_owner_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_image_path_owner_check
  CHECK (image_path = '' OR split_part(image_path, '/', 1) = author_id::text);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_video_path_owner_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_video_path_owner_check
  CHECK (video_path = '' OR split_part(video_path, '/', 1) = author_id::text);
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_thumbnail_path_owner_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_thumbnail_path_owner_check
  CHECK (thumbnail_path = '' OR split_part(thumbnail_path, '/', 1) = author_id::text);

-- Convert existing Supabase Storage URLs to canonical object paths. Future
-- clients persist only paths and mint short-lived URLs after post RLS succeeds.
UPDATE public.posts
SET image_path = substring(image_url FROM '/render/image/sign/post-images/([^?]+)')
WHERE image_path = ''
  AND image_url LIKE '%/render/image/sign/post-images/%';

UPDATE public.posts
SET image_path = substring(image_url FROM '/render/image/public/post-images/([^?]+)')
WHERE image_path = ''
  AND image_url LIKE '%/render/image/public/post-images/%';

UPDATE public.posts
SET image_path = substring(image_url FROM '/object/sign/post-images/([^?]+)')
WHERE image_path = ''
  AND image_url LIKE '%/object/sign/post-images/%';

UPDATE public.posts
SET image_path = substring(image_url FROM '/object/public/post-images/([^?]+)')
WHERE image_path = ''
  AND image_url LIKE '%/object/public/post-images/%';

UPDATE public.posts
SET video_path = substring(video_url FROM '/object/sign/post-images/([^?]+)')
WHERE video_path = ''
  AND video_url LIKE '%/object/sign/post-images/%';

UPDATE public.posts
SET video_path = substring(video_url FROM '/object/public/post-images/([^?]+)')
WHERE video_path = ''
  AND video_url LIKE '%/object/public/post-images/%';

UPDATE public.posts
SET thumbnail_path = substring(thumbnail_url FROM '/render/image/sign/post-images/([^?]+)')
WHERE thumbnail_path = ''
  AND thumbnail_url LIKE '%/render/image/sign/post-images/%';

UPDATE public.posts
SET thumbnail_path = substring(thumbnail_url FROM '/render/image/public/post-images/([^?]+)')
WHERE thumbnail_path = ''
  AND thumbnail_url LIKE '%/render/image/public/post-images/%';

UPDATE public.posts
SET thumbnail_path = substring(thumbnail_url FROM '/object/sign/post-images/([^?]+)')
WHERE thumbnail_path = ''
  AND thumbnail_url LIKE '%/object/sign/post-images/%';

UPDATE public.posts
SET thumbnail_path = substring(thumbnail_url FROM '/object/public/post-images/([^?]+)')
WHERE thumbnail_path = ''
  AND thumbnail_url LIKE '%/object/public/post-images/%';

-- Stop handing the old long-lived bearer URLs to readers once their canonical
-- paths are known. Previously issued tokens cannot be selectively revoked and
-- must be rotated by project operators if historical confidentiality is needed.
UPDATE public.posts SET image_url = NULL WHERE image_path <> '';
UPDATE public.posts SET video_url = '' WHERE video_path <> '';
UPDATE public.posts SET thumbnail_url = '' WHERE thumbnail_path <> '';

-- Uploaders can always access their own folder (including before first insert).
-- Everyone else can sign only objects referenced by a published post that the
-- current auth context can already SELECT. Posts RLS therefore remains the
-- authorization source for public, followers-only, private, blocked, and story
-- media without granting unrelated users blanket Storage access.
DROP POLICY IF EXISTS "Users can view their own post images" ON storage.objects;
CREATE POLICY "Users can view their own post images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'post-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.posts
        WHERE public.posts.status = 'published'
          AND (storage.foldername(storage.objects.name))[1] = public.posts.author_id::text
          AND (
            public.posts.image_path = storage.objects.name
            OR public.posts.video_path = storage.objects.name
            OR public.posts.thumbnail_path = storage.objects.name
          )
          AND (
            public.posts.content_kind = 'post'
            OR (
              public.posts.content_kind = 'story'
              AND public.posts.story_expires_at > now()
            )
          )
      )
    )
  );

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('published', 'scheduled', 'archived', 'deleted'));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_content_kind_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_kind_check CHECK (content_kind IN ('post', 'story'));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_scheduled_at_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_scheduled_at_check
  CHECK (status <> 'scheduled' OR scheduled_at IS NOT NULL);

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_story_expiry_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_story_expiry_check
  CHECK (content_kind <> 'story' OR story_expires_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS posts_public_feed_idx
  ON public.posts (created_at DESC, id)
  WHERE status = 'published' AND content_kind = 'post';

CREATE INDEX IF NOT EXISTS posts_active_stories_idx
  ON public.posts (story_expires_at DESC, id)
  WHERE status = 'published' AND content_kind = 'story';

CREATE INDEX IF NOT EXISTS posts_image_path_idx
  ON public.posts (image_path) WHERE image_path <> '';
CREATE INDEX IF NOT EXISTS posts_video_path_idx
  ON public.posts (video_path) WHERE video_path <> '';
CREATE INDEX IF NOT EXISTS posts_thumbnail_path_idx
  ON public.posts (thumbnail_path) WHERE thumbnail_path <> '';

-- The original generic notification trigger reads NEW.parent_id even when
-- NEW is a follows/post_likes row. PostgreSQL resolves that record field at
-- execution time, so every follow insert fails with "record new has no field
-- parent_id". Read the optional reply field from JSON and keep the other
-- table-specific fields inside their matching branches.
CREATE OR REPLACE FUNCTION public.notify_social()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  actor_id UUID;
  ref TEXT;
  txt TEXT;
  k TEXT;
  parent_author UUID;
  parent_post UUID;
  reply_parent_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'follows' THEN
    target_id := NEW.followee_id;
    actor_id := NEW.follower_id;
    k := 'follow';
    ref := NEW.follower_id::text;
    txt := 'started following you';
  ELSIF TG_TABLE_NAME = 'post_likes' THEN
    SELECT author_id INTO target_id FROM public.posts WHERE id = NEW.post_id;
    actor_id := NEW.user_id;
    k := 'like';
    ref := NEW.post_id::text;
    txt := 'liked your post';
  ELSIF TG_TABLE_NAME = 'comments' THEN
    SELECT author_id INTO target_id FROM public.posts WHERE id = NEW.post_id;
    actor_id := NEW.author_id;
    k := 'comment';
    ref := NEW.post_id::text;
    txt := 'commented: ' || left(NEW.body, 80);
    reply_parent_id := nullif(to_jsonb(NEW) ->> 'parent_id', '')::uuid;
  ELSIF TG_TABLE_NAME = 'comment_likes' THEN
    SELECT author_id, post_id INTO parent_author, parent_post
    FROM public.comments WHERE id = NEW.comment_id;
    target_id := parent_author;
    actor_id := NEW.user_id;
    k := 'comment_like';
    ref := parent_post::text;
    txt := 'liked your comment';
  END IF;

  IF target_id IS NOT NULL AND target_id <> actor_id THEN
    INSERT INTO public.notifications (user_id, kind, actor_id, ref_id, text)
    VALUES (target_id, k, actor_id, ref, txt);
  END IF;

  IF reply_parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author
    FROM public.comments WHERE id = reply_parent_id;
    IF parent_author IS NOT NULL
       AND parent_author <> actor_id
       AND parent_author <> target_id THEN
      INSERT INTO public.notifications (user_id, kind, actor_id, ref_id, text)
      VALUES (
        parent_author,
        'comment',
        actor_id,
        ref,
        'replied: ' || left(NEW.body, 80)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_social() FROM PUBLIC;

-- Feed-event aggregation runs inside the trigger, so the inserting user's RLS
-- must not block the trigger's post_stats write. Keep execution locked to the
-- trigger owner; callers can only affect rows they are already authorized to
-- insert into feed_events.
CREATE OR REPLACE FUNCTION public.update_post_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.post_stats (post_id) VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;
  IF NEW.event = 'video_impression' THEN
    UPDATE public.post_stats
    SET impressions = impressions + 1, updated_at = now()
    WHERE post_id = NEW.post_id;
  ELSIF NEW.event = 'video_play' THEN
    UPDATE public.post_stats
    SET plays = plays + 1, updated_at = now()
    WHERE post_id = NEW.post_id;
  ELSIF NEW.event = 'video_complete' THEN
    UPDATE public.post_stats
    SET completes = completes + 1, updated_at = now()
    WHERE post_id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_post_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_post_stats() TO service_role;

-- Feed reads used to invoke this opportunistically, which meant a scheduled
-- post could remain unpublished forever when nobody happened to open Home.
-- pg_cron below makes publication independent of application traffic.
CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
BEGIN
  UPDATE public.posts
  SET status = 'published', updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_due_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_due_posts() TO service_role;

-- Supabase hosts pg_cron. Named schedule calls upsert by job name, so repeated
-- migrations preserve one job without resetting its history or active state.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

DO $$
BEGIN
  PERFORM cron.schedule(
    'wizz-publish-due-posts',
    '* * * * *',
    'SELECT public.publish_due_posts()'
  );
END;
$$;

-- The composer probes this before exposing schedule/story controls. This keeps
-- a partially applied migration (columns present, cron job absent) fail-closed.
CREATE OR REPLACE FUNCTION public.posting_integrity_ready()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'wizz-publish-due-posts'
      AND active
  ) AND EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'post-images' AND public = false
  ) AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can view their own post images'
      AND command = 'SELECT'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'image_path'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'video_path'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'thumbnail_path'
  );
$$;

REVOKE ALL ON FUNCTION public.posting_integrity_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.posting_integrity_ready() TO service_role;

-- Owners must be able to read archived/deleted/scheduled rows so the recovery
-- UI can list and restore them. Everyone else still gets the privacy/status
-- gate below.
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts respect visibility and status" ON public.posts;
CREATE POLICY "Posts respect visibility and status"
  ON public.posts FOR SELECT USING (
    auth.uid() = author_id
    OR (
      status = 'published'
      AND (
        visibility = 'public'
        OR (
          visibility = 'followers'
          AND public.is_following(auth.uid(), posts.author_id)
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = posts.author_id AND blocked_id = auth.uid())
           OR (blocker_id = auth.uid() AND blocked_id = posts.author_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = posts.author_id
          AND p.is_private
          AND p.id <> auth.uid()
          AND NOT public.is_following(auth.uid(), p.id)
      )
    )
  );

-- PostgreSQL combines permissive policies with OR. Fail closed if dashboard
-- drift added another read policy instead of silently preserving a bypass.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'posts'
      AND command IN ('SELECT', 'ALL')
      AND policyname <> 'Posts respect visibility and status'
  ) THEN
    RAISE EXCEPTION 'Unexpected SELECT policy on public.posts; review it before retrying migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND command IN ('SELECT', 'ALL')
      AND policyname NOT IN (
        'Users can view their own post images',
        'Avatar images are readable by authenticated users'
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected SELECT policy on storage.objects; review it before retrying migration';
  END IF;
END;
$$;
