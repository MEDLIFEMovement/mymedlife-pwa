"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type {
  MobileNavigationItem,
  NavigationItem,
} from "@/services/role-visibility";

type AppNavigationProps = {
  mode?: "default" | "mobile-app";
  navItems: NavigationItem[];
  quickItems: MobileNavigationItem[];
  showQuickItemHelpers?: boolean;
  tone?: "dark" | "light";
};

export function AppNavigation({
  mode = "default",
  navItems,
  quickItems,
  showQuickItemHelpers = true,
  tone = "dark",
}: AppNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeNavIndex = getActiveIndex(pathname, searchParams, navItems);
  const activeQuickIndex = getActiveIndex(pathname, searchParams, quickItems);
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
                "shrink-0 snap-start rounded-full border px-3 py-2 text-[0.94rem] font-medium transition",
                isActive
                  ? tone === "light"
                    ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_12px_24px_rgba(59,115,231,0.12)]"
                    : "border-[#5d8ff6]/45 bg-[#5d8ff6]/14 text-white shadow-[0_0_24px_rgba(93,143,246,0.18)]"
                  : tone === "light"
                    ? "border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:text-slate-950"
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
        className={[
          "fixed z-40 grid gap-1 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:hidden",
          showQuickItemHelpers
            ? "inset-x-3 bottom-3 rounded-[1.5rem] p-2"
            : "inset-x-3 bottom-2 rounded-[1.2rem] p-1.5",
          tone === "light"
            ? "border border-slate-200/90 bg-white/96"
            : "border border-white/12 bg-[#081a3a]/95",
          quickGridClassName,
        ].join(" ")}
      >
        {quickItems.map((item, index) => {
          const isActive = index === activeQuickIndex;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                showQuickItemHelpers
                  ? "flex min-h-14 flex-col items-center justify-center rounded-[1rem] px-2 text-center transition"
                  : "flex min-h-[3rem] items-center justify-center rounded-[0.9rem] px-2 text-center transition",
                isActive
                  ? tone === "light"
                    ? "bg-[#f7d05e] text-[#08224c] shadow-[0_12px_26px_rgba(247,208,94,0.22)]"
                    : "bg-[#f7d05e] text-[#08224c] shadow-[0_0_24px_rgba(247,208,94,0.24)]"
                  : tone === "light"
                    ? "bg-slate-50 text-slate-600 hover:bg-[#eef4ff] hover:text-slate-950"
                    : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
            >
              <span className="text-[0.68rem] font-semibold leading-tight">{item.label}</span>
              {showQuickItemHelpers ? (
                <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] opacity-70">
                  {item.helper}
                </span>
              ) : null}
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

function getActiveIndex(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike,
  items: NavigationItem[],
): number {
  let activeIndex = -1;
  let activeScore = -1;

  items.forEach((item, index) => {
    const location = parseHref(item.href);

    if (!isActiveLocation(pathname, searchParams, location)) {
      return;
    }

    const score = location.path.length * 10 + location.params.length;
    if (score <= activeScore) {
      return;
    }

    activeIndex = index;
    activeScore = score;
  });

  return activeIndex;
}

function isActiveLocation(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike,
  location: ParsedHref,
): boolean {
  if (!isActivePath(pathname, location.path)) {
    return false;
  }

  return location.params.every(([key, value]) => getComparableParamValue(pathname, searchParams, key) === value);
}

function isActivePath(pathname: string, path: string): boolean {
  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

type ParsedHref = {
  path: string;
  params: Array<[string, string]>;
};

type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};

function parseHref(href: string): ParsedHref {
  const hashIndex = href.indexOf("#");
  const normalizedHref = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const [path, query = ""] = normalizedHref.split("?");

  return {
    path,
    params: Array.from(new URLSearchParams(query).entries()),
  };
}

function getComparableParamValue(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike,
  key: string,
): string | null {
  const value = searchParams.get(key);
  if (value) {
    return value;
  }

  if (key !== "view") {
    return value;
  }

  switch (pathname) {
    case "/chapter":
      return "overview";
    case "/coach":
      return "chapters";
    case "/staff":
      return "chapters";
    default:
      return value;
  }
}
