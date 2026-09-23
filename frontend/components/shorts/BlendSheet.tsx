import { Check, Loader2, Users, X } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import type { PublicProfile } from "@/frontend/hooks/usePublicProfile";

/**
 * Blend picker + connection states. Followers only.
 * - pick a follower → requesting radar animation while they decide
 * - incoming invite → accept / decline
 */
export function BlendSheet({
  open,
  onClose,
  followers,
  loadingFollowers,
  requesting,
  requestFailed,
  incoming,
  onInvite,
  onAccept,
  onDecline,
  onCancelRequest,
}: {
  open: boolean;
  onClose: () => void;
  followers: PublicProfile[];
  loadingFollowers: boolean;
  requesting: { toId: string; toName: string } | null;
  requestFailed: string | null;
  incoming: { fromName: string } | null;
  onInvite: (toId: string, toName: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onCancelRequest: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Watch together">
      {incoming ? (
        <div className="flex flex-col items-center px-4 py-6 text-center">
          <span className="relative grid size-20 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
            <span className="absolute inset-0 animate-pulse rounded-full bg-brand/15" />
            <span className="relative grid size-16 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">
              {incoming.fromName.slice(0, 1).toUpperCase()}
            </span>
          </span>
          <p className="mt-4 text-[15px] font-bold text-foreground">
            {incoming.fromName} wants to watch together
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Accept to sync playback — play, pause and react in real time.
          </p>
          <div className="mt-5 flex w-full gap-2">
            <button
              onClick={onDecline}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-sm font-semibold"
            >
              <X className="size-4" /> Decline
            </button>
            <button
              onClick={onAccept}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-bold text-brand-foreground"
            >
              <Check className="size-4" /> Watch together
            </button>
          </div>
        </div>
      ) : requesting ? (
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <span className="relative grid size-24 place-items-center">
            <span
              className="absolute inset-0 animate-ping rounded-full bg-brand/25"
              style={{ animationDuration: "1.6s" }}
            />
            <span
              className="absolute inset-2 animate-ping rounded-full bg-brand/20"
              style={{ animationDuration: "1.6s", animationDelay: "0.4s" }}
            />
            <span
              className="absolute inset-4 animate-ping rounded-full bg-brand/15"
              style={{ animationDuration: "1.6s", animationDelay: "0.8s" }}
            />
            <span className="relative grid size-14 place-items-center rounded-full bg-brand text-lg font-bold text-brand-foreground">
              {requesting.toName.slice(0, 1).toUpperCase()}
            </span>
          </span>
          <p className="mt-5 flex items-center gap-2 text-[15px] font-bold text-foreground">
            <Loader2 className="size-4 animate-spin" /> Requesting connection…
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Waiting for {requesting.toName} to accept. They have 45 seconds.
          </p>
          <button
            onClick={onCancelRequest}
            className="mt-5 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold"
          >
            Cancel request
          </button>
        </div>
      ) : (
        <div>
          <p className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
            <Users className="size-3.5" /> Followers only — pick someone to sync up with.
          </p>
          {requestFailed && (
            <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
              {requestFailed}
            </p>
          )}
          {loadingFollowers ? (
            <div className="space-y-2 px-2 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : followers.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-[15px] font-semibold">No followers yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                People who follow you will show up here.
              </p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {followers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.display_name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                      {p.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.display_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{p.username}
                    </span>
                  </span>
                  <button
                    onClick={() => onInvite(p.id, p.display_name)}
                    className="press shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-brand-foreground"
                  >
                    Invite
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  );
}
