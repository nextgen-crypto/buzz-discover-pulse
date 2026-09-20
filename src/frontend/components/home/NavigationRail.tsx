import { Link } from "@tanstack/react-router";
import { left, right } from "@/frontend/components/home/nav-items";

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
      activeOptions={{ exact }}
      activeProps={{ "aria-current": "page" }}
      className="flex w-full flex-col items-center gap-1 rounded-xl py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {({ isActive }) => (
        <>
          <Icon className={isActive ? "size-5 text-brand" : "size-5"} />
          <span className={isActive ? "text-[10px] font-semibold text-brand" : "text-[10px] font-medium"}>
            {label}
          </span>
        </>
      )}
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
    </nav>
  );
}