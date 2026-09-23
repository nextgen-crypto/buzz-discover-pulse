import { useEffect, useState } from "react";

export interface ShowcaseSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  cta: string;
  linkUrl: string;
  active: boolean;
  createdAt: string;
}

const KEY = "wizz:showcase-v1";

export function getSlides(): ShowcaseSlide[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ShowcaseSlide[];
  } catch {
    return [];
  }
}

export function saveSlides(slides: ShowcaseSlide[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slides));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("showcase-changed"));
}

export function activeSlides(): ShowcaseSlide[] {
  return getSlides().filter((s) => s.active);
}

/** Live list of active showcase slides for feed display. Mount-gated so SSR
 *  (no localStorage) and hydration render identically. */
export function useShowcase(): ShowcaseSlide[] {
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  useEffect(() => {
    const refresh = () => setSlides(activeSlides());
    refresh();
    window.addEventListener("showcase-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("showcase-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return slides;
}
