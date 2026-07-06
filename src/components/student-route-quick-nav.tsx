import Link from "next/link";
import { CalendarDays, Home, Sparkles, Trophy, User } from "lucide-react";

type StudentRouteQuickNavItem = {
  href: string;
  label: string;
  helper: string;
  key: StudentRouteQuickNavKey;
  Icon: typeof Home;
};

export type StudentRouteQuickNavKey =
  | "home"
  | "stories"
  | "events"
  | "points"
  | "profile";

const studentRouteQuickNavItems: StudentRouteQuickNavItem[] = [
  { key: "home", label: "Home", helper: "Today", href: "/app", Icon: Home },
  { key: "stories", label: "Stories", helper: "Field", href: "/app/stories", Icon: Sparkles },
  { key: "events", label: "Events", helper: "RSVP", href: "/app/events", Icon: CalendarDays },
  { key: "points", label: "Points", helper: "Rank", href: "/app/points", Icon: Trophy },
  { key: "profile", label: "Profile", helper: "Me", href: "/profile", Icon: User },
];

export function StudentRouteQuickNav({
  active,
}: {
  active: StudentRouteQuickNavKey;
}) {
  return (
    <nav
      aria-label="Student quick navigation"
      className="fixed bottom-3 left-1/2 z-50 grid w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 grid-cols-5 gap-1 rounded-[1.5rem] border border-slate-200 bg-white/96 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      {studentRouteQuickNavItems.map(({ href, label, helper, key, Icon }) => {
        const isActive = active === key;

        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex min-h-14 flex-col items-center justify-center rounded-[1rem] px-2 text-center transition",
              isActive
                ? "bg-[#2563eb] text-white shadow-[0_12px_26px_rgba(93,143,246,0.22)]"
                : "bg-[#dbeafe] text-slate-600 hover:bg-[#eef4ff] hover:text-slate-950",
            ].join(" ")}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
            <span className="mt-0.5 text-[0.68rem] font-semibold leading-tight">
              {label}
            </span>
            <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] opacity-70">
              {helper}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
