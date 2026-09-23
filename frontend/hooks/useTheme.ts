import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "wizz:theme";

function stored(): Theme {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // storage unavailable
  }
  return "system";
}

function apply(next: Theme) {
  if (typeof document === "undefined") return;
  const prefersDark =
    next === "dark" ||
    (next === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", prefersDark);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // storage unavailable
  }
}

/** App theme, persisted. Every surface reads/writes the same preference. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(stored);

  useEffect(() => {
    apply(stored());
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
    apply(next);
  }, []);

  return { theme, applyTheme };
}
