-- Ownership enforcement + DMs + social safety.
--
-- posts: visibility / status / edit + comment switches. SELECT tightened so
-- private/archived content is invisible to unauthorized viewers (backend
-- enforcement, not just hidden buttons). Owner UPDATE/DELETE stay owner-only.
-- profiles.is_private: private accounts hide from strangers (followers pass).
-- blocks: hard exclusion enforced inside SELECT policies (backend, not UI).
-- follow_requests: private-account request flow.
-- conversations/messages: real DMs between participants only.
-- content_audit: owner-action trail (own rows readable, never visitors').
-- notifications kind += 'message'.

-- ------------------------------------------------- schema columns first
-- All ADD COLUMNs run before any policy, because policy creation validates
-- every referenced column at CREATE time.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'followers', 'private')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'archived', 'deleted')),
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------- blocks
-- Created first: the posts/profiles policies below reference this table.
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------- post columns
-- (Columns added at the top of this file; policies below.)

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts respect visibility and status" ON public.posts;
CREATE POLICY "Posts respect visibility and status"
  ON public.posts FOR SELECT USING (
    status = 'published'
    AND (
      visibility = 'public'
      OR auth.uid() = author_id
      OR (
        visibility = 'followers'
        AND EXISTS (
          SELECT 1 FROM public.follows
          WHERE follower_id = auth.uid() AND followee_id = posts.author_id
        )
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
        AND NOT EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid() AND f.followee_id = p.id
        )
    )
  );

-- Comments only on open, published posts (backend, not just UI).
DROP POLICY IF EXISTS "Users can comment as themselves" ON public.comments;
DROP POLICY IF EXISTS "Users can comment as themselves" ON public.comments;
CREATE POLICY "Users can comment as themselves"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND status = 'published' AND comments_enabled
    )
  );

-- ------------------------------------------------------- profile privacy
-- (is_private added at the top of this file.)

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
-- Rows stay readable (names, bios, follow/request actions) while content
-- (posts, follower lists) is locked down by stricter policies. Blocks are
-- enforced here: neither direction can read the row at all.
DROP POLICY IF EXISTS "Profiles respect privacy and blocks" ON public.profiles;
DROP POLICY IF EXISTS "Profiles respect blocks" ON public.profiles;
CREATE POLICY "Profiles respect blocks"
  ON public.profiles FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM public.blocks
      WHERE (blocker_id = profiles.id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = profiles.id)
    )
  );

-- Helper for privacy checks: runs as owner (bypasses RLS) so policies can
-- test follow relationships without recursing into the follows policy itself.
CREATE OR REPLACE FUNCTION public.is_following(_follower UUID, _followee UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = _follower AND followee_id = _followee
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_following(UUID, UUID) TO anon, authenticated;

-- Follower lists respect privacy: private accounts expose follows only to
-- themselves and their followers.
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Follows respect privacy" ON public.follows;
CREATE POLICY "Follows respect privacy"
  ON public.follows FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id IN (follows.follower_id, follows.followee_id)
        AND p.is_private
        AND p.id <> auth.uid()
        AND NOT public.is_following(auth.uid(), p.id)
    )
  );

-- ---------------------------------------------------------------- blocks
-- (Table created at the top of this file; policies below.)
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
CREATE POLICY "Users can view their own blocks"
  ON public.blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS "Users can block as themselves" ON public.blocks;
CREATE POLICY "Users can block as themselves"
  ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Users can unblock as themselves" ON public.blocks;
CREATE POLICY "Users can unblock as themselves"
  ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- -------------------------------------------------------- follow requests
CREATE TABLE IF NOT EXISTS public.follow_requests (
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, followee_id),
  CONSTRAINT follow_requests_no_self CHECK (requester_id <> followee_id)
);

GRANT SELECT, INSERT, DELETE ON public.follow_requests TO authenticated;
GRANT ALL ON public.follow_requests TO service_role;

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Involved users can view requests" ON public.follow_requests;
CREATE POLICY "Involved users can view requests"
  ON public.follow_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = followee_id);
DROP POLICY IF EXISTS "Users can request as themselves" ON public.follow_requests;
CREATE POLICY "Users can request as themselves"
  ON public.follow_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "Involved users can withdraw requests" ON public.follow_requests;
CREATE POLICY "Involved users can withdraw requests"
  ON public.follow_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = followee_id);

-- ------------------------------------------------------------ conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversations_no_self CHECK (user_a_id <> user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_idx ON public.conversations
  (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Participants can open conversations" ON public.conversations;
CREATE POLICY "Participants can open conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ---------------------------------------------------------------- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_a_id OR auth.uid() = c.user_b_id)
    )
  );
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_a_id OR auth.uid() = c.user_b_id)
    )
  );
DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.messages;
CREATE POLICY "Recipients can mark messages read"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() <> sender_id)
  WITH CHECK (auth.uid() <> sender_id);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages (sender_id);

-- Keep conversation ordering fresh + notify the other participant.
CREATE OR REPLACE FUNCTION public.on_message_sent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  other_id UUID;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT CASE WHEN user_a_id = NEW.sender_id THEN user_b_id ELSE user_a_id END
    INTO other_id FROM public.conversations WHERE id = NEW.conversation_id;
  IF other_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, actor_id, ref_id, text)
    VALUES (other_id, 'message', NEW.sender_id, NEW.conversation_id::text, left(NEW.body, 80));
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.on_message_sent() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS messages_notify_trigger ON public.messages;
CREATE TRIGGER messages_notify_trigger
  AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_message_sent();

-- ---------------------------------------------------------- content audit
CREATE TABLE IF NOT EXISTS public.content_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 40),
  ref_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.content_audit TO authenticated;
GRANT ALL ON public.content_audit TO service_role;

ALTER TABLE public.content_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own audit trail" ON public.content_audit;
CREATE POLICY "Users can view their own audit trail"
  ON public.content_audit FOR SELECT TO authenticated USING (auth.uid() = actor_id);
DROP POLICY IF EXISTS "Users can log their own actions" ON public.content_audit;
CREATE POLICY "Users can log their own actions"
  ON public.content_audit FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

CREATE INDEX IF NOT EXISTS content_audit_actor_idx ON public.content_audit (actor_id, created_at DESC);

-- notifications kind += 'message'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('follow', 'like', 'comment', 'comment_like', 'blend_invite', 'mention', 'message'));

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
