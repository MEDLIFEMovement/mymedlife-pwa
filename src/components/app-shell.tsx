import Link from "next/link";
import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app-navigation";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getMobileQuickNavigationForActor,
  getNavigationForActor,
} from "@/services/role-visibility";

type AppShellProps = {
  children: ReactNode;
  actor?: LocalActorContext;
  debugToolsPlacement?: "before-content" | "after-content";
};

export function AppShell({
  actor,
  children,
  debugToolsPlacement = "before-content",
}: AppShellProps) {
  const navItems = getNavigationForActor(actor);
  const quickItems = getMobileQuickNavigationForActor(actor);
  const debugTools = actor ? (
    <>
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />
    </>
  ) : null;

  return (
    <main className="min-h-screen px-4 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-emerald-200 px-4 py-2 text-sm font-semibold text-[#08231e] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                myMEDLIFE
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-semibold text-white">
                  Chapter operating system
                </p>
                <span className="rounded-full border border-lime-200/20 bg-lime-200/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-lime-100">
                  Pilot-safe
                </span>
              </div>
              <p className="max-w-xl text-xs leading-5 text-white/52">
                Built to show each role what to do next while keeping live writes
                and external automations disabled until approved.
              </p>
            </Link>
            <AppNavigation navItems={navItems} quickItems={quickItems} />
          </div>
        </header>
        {debugToolsPlacement === "before-content" ? debugTools : null}
        <div id="main-content" tabIndex={-1} className="flex flex-col gap-5">
          {children}
        </div>
        {debugToolsPlacement === "after-content" ? debugTools : null}
      </div>
    </main>
  );
}
