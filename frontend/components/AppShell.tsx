import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "@/frontend/components/home/BottomNav";
import { NavigationRail } from "@/frontend/components/home/NavigationRail";
import { TopBar } from "@/frontend/components/home/TopBar";
import { useSession } from "@/frontend/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

function useMaintenance(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("wizz:admin-ops-v1");
        setOn(
          Boolean(
            raw && (JSON.parse(raw) as { config?: { maintenance?: boolean } }).config?.maintenance,
          ),
        );
      } catch {
        setOn(false);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);
  return on;
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const maintenance = useMaintenance();
  const { user } = useSession();
  const [warnings, setWarnings] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    if (!user) {
      setWarnings([]);
      return;
    }
    supabase
      .from("warnings")
      .select("id, message")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setWarnings(data as { id: string; message: string }[]);
      });
  }, [user]);

  async function dismissWarning(id: string) {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
    await supabase.from("warnings").update({ is_read: true }).eq("id", id);
  }

  return (
    <div className="min-h-[100dvh] bg-surface-strong md:pl-20">
      <NavigationRail />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border">
        <TopBar />
        {maintenance && (
          <p className="bg-live px-4 py-2 text-center text-xs font-bold text-white">
            Maintenance mode is ON — some features may be unavailable.
          </p>
        )}
        {warnings.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-2 bg-foreground px-4 py-2 text-background"
          >
            <p className="min-w-0 flex-1 truncate text-xs font-semibold">{w.message}</p>
            <button
              onClick={() => void dismissWarning(w.id)}
              className="shrink-0 rounded-full bg-background/20 px-3 py-1 text-[11px] font-bold"
            >
              Dismiss
            </button>
          </div>
        ))}
        <main className="min-w-0 flex-1 pb-24 md:pb-10">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
