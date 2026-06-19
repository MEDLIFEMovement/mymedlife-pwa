"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  MobileNavigationItem,
  NavigationItem,
} from "@/services/role-visibility";

type AppNavigationProps = {
  mode?: "default" | "mobile-app";
  navItems: NavigationItem[];
  quickItems: MobileNavigationItem[];
};

export function AppNavigation({
  mode = "default",
  navItems,
  quickItems,
}: AppNavigationProps) {
  const pathname = usePathname();
  const activeNavIndex = getActiveIndex(pathname, navItems);
  const activeQuickIndex = getActiveIndex(pathname, quickItems);
  const quickGridClassName = getQuickGridClassName(quickItems.length);

  return (
    <>
      <nav
        aria-label="Primary app navigation"
        className={[
          "snap-x gap-2 overflow-x-auto pb-1",
          mode === "mobile-app" ? "hidden sm:flex" : "flex",
        ].join(" ")}
      >
        {navItems.map((item, index) => {
          const isActive = index === activeNavIndex;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "shrink-0 snap-start rounded-full border px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "border-[#5d8ff6]/45 bg-[#5d8ff6]/14 text-white shadow-[0_0_24px_rgba(93,143,246,0.18)]"
                  : "border-white/10 bg-black/20 text-white/72 hover:border-white/22 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Mobile quick navigation"
        className={`fixed inset-x-3 bottom-3 z-40 grid gap-1 rounded-[1.5rem] border border-white/12 bg-[#081a3a]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:hidden ${quickGridClassName}`}
      >
        {quickItems.map((item, index) => {
          const isActive = index === activeQuickIndex;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex min-h-14 flex-col items-center justify-center rounded-[1rem] px-2 text-center transition",
                isActive
                  ? "bg-[#f7d05e] text-[#08224c] shadow-[0_0_24px_rgba(247,208,94,0.24)]"
                  : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
            >
              <span className="text-[0.7rem] font-semibold leading-tight">{item.label}</span>
              <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] opacity-70">
                {item.helper}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function getQuickGridClassName(count: number) {
  if (count <= 3) {
    return "grid-cols-3";
  }

  if (count === 5) {
    return "grid-cols-5";
  }

  return "grid-cols-4";
}

function getActiveIndex(pathname: string, items: NavigationItem[]): number {
  let activeIndex = -1;
  let activeHrefLength = -1;

  items.forEach((item, index) => {
    if (!isActivePath(pathname, item.href) || item.href.length <= activeHrefLength) {
      return;
    }

    activeIndex = index;
    activeHrefLength = item.href.length;
  });

  return activeIndex;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
