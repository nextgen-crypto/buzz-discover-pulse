import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Entry {
  refs: number;
  channel: RealtimeChannel;
  teardown?: (() => void) | undefined;
}

const registry = new Map<string, Entry>();

/**
 * Refcounted shared realtime subscription.
 *
 * supabase-js reuses channel instances by topic, and calling .on() on an
 * already-subscribed instance THROWS. With shared hooks (badge + sheet both
 * listening, StrictMode remounts), naive subscribe-per-mount crashes the
 * whole tree. This binds callbacks exactly once per topic and tears down on
 * the last unmount — broadcast topics stay exact so delivery keeps working.
 */
export function useSharedRealtimeChannel(
  topic: string | null,
  bind: (channel: RealtimeChannel) => void | (() => void),
) {
  const bindRef = useRef(bind);
  bindRef.current = bind;

  useEffect(() => {
    if (!topic) return;
    let entry = registry.get(topic);
    if (!entry) {
      const channel = supabase.channel(topic);
      entry = { refs: 0, channel };
      registry.set(topic, entry);
      entry.teardown = bindRef.current(channel) ?? undefined;
    }
    entry.refs += 1;
    return () => {
      const e = registry.get(topic);
      if (!e) return;
      e.refs -= 1;
      if (e.refs <= 0) {
        registry.delete(topic);
        e.teardown?.();
        void supabase.removeChannel(e.channel);
      }
    };
  }, [topic]);
}
