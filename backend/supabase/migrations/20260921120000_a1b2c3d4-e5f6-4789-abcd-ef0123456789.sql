-- Best-practice comments schema.
--
-- RELATIONAL (SQL) for everything relational:
--   comments          -> posts + profiles (+ self for replies), all FK CASCADE
--   comment_likes     -> composite PK (user_id, comment_id), like `saves`
--   posts.comments_count denormalized counter, kept by trigger so feeds never
--   pay for COUNT(*) on every render (no heavy reads, no N+1).
--
-- FLEXIBLE (NoSQL-style JSONB) for everything unrelated/schemaless:
--   comments.metadata -> mentions, hashtags, client info, edit history,
--   attachments. No extra tables, no joins, GIN-indexed for ad-hoc queries.

-- ---------------------------------------------------------------- comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Public reads only live comments; authors can always see their own rows.
CREATE POLICY "Comments are viewable when not deleted"
  ON public.comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authors can view their own comments"
  ON public.comments FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can comment as themselves"
  ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
-- Updates are the edit + soft-delete path. No hard DELETE granted.
CREATE POLICY "Users can edit or soft-delete their own comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Keyset pagination (created_at, id): no OFFSET anywhere.
CREATE INDEX comments_post_created_idx ON public.comments (post_id, created_at DESC, id DESC);
CREATE INDEX comments_parent_created_idx ON public.comments (parent_id, created_at ASC) WHERE parent_id IS NOT NULL;
CREATE INDEX comments_metadata_gin ON public.comments USING gin (metadata);

CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------ comment_likes
CREATE TABLE public.comment_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

GRANT SELECT ON public.comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are viewable by everyone"
  ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like as themselves"
  ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike as themselves"
  ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX comment_likes_comment_idx ON public.comment_likes (comment_id);
CREATE INDEX comment_likes_user_idx ON public.comment_likes (user_id);

-- --------------------------------------- denormalized counter (light reads)
ALTER TABLE public.posts ADD COLUMN comments_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE'
    AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE'
    AND OLD.is_deleted = true AND NEW.is_deleted = false THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Backfill for rows predating the counter.
UPDATE public.posts p SET comments_count = (
  SELECT count(*) FROM public.comments c WHERE c.post_id = p.id AND c.is_deleted = false
);

-- ---------------------------------------------------------------- realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
