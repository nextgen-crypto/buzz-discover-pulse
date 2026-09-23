-- Real notifications: relational rows written by triggers (SECURITY DEFINER
-- bypasses RLS cleanly — no service key needed at runtime, users can't forge).
-- post_likes gives posts a real like graph like saves does for bookmarks.

CREATE TABLE public.post_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

GRANT SELECT ON public.post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like as themselves"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike as themselves"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX post_likes_post_idx ON public.post_likes (post_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('follow', 'like', 'comment', 'comment_like', 'blend_invite', 'mention')),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ref_id TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No INSERT grant: only triggers (owner) and service_role write. Users can
-- never forge notifications for each other.
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can mark their own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX notifications_user_all_idx ON public.notifications (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_social()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_id UUID;
  actor_id UUID;
  ref TEXT;
  txt TEXT;
  k TEXT;
  parent_author UUID;
  parent_post UUID;
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
  ELSIF TG_TABLE_NAME = 'comment_likes' THEN
    SELECT author_id, post_id INTO parent_author, parent_post FROM public.comments WHERE id = NEW.comment_id;
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

  -- Replies also poke the parent comment author.
  IF TG_TABLE_NAME = 'comments' AND NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM public.comments WHERE id = NEW.parent_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.author_id AND parent_author <> target_id THEN
      INSERT INTO public.notifications (user_id, kind, actor_id, ref_id, text)
      VALUES (parent_author, 'comment', NEW.author_id, NEW.post_id::text, 'replied: ' || left(NEW.body, 80));
    END IF;
  END IF;

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.notify_social() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER follows_notify_trigger
  AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_social();
CREATE TRIGGER post_likes_notify_trigger
  AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_social();
CREATE TRIGGER comments_notify_trigger
  AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_social();
CREATE TRIGGER comment_likes_notify_trigger
  AFTER INSERT ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.notify_social();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
