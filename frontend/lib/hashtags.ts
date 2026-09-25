const HASHTAG_PATTERN = /#([\p{L}\p{N}_]+)/gu;

function normalizeTag(value: string): string {
  return value.trim().replace(/^#/, "").toLowerCase();
}

/** Extract explicit caption hashtags plus comma/space-separated tag metadata. */
export function extractHashtags(caption: string, tags = ""): string[] {
  const found = new Set<string>();
  for (const match of caption.matchAll(HASHTAG_PATTERN)) {
    const tag = normalizeTag(match[1] ?? "");
    if (tag) found.add(tag);
  }
  for (const raw of tags.split(/[\s,]+/)) {
    const tag = normalizeTag(raw.replace(/^@/, ""));
    if (tag && /[\p{L}\p{N}_]/u.test(tag)) found.add(tag);
  }
  return [...found].slice(0, 8);
}

/** Avoid rendering a stored tag twice when it is already present in the caption. */
export function visibleHashtags(caption: string, hashtags: string[]): string[] {
  const present = new Set(
    [...caption.matchAll(HASHTAG_PATTERN)].map((match) => normalizeTag(match[1] ?? "")),
  );
  return [...new Set(hashtags.map(normalizeTag).filter((tag) => tag && !present.has(tag)))].slice(
    0,
    8,
  );
}
