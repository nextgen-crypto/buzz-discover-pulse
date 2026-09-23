import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { creators, news, shorts, stories, videos } from "@/backend/database/seed";
import {
  fetchAdminReports,
  resolveAdminReport,
  type ResolveAction,
} from "@/backend/api/admin.functions";
import { TRACKS } from "@/frontend/components/create/creationEngine";
import { Badge, Empty, Field, Panel, inputCls } from "@/frontend/components/admin/ui";
import { exportCsv, newId, type ActFn, type OpStore } from "@/frontend/components/admin/opStore";
import type { AdminMetrics } from "@/frontend/hooks/useAdminMetrics";
import { useSession } from "@/frontend/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface SectionProps {
  m: AdminMetrics | null;
  ops: OpStore;
  act: ActFn;
  email: string;
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const tz = (n: number) => `TZS ${n.toLocaleString()}`;

/* ---------------------------------------------------------- CONTENT */
export function ContentSection({ m, ops, act }: SectionProps) {
  const [tab, setTab] = useState<
    "posts" | "videos" | "shorts" | "stories" | "news" | "comments" | "tags" | "audio" | "live"
  >("posts");
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, caption, category, created_at, author_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        caption: string;
        category: string;
        created_at: string;
        author_id: string;
      }[];
    },
  });
  const { data: commentsProbe } = useQuery({
    queryKey: ["admin-comments-probe"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, author_id")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as { id: string; body: string; created_at: string; author_id: string }[];
    },
    retry: false,
  });
  const names = new Map((m?.users ?? []).map((u) => [u.id, u.username]));
  const isHidden = (kind: string, refId: string) =>
    ops.hidden.some((h) => h.kind === kind && h.refId === refId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            "posts",
            "videos",
            "shorts",
            "stories",
            "news",
            "comments",
            "tags",
            "audio",
            "live",
          ] as const
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold capitalize",
              tab === t
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground border border-border",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <Panel title={`Posts (${posts.length})`} hint="Latest 50">
          {isLoading ? (
            <Empty text="Loading…" />
          ) : (
            <ul className="divide-y divide-border">
              {posts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {p.caption.slice(0, 80) || "Photo post"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      @{names.get(p.author_id) ?? "?"} · {p.category} · {timeAgo(p.created_at)}
                    </span>
                  </span>
                  {isHidden("post", p.id) ? (
                    <Badge tone="red">hidden</Badge>
                  ) : (
                    <button
                      onClick={() =>
                        act("Hide post", p.id.slice(0, 8), (s) => ({
                          ...s,
                          hidden: [
                            ...s.hidden,
                            { kind: "post", refId: p.id, reason: "admin hide" },
                          ],
                        }))
                      }
                      className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Hide
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "videos" && (
        <Panel title={`Videos (${videos.length})`} hint="Seed catalogue">
          <ul className="divide-y divide-border">
            {videos.map((v) => {
              const a = creators.find((c) => c.id === v.authorId);
              return (
                <li key={v.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{v.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {a?.displayName} · {v.category} · {v.views.toLocaleString()} views
                    </span>
                  </span>
                  {isHidden("video", v.id) ? (
                    <Badge tone="red">hidden</Badge>
                  ) : (
                    <button
                      onClick={() =>
                        act("Hide video", v.id, (s) => ({
                          ...s,
                          hidden: [
                            ...s.hidden,
                            { kind: "video", refId: v.id, reason: "admin hide" },
                          ],
                        }))
                      }
                      className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Hide
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {tab === "shorts" && (
        <Panel title={`Shorts (${shorts.length})`} hint="Seed feed catalogue">
          <ul className="divide-y divide-border">
            {shorts.map((s) => {
              const a = creators.find((c) => c.id === s.authorId);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{s.caption}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {a?.displayName} · {s.category} · {s.metrics.views.toLocaleString()} views
                    </span>
                  </span>
                  {isHidden("short", s.id) ? (
                    <Badge tone="red">hidden</Badge>
                  ) : (
                    <button
                      onClick={() =>
                        act("Hide short", s.id, (st) => ({
                          ...st,
                          hidden: [
                            ...st.hidden,
                            { kind: "short", refId: s.id, reason: "admin hide" },
                          ],
                        }))
                      }
                      className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Hide
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {tab === "stories" && (
        <Panel title={`Stories (${stories.length})`} hint="Seed story rail">
          <ul className="divide-y divide-border">
            {stories.map((s) => {
              const a = creators.find((c) => c.id === s.authorId);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {a?.displayName}&apos;s story
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      @{a?.username} · {s.viewed ? "viewed" : "unviewed"}
                    </span>
                  </span>
                  {isHidden("story", s.id) ? (
                    <Badge tone="red">hidden</Badge>
                  ) : (
                    <button
                      onClick={() =>
                        act("Hide story", s.id, (st) => ({
                          ...st,
                          hidden: [
                            ...st.hidden,
                            { kind: "story", refId: s.id, reason: "admin hide" },
                          ],
                        }))
                      }
                      className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                    >
                      Hide
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {tab === "news" && (
        <Panel title={`News (${news.length})`} hint="Seed articles">
          <ul className="divide-y divide-border">
            {news.map((n) => (
              <li key={n.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{n.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {n.sourceName} · {n.category}
                    {n.live ? " · LIVE" : ""}
                  </span>
                </span>
                {isHidden("news", n.id) ? (
                  <Badge tone="red">hidden</Badge>
                ) : (
                  <button
                    onClick={() =>
                      act("Hide article", n.id, (st) => ({
                        ...st,
                        hidden: [...st.hidden, { kind: "news", refId: n.id, reason: "admin hide" }],
                      }))
                    }
                    className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                  >
                    Hide
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "comments" && (
        <Panel
          title="Comments"
          hint={commentsProbe ? "Live from Supabase" : "Migration not applied yet"}
        >
          {!commentsProbe ? (
            <Empty text="Run the comments migration in Supabase to moderate live comments." />
          ) : commentsProbe.length === 0 ? (
            <Empty text="No comments yet." />
          ) : (
            <ul className="divide-y divide-border">
              {commentsProbe.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{c.body.slice(0, 90)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      @{names.get(c.author_id) ?? "?"} · {timeAgo(c.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {tab === "tags" && (
        <Panel title="Hashtags" hint="From the last 1000 posts">
          <div className="flex flex-wrap gap-1.5">
            {(m?.hashtags ?? []).map((h) => (
              <span
                key={h.tag}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                #{h.tag} · {h.count}
              </span>
            ))}
            {(m?.hashtags ?? []).length === 0 && <Empty text="No hashtags yet." />}
          </div>
        </Panel>
      )}

      {tab === "audio" && (
        <Panel title={`Audio (${TRACKS.length})`} hint="In-app sound library">
          <ul className="divide-y divide-border">
            {TRACKS.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.creator} · {t.duration}
                  </span>
                </span>
                <Badge>{t.id === "t5" ? "original" : "licensed"}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === "live" && (
        <Panel title="Live streams" hint="Rooms are local mock sessions for now">
          <Empty text="No live rooms right now. Blend rooms appear here when realtime rooms land." />
        </Panel>
      )}
    </div>
  );
}

/* -------------------------------------------------------- MODERATION */
const REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Violence",
  "Nudity",
  "Copyright",
  "Impersonation",
  "Other",
];

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Live moderation queue (Supabase reports). Falls back to the local demo queue. */
export function ModerationSection({ m, ops, act, email }: SectionProps) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports-live"],
    queryFn: () => fetchAdminReports(),
    staleTime: 15_000,
    retry: false,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Panel title="Moderation queue">
        <Empty text="Loading live reports…" />
      </Panel>
    );
  }
  if (!data || data.live === false) {
    return <ModerationLocalSection m={m} ops={ops} act={act} email={email} />;
  }

  const reports = data.reports;
  const pending = reports.filter((r) => r.status === "pending");

  async function resolve(id: string, action: ResolveAction) {
    setBusyId(id);
    setError(null);
    try {
      const res = await resolveAdminReport({ data: { id, action } });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports-live"] });
      act(`Moderate: ${action}`, `${id} — ${res.detail}`, (s) => s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat2 label="Pending" value={`${pending.length}`} alert={pending.length > 0} />
        <Stat2 label="Source" value="Supabase live" />
        <Stat2
          label="Resolved"
          value={`${reports.filter((r) => r.status === "resolved").length}`}
        />
      </div>
      <Panel
        title={`Moderation queue (${pending.length} pending)`}
        hint="Review → approve, remove, delete, warn, restrict, suspend"
      >
        {error && <p className="mb-2 text-xs font-semibold text-live">{error}</p>}
        {reports.length === 0 ? (
          <Empty text="Queue is clear." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3">Content</th>
                  <th className="pb-2 pr-3">Reason</th>
                  <th className="pb-2 pr-3">Reporter</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => {
                  const realUser = isUuidLike(r.target_user_id ?? "");
                  const busy = busyId === r.id;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-3">
                        <p className="font-semibold">{r.ref_title || r.ref_id.slice(0, 12)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.kind} · {new Date(r.created_at).toLocaleString()}
                        </p>
                        {r.resolution && (
                          <p className="text-[11px] text-muted-foreground">→ {r.resolution}</p>
                        )}
                      </td>
                      <td className="py-2 pr-3">{r.reason}</td>
                      <td className="py-2 pr-3 text-muted-foreground">@{r.reporter_name}</td>
                      <td className="py-2 pr-3">
                        <Badge tone={r.status === "pending" ? "red" : "gray"}>{r.status}</Badge>
                      </td>
                      <td className="py-2">
                        {r.status === "resolved" ? (
                          <span className="text-xs text-muted-foreground">done</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            <ModBtn
                              label={busy ? "…" : "Approve"}
                              onClick={() => void resolve(r.id, "approve")}
                            />
                            <ModBtn
                              label="Remove"
                              danger
                              onClick={() => void resolve(r.id, "remove_content")}
                            />
                            <ModBtn
                              label="Delete"
                              danger
                              onClick={() => void resolve(r.id, "delete_content")}
                            />
                            <ModBtn
                              label="Warn"
                              disabled={!realUser}
                              onClick={() => void resolve(r.id, "warn")}
                            />
                            <ModBtn
                              label="Restrict"
                              danger
                              disabled={!realUser}
                              onClick={() => void resolve(r.id, "restrict")}
                            />
                            <ModBtn
                              label="Suspend"
                              danger
                              disabled={!realUser}
                              onClick={() => void resolve(r.id, "suspend")}
                            />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {user && (
        <FileReportForm
          userId={user.id}
          onFiled={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-reports-live"] });
            act("File report (admin)", "manual", (s) => s);
          }}
        />
      )}
    </div>
  );
}

function FileReportForm({ userId, onFiled }: { userId: string; onFiled: () => void }) {
  const [kind, setKind] = useState("post");
  const [refId, setRefId] = useState("");
  const [reason, setReason] = useState(REASONS[0]!);
  const [error, setError] = useState<string | null>(null);

  async function file() {
    if (!refId.trim()) return;
    setError(null);
    const { error: err } = await supabase.from("reports").insert({
      reporter_id: userId,
      kind,
      ref_id: refId.trim(),
      ref_title: refId.trim(),
      reason,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setRefId("");
    onFiled();
  }

  return (
    <Panel title="File a report" hint="Goes straight into the live queue">
      {error && <p className="mb-2 text-xs font-semibold text-live">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
            <option value="post">Post</option>
            <option value="video">Video</option>
            <option value="comment">Comment</option>
            <option value="user">User</option>
            <option value="short">Short</option>
            <option value="story">Story</option>
            <option value="article">Article</option>
          </select>
        </Field>
        <Field label="Reference ID">
          <input
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="uuid / @user"
            className={inputCls}
          />
        </Field>
        <Field label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <button
            disabled={!refId.trim()}
            onClick={() => void file()}
            className="w-full rounded-full bg-foreground py-2.5 text-xs font-bold text-background disabled:opacity-50"
          >
            File report
          </button>
        </div>
      </div>
    </Panel>
  );
}

function ModerationLocalSection({ ops, act }: SectionProps) {
  const [kind, setKind] = useState("post");
  const [refId, setRefId] = useState("");
  const [reason, setReason] = useState(REASONS[0]!);
  const pending = ops.reports.filter((r) => r.status === "pending");

  function resolve(id: string, resolution: string, extra?: (s: OpStore) => OpStore) {
    act(`Moderate report ${id}: ${resolution}`, id, (s) => {
      const base: OpStore = {
        ...s,
        reports: s.reports.map((r) =>
          r.id === id ? { ...r, status: "resolved" as const, resolution } : r,
        ),
      };
      return extra ? extra(base) : base;
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat2 label="Pending" value={`${pending.length}`} alert={pending.length > 0} />
        <Stat2
          label="In review"
          value={`${ops.reports.filter((r) => r.status === "review").length}`}
        />
        <Stat2
          label="Resolved"
          value={`${ops.reports.filter((r) => r.status === "resolved").length}`}
        />
      </div>

      <Panel title="Moderation queue" hint="Review → approve, remove, warn, restrict or suspend">
        {ops.reports.length === 0 ? (
          <Empty text="Queue is clear." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3">Content</th>
                  <th className="pb-2 pr-3">Reason</th>
                  <th className="pb-2 pr-3">Reports</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ops.reports.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3">
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.kind} · {r.refId}
                      </p>
                      {r.resolution && (
                        <p className="text-[11px] text-muted-foreground">→ {r.resolution}</p>
                      )}
                    </td>
                    <td className="py-2 pr-3">{r.reason}</td>
                    <td className="py-2 pr-3 font-bold">{r.count}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        tone={
                          r.status === "pending" ? "red" : r.status === "review" ? "brand" : "gray"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {r.status === "resolved" ? (
                        <span className="text-xs text-muted-foreground">done</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          <ModBtn
                            label="Approve"
                            onClick={() => resolve(r.id, "Approved — no violation")}
                          />
                          <ModBtn
                            label="Remove"
                            danger
                            onClick={() =>
                              resolve(r.id, "Removed", (s) => ({
                                ...s,
                                hidden: [
                                  ...s.hidden,
                                  { kind: r.kind, refId: r.refId, reason: r.reason },
                                ],
                              }))
                            }
                          />
                          <ModBtn label="Warn" onClick={() => resolve(r.id, "User warned")} />
                          <ModBtn
                            label="Restrict"
                            danger
                            onClick={() => resolve(r.id, "User restricted")}
                          />
                          <ModBtn
                            label="Suspend"
                            danger
                            onClick={() =>
                              resolve(r.id, "User suspended", (s) =>
                                r.kind === "user"
                                  ? {
                                      ...s,
                                      flags: {
                                        ...s.flags,
                                        [r.refId]: { ...s.flags[r.refId], suspended: true },
                                      },
                                    }
                                  : s,
                              )
                            }
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="File a report" hint="Manual intake">
        <div className="grid gap-2 sm:grid-cols-4">
          <Field label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
              <option value="post">Post</option>
              <option value="video">Video</option>
              <option value="comment">Comment</option>
              <option value="user">User</option>
            </select>
          </Field>
          <Field label="Reference ID">
            <input
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              placeholder="v-2 / @user"
              className={inputCls}
            />
          </Field>
          <Field label="Reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              disabled={!refId.trim()}
              onClick={() => {
                act("File report", refId.trim(), (s) => ({
                  ...s,
                  reports: [
                    {
                      id: newId("r"),
                      kind: kind as "post",
                      refId: refId.trim(),
                      title: refId.trim(),
                      reason,
                      count: 1,
                      status: "pending",
                      createdAt: new Date().toISOString(),
                    },
                    ...s.reports,
                  ],
                }));
                setRefId("");
              }}
              className="w-full rounded-full bg-foreground py-2.5 text-xs font-bold text-background disabled:opacity-50"
            >
              File report
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Stat2({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className={cn("text-2xl font-bold", alert && "text-live")}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ModBtn({
  label,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-bold disabled:opacity-40",
        danger ? "bg-live/10 text-live" : "bg-secondary text-foreground",
      )}
    >
      {label}
    </button>
  );
}

/* ---------------------------------------------------------- PAYMENTS */
export function PaymentsSection({ ops, act }: SectionProps) {
  const [filter, setFilter] = useState("all");
  const done = ops.txns.filter((t) => t.status === "completed");
  const volume = done.reduce((s, t) => s + t.amount, 0);
  const fees = done.reduce((s, t) => s + t.fee, 0);
  const providers = ["M-Pesa", "Airtel Money", "Mixx"] as const;
  const rows = ops.txns.filter((t) => filter === "all" || t.status === filter);

  function setStatus(
    id: string,
    status: "completed" | "pending" | "failed" | "refunded",
    verb: string,
  ) {
    act(`${verb} transaction`, id, (s) => ({
      ...s,
      txns: s.txns.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Stat2 label="Volume" value={tz(volume)} />
        <Stat2 label="Platform fees" value={tz(fees)} />
        <Stat2
          label="Pending"
          value={`${ops.txns.filter((t) => t.status === "pending").length}`}
          alert
        />
        <Stat2
          label="Failed"
          value={`${ops.txns.filter((t) => t.status === "failed").length}`}
          alert={ops.txns.some((t) => t.status === "failed")}
        />
      </div>
      <Panel title="Providers">
        <div className="grid gap-2 sm:grid-cols-3">
          {providers.map((p) => {
            const total = done.filter((t) => t.provider === p).reduce((s, t) => s + t.amount, 0);
            const count = ops.txns.filter((t) => t.provider === p).length;
            return (
              <div key={p} className="rounded-2xl bg-secondary p-3">
                <p className="text-sm font-bold">{p}</p>
                <p className="mt-1 text-lg font-bold">{tz(total)}</p>
                <p className="text-[11px] text-muted-foreground">{count} transactions</p>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel
        title="Transactions"
        right={
          <span className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter status"
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold"
            >
              {["all", "completed", "pending", "failed", "refunded"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                exportCsv(
                  "transactions.csv",
                  ops.txns.map((t) => [
                    t.id,
                    t.user,
                    t.provider,
                    t.type,
                    t.amount,
                    t.fee,
                    t.status,
                    t.createdAt,
                  ]),
                  ["id", "user", "provider", "type", "amount", "fee", "status", "created_at"],
                )
              }
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
            >
              Export CSV
            </button>
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">ID</th>
                <th className="pb-2 pr-3">User</th>
                <th className="pb-2 pr-3">Provider</th>
                <th className="pb-2 pr-3">Amount</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 pr-3 font-mono text-xs">{t.id}</td>
                  <td className="py-2 pr-3 font-semibold">@{t.user}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {t.provider} · {t.type}
                  </td>
                  <td className="py-2 pr-3 font-bold">{tz(t.amount)}</td>
                  <td className="py-2 pr-3">
                    <Badge
                      tone={
                        t.status === "completed"
                          ? "dark"
                          : t.status === "pending"
                            ? "brand"
                            : t.status === "failed"
                              ? "red"
                              : "gray"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <span className="flex flex-wrap gap-1">
                      {t.status === "pending" && (
                        <>
                          <ModBtn
                            label="Approve"
                            onClick={() => setStatus(t.id, "completed", "Approve payout")}
                          />
                          <ModBtn
                            label="Refund"
                            danger
                            onClick={() => setStatus(t.id, "refunded", "Refund transaction")}
                          />
                        </>
                      )}
                      {t.status === "failed" && (
                        <ModBtn
                          label="Retry"
                          onClick={() => setStatus(t.id, "completed", "Retry transaction")}
                        />
                      )}
                      {t.status === "completed" && t.type === "withdrawal" && (
                        <ModBtn
                          label="Refund"
                          danger
                          onClick={() => setStatus(t.id, "refunded", "Refund transaction")}
                        />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------- CREATORS */
export function CreatorsSection({ m, ops, act }: SectionProps) {
  const leaders = m?.leaders ?? [];
  return (
    <Panel
      title="Creator management"
      hint="Earnings estimated from audience · payouts tracked locally"
    >
      {leaders.length === 0 ? (
        <Empty text="No creators yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3">Creator</th>
                <th className="pb-2 pr-3">Followers</th>
                <th className="pb-2 pr-3">Posts</th>
                <th className="pb-2 pr-3">Est. earnings</th>
                <th className="pb-2 pr-3">Payout</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaders.map((l) => {
                const payout = ops.payouts[l.id] ?? "unpaid";
                return (
                  <tr key={l.id}>
                    <td className="py-2 pr-3">
                      <p className="font-semibold">{l.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">@{l.username}</p>
                    </td>
                    <td className="py-2 pr-3 font-bold">{l.followers.toLocaleString()}</td>
                    <td className="py-2 pr-3">{l.posts}</td>
                    <td className="py-2 pr-3 font-bold">{tz(l.followers * 2)}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={payout}
                        onChange={(e) =>
                          act(`Set payout ${e.target.value}`, `@${l.username}`, (s) => ({
                            ...s,
                            payouts: {
                              ...s.payouts,
                              [l.id]: e.target.value as "unpaid" | "pending" | "paid",
                            },
                          }))
                        }
                        aria-label={`Payout status for ${l.username}`}
                        className="rounded-xl border border-border bg-secondary px-2 py-1.5 text-xs font-semibold"
                      >
                        <option value="unpaid">unpaid</option>
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <ModBtn
                        label="Approve verification"
                        onClick={() =>
                          act("Approve creator verification", `@${l.username}`, (s) => s)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
