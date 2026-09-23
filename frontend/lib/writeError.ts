/**
 * Shared write-failure messaging. Auth/RLS rejections (expired or missing
 * session) all mean the same thing to the user: sign back in and retry.
 * Everything else surfaces the backend's own message.
 */
export function writeErrorMessage(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  if (/jwt expired|invalid.*token|unauthorized|401|refresh_token|session/i.test(msg)) {
    return "Session expired — log out and back in, then retry.";
  }
  return msg || fallback;
}
