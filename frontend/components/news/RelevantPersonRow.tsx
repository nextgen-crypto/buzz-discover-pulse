import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import type { RelevantPerson } from "@/frontend/hooks/useStoryDetail";
import { useFollowState } from "@/frontend/hooks/usePublicProfile";
import { useOutgoingRequest } from "@/frontend/hooks/useSocial";
import { useSession } from "@/frontend/hooks/useSession";

/**
 * One relevant person: avatar, name, @handle, one-line bio, compact
 * Follow button reusing the profile follow logic (Follow / Following /
 * Requested for private accounts). Row opens the real profile.
 */
export function RelevantPersonRow({
  person,
}: {
  person: RelevantPerson;
}) {
  const { user } = useSession();
  const viewerId = user?.id ?? null;
  const isMe = viewerId !== null && viewerId === person.id;
  const { isFollowing, toggle } = useFollowState(isMe ? null : viewerId, isMe ? null : person.id);
  const { requested, send, withdraw } = useOutgoingRequest(
    isMe ? null : viewerId,
    isMe ? null : person.id,
  );

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Link to="/u/$username" params={{ username: person.username }}>
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt={person.displayName}
            loading="lazy"
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-foreground">
            {person.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
      <Link to="/u/$username" params={{ username: person.username }} className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-[15px] font-bold text-foreground">
          {person.displayName}
          {person.verified && <BadgeCheck className="size-4 shrink-0 text-brand" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
        {person.bio && (
          <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
            {person.bio}
          </p>
        )}
      </Link>
      {isMe ? (
        <span className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">
          You
        </span>
      ) : person.isPrivate && !isFollowing ? (
        requested ? (
          <button
            onClick={() => withdraw()}
            className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            Requested
          </button>
        ) : (
          <button
            onClick={() => send()}
            className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground"
          >
            Follow
          </button>
        )
      ) : (
        <button
          onClick={() => toggle.mutate(!isFollowing)}
          disabled={toggle.isPending}
          aria-pressed={isFollowing}
          className={
            isFollowing
              ? "shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-foreground disabled:opacity-60"
              : "shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground disabled:opacity-60"
          }
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
