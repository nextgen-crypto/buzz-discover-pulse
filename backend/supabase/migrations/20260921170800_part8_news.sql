-- WIZZ chunk 8/8: news stories model. Run on its own.
-- Fully re-runnable. Expected: "Success. No rows returned".
--
-- News stories aggregate REAL posts (no duplicated content):
--   news_stories         curated topics (admin/service-role writes)
--   story_posts          post membership + Top ranking score
--   story_relevant_people  curated accounts per story
--   story_follows/saves  per-user story subscriptions (RLS: own rows only)
--   trending_topics      ranked topic list under the story feed
-- Clients read defensively: when these tables are absent the UI falls back
-- to hashtag-derived stories built live from public.posts.

-- ------------------------------------------------------------ stories
CREATE TABLE IF NOT EXISTS public.news_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 200),
  summary TEXT NOT NULL DEFAULT '' CHECK (char_length(summary) <= 3000),
  summary_short TEXT NOT NULL DEFAULT '' CHECK (char_length(summary_short) <= 300),
  category TEXT NOT NULL DEFAULT 'News',
  state TEXT NOT NULL DEFAULT 'developing'
    CHECK (state IN ('breaking', 'developing', 'updated', 'trending', 'live', 'archived')),
  cover_image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_stories TO anon;
GRANT SELECT ON public.news_stories TO authenticated;
GRANT ALL ON public.news_stories TO service_role;

ALTER TABLE public.news_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories are public" ON public.news_stories;
CREATE POLICY "Stories are public"
  ON public.news_stories FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS news_stories_created_idx
  ON public.news_stories (created_at DESC);

-- -------------------------------------------------------- story posts
CREATE TABLE IF NOT EXISTS public.story_posts (
  story_id UUID NOT NULL REFERENCES public.news_stories(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  relevance_score INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, post_id)
);

GRANT SELECT ON public.story_posts TO anon;
GRANT SELECT ON public.story_posts TO authenticated;
GRANT ALL ON public.story_posts TO service_role;

ALTER TABLE public.story_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Story posts are public" ON public.story_posts;
CREATE POLICY "Story posts are public"
  ON public.story_posts FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS story_posts_story_idx
  ON public.story_posts (story_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS story_posts_added_idx
  ON public.story_posts (story_id, added_at DESC);

-- ---------------------------------------------------- relevant people
CREATE TABLE IF NOT EXISTS public.story_relevant_people (
  story_id UUID NOT NULL REFERENCES public.news_stories(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank INT NOT NULL DEFAULT 0,
  PRIMARY KEY (story_id, profile_id)
);

GRANT SELECT ON public.story_relevant_people TO anon;
GRANT SELECT ON public.story_relevant_people TO authenticated;
GRANT ALL ON public.story_relevant_people TO service_role;

ALTER TABLE public.story_relevant_people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Relevant people are public" ON public.story_relevant_people;
CREATE POLICY "Relevant people are public"
  ON public.story_relevant_people FOR SELECT USING (true);

-- ------------------------------------------------------ story follows
CREATE TABLE IF NOT EXISTS public.story_follows (
  story_id UUID NOT NULL REFERENCES public.news_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.story_follows TO authenticated;
GRANT ALL ON public.story_follows TO service_role;

ALTER TABLE public.story_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own story follows" ON public.story_follows;
CREATE POLICY "Users manage their own story follows"
  ON public.story_follows FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------- story saves
CREATE TABLE IF NOT EXISTS public.story_saves (
  story_id UUID NOT NULL REFERENCES public.news_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.story_saves TO authenticated;
GRANT ALL ON public.story_saves TO service_role;

ALTER TABLE public.story_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own story saves" ON public.story_saves;
CREATE POLICY "Users manage their own story saves"
  ON public.story_saves FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS story_saves_user_idx
  ON public.story_saves (user_id, created_at DESC);

-- ---------------------------------------------------- trending topics
CREATE TABLE IF NOT EXISTS public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  context TEXT NOT NULL DEFAULT '' CHECK (char_length(context) <= 80),
  post_count INT NOT NULL DEFAULT 0 CHECK (post_count >= 0),
  rank INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trending_topics TO anon;
GRANT SELECT ON public.trending_topics TO authenticated;
GRANT ALL ON public.trending_topics TO service_role;

ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trending topics are public" ON public.trending_topics;
CREATE POLICY "Trending topics are public"
  ON public.trending_topics FOR SELECT USING (true);

INSERT INTO public.trending_topics (label, context, post_count, rank)
VALUES
  ('SGR', 'Tanzania · Trending', 0, 1),
  ('Simba SC', 'Sports · Trending', 0, 2),
  ('Bongo Flava', 'Music · Trending', 0, 3),
  ('Tech', 'Trending in Tanzania', 0, 4),
  ('Yanga', 'Sports · Trending', 0, 5)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------- upkeep
CREATE OR REPLACE FUNCTION public.touch_news_story_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.touch_news_story_updated_at() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS news_stories_touch ON public.news_stories;
CREATE TRIGGER news_stories_touch
  BEFORE UPDATE ON public.news_stories FOR EACH ROW
  EXECUTE FUNCTION public.touch_news_story_updated_at();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.story_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
