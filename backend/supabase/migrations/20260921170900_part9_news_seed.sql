-- WIZZ chunk 9/9: news mock data. Run on its own, after part 8.
-- Fully re-runnable (seeds once; no-ops when stories exist).
-- Expected: "Success. No rows returned".
--
-- Data-driven mocks: stories are static seeds, but post links, relevant
-- people, and trending counts all derive from the LIVE posts/profiles in
-- the project — no fake relations, and re-running never duplicates.

DO $$ BEGIN
  IF (SELECT count(*) FROM public.news_stories) = 0 THEN

    INSERT INTO public.news_stories (headline, summary, summary_short, category, state)
    VALUES
      ('SGR freight volumes hit record high on Dar–Dodoma line',
       'Tanzania Railways says freight volumes on the standard-gauge line kept climbing through the quarter as more cargo shifts from road to rail. Operators point to faster turnaround at Dar es Salaam port and new dry-port capacity upcountry. Analysts watching the numbers say the next test is passenger demand once the full schedule beds in.',
       'Freight volumes on the SGR kept climbing as cargo shifts from road to rail.',
       'Business', 'developing'),
      ('Simba and Yanga set for another season-defining derby',
       'The Kariakoo derby returns with both sides separated by a handful of points at the top of the table. Coaches played down the occasion at Friday press conferences, but supporters have already turned the week into a festival of banners, songs, and predictions across the city.',
       'Simba and Yanga meet again with the title race on a knife edge.',
       'Sports', 'trending'),
      ('Starlink residential rollout expands across Tanzania',
       'Satellite internet kits are reaching more households beyond the fibre footprint, with installers reporting growing demand in Arusha, Mwanza, and Dodoma. Users compare notes on speeds, pricing, and setup while regulators watch how the new capacity reshapes rural connectivity.',
       'Satellite kits reach more homes beyond the fibre footprint.',
       'Technology', 'developing'),
      ('Bongo Flava dominates year-end festival lineups',
       'Promoters say homegrown acts will headline nearly every major December festival, capping a year in which Tanzanian pop travelled further than ever on streaming charts. Fans are already debating dream collaborations and the perfect closing set.',
       'Homegrown acts headline nearly every major December festival.',
       'Entertainment', 'trending'),
      ('Tropical storm watch issued for coastal regions',
       'The weather authority has issued a storm watch for coastal areas including Dar es Salaam, Tanga, and Mtwara, urging fishers and ferry operators to check updates before setting out. Emergency teams say they are on standby through the weekend.',
       'Storm watch issued for the coast; fishers and ferries urged to check updates.',
       'News', 'breaking');

    -- Link the 30 most recent published posts across stories, round-robin.
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
      FROM public.posts WHERE status = 'published' LIMIT 30
    ),
    ordered_stories AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS sn
      FROM public.news_stories
    ),
    story_count AS (SELECT count(*) AS n FROM ordered_stories)
    INSERT INTO public.story_posts (story_id, post_id, relevance_score)
    SELECT s.id, r.id, 100 - r.rn
    FROM ranked r
    JOIN ordered_stories s
      ON ((r.rn - 1) % (SELECT n FROM story_count)) = (s.sn - 1)
    ON CONFLICT DO NOTHING;

    -- Relevant people = the most-linked authors per story.
    WITH author_counts AS (
      SELECT sp.story_id, p.author_id, count(*) AS cnt
      FROM public.story_posts sp
      JOIN public.posts p ON p.id = sp.post_id
      GROUP BY sp.story_id, p.author_id
    ),
    ranked_authors AS (
      SELECT story_id, author_id,
             ROW_NUMBER() OVER (PARTITION BY story_id ORDER BY cnt DESC) AS rnk
      FROM author_counts
    )
    INSERT INTO public.story_relevant_people (story_id, profile_id, rank)
    SELECT story_id, author_id, rnk FROM ranked_authors WHERE rnk <= 5
    ON CONFLICT DO NOTHING;

  END IF;
END $$;

-- Refresh trending counts from live hashtags (safe to re-run anytime).
UPDATE public.trending_topics t
SET post_count = COALESCE((
  SELECT count(*)
  FROM public.posts p,
       LATERAL unnest(p.hashtags) h
  WHERE p.status = 'published'
    AND lower(h) = lower(replace(regexp_replace(t.label, '^#', ''), ' ', ''))
), 0);
