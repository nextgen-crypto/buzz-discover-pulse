import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Upload + long-lived signed URL. Requests a server-side resized rendition
 * (width px, quality 75) so feed/profile never download multi-MB originals.
 * Falls back to the plain signed URL when the project has transformations
 * disabled — uploads never break because of it.
 */
export async function uploadAndSign(
  bucket: string,
  path: string,
  file: File | Blob,
  opts?: { contentType?: string; width?: number; upsert?: boolean },
): Promise<string> {
  const { error: upError } = await supabase.storage
    .from(bucket)
    .upload(
      path,
      file,
      opts?.contentType || opts?.upsert
        ? { contentType: opts.contentType, upsert: opts.upsert }
        : undefined,
    );
  if (upError) throw upError;
  if (opts?.width) {
    const transformed = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, TEN_YEARS, {
        transform: { width: opts.width, quality: 75 },
      });
    if (!transformed.error) return transformed.data.signedUrl;
  }
  const signed = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}
