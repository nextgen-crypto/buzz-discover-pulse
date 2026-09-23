import { useEffect, useRef, useState } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { useSession } from "@/frontend/hooks/useSession";
import { useConversations, useMessages } from "@/frontend/hooks/useMessages";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/messages");

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function MessagesScreen() {
  const { session, loading, user } = useSession();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const { c } = routeApi.useSearch();
  const { data: convos = [], isLoading } = useConversations(userId);
  const [selected, setSelected] = useState<string | null>(c ?? null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (c) setSelected(c);
  }, [c]);
  useEffect(() => {
    if (!selected && convos.length > 0 && window.innerWidth >= 1024) {
      setSelected(convos[0]!.id);
    }
  }, [convos, selected]);

  const active = convos.find((x) => x.id === selected) ?? null;
  const thread = useMessages(selected, userId);
  const activeMessages = selected ? thread.messages : [];

  useEffect(() => {
    if (selected) {
      thread.markRead();
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, activeMessages.length]);

  function pick(id: string) {
    setSelected(id);
    setDraft("");
    void navigate({ to: "/messages", search: { c: id }, replace: true });
  }

  function send() {
    const text = draft.trim();
    if (!text || !selected) return;
    thread.send(text, {
      onSuccess: () => setDraft(""),
    });
  }

  if (loading) {
    return (
      <AppShell title="Messages">
        <div className="space-y-2 px-4 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Messages">
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <h2 className="text-xl font-bold">Sign in to message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your conversations live here once you log in.
          </p>
          <Link
            to="/auth"
            className="mt-5 w-full rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground"
          >
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  const list = (
    <div className="min-w-0">
      <h2 className="px-4 pb-2 pt-4 text-xl font-bold">Messages</h2>
      {isLoading ? (
        <div className="space-y-2 px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : convos.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No conversations yet. Visit someone&apos;s profile and tap Message.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {convos.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => pick(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary",
                  selected === c.id && "bg-secondary",
                )}
              >
                {c.peer.avatar_url ? (
                  <img
                    src={c.peer.avatar_url}
                    alt={c.peer.display_name}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                    {c.peer.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">{c.peer.display_name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(c.lastAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-muted-foreground">
                      {c.lastMessage}
                    </span>
                    {c.unread > 0 && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <AppShell title="Messages">
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:divide-x lg:divide-border">
        <div className={cn(selected && "hidden lg:block")}>{list}</div>
        <div className={cn(!selected && "hidden lg:flex", "min-h-[60dvh] flex-col")}>
          {!active ? (
            <div className="hidden flex-1 place-items-center px-6 text-center lg:grid">
              <p className="text-sm text-muted-foreground">
                Pick a conversation to start chatting.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <button
                  aria-label="Back to conversations"
                  onClick={() => {
                    setSelected(null);
                    void navigate({ to: "/messages", search: {}, replace: true });
                  }}
                  className="grid size-9 place-items-center rounded-full hover:bg-secondary lg:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <Link
                  to="/u/$username"
                  params={{ username: active.peer.username }}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  {active.peer.avatar_url ? (
                    <img
                      src={active.peer.avatar_url}
                      alt={active.peer.display_name}
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                      {active.peer.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {active.peer.display_name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      @{active.peer.username}
                    </span>
                  </span>
                </Link>
              </div>
              <div className="flex max-h-[52dvh] min-h-[40dvh] flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-3 lg:max-h-[62dvh]">
                {thread.isLoading ? (
                  <Loader2 className="mx-auto mt-8 size-5 animate-spin text-muted-foreground" />
                ) : activeMessages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No messages yet — say hi.
                  </p>
                ) : (
                  activeMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.mine ? "justify-end" : "justify-start")}
                    >
                      <p
                        className={cn(
                          "max-w-[75%] break-words rounded-2xl px-3.5 py-2 text-sm leading-snug",
                          m.mine
                            ? "bg-brand text-brand-foreground"
                            : "bg-secondary text-foreground",
                        )}
                      >
                        {m.body}
                      </p>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                    placeholder="Message…"
                    maxLength={1000}
                    aria-label="Write a message"
                    className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    aria-label="Send message"
                    onClick={send}
                    disabled={!draft.trim() || thread.sending}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground disabled:opacity-50"
                  >
                    <SendHorizonal className="size-4" />
                  </button>
                </div>
                {thread.sendError && (
                  <p className="mt-1.5 text-xs font-semibold text-live">
                    Couldn&apos;t send. Try again.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
