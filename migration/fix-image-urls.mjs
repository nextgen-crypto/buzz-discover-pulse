/**
 * Re-sign imported image URLs.
 *
 * The data import stores paths like:
 *   https://<ref>.supabase.co/storage/v1/object/sign/<bucket>/<path>
 * with NO token, so images 404. This script mints fresh 10-year signed URLs
 * (the app's own convention) and writes them back to posts + profiles.
 *
 *   DST_URL="https://<your-ref>.supabase.co" \
 *   DST_SERVICE_KEY="<your service_role key>" \
 *   node migration/fix-image-urls.mjs [--dry-run]
 *
 * Keys from env only — never hard-code them here.
 */

const DRY_RUN = process.argv.includes("--dry-run");
const URL = process.env.DST_URL;
const KEY = process.env.DST_SERVICE_KEY;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

if (!URL || !KEY || URL.includes("<") || KEY.includes("<")) {
  console.error("Set DST_URL and DST_SERVICE_KEY first.");
  process.exit(1);
}

const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

/** Extract bucket + path from a stored .../object/sign/<bucket>/<path>[?...] URL. */
function parseStoredUrl(u) {
  const m = u.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(\?|$)/);
  if (!m) return null;
  return { bucket: m[1], path: m[2].split("?")[0] };
}

async function sign(bucket, path) {
  const res = await fetch(`${URL}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ expiresIn: TEN_YEARS }),
  });
  if (!res.ok) throw new Error(`sign ${bucket}/${path}: ${res.status} ${await res.text()}`);
  const { signedURL } = await res.json();
  return `${URL}${signedURL}`;
}

async function all(table, select) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=${select}`, { headers: H });
  if (!res.ok) throw new Error(`read ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

let fixed = 0;
const failures = [];

// posts.image_url
for (const p of await all("posts", "id,image_url")) {
  if (!p.image_url || !p.image_url.includes("/object/sign/")) continue;
  const parsed = parseStoredUrl(p.image_url);
  if (!parsed) {
    failures.push(`posts/${p.id}: unparseable URL`);
    continue;
  }
  try {
    const fresh = DRY_RUN ? p.image_url : await sign(parsed.bucket, parsed.path);
    if (!DRY_RUN) {
      const up = await fetch(`${URL}/rest/v1/posts?id=eq.${p.id}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ image_url: fresh }),
      });
      if (!up.ok) throw new Error(`update: ${up.status} ${await up.text()}`);
    }
    fixed += 1;
    console.log(`posts/${p.id.slice(0, 8)} ✓`);
  } catch (e) {
    failures.push(`posts/${p.id}: ${e.message}`);
  }
}

// profiles.avatar_url
for (const p of await all("profiles", "id,avatar_url")) {
  if (!p.avatar_url || !p.avatar_url.includes("/object/sign/")) continue;
  const parsed = parseStoredUrl(p.avatar_url);
  if (!parsed) {
    failures.push(`profiles/${p.id}: unparseable URL`);
    continue;
  }
  try {
    const fresh = DRY_RUN ? p.avatar_url : await sign(parsed.bucket, parsed.path);
    if (!DRY_RUN) {
      const up = await fetch(`${URL}/rest/v1/profiles?id=eq.${p.id}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ avatar_url: fresh }),
      });
      if (!up.ok) throw new Error(`update: ${up.status} ${await up.text()}`);
    }
    fixed += 1;
    console.log(`profiles/${p.id.slice(0, 8)} ✓`);
  } catch (e) {
    failures.push(`profiles/${p.id}: ${e.message}`);
  }
}

console.log(`\nDone: ${fixed} URLs re-signed${DRY_RUN ? " (dry run)" : ""}.`);
if (failures.length > 0) {
  console.log(`${failures.length} failures:`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(2);
}
