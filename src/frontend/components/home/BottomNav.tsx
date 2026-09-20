import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Sheet } from "@/frontend/components/overlays/Sheet";
import { CreatePostSheet } from "@/frontend/components/home/CreatePostSheet";
import { left, right, createActions } from "@/frontend/components/home/nav-items";

function Tab({
  to,
  label,
  Icon,
  exact,
}: {
  to: string;
  label: string;
  Icon: (typeof left)[number]["Icon"];
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2"
      activeProps={{ "aria-current": "page" }}
    >
      {({ isActive }) => (
        <>
          <Icon className={isActive ? "size-5 text-brand" : "size-5 text-muted-foreground"} />
          <span
            className={
              isActive
                ? "max-w-full truncate text-[9px] font-semibold text-brand min-[390px]:text-[10px]"
                : "max-w-full truncate text-[9px] font-medium text-muted-foreground min-[390px]:text-[10px]"
            }
          >
            {label}
          </span>
        </>
      )}
    </Link>
  );
}

export function BottomNav() {
  const [creating, setCreating] = useState(false);
  const [posting, setPosting] = useState(false);

  return (
    <>
      <nav aria-label="Primary" className="pointer-events-none sticky bottom-0 z-40 px-2 pb-safe sm:px-4 md:hidden">
        <div className="pointer-events-auto mx-auto mb-2 flex w-full max-w-2xl items-center rounded-3xl border border-border bg-background/90 px-1 shadow-raise backdrop-blur-xl sm:px-2">
          {left.map((item) => (
            <Tab key={item.to} {...item} />
          ))}

          <button
            aria-label="Create"
            onClick={() => setCreating(true)}
            className="mx-1 grid size-11 place-items-center rounded-full bg-brand shadow-create transition-transform active:scale-95 min-[390px]:mx-2 min-[390px]:size-12"
          >
            <Plus className="size-6 text-white" strokeWidth={2.5} />
          </button>

          {right.map((item) => (
            <Tab key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Create">
        <div className="flex flex-col gap-1">
          {createActions.map(({ label, hint, Icon }) => (
            <button
              key={label}
              onClick={() => {
                if (label === "Post a photo") {
                  setCreating(false);
                  setPosting(true);
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-secondary"
            >
              <span className="grid size-10 place-items-center rounded-full bg-secondary">
                <Icon className="size-5 text-brand" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <CreatePostSheet open={posting} onClose={() => setPosting(false)} />
    </>
  );
}
