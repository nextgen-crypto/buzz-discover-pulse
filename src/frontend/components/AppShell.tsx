import type { ReactNode } from "react";
import { BottomNav } from "@/frontend/components/home/BottomNav";
import { NavigationRail } from "@/frontend/components/home/NavigationRail";
import { TopBar } from "@/frontend/components/home/TopBar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-surface-strong md:pl-20">
      <NavigationRail />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-background md:border-x md:border-border">
        <TopBar />
        <main className="min-w-0 flex-1 pb-24 md:pb-10">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
