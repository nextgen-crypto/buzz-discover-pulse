import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { CreationEngine } from "@/frontend/components/create/creationEngine";
import { left, right, type CreateKind } from "@/frontend/components/home/nav-items";

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
      aria-label={label}
      activeOptions={{ exact }}
      className="flex min-w-0 flex-1 flex-col items-center py-2.5"
      activeProps={{ "aria-current": "page" }}
    >
      {({ isActive }) => (
        <span className="relative">
          <Icon
            className={isActive ? "animate-pop size-6 text-brand" : "size-6 text-muted-foreground"}
          />
          {isActive && (
            <span className="animate-scale-in absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />
          )}
        </span>
      )}
    </Link>
  );
}

/** Single global creation entry point. Contextual surfaces dispatch `open-create`. */
export function BottomNav() {
  const [createOpen, setCreateOpen] = useState(false);
  const [initialKind, setInitialKind] = useState<CreateKind | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const kind = (e as CustomEvent<{ kind?: CreateKind }>).detail?.kind ?? null;
      setInitialKind(kind);
      setCreateOpen(true);
    };
    window.addEventListener("open-create", handler);
    return () => window.removeEventListener("open-create", handler);
  }, []);

  return (
    <>
      <nav
        aria-label="Primary"
        className="animate-fade-up pointer-events-none sticky bottom-0 z-40 px-2 pb-safe sm:px-4 md:hidden"
      >
        <div className="pointer-events-auto mx-auto mb-2 flex w-full max-w-2xl items-center rounded-3xl border border-border bg-background/90 px-1 shadow-raise backdrop-blur-xl sm:px-2">
          {left.map((item) => (
            <Tab key={item.to} {...item} />
          ))}

          <button
            aria-label="Create"
            onClick={() => {
              setInitialKind(null);
              setCreateOpen(true);
            }}
            className="press mx-1 grid size-10 shrink-0 place-items-center rounded-full bg-brand min-[390px]:mx-2"
          >
            <Plus className="size-5 text-white" strokeWidth={2.5} />
          </button>

          {right.map((item) => (
            <Tab key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <CreationEngine
        open={createOpen}
        initial={initialKind}
        onClose={() => {
          setCreateOpen(false);
          setInitialKind(null);
        }}
      />
    </>
  );
}
