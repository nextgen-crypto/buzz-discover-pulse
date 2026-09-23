const compact = new Intl.NumberFormat("en", { notation: "compact" });

/** 2800 -> "2.8K", 228 -> "228", 3000 -> "3K". */
export function formatCount(n: number): string {
  return compact.format(n);
}

/** First @mention in a caption, for "Replying to @user" lines. */
export function replyingTo(caption: string): string | null {
  const m = /@([\p{L}\p{N}._]+)/u.exec(caption);
  return m ? m[1]!.toLowerCase() : null;
}
export function newsTimeAgo(iso: string): string {
  const mins = Math.max(
    1,
    Math.round((Date.parse("2026-08-27T12:00:00.000Z") - Date.parse(iso)) / 60_000),
  );
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / (60 * 24))}d`;
}
