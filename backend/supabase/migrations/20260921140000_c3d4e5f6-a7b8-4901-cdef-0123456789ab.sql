-- User reports + admin warnings.
--
-- reports: filed from any surface (feed, watch, comments). ref_id is TEXT so
-- demo/seed ids work alongside UUIDs. Admin reads/writes via service_role;
-- users see only their own filings.
-- warnings: delivered TO users (admin writes via service_role, user reads own).
-- The app shows unread warnings as a banner until dismissed.

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('post', 'video', 'comment', 'user', 'short', 'story')),
  ref_id TEXT NOT NULL,
  ref_title TEXT NOT NULL DEFAULT '',
  target_user_id TEXT,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 60),
  details TEXT NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'resolved')),
  resolution TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users can file reports as themselves"
  ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE INDEX reports_status_created_idx ON public.reports (status, created_at DESC);
CREATE INDEX reports_ref_idx ON public.reports (kind, ref_id);

CREATE TABLE public.warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.warnings TO authenticated;
GRANT ALL ON public.warnings TO service_role;

ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warnings"
  ON public.warnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can dismiss their own warnings"
  ON public.warnings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX warnings_user_idx ON public.warnings (user_id, created_at DESC);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
