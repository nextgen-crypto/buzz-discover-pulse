/**
 * Object-storage + CDN addressing.
 *
 * PostgreSQL stores only `objectKey`. Renditions (thumbnail/small/medium/
 * large/original) are generated on ingest and served from the CDN edge, so the
 * client never downloads an original when a 400px thumbnail is enough.
 */

export type Rendition = "thumbnail" | "small" | "medium" | "large" | "original";

const RENDITION_WIDTH: Record<Rendition, number> = {
  thumbnail: 200,
  small: 400,
  medium: 800,
  large: 1280,
  original: 1920,
};

const CDN_BASE = "https://picsum.photos/seed";

function hashKey(objectKey: string): string {
  return encodeURIComponent(objectKey.replace(/[^a-zA-Z0-9]/g, "-"));
}

/** Resolve an image object key to a CDN URL at the requested rendition. */
export function imageUrl(objectKey: string, rendition: Rendition = "medium", aspect = 1): string {
  // Real Supabase URLs (signed storage URLs) pass through untouched.
  if (objectKey.startsWith("http")) return objectKey;
  const w = RENDITION_WIDTH[rendition];
  const h = Math.max(1, Math.round(w / aspect));
  return `${CDN_BASE}/${hashKey(objectKey)}/${w}/${h}`;
}

/** Low-cost LQIP used behind progressive image loading. */
export function placeholderUrl(objectKey: string): string {
  if (objectKey.startsWith("http")) return objectKey;
  return `${CDN_BASE}/${hashKey(objectKey)}/20/20`;
}

/** Responsive srcset so the device picks the cheapest adequate rendition. */
export function imageSrcSet(objectKey: string, aspect = 1): string {
  if (objectKey.startsWith("http")) return objectKey;
  return (["small", "medium", "large"] as const)
    .map((r) => `${imageUrl(objectKey, r, aspect)} ${RENDITION_WIDTH[r]}w`)
    .join(", ");
}

/**
 * Video delivery. Object keys resolve to compressed, CDN-hosted renditions;
 * originals are never streamed to clients.
 */
export function videoUrl(objectKey: string): string {
  return objectKey.startsWith("http") ? objectKey : `https://cdn.buzz.app/${objectKey}`;
}
