"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type {
  MobileNavigationItem,
  NavigationItem,
} from "@/services/role-visibility";

type AppNavigationProps = {
  mode?: "default" | "mobile-app";
  layout?: "horizontal" | "sidebar";
  surfaceFamily?: "member" | "leader" | "coach" | "staff" | "ds_admin" | "super_admin";
  heading?: string;
  summary?: string;
  navItems: NavigationItem[];
  quickItems: MobileNavigationItem[];
  showQuickItemHelpers?: boolean;
};

export function AppNavigation({
  mode = "default",
  layout = "horizontal",
  surfaceFamily,
  heading,
  summary,
  navItems,
  quickItems,
  showQuickItemHelpers = true,
}: AppNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeNavIndex = getActiveIndex(pathname, searchParams, navItems);
  const activeQuickIndex = getActiveIndex(pathname, searchParams, quickItems);
  const quickGridClassName = getQuickGridClassName(quickItems.length);

  return (
    <>
      {layout === "sidebar" ? (
        <aside
          className={[
            "hidden lg:block lg:sticky lg:top-4 lg:self-start",
            mode === "mobile-app" ? "hidden" : "",
          ].join(" ")}
        >
          <div
            className={[
              "rounded-[1.7rem] border p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl",
              getSidebarChromeClasses(surfaceFamily),
            ].join(" ")}
          >
            <div className="mb-4 space-y-1">
              <p className={getSidebarEyebrowClasses(surfaceFamily)}>
                {heading ?? "Navigation"}
              </p>
              <p className={getSidebarSummaryClasses(surfaceFamily)}>
                {summary ?? "Move through the surface that matches your role."}
              </p>
            </div>
            <nav aria-label="Primary app navigation" className="grid gap-2">
              {navItems.map((item, index) => {
                const isActive = index === activeNavIndex;

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      getSidebarNavItemBaseClasses(surfaceFamily),
                      isActive
                        ? getSidebarNavItemActiveClasses(surfaceFamily)
                        : getSidebarNavItemInactiveClasses(surfaceFamily),
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      ) : (
        <div
          className={[
            "rounded-[1.4rem] border p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl",
            "border-slate-200/90 bg-white/82",
            mode === "mobile-app" ? "hidden sm:block" : "",
          ].join(" ")}
        >
          <nav aria-label="Primary app navigation" className="flex snap-x gap-2 overflow-x-auto pb-1">
            {navItems.map((item, index) => {
              const isActive = index === activeNavIndex;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "shrink-0 snap-start rounded-[1rem] border px-4 py-2.5 text-[0.92rem] font-semibold transition",
                    isActive
                      ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_12px_24px_rgba(59,115,231,0.12)]"
                      : "border-transparent bg-transparent text-slate-600 hover:border-[#bfdbfe] hover:bg-white hover:text-slate-950",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <nav
        aria-label="Mobile quick navigation"
        className={[
          "fixed z-40 grid gap-1 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden",
          showQuickItemHelpers
            ? "inset-x-3 bottom-3 rounded-[1.5rem] p-2"
            : "inset-x-3 bottom-2 rounded-[1.2rem] p-1.5",
          "border border-slate-200/90 bg-white/96",
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
                    ? "bg-[#2563eb] text-white shadow-[0_12px_26px_rgba(93,143,246,0.22)]"
                    : "bg-[#dbeafe] text-slate-600 hover:bg-[#eef4ff] hover:text-slate-950",
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

function getSidebarChromeClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  switch (surfaceFamily) {
    case "leader":
      return "border-[#20386f]/90 bg-[#0b1d39] text-white";
    case "coach":
      return "border-[#dbeafe]/90 bg-[#fbfdff]/96";
    case "staff":
      return "border-[#e2e8f0] bg-white/94";
    case "ds_admin":
    case "super_admin":
      return "border-slate-200/95 bg-[#fbfdff]/97";
    case "member":
    default:
      return "border-slate-200/90 bg-white/92";
  }
}

function getSidebarNavItemBaseClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  switch (surfaceFamily) {
    case "leader":
      return "rounded-[0.95rem] border px-4 py-2.5 text-[0.92rem] font-semibold transition";
    case "coach":
    case "staff":
    case "ds_admin":
    case "super_admin":
      return "rounded-[0.95rem] border px-4 py-2.5 text-[0.92rem] font-semibold transition";
    case "member":
    default:
      return "rounded-[1rem] border px-4 py-3 text-sm font-semibold transition";
  }
}

function getSidebarNavItemActiveClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  switch (surfaceFamily) {
    case "leader":
      return "border-[#2f5be0] bg-[#2f5be0] text-white shadow-[0_10px_22px_rgba(47,91,224,0.28)]";
    case "coach":
      return "border-[#dbeafe] bg-[#f8fbff] text-[#1d4ed8] shadow-[0_10px_22px_rgba(37,99,235,0.08)]";
    case "staff":
      return "border-[#dbeafe] bg-[#f8fbff] text-[#1d4ed8] shadow-[0_10px_22px_rgba(37,99,235,0.08)]";
    case "ds_admin":
    case "super_admin":
      return "border-slate-200 bg-[#f8fbff] text-slate-950 shadow-[0_10px_22px_rgba(15,23,42,0.06)]";
    case "member":
    default:
      return "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_12px_24px_rgba(59,115,231,0.12)]";
  }
}

function getSidebarNavItemInactiveClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  switch (surfaceFamily) {
    case "leader":
      return "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white";
    case "coach":
    case "staff":
      return "border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#f8fbff] hover:text-slate-950";
    case "ds_admin":
    case "super_admin":
      return "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-[#f8fbff] hover:text-slate-950";
    case "member":
    default:
      return "border-slate-200 bg-white text-slate-600 hover:border-[#bfdbfe] hover:bg-[#f8fbff] hover:text-slate-950";
  }
}

function getSidebarEyebrowClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  const base = "text-[0.7rem] font-semibold uppercase tracking-[0.24em]";

  switch (surfaceFamily) {
    case "leader":
      return `${base} text-[#8ab4ff]`;
    case "coach":
      return `${base} text-[#2563eb]`;
    case "staff":
      return `${base} text-[#2563eb]`;
    case "ds_admin":
    case "super_admin":
      return `${base} text-slate-600`;
    case "member":
    default:
      return `${base} text-[#2563eb]`;
  }
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

function getSidebarSummaryClasses(
  surfaceFamily?: AppNavigationProps["surfaceFamily"],
): string {
  switch (surfaceFamily) {
    case "leader":
      return "text-sm font-semibold text-white";
    case "ds_admin":
    case "super_admin":
      return "text-sm font-semibold text-slate-950";
    default:
      return "text-sm font-semibold text-slate-950";
  }
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

  const areLeaderAliases =
    (pathname === "/chapter" && path === "/leader") ||
    (pathname === "/leader" && path === "/chapter");

  return areLeaderAliases || pathname === path || pathname.startsWith(`${path}/`);
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
    case "/leader":
      return "overview";
    case "/coach":
    case "/staff":
      return "chapters";
    default:
      return value;
  }
}
