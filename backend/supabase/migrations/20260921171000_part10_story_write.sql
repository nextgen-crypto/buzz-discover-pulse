-- WIZZ chunk 10/10: let users attach their own posts to stories.
-- Run on its own. Fully re-runnable. Expected: "Success. No rows returned".
--
-- story_posts was read-only (SELECT grant only), so discussion could never
-- grow from the app. This adds a narrow INSERT path: an authenticated user
-- may link a post only when they authored that post. Reads unchanged.

GRANT INSERT ON public.story_posts TO authenticated;

DROP POLICY IF EXISTS "Users can link their own posts" ON public.story_posts;
CREATE POLICY "Users can link their own posts"
  ON public.story_posts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = story_posts.post_id
        AND p.author_id = auth.uid()
    )
  );
