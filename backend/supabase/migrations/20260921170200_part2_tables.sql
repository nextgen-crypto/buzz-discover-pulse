-- WIZZ chunk 2/3: new tables. Run second, on its own, after chunk 1 succeeds.
-- Expected: "Success. No rows returned".

-- ---------------------------------------------------------------- blocks
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

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages (sender_id);

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

CREATE INDEX IF NOT EXISTS content_audit_actor_idx ON public.content_audit (actor_id, created_at DESC);

-- Message trigger function (trigger itself is attached in chunk 3).
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
