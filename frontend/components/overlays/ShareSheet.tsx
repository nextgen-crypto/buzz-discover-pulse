import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Link2, Send } from "lucide-react";
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
          <span className="grid size-11 place-items-center rounded-full bg-[#25D366]">
            <svg viewBox="0 0 24 24" className="size-6 fill-white" aria-label="WhatsApp">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-foreground">WhatsApp</span>
        </a>
        <button
          onClick={copyLink}
          className="flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-3"
        >
          <span className="grid size-11 place-items-center rounded-full bg-brand-soft">
            {copied ? (
              <Check className="size-5 text-brand" />
            ) : (
              <Copy className="size-5 text-brand" />
            )}
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
