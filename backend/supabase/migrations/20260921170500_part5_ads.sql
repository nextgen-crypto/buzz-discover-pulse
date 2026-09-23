-- WIZZ chunk 5/5: Advertising / Promoted Content System (MVP, additive only).
-- Run on its own, after chunk 3 succeeds. Fully re-runnable.
-- Expected: "Success. No rows returned".
--
-- Scope (non-disruptive core):
--   - Campaign references existing post (no duplicate post, engagement stays put)
--   - Owner-only promote; admin approve/reject/pause; feed injects active only
--   - Frequency caps + hide/mute + viewport-counted impressions
--   - Estimated reach only (never guaranteed), budget-gated delivery
-- Defer (NOT in this migration): real PSP charges, auto malware checks,
-- multi-placement delivery, video-completion analytics.

-- ------------------------------------------------------------- ad packages
CREATE TABLE IF NOT EXISTS public.ad_packages (
  id TEXT PRIMARY KEY CHECK (id IN ('starter', 'growth', 'business', 'custom')),
  label TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  duration_days INT NOT NULL DEFAULT 1 CHECK (duration_days BETWEEN 1 AND 90),
  impressions_target INT NOT NULL DEFAULT 1000 CHECK (impressions_target >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'
);

GRANT SELECT ON public.ad_packages TO anon;
GRANT SELECT ON public.ad_packages TO authenticated;
GRANT ALL ON public.ad_packages TO service_role;

ALTER TABLE public.ad_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Packages viewable by everyone" ON public.ad_packages;
CREATE POLICY "Packages viewable by everyone"
  ON public.ad_packages FOR SELECT USING (true);

INSERT INTO public.ad_packages (id, label, price_cents, currency, duration_days, impressions_target, is_active)
VALUES
  ('starter', 'Starter', 1000000, 'TZS', 1, 1000, true),
  ('growth', 'Growth', 2000000, 'TZS', 3, 5000, true),
  ('business', 'Business', 5000000, 'TZS', 7, 20000, true),
  ('custom', 'Custom', 0, 'TZS', 30, 0, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------ ad campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '' CHECK (char_length(name) <= 80),
  objective TEXT NOT NULL DEFAULT 'reach'
    CHECK (objective IN ('reach','engagement','profile_visits','followers','website_visits','product','app_downloads','event','messages')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_payment','pending_review','approved','active','paused','completed','rejected','cancelled','expired','budget_exhausted')),
  package TEXT NOT NULL DEFAULT 'starter'
    CHECK (package IN ('starter','growth','business','custom')),
  budget_cents INT NOT NULL DEFAULT 0 CHECK (budget_cents >= 0),
  spend_cents INT NOT NULL DEFAULT 0 CHECK (spend_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  placement TEXT NOT NULL DEFAULT 'feed'
    CHECK (placement IN ('feed','news','video','search','explore')),
  frequency_every_n INT NOT NULL DEFAULT 5 CHECK (frequency_every_n BETWEEN 3 AND 20),
  frequency_cap_per_day INT NOT NULL DEFAULT 3 CHECK (frequency_cap_per_day BETWEEN 1 AND 20),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  targeting JSONB NOT NULL DEFAULT '{}',
  cta_label TEXT NOT NULL DEFAULT '' CHECK (char_length(cta_label) <= 24),
  cta_url TEXT NOT NULL DEFAULT '' CHECK (char_length(cta_url) <= 500),
  rejection_reason TEXT NOT NULL DEFAULT '' CHECK (char_length(rejection_reason) <= 300),
  -- Denormalized counters, maintained by trigger on ad_events. Never written by clients.
  impressions INT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  engagements INT NOT NULL DEFAULT 0 CHECK (engagements >= 0),
  hides INT NOT NULL DEFAULT 0 CHECK (hides >= 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ad_campaigns TO authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active campaigns viewable by everyone" ON public.ad_campaigns;
CREATE POLICY "Active campaigns viewable by everyone"
  ON public.ad_campaigns FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Advertisers manage own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers manage own campaigns"
  ON public.ad_campaigns FOR SELECT TO authenticated USING (auth.uid() = advertiser_id);
DROP POLICY IF EXISTS "Advertisers create own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers create own campaigns"
  ON public.ad_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = advertiser_id);
DROP POLICY IF EXISTS "Advertisers update own campaigns" ON public.ad_campaigns;
CREATE POLICY "Advertisers update own campaigns"
  ON public.ad_campaigns FOR UPDATE TO authenticated
  USING (auth.uid() = advertiser_id) WITH CHECK (auth.uid() = advertiser_id);

CREATE INDEX IF NOT EXISTS ad_campaigns_status_idx ON public.ad_campaigns (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_campaigns_advertiser_idx ON public.ad_campaigns (advertiser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_campaigns_post_idx ON public.ad_campaigns (post_id) WHERE post_id IS NOT NULL;

-- ---------------------------------------------------------------- ad events
-- Privacy-conscious: viewer_id nullable (anon impressions carry no identity).
-- One row per counted action; viewport rule enforced client-side (only log
-- when the unit is actually visible).
CREATE TABLE IF NOT EXISTS public.ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL
    CHECK (kind IN ('impression','click','like','comment','share','save','follow','profile_visit','video_view','video_completion','hide','report')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users log their own ad events" ON public.ad_events;
CREATE POLICY "Users log their own ad events"
  ON public.ad_events FOR INSERT TO authenticated
  WITH CHECK (viewer_id IS NULL OR auth.uid() = viewer_id);
DROP POLICY IF EXISTS "Advertisers view own campaign events" ON public.ad_events;
CREATE POLICY "Advertisers view own campaign events"
  ON public.ad_events FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = ad_events.campaign_id AND c.advertiser_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS ad_events_campaign_idx ON public.ad_events (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_events_viewer_idx ON public.ad_events (viewer_id, created_at DESC)
  WHERE viewer_id IS NOT NULL;

-- ------------------------------------------------------------ ad exposures
-- Frequency DB: one row per (campaign, viewer). Drives spacing, rotation,
-- fatigue protection. No precise location or sensitive data here, ever.
CREATE TABLE IF NOT EXISTS public.ad_exposures (
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  impression_count INT NOT NULL DEFAULT 0 CHECK (impression_count >= 0),
  interaction_count INT NOT NULL DEFAULT 0 CHECK (interaction_count >= 0),
  hidden BOOLEAN NOT NULL DEFAULT false,
  muted BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (campaign_id, viewer_id)
);

GRANT SELECT, INSERT, UPDATE ON public.ad_exposures TO authenticated;
GRANT ALL ON public.ad_exposures TO service_role;

ALTER TABLE public.ad_exposures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own exposures" ON public.ad_exposures;
CREATE POLICY "Users manage own exposures"
  ON public.ad_exposures FOR SELECT TO authenticated USING (auth.uid() = viewer_id);
DROP POLICY IF EXISTS "Users insert own exposures" ON public.ad_exposures;
CREATE POLICY "Users insert own exposures"
  ON public.ad_exposures FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
DROP POLICY IF EXISTS "Users update own exposures" ON public.ad_exposures;
CREATE POLICY "Users update own exposures"
  ON public.ad_exposures FOR UPDATE TO authenticated
  USING (auth.uid() = viewer_id) WITH CHECK (auth.uid() = viewer_id);

-- ------------------------------------------------------------- ad payments
-- Billing stub: payment required before status can leave pending_payment.
-- Real PSP (M-Pesa/Airtel/Card) lands here later as status transitions only.
CREATE TABLE IF NOT EXISTS public.ad_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  method TEXT NOT NULL DEFAULT 'wallet'
    CHECK (method IN ('mpesa','airtel','mixx','halo','card','wallet')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed','refunded')),
  receipt JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ad_payments TO authenticated;
GRANT ALL ON public.ad_payments TO service_role;

ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Advertisers view own payments" ON public.ad_payments;
CREATE POLICY "Advertisers view own payments"
  ON public.ad_payments FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = ad_payments.campaign_id AND c.advertiser_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Advertisers create own payments" ON public.ad_payments;
CREATE POLICY "Advertisers create own payments"
  ON public.ad_payments FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ad_campaigns c
      WHERE c.id = ad_payments.campaign_id AND c.advertiser_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS ad_payments_campaign_idx ON public.ad_payments (campaign_id, created_at DESC);

-- ---------------------------------------------------------- ad preferences
CREATE TABLE IF NOT EXISTS public.ad_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  personalized BOOLEAN NOT NULL DEFAULT true,
  interests TEXT[] NOT NULL DEFAULT '{}',
  muted_advertisers UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'
);

GRANT SELECT, INSERT, UPDATE ON public.ad_preferences TO authenticated;
GRANT ALL ON public.ad_preferences TO service_role;

ALTER TABLE public.ad_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ad preferences" ON public.ad_preferences;
CREATE POLICY "Users manage own ad preferences"
  ON public.ad_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own ad preferences" ON public.ad_preferences;
CREATE POLICY "Users insert own ad preferences"
  ON public.ad_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own ad preferences" ON public.ad_preferences;
CREATE POLICY "Users update own ad preferences"
  ON public.ad_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------- triggers
CREATE OR REPLACE FUNCTION public.ad_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.ad_touch_updated_at() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS ad_campaigns_touch ON public.ad_campaigns;
CREATE TRIGGER ad_campaigns_touch
  BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION public.ad_touch_updated_at();

-- Denormalized counters: single source of truth stays ad_events.
CREATE OR REPLACE FUNCTION public.on_ad_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ad_campaigns SET
    impressions = impressions + CASE WHEN NEW.kind = 'impression' THEN 1 ELSE 0 END,
    clicks = clicks + CASE WHEN NEW.kind = 'click' THEN 1 ELSE 0 END,
    engagements = engagements + CASE WHEN NEW.kind IN ('like','comment','share','save','follow','profile_visit','video_view','video_completion') THEN 1 ELSE 0 END,
    hides = hides + CASE WHEN NEW.kind IN ('hide','report') THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.campaign_id;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.on_ad_event() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS ad_events_counter_trigger ON public.ad_events;
CREATE TRIGGER ad_events_counter_trigger
  AFTER INSERT ON public.ad_events FOR EACH ROW EXECUTE FUNCTION public.on_ad_event();
