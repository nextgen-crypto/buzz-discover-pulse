import { useEffect, useState } from "react";

export interface Ad {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  budget: number;
  paid: boolean;
  status: "active" | "paused";
  impressions: number;
  clicks: number;
  createdAt: string;
}

const KEY = "wizz:ads";

export function getAds(): Ad[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Ad[];
  } catch {
    return [];
  }
}

export function saveAds(ads: Ad[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ads));
  } catch {
    // storage unavailable
  }
}

export function activeAds(): Ad[] {
  return getAds().filter((a) => a.paid && a.status === "active");
}

function touch(id: string, field: "impressions" | "clicks") {
  saveAds(getAds().map((a) => (a.id === id ? { ...a, [field]: a[field] + 1 } : a)));
}

export function recordImpression(id: string) {
  touch(id, "impressions");
}

export function recordClick(id: string) {
  touch(id, "clicks");
}

/** Live list of paid + active ads for feed injection. Mount-gated so SSR
 *  (no localStorage) and hydration render identically. */
export function useAds(): Ad[] {
  const [ads, setAds] = useState<Ad[]>([]);
  useEffect(() => {
    const refresh = () => setAds(activeAds());
    refresh();
    window.addEventListener("ads-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ads-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return ads;
}

export function notifyAdsChanged() {
  window.dispatchEvent(new CustomEvent("ads-changed"));
}
