import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { left, right } from "@/frontend/components/home/nav-items";
import { openCreate } from "@/frontend/components/home/nav-items";

function RailTab({
  to,
  label,
  Icon,
  exact,
}: {
  to: string;
  label: string;
  Icon: (typeof left)[number]["Icon"] | (typeof right)[number]["Icon"];
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      activeOptions={{ exact }}
      activeProps={{ "aria-current": "page" }}
      className="flex w-full flex-col items-center rounded-xl py-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {({ isActive }) => <Icon className={isActive ? "size-6 text-brand" : "size-6"} />}
    </Link>
  );
}

/** Tablet-and-up primary nav: mirrors BottomNav's routes as a docked left rail. */
export function NavigationRail() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r border-border bg-background px-2 py-4 md:flex"
    >
      <Link to="/" aria-label="WIZZ home" className="mb-5 text-xl font-black text-title">
        W
      </Link>

      {[...left, ...right].map((item) => (
        <RailTab key={item.to} {...item} />
      ))}
      <button
        aria-label="Create"
        onClick={() => openCreate()}
        className="press mt-2 grid size-11 place-items-center rounded-full bg-brand"
      >
        <Plus className="size-5 text-white" strokeWidth={2.5} />
      </button>
    </nav>
  );
}
