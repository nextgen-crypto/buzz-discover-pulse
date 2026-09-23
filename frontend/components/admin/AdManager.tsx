import { useRef, useState } from "react";
import { ImagePlus, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { getAds, notifyAdsChanged, saveAds, type Ad } from "@/frontend/components/ads/ads";
import { uploadAndSign } from "@/frontend/lib/storageUpload";

const PLANS = [
  { price: 10, label: "$10 · Starter", reach: "±1k views" },
  { price: 50, label: "$50 · Growth", reach: "±10k views" },
  { price: 200, label: "$200 · Scale", reach: "±50k views" },
];

/** Monochrome ad management: create, pay (simulated), pause, track. */
export function AdManager({
  ads,
  refresh,
  userId,
}: {
  ads: Ad[];
  refresh: () => void;
  userId: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [plan, setPlan] = useState(PLANS[1]!);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadCreative(file: File) {
    if (!userId) {
      setError("Sign in to upload a creative.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      setImageUrl(
        await uploadAndSign("post-images", `${userId}/ad-${Date.now()}.jpg`, file, {
          width: 1280,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function mutate(id: string, fn: (a: Ad) => Ad) {
    saveAds(getAds().map((a) => (a.id === id ? fn(a) : a)));
    notifyAdsChanged();
    refresh();
  }

  async function payAndLaunch() {
    if (!title.trim() || !imageUrl || !linkUrl.trim()) {
      setError("Title, creative and link are required.");
      return;
    }
    setPaying(true);
    setError(null);
    await new Promise((res) => setTimeout(res, 1200));
    const ad: Ad = {
      id: `ad-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      imageUrl,
      linkUrl: /^https?:\/\//.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`,
      budget: plan.price,
      paid: true,
      status: "active",
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    saveAds([ad, ...getAds()]);
    notifyAdsChanged();
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setLinkUrl("");
    setPaying(false);
    refresh();
  }

  const revenue = ads.filter((a) => a.paid).reduce((s, a) => s + a.budget, 0);
  const impressions = ads.reduce((s, a) => s + a.impressions, 0);
  const clicks = ads.reduce((s, a) => s + a.clicks, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          {
            label: "Active ads",
            value: `${ads.filter((a) => a.status === "active" && a.paid).length}`,
          },
          { label: "Impressions", value: `${impressions}` },
          { label: "Clicks", value: `${clicks}` },
          { label: "Revenue", value: `$${revenue}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-secondary p-3">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border p-3 sm:p-4">
        <p className="text-sm font-bold text-foreground">New campaign</p>
        <div className="mt-2 grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer collection"
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Subtitle</span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Up to 40% off this week"
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Creative</span>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary px-3 py-2.5 text-sm font-semibold"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {imageUrl ? "Replace image" : "Upload image"}
              </button>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="…or paste image URL"
                className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Ad creative preview"
                className="mt-2 aspect-[16/9] w-full rounded-xl border border-border object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadCreative(f);
                e.target.value = "";
              }}
            />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Plan</span>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {PLANS.map((p) => (
                <button
                  key={p.price}
                  onClick={() => setPlan(p)}
                  className={`rounded-xl px-2 py-2.5 text-center ${
                    plan.price === p.price
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <span className="block text-xs font-bold">{p.label}</span>
                  <span className="block text-[11px] opacity-70">{p.reach}</span>
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-muted-foreground">Destination link</span>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="shop.example.com/sale"
                className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </label>
          </div>
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-live">{error}</p>}
        <button
          onClick={payAndLaunch}
          disabled={paying || uploading}
          className="press mt-3 w-full rounded-full bg-foreground py-2.5 text-sm font-bold text-background disabled:opacity-60"
        >
          {paying ? "Processing payment…" : `Pay $${plan.price} & launch`}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Simulated checkout — no real charge. Ads inject into Home + Videos feeds.
        </p>
      </div>

      {ads.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {ads.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              {a.imageUrl && (
                <img src={a.imageUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {a.title}
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${a.paid && a.status === "active" ? "bg-brand" : "bg-muted-foreground"}`}
                  />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  ${a.budget} · {a.impressions} views · {a.clicks} clicks ·{" "}
                  {a.paid ? a.status : "unpaid"}
                </span>
              </span>
              <button
                aria-label={a.status === "active" ? "Pause ad" : "Resume ad"}
                onClick={() =>
                  mutate(a.id, (x) => ({
                    ...x,
                    status: x.status === "active" ? "paused" : "active",
                  }))
                }
                className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
              >
                {a.status === "active" ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
              <button
                aria-label="Delete ad"
                onClick={() => {
                  saveAds(getAds().filter((x) => x.id !== a.id));
                  notifyAdsChanged();
                  refresh();
                }}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
