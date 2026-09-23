/** Admin allowlist. Set VITE_ADMIN_EMAILS="you@example.com,teammate@example.com" in .env. */
export function adminEmails(): string[] {
  const raw = (import.meta.env["VITE_ADMIN_EMAILS"] as string | undefined) ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
