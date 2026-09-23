/**
 * Copy Supabase Storage buckets + objects from one project to another.
 *
 *   SRC_URL="<source VITE_SUPABASE_URL>" \
 *   SRC_SERVICE_KEY="<source service_role key>" \
 *   DST_URL="https://<your-ref>.supabase.co" \
 *   DST_SERVICE_KEY="<your service_role key>" \
 *   node migration/copy-storage.mjs [--dry-run] [--buckets avatars,post-images]
 *
 * Uses only Node built-ins (global fetch). Never prints keys.
 */

const DRY_RUN = process.argv.includes("--dry-run");
const bucketsArg = process.argv.find((a) => a.startsWith("--buckets="));
const ONLY_BUCKETS = bucketsArg
  ? bucketsArg
      .slice("--buckets=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const SRC = {
  url: process.env.SRC_URL,
  key: process.env.SRC_SERVICE_KEY,
};
const DST = {
  url: process.env.DST_URL,
  key: process.env.DST_SERVICE_KEY,
};

for (const [name, v] of [
  ["SRC_URL", SRC.url],
  ["SRC_SERVICE_KEY", SRC.key],
  ["DST_URL", DST.url],
  ["DST_SERVICE_KEY", DST.key],
]) {
  if (!v || v.includes("<") || v.includes("your-")) {
    console.error(`Missing or placeholder env: ${name}`);
    process.exit(1);
  }
}

function api(base, key, path, init = {}) {
  return fetch(`${base}/storage/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });
}

async function listBuckets(base, key) {
  const res = await api(base, key, "/bucket");
  if (!res.ok) throw new Error(`list buckets failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createBucket(bucket) {
  const res = await api(DST.url, DST.key, "/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: bucket.name, public: bucket.public ?? false }),
  });
  if (res.status === 409 || res.status === 400) {
    const text = await res.text();
    if (text.includes("already exists") || text.includes("Duplicate")) return "exists";
    throw new Error(`create bucket ${bucket.name}: ${res.status} ${text}`);
  }
  if (!res.ok) throw new Error(`create bucket ${bucket.name}: ${res.status} ${await res.text()}`);
  return "created";
}

/** Recursive walk. Folder placeholders have no id. */
async function walk(bucket, prefix, out) {
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await api(SRC.url, SRC.key, `/object/list/${bucket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit, offset }),
    });
    if (!res.ok) throw new Error(`list ${bucket}/${prefix}: ${res.status} ${await res.text()}`);
    const entries = await res.json();
    if (!Array.isArray(entries) || entries.length === 0) break;
    for (const e of entries) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (!e.id) {
        await walk(bucket, path, out); // folder
      } else {
        out.push({ path, mimetype: e.metadata?.mimetype });
      }
    }
    if (entries.length < limit) break;
    offset += limit;
  }
}

async function copyFile(bucket, file) {
  const dl = await api(SRC.url, SRC.key, `/object/${bucket}/${file.path}`);
  if (!dl.ok) throw new Error(`download ${file.path}: ${dl.status}`);
  const bytes = new Uint8Array(await dl.arrayBuffer());
  if (DRY_RUN) return bytes.length;
  const up = await api(DST.url, DST.key, `/object/${bucket}/${file.path}`, {
    method: "POST",
    headers: {
      "Content-Type": file.mimetype || "application/octet-stream",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!up.ok) throw new Error(`upload ${file.path}: ${up.status} ${await up.text()}`);
  return bytes.length;
}

/** Tiny concurrency pool. */
async function pool(items, size, fn) {
  const results = [];
  const running = new Set();
  for (const item of items) {
    const p = fn(item).then(
      (v) => ({ ok: true, item, v }),
      (err) => ({ ok: false, item, err }),
    );
    running.add(p);
    p.finally(() => running.delete(p));
    results.push(p);
    if (running.size >= size) await Promise.race(running);
  }
  return Promise.all(results);
}

const buckets = (await listBuckets(SRC.url, SRC.key)).filter(
  (b) => !ONLY_BUCKETS || ONLY_BUCKETS.includes(b.name),
);
console.log(`Buckets to copy: ${buckets.map((b) => b.name).join(", ") || "(none)"}${DRY_RUN ? " [DRY RUN]" : ""}`);

let copied = 0;
let bytes = 0;
const failures = [];

for (const bucket of buckets) {
  const state = DRY_RUN ? "dry-run" : await createBucket(bucket);
  console.log(`[${bucket.name}] bucket: ${state}`);
  const files = [];
  await walk(bucket.name, "", files);
  console.log(`[${bucket.name}] ${files.length} files`);
  const results = await pool(files, 5, (f) => copyFile(bucket.name, f));
  for (const r of results) {
    if (r.ok) {
      copied += 1;
      bytes += r.v;
    } else {
      failures.push(`${bucket.name}/${r.item.path}: ${r.err.message}`);
    }
  }
}

console.log(`\nDone: ${copied} files, ${(bytes / 1024 / 1024).toFixed(1)} MB${DRY_RUN ? " (dry run, nothing written)" : ""}`);
if (failures.length > 0) {
  console.log(`\n${failures.length} failures:`);
  for (const f of failures.slice(0, 30)) console.log(`  - ${f}`);
  process.exit(2);
}
