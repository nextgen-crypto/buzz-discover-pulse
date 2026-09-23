-- WIZZ chunk 3/3: policies, triggers, realtime. Run last, on its own,
-- after chunks 1 and 2 both report success.
-- Expected: "Success. No rows returned".

-- ------------------------------------------------------------------ posts
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

-- ---------------------------------------------------------------- comments
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

-- ---------------------------------------------------------------- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
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

-- ----------------------------------------------------------------- follows
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

-- ------------------------------------------------------------------ blocks
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
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Participants can open conversations" ON public.conversations;
CREATE POLICY "Participants can open conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- ---------------------------------------------------------------- messages
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

DROP TRIGGER IF EXISTS messages_notify_trigger ON public.messages;
CREATE TRIGGER messages_notify_trigger
  AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_message_sent();

-- ---------------------------------------------------------- content audit
DROP POLICY IF EXISTS "Users can view their own audit trail" ON public.content_audit;
CREATE POLICY "Users can view their own audit trail"
  ON public.content_audit FOR SELECT TO authenticated USING (auth.uid() = actor_id);
DROP POLICY IF EXISTS "Users can log their own actions" ON public.content_audit;
CREATE POLICY "Users can log their own actions"
  ON public.content_audit FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);

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
