import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Link2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { useSession } from "@/frontend/hooks/useSession";
import { useFollowList, type PublicProfile } from "@/frontend/hooks/usePublicProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Everyone on WIZZ, used to build the "not following you" list. */
function useAllProfiles(enabled: boolean) {
  return useQuery({
    queryKey: ["all-profiles-share"],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<PublicProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, verified")
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PublicProfile[];
    },
  });
}

export function ShareSheet({
  open,
  onClose,
  url,
  message,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  message: string;
}) {
  const { user } = useSession();
  const [tab, setTab] = useState<"followers" | "others">("followers");
  const [sent, setSent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: followers = [] } = useFollowList(user?.id ?? null, "followers");
  const { data: everyone = [] } = useAllProfiles(open);

  const others = useMemo(() => {
    const followerIds = new Set(followers.map((f) => f.id));
    return everyone.filter((p) => p.id !== user?.id && !followerIds.has(p.id));
  }, [everyone, followers, user?.id]);

  const people = tab === "followers" ? followers : others;
  const shareText = `${message} ${url}`.trim();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  function sendTo(person: PublicProfile) {
    setSent((prev) => (prev.includes(person.id) ? prev : [...prev, person.id]));
    void navigator.clipboard.writeText(url).catch(() => undefined);
    toast.success(`Link ready to send to @${person.username}`);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Share">
      <div className="grid grid-cols-3 gap-2 pb-4">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3"
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-soft">
            <MessageSquare className="size-5 text-brand" />
          </span>
          <span className="text-xs font-semibold text-foreground">WhatsApp</span>
        </a>
        <button
          onClick={copyLink}
          className="flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3"
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-soft">
            {copied ? <Check className="size-5 text-brand" /> : <Copy className="size-5 text-brand" />}
          </span>
          <span className="text-xs font-semibold text-foreground">Copy link</span>
        </button>
        <button
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              void navigator.share({ text: message, url }).catch(() => undefined);
            } else {
              void copyLink();
            }
          }}
          className="flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3"
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-soft">
            <Link2 className="size-5 text-brand" />
          </span>
          <span className="text-xs font-semibold text-foreground">More</span>
        </button>
      </div>

      <div className="flex gap-2 pb-3">
        {(["followers", "others"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold",
              tab === t ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {t === "followers" ? "Followers" : "Not following you"}
          </button>
        ))}
      </div>

      {!user ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sign in to send this straight to people on WIZZ.
        </p>
      ) : people.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {tab === "followers" ? "No followers yet." : "No other accounts to show."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3 py-2.5">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.display_name}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-10 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                  {person.display_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{person.display_name}</p>
                <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
              </div>
              <button
                onClick={() => sendTo(person)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold",
                  sent.includes(person.id)
                    ? "bg-secondary text-muted-foreground"
                    : "bg-brand text-brand-foreground",
                )}
              >
                <Send className="size-3.5" />
                {sent.includes(person.id) ? "Sent" : "Send"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
