import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DayBucket {
  day: string;
  users: number;
  posts: number;
  follows: number;
}

export interface Leader {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  followers: number;
  posts: number;
}

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  created_at: string;
}

export interface RecentPost {
  id: string;
  caption: string;
  author: string;
  created_at: string;
  hasImage: boolean;
}

export interface AdminMetrics {
  totals: { users: number; posts: number; follows: number; today: number };
  series: DayBucket[];
  categories: { name: string; count: number }[];
  hashtags: { tag: string; count: number }[];
  leaders: Leader[];
  recent: RecentPost[];
  users: AdminUser[];
  newWeek: number;
}

const DAY = 86_400_000;

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function useAdminMetrics(enabled: boolean) {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, posts, follows, profiles, followsRows] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("posts").select("id", { count: "exact", head: true }),
          supabase.from("follows").select("follower_id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, verified, created_at")
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("follows")
            .select("follower_id, followee_id, created_at")
            .order("created_at", { ascending: false })
            .limit(2000),
        ]);
        for (const r of [usersRes, posts, follows, profiles, followsRows]) {
          if (r.error) throw r.error;
        }
        const currentPosts = await supabase
          .from("posts")
          .select("id, author_id, caption, image_url, image_path, category, hashtags, created_at")
          .order("created_at", { ascending: false })
          .limit(1000);
        const postRows = currentPosts.error
          ? await supabase
              .from("posts")
              .select("id, author_id, caption, image_url, category, hashtags, created_at")
              .order("created_at", { ascending: false })
              .limit(1000)
          : currentPosts;
        if (postRows.error) throw postRows.error;

        // 14-day series buckets.
        const days: DayBucket[] = Array.from({ length: 14 }, (_, i) => {
          const ts = Date.now() - (13 - i) * DAY;
          return { day: dayKey(ts), users: 0, posts: 0, follows: 0 };
        });
        const byDay = new Map(days.map((d) => [d.day, d]));
        const bump = (iso: string, field: "users" | "posts" | "follows") => {
          const b = byDay.get(dayKey(Date.parse(iso)));
          if (b) b[field] += 1;
        };
        for (const p of (profiles.data ?? []) as { created_at: string }[])
          bump(p.created_at, "users");
        for (const p of (postRows.data ?? []) as { created_at: string }[])
          bump(p.created_at, "posts");
        for (const f of (followsRows.data ?? []) as { created_at: string }[])
          bump(f.created_at, "follows");

        // Categories + hashtags from the same post sample.
        const catCount = new Map<string, number>();
        const tagCount = new Map<string, number>();
        for (const p of (postRows.data ?? []) as { category: string; hashtags: string[] }[]) {
          catCount.set(p.category, (catCount.get(p.category) ?? 0) + 1);
          for (const t of p.hashtags ?? []) {
            const clean = t.trim().toLowerCase();
            if (clean) tagCount.set(clean, (tagCount.get(clean) ?? 0) + 1);
          }
        }
        const categories = [...catCount.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 7);
        const hashtags = [...tagCount.entries()]
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Leaders: follower counts joined onto profiles.
        const followerCount = new Map<string, number>();
        for (const f of (followsRows.data ?? []) as { followee_id: string }[]) {
          followerCount.set(f.followee_id, (followerCount.get(f.followee_id) ?? 0) + 1);
        }
        const postCount = new Map<string, number>();
        for (const p of (postRows.data ?? []) as { author_id: string }[]) {
          postCount.set(p.author_id, (postCount.get(p.author_id) ?? 0) + 1);
        }
        const leaders: Leader[] = (
          (profiles.data ?? []) as {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
            verified: boolean;
          }[]
        )
          .map((p) => ({
            ...p,
            followers: followerCount.get(p.id) ?? 0,
            posts: postCount.get(p.id) ?? 0,
          }))
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 8);

        const todayKey = dayKey(Date.now());
        const today = byDay.get(todayKey);
        const weekAgo = Date.now() - 7 * DAY;
        const allUsers: AdminUser[] = (
          (profiles.data ?? []) as {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
            verified: boolean;
            created_at: string;
          }[]
        )
          .slice(0, 200)
          .map((p) => ({
            id: p.id,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            verified: p.verified,
            created_at: p.created_at,
          }));
        const newWeek = allUsers.filter((u) => Date.parse(u.created_at) >= weekAgo).length;
        const nameOf = new Map(
          ((profiles.data ?? []) as { id: string; username: string }[]).map((p) => [
            p.id,
            p.username,
          ]),
        );
        const recent: RecentPost[] = (
          (postRows.data ?? []) as {
            id: string;
            author_id: string;
            caption: string;
            image_url: string | null;
            image_path?: string | null;
            created_at: string;
          }[]
        )
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            caption: p.caption,
            author: nameOf.get(p.author_id) ?? "unknown",
            created_at: p.created_at,
            hasImage: Boolean(p.image_url || p.image_path),
          }));
        if (!cancelled) {
          setData({
            totals: {
              users: usersRes.count ?? 0,
              posts: posts.count ?? 0,
              follows: follows.count ?? 0,
              today: (today?.users ?? 0) + (today?.posts ?? 0) + (today?.follows ?? 0),
            },
            series: days,
            categories,
            hashtags,
            leaders,
            recent,
            users: allUsers,
            newWeek,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load metrics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading, error };
}
