import Link from "next/link";
import { CalendarDays, Heart, Home, Trophy, User } from "lucide-react";

function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

export type MemberBottomNavTab =
  | "home"
  | "stories"
  | "events"
  | "points"
  | "profile";

type MemberBottomNavProps = {
  activeTab: MemberBottomNavTab;
  profileHref?: string;
};

export function MemberBottomNav({
  activeTab,
  profileHref = "/profile",
}: MemberBottomNavProps) {
  const items: {
    id: MemberBottomNavTab;
    label: string;
    href: string;
    Icon: typeof Home;
  }[] = [
    { id: "home", label: "Home", href: "/app", Icon: Home },
    { id: "stories", label: "Stories", href: "/app/stories", Icon: Heart },
    { id: "events", label: "Events", href: "/app/events", Icon: CalendarDays },
    { id: "points", label: "Points", href: "/app/points", Icon: Trophy },
    { id: "profile", label: "Profile", href: profileHref, Icon: User },
  ];

  return (
    <nav
      aria-label="Member bottom navigation"
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card pb-safe"
    >
      {items.map(({ id, label, href, Icon }) => {
        const isActive = activeTab === id;

        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
