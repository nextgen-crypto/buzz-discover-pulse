-- Event tracking + public aggregates for engagement-rate ranking.
--
-- RELATIONAL: feed_events (one row per interaction, FK to profiles, index-first
-- reads) and post_stats (one row per post, maintained by trigger — feeds read
-- ONE small row instead of COUNT(*)ing events, no heavy reads).
-- NOSQL: feed_events.meta JSONB for schemaless context (progress pct, source
-- surface, client). post_id is TEXT (not FK) because demo/seed ids are strings.

CREATE TABLE public.feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (char_length(event) BETWEEN 1 AND 40),
  post_id TEXT NOT NULL,
  author_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feed_events TO authenticated;
GRANT ALL ON public.feed_events TO service_role;

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

-- Users see only their own raw events; aggregates go through post_stats.
CREATE POLICY "Users can view their own events"
  ON public.feed_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can track as themselves"
  ON public.feed_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX feed_events_user_created_idx ON public.feed_events (user_id, created_at DESC);
CREATE INDEX feed_events_post_event_idx ON public.feed_events (post_id, event);

-- Public per-post counters, trigger-maintained (cheap single-row reads).
CREATE TABLE public.post_stats (
  post_id TEXT PRIMARY KEY,
  impressions INTEGER NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  completes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.post_stats TO anon;
GRANT SELECT ON public.post_stats TO authenticated;
GRANT ALL ON public.post_stats TO service_role;

ALTER TABLE public.post_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post stats are viewable by everyone"
  ON public.post_stats FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_post_stats()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.post_stats (post_id) VALUES (NEW.post_id)
  ON CONFLICT (post_id) DO NOTHING;
  IF NEW.event = 'video_impression' THEN
    UPDATE public.post_stats SET impressions = impressions + 1, updated_at = now() WHERE post_id = NEW.post_id;
  ELSIF NEW.event = 'video_play' THEN
    UPDATE public.post_stats SET plays = plays + 1, updated_at = now() WHERE post_id = NEW.post_id;
  ELSIF NEW.event = 'video_complete' THEN
    UPDATE public.post_stats SET completes = completes + 1, updated_at = now() WHERE post_id = NEW.post_id;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.update_post_stats() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER feed_events_stats_trigger
  AFTER INSERT ON public.feed_events
  FOR EACH ROW EXECUTE FUNCTION public.update_post_stats();
