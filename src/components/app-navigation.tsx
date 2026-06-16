"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  MobileNavigationItem,
  NavigationItem,
} from "@/services/role-visibility";

type AppNavigationProps = {
  navItems: NavigationItem[];
  quickItems: MobileNavigationItem[];
};

export function AppNavigation({ navItems, quickItems }: AppNavigationProps) {
  const pathname = usePathname();
  const activeNavIndex = getActiveIndex(pathname, navItems);
  const activeQuickIndex = getActiveIndex(pathname, quickItems);

  return (
    <>
      <nav
        aria-label="Primary app navigation"
        className="flex snap-x gap-2 overflow-x-auto pb-1"
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
                  ? "border-emerald-200/60 bg-emerald-200/18 text-white shadow-[0_0_24px_rgba(147,227,200,0.16)]"
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
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[1.5rem] border border-white/12 bg-[#071d1a]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:hidden"
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
                  ? "bg-emerald-200 text-[#08231e] shadow-[0_0_24px_rgba(147,227,200,0.22)]"
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
