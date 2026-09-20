import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Users } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import {
  useFollowList,
  useProfileByUsername,
  type FollowListKind,
} from "@/frontend/hooks/usePublicProfile";

export function FollowListScreen({
  username,
  kind,
}: {
  username: string;
  kind: FollowListKind;
}) {
  const { data: profile, isLoading } = useProfileByUsername(username);
  const { data: people = [], isLoading: loadingPeople } = useFollowList(profile?.id ?? null, kind);
  const heading = kind === "followers" ? "Followers" : "Following";

  return (
    <AppShell title={`${heading} — @${username}`}>
       <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 pt-4 sm:px-6">
        <Link
          to="/u/$username"
          params={{ username }}
          aria-label="Back to profile"
          className="grid size-9 place-items-center rounded-full bg-secondary"
        >
          <ArrowLeft className="size-4 text-foreground" />
        </Link>
         <div className="min-w-0">
           <h2 className="truncate text-lg font-bold tracking-tight text-foreground">{heading}</h2>
           <p className="truncate text-xs text-muted-foreground">@{username}</p>
        </div>
      </div>

      {isLoading || loadingPeople ? (
        <div className="space-y-2 px-4 pt-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
            <Users className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {kind === "followers" ? "No followers yet" : "Not following anyone yet"}
          </p>
        </div>
      ) : (
         <ul className="mt-4 grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                to="/u/$username"
                params={{ username: person.username }}
                className="flex items-center gap-3 px-4 py-3"
              >
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.display_name}
                    loading="lazy"
                    className="size-11 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand text-sm font-bold text-brand-foreground">
                    {person.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                    {person.display_name}
                    {person.verified && <BadgeCheck className="size-3.5 shrink-0 text-brand" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                  {person.bio.trim() && (
                    <p className="truncate text-xs text-muted-foreground">{person.bio}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
