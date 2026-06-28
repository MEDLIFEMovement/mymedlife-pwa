import Link from "next/link";
import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app-navigation";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import type { LocalActorContext } from "@/services/local-actor-context";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  getActorSurfaceFamily,
  type MobileNavigationItem,
  getMobileQuickNavigationForActor,
  getNavigationForActor,
} from "@/services/role-visibility";

type AppShellProps = {
  children: ReactNode;
  actor?: LocalActorContext;
  chromeMode?: "default" | "mobile-app";
  debugToolsPlacement?: "before-content" | "after-content";
  hideTopHeader?: boolean;
  showMobileQuickItemHelpers?: boolean;
  showDebugTools?: boolean;
  mobileQuickItemsOverride?: MobileNavigationItem[];
};

export function AppShell({
  actor,
  children,
  chromeMode,
  debugToolsPlacement = "after-content",
  hideTopHeader = false,
  showMobileQuickItemHelpers = true,
  showDebugTools = true,
  mobileQuickItemsOverride,
}: AppShellProps) {
  const surfaceFamily = actor ? getActorSurfaceFamily(actor) : null;
  const isMemberShell = surfaceFamily === "member";
  const isCommandSurface = surfaceFamily !== null && surfaceFamily !== "member";
  const resolvedChromeMode =
    chromeMode ?? (isMemberShell ? "mobile-app" : "default");
  const shellVariant =
    isCommandSurface ? "command" : actor && !isMemberShell ? "compact" : "hero";
  const maxWidthClassName = isCommandSurface
    ? "max-w-[92rem]"
    : isMemberShell
      ? "max-w-[44rem]"
      : "max-w-6xl";
  const navItems = getNavigationForActor(actor);
  const quickItems = mobileQuickItemsOverride ?? getMobileQuickNavigationForActor(actor);
  const shellCopy = getShellCopy(actor);
  const showCommandSummary = !isCommandSurface;
  const showSharedTopHeader = !hideTopHeader;
  const showSharedDesktopRail = isCommandSurface;
  const sidebarCopy = getSidebarCopy(surfaceFamily);
  const debugActor = actor && showDebugTools ? actor : null;
  const shellBadge = getShellBadge(actor);
  const headerChrome = getHeaderChromeClasses(surfaceFamily, isCommandSurface);
  const mainChrome = getMainChromeClasses(surfaceFamily, resolvedChromeMode, isCommandSurface);
  const debugTools = debugActor ? (
    <details className="app-surface rounded-[1.65rem] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="app-eyebrow app-eyebrow-slate">Preview role</p>
          <p className="app-copy mt-2">
            Switch this browser between seeded member, leader, staff, and admin views without
            losing your place in the app.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-xs font-semibold text-slate-600">
          Browser only
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        <LocalActorNotice actor={debugActor} />
        <LocalRoleSwitcher actor={debugActor} />
      </div>
    </details>
  ) : null;

  return (
    <main
      className={[
        "min-h-screen px-4 sm:px-6 sm:pb-10 lg:px-8",
        mainChrome,
        resolvedChromeMode === "mobile-app"
          ? "pb-[calc(11rem+env(safe-area-inset-bottom))]"
          : "pb-28",
        resolvedChromeMode === "mobile-app" ? "pt-2 sm:pt-4" : isCommandSurface ? "pt-3" : "pt-4",
      ].join(" ")}
    >
      <a
        href="#main-content"
        className="sr-only rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>
      <div
        className={[
          `mx-auto flex w-full ${maxWidthClassName}`,
          showSharedDesktopRail
            ? "gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start"
            : "flex-col gap-4",
        ].join(" ")}
      >
        {showSharedDesktopRail ? (
          <div className="min-w-0">
            <AppNavigation
              layout="sidebar"
              mode={resolvedChromeMode}
              surfaceFamily={surfaceFamily ?? undefined}
              heading={sidebarCopy.heading}
              summary={sidebarCopy.summary}
              navItems={navItems}
              quickItems={quickItems}
              showQuickItemHelpers={showMobileQuickItemHelpers}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex flex-col gap-4">
        {showSharedTopHeader ? (
          <header
            className={[
              "border backdrop-blur-xl",
              resolvedChromeMode === "mobile-app"
                ? "hidden sm:block"
                : "",
              headerChrome,
              shellVariant === "command"
                ? "rounded-[1.15rem] px-4 py-3"
                : shellVariant === "compact"
                ? isCommandSurface
                  ? "rounded-[1.35rem] px-4 py-3"
                  : "rounded-[1.65rem] p-4"
                : "rounded-[2rem] p-4",
            ].join(" ")}
          >
            <div
              className={[
                "flex flex-col gap-4",
                shellVariant === "command"
                  ? "lg:flex-row lg:items-center lg:justify-between"
                  : shellVariant === "compact"
                  ? isCommandSurface
                    ? "xl:grid xl:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] xl:items-center"
                    : "xl:grid xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-center"
                  : isMemberShell
                    ? ""
                    : "lg:flex-row lg:items-center lg:justify-between",
              ].join(" ")}
            >
              <Link
                href={actor ? getLandingRouteForActor(actor) : "/"}
                className={shellVariant === "compact" ? "space-y-1.5" : "space-y-1"}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                    {shellCopy.eyebrow}
                  </p>
                  {shellBadge ? (
                    <span className={shellBadge.className}>{shellBadge.label}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <p
                    className={
                      shellVariant === "command"
                        ? "text-[1rem] font-semibold text-slate-950 sm:text-[1.12rem]"
                        : shellVariant === "compact"
                        ? isCommandSurface
                          ? "text-[1.08rem] font-semibold text-slate-950 sm:text-[1.2rem]"
                          : "text-[1.05rem] font-semibold text-slate-950 sm:text-[1.15rem]"
                        : "text-xl font-semibold text-slate-950"
                    }
                  >
                    {shellCopy.title}
                  </p>
                  {shellCopy.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {shellCopy.tags
                        .slice(
                          0,
                          shellVariant === "command"
                            ? 1
                            : shellVariant === "compact"
                              ? 2
                              : shellCopy.tags.length,
                        )
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
                {showCommandSummary ? (
                  <p
                    className={[
                      "leading-5 text-slate-600",
                      shellVariant === "command"
                        ? "max-w-xl text-[0.74rem]"
                        : shellVariant === "compact"
                        ? isCommandSurface
                          ? "max-w-xl text-[0.75rem]"
                          : "max-w-2xl text-[0.78rem]"
                        : "max-w-xl text-xs",
                    ].join(" ")}
                  >
                    {shellCopy.summary}
                  </p>
                ) : null}
              </Link>
            </div>
          </header>
        ) : null}
        {debugToolsPlacement === "before-content" ? debugTools : null}
        <div
          id="main-content"
          tabIndex={-1}
          className={resolvedChromeMode === "mobile-app" ? "flex flex-col gap-4 sm:gap-5" : "flex flex-col gap-5"}
        >
          {children}
        </div>
        {resolvedChromeMode === "mobile-app" ? (
          <AppNavigation
            mode={resolvedChromeMode}
            surfaceFamily={surfaceFamily ?? undefined}
            navItems={navItems}
            quickItems={quickItems}
            showQuickItemHelpers={showMobileQuickItemHelpers}
          />
        ) : null}
        {debugToolsPlacement === "after-content" ? debugTools : null}
        </div>
      </div>
    </main>
  );
}

type ShellCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  tags: string[];
};

type SidebarCopy = {
  heading: string;
  summary: string;
};

type ShellBadge = {
  label: string;
  className: string;
};

function getHeaderChromeClasses(
  surfaceFamily: ReturnType<typeof getActorSurfaceFamily> | null,
  isCommandSurface: boolean,
): string {
  if (!isCommandSurface) {
    return "border-slate-200 bg-white/92 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.08)]";
  }

  switch (surfaceFamily) {
    case "leader":
      return "border-[var(--mymedlife-border)]/90 bg-[var(--mymedlife-surface-tint)]/90 shadow-[0_12px_28px_rgb(var(--mymedlife-primary-rgb)/0.06)]";
    case "coach":
      return "border-[var(--mymedlife-badge-background)]/90 bg-white/88 shadow-[0_12px_28px_rgb(var(--mymedlife-primary-rgb)/0.05)]";
    case "staff":
      return "border-slate-200/90 bg-white/86 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]";
    case "ds_admin":
      return "border-slate-200/90 bg-[var(--mymedlife-surface-tint)]/94 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]";
    case "super_admin":
      return "border-slate-200/90 bg-[var(--mymedlife-surface-tint)]/94 shadow-[0_10px_24px_rgb(var(--mymedlife-shadow-rgb)/0.05)]";
    case "member":
    default:
      return "border-slate-200/90 bg-white/92 shadow-[0_18px_48px_rgb(var(--mymedlife-shadow-rgb)/0.08)]";
  }
}

function getMainChromeClasses(
  surfaceFamily: ReturnType<typeof getActorSurfaceFamily> | null,
  resolvedChromeMode: "default" | "mobile-app",
  isCommandSurface: boolean,
): string {
  if (resolvedChromeMode === "mobile-app") {
    return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-accent-rgb)/0.08),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.05),transparent_20%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_43%,var(--background)_100%)]";
  }

  if (!isCommandSurface) {
    return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-accent-rgb)/0.08),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.05),transparent_20%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_43%,var(--background)_100%)]";
  }

  switch (surfaceFamily) {
    case "leader":
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-primary-rgb)/0.06),transparent_24%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.05),transparent_20%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_48%,var(--background)_100%)]";
    case "coach":
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-primary-rgb)/0.04),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.04),transparent_18%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_50%,var(--background)_100%)]";
    case "staff":
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-accent-rgb)/0.04),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.035),transparent_18%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_50%,var(--background)_100%)]";
    case "ds_admin":
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-shadow-rgb)/0.04),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.03),transparent_18%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_50%,var(--background)_100%)]";
    case "super_admin":
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-shadow-rgb)/0.04),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.03),transparent_18%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_50%,var(--background)_100%)]";
    case "member":
    default:
      return "bg-[radial-gradient(circle_at_top_left,rgb(var(--mymedlife-accent-rgb)/0.08),transparent_22%),radial-gradient(circle_at_top_right,rgb(var(--mymedlife-accent-rgb)/0.05),transparent_20%),linear-gradient(180deg,var(--mymedlife-nav-text)_0%,var(--mymedlife-surface-tint)_43%,var(--background)_100%)]";
  }
}

function getShellCopy(actor?: LocalActorContext): ShellCopy {
  if (!actor) {
    return {
      eyebrow: "myMEDLIFE",
      title: "myMEDLIFE",
      summary:
        "Sign in to continue into the right role-based experience for your chapter or team.",
      tags: [],
    };
  }

  const primaryChapter = actor.chapterNames[0] ?? "myMEDLIFE";
  switch (actor.primaryCanonicalRole) {
    case "student_member":
    case "committee_member":
    case "traveler":
      return {
        eyebrow: actor.primaryCanonicalRole === "traveler"
          ? "SLT traveler view"
          : "General member app",
        title: primaryChapter,
        summary:
          actor.primaryCanonicalRole === "traveler"
            ? "Stay focused on your trip-prep steps, readiness status, deadlines, and next travel task without staff-heavy controls."
            : "Stay focused on your next action, campaign progress, events, points, and trip prep without staff-heavy controls.",
        tags: [
          actor.chapterRoles[0] ?? "Student member",
          actor.primaryCanonicalRole === "traveler" ? "SLT Prep enabled" : "Member app",
          actor.primaryCanonicalRole === "traveler" ? "Trip Prep live" : "Rush Month live",
          "Mobile-first",
        ],
      };
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return {
        eyebrow: "Leadership command center",
        title: "Student Leadership Command Center",
        summary:
          "Run the chapter with member follow-up, committee health, impact signals, and leadership pipeline views in one role-specific surface.",
        tags: [actor.chapterRoles[0] ?? "Leader", "Desktop or tablet", "Chapter-wide"],
      };
    case "coach":
    case "sales_coach":
      return {
        eyebrow: "Coach command center",
        title: "Coach / Staff Command Center",
        summary:
          "Scan chapter health, intervention risk, proof posture, and next support decisions without turning on live writes or external sends.",
        tags: [
          actor.coachPortfolioChapterNames.length > 1
            ? `${actor.coachPortfolioChapterNames.length} chapter portfolio`
            : `1 chapter portfolio`,
          "Support view",
          "Approvals gated",
        ],
      };
    case "department_staff":
    case "sales_admin":
      return {
        eyebrow: "Staff command center",
        title: "Staff Command Center",
        summary:
          "Review chapter operations, proof-sharing posture, launch gates, and internal readiness from one staff-facing command surface.",
        tags: [actor.staffRoles[0] ?? "HQ admin", "Operations view", "Approvals gated"],
      };
    case "ds_admin":
      return {
        eyebrow: "DS admin backend",
        title: "DS Admin Backend",
        summary:
          "Inspect mock-only integration posture, outbox safety, and write-readiness evidence without reading protected chapter operations data.",
        tags: ["DS admin", "Outbox review", "Read-only"],
      };
    case "super_admin":
      return {
        eyebrow: "Super admin backend",
        title: "Super Admin Backend",
        summary:
          "Inspect command-center surfaces, launch readiness, audit posture, and internal configuration lanes from one backend shell.",
        tags: ["Super admin", "Backend tools", "Role-aware"],
      };
  }
}

function getSidebarCopy(surfaceFamily: ReturnType<typeof getActorSurfaceFamily> | null): SidebarCopy {
  switch (surfaceFamily) {
    case "leader":
      return {
        heading: "Leader navigation",
        summary: "Chapter overview, members, committees, events, impact, and succession.",
      };
    case "coach":
      return {
        heading: "Coach navigation",
        summary: "Portfolio chapters, chapter detail, campaigns, support notes, and traveler prep.",
      };
    case "staff":
      return {
        heading: "Staff navigation",
        summary: "Chapters, campaigns, proof review, feed tools, HubSpot, and support notes.",
      };
    case "ds_admin":
    case "super_admin":
      return {
        heading: "Admin navigation",
        summary: "Permissions, integrations, audit posture, workflows, and launch gates.",
      };
    case "member":
    default:
      return {
        heading: "Navigation",
        summary: "Move through the surface that matches your role.",
      };
  }
}

function getShellBadge(actor?: LocalActorContext): ShellBadge | null {
  if (!actor) {
    return {
      label: "Role-aware",
      className:
        "rounded-full border border-[var(--mymedlife-primary-button)]/35 bg-[var(--mymedlife-badge-background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]",
    };
  }

  switch (actor.primaryCanonicalRole) {
    case "student_member":
    case "committee_member":
      return {
        label: "Member app",
        className:
          "rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]",
      };
    case "traveler":
      return {
        label: "SLT prep",
        className:
          "rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]",
      };
    case "committee_chair":
    case "eboard_officer":
    case "vice_president":
    case "president":
      return {
        label: "Leader shell",
        className:
          "rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]",
      };
    case "coach":
    case "sales_coach":
      return {
        label: "Coach surface",
        className:
          "rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-info)]",
      };
    case "department_staff":
    case "sales_admin":
      return {
        label: "Staff surface",
        className:
          "rounded-full border border-slate-200 bg-[var(--mymedlife-surface-hover)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600",
      };
    case "ds_admin":
      return {
        label: "DS backend",
        className:
          "rounded-full border border-slate-200 bg-[var(--mymedlife-surface-hover)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600",
      };
    case "super_admin":
      return {
        label: "Super admin",
        className:
          "rounded-full border border-slate-200 bg-[var(--mymedlife-surface-hover)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600",
      };
  }
}
