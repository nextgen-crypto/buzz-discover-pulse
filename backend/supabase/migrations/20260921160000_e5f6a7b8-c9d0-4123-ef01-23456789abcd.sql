-- Allow reporting news articles (kind = 'article').
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_kind_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_kind_check
  CHECK (kind IN ('post', 'video', 'comment', 'user', 'short', 'story', 'article'));
