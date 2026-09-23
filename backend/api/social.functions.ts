import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Answer a follow request. Only the followee (validated from the session,
 * never from client input) can accept — accept writes the follow row.
 */
export const respondFollowRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { requesterId?: string; accept?: boolean } | undefined) => ({
    requesterId: data?.requesterId ?? "",
    accept: data?.accept === true,
  }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; accepted: boolean }> => {
    const me = (context as unknown as { userId: string }).userId;
    if (!data.requesterId || data.requesterId === me) throw new Error("Bad request.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error } = await supabaseAdmin
      .from("follow_requests")
      .select("requester_id")
      .eq("requester_id", data.requesterId)
      .eq("followee_id", me)
      .maybeSingle();
    if (error || !req) throw new Error("Request not found.");
    if (data.accept) {
      const { error: followError } = await supabaseAdmin
        .from("follows")
        .insert({ follower_id: data.requesterId, followee_id: me });
      if (followError && !followError.message.includes("duplicate")) throw followError;
    }
    await supabaseAdmin
      .from("follow_requests")
      .delete()
      .eq("requester_id", data.requesterId)
      .eq("followee_id", me);
    return { ok: true as const, accepted: data.accept };
  });
