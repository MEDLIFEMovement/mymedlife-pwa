import Link from "next/link";
import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app-navigation";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import type { LocalActorContext } from "@/services/local-actor-context";
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
  const chromeTone = actor ? "light" : "dark";
  const debugActor = actor && showDebugTools ? actor : null;
  const debugTools = debugActor ? (
    <details className="app-surface rounded-[1.65rem] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="app-eyebrow app-eyebrow-slate">Preview role</p>
          <p className="app-copy mt-2">
            Switch this browser between seeded member, leader, coach, and admin views without
            losing your place in the app.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
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
        chromeTone === "light" && isCommandSurface
          ? "bg-[radial-gradient(circle_at_top_left,rgba(93,143,246,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(247,208,94,0.1),transparent_18%),linear-gradient(180deg,#f4f8fd_0%,#edf3fa_40%,#e7eef7_100%)]"
          : chromeTone === "light"
          ? "bg-[radial-gradient(circle_at_top_left,rgba(93,143,246,0.16),transparent_22%),radial-gradient(circle_at_top_right,rgba(247,208,94,0.12),transparent_20%),linear-gradient(180deg,#f6faff_0%,#edf4fd_40%,#e8f0fa_100%)]"
          : "",
        resolvedChromeMode === "mobile-app"
          ? "pb-[calc(8.75rem+env(safe-area-inset-bottom))]"
          : "pb-28",
        resolvedChromeMode === "mobile-app" ? "pt-2 sm:pt-4" : isCommandSurface ? "pt-3" : "pt-4",
      ].join(" ")}
    >
      <a
        href="#main-content"
        className="sr-only rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>
      <div className={`mx-auto flex w-full ${maxWidthClassName} flex-col gap-4`}>
        {!hideTopHeader ? (
          <header
            className={[
              "border backdrop-blur-xl",
              resolvedChromeMode === "mobile-app"
                ? "hidden sm:block"
                : "",
              isCommandSurface
                ? "border-slate-200/90 bg-white/84 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
                : chromeTone === "light"
                ? "border-slate-200 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
                : resolvedChromeMode === "mobile-app"
                  ? "border-[#5d8ff6]/20 bg-[#081a3a]/92 shadow-[0_18px_70px_rgba(0,0,0,0.22)]"
                  : "border-white/12 bg-white/[0.06] shadow-[0_18px_70px_rgba(0,0,0,0.22)]",
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
              <Link href="/" className={shellVariant === "compact" ? "space-y-1.5" : "space-y-1"}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
                    {shellCopy.eyebrow}
                  </p>
                  {showCommandSummary ? (
                    <span className="rounded-full border border-[#f7d05e]/35 bg-[#fff6d8] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8a6700]">
                      Pilot-safe
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Role-aware
                    </span>
                  )}
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
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600"
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
                      chromeTone === "light" ? "leading-5 text-slate-600" : "leading-5 text-white/52",
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
              <div
                className={
                  shellVariant === "command"
                    ? "min-w-0 lg:max-w-[60rem]"
                    : shellVariant === "compact"
                    ? isCommandSurface
                      ? chromeTone === "light"
                        ? "min-w-0 border-t border-slate-200 pt-3 xl:border-t-0 xl:pt-0"
                        : "min-w-0 border-t border-white/8 pt-3 xl:border-t-0 xl:pt-0"
                      : "min-w-0 xl:pt-1"
                    : ""
                }
              >
                <AppNavigation
                  mode={resolvedChromeMode}
                  navItems={navItems}
                  quickItems={quickItems}
                  showQuickItemHelpers={showMobileQuickItemHelpers}
                  tone={chromeTone}
                />
              </div>
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
            navItems={navItems}
            quickItems={quickItems}
            showQuickItemHelpers={showMobileQuickItemHelpers}
            tone={chromeTone}
          />
        ) : null}
        {debugToolsPlacement === "after-content" ? debugTools : null}
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

function getShellCopy(actor?: LocalActorContext): ShellCopy {
  if (!actor) {
    return {
      eyebrow: "myMEDLIFE",
      title: "Chapter operating system",
      summary:
        "Built to guide each role through the right next steps while broader system handoffs stay staged.",
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
          : "Student member view",
        title: primaryChapter,
        summary:
          actor.primaryCanonicalRole === "traveler"
            ? "Stay focused on your trip-prep steps, readiness status, deadlines, and next travel task without staff-heavy controls."
            : "Stay focused on your next action, campaign progress, events, points, and trip prep without staff-heavy controls.",
        tags: [
          actor.chapterRoles[0] ?? "Student member",
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
        title: "Coach Command Center",
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
        eyebrow: "DS safety lane",
        title: "Integration Oversight",
        summary:
          "Inspect mock-only integration posture, outbox safety, and write-readiness evidence without reading protected chapter operations data.",
        tags: ["DS admin", "Outbox review", "Read-only"],
      };
    case "super_admin":
      return {
        eyebrow: "Admin backend",
        title: "Admin Backend",
        summary:
          "Inspect command-center surfaces, launch readiness, audit posture, and internal configuration lanes from one backend shell.",
        tags: ["Super admin", "Backend tools", "Role-aware"],
      };
  }
}
