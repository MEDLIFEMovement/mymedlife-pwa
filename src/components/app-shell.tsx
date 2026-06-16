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
};

export function AppShell({ actor, children }: AppShellProps) {
  const navItems = getNavigationForActor(actor);
  const quickItems = getMobileQuickNavigationForActor(actor);

  return (
    <main className="min-h-screen px-4 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-emerald-200 px-4 py-2 text-sm font-semibold text-[#08231e] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[2rem] border border-white/12 bg-white/[0.06] p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                myMEDLIFE
              </p>
              <p className="text-xl font-semibold text-white">Chapter operating system</p>
            </Link>
            <AppNavigation navItems={navItems} quickItems={quickItems} />
          </div>
        </header>
        {actor ? (
          <>
            <LocalActorNotice actor={actor} />
            <LocalRoleSwitcher actor={actor} />
          </>
        ) : null}
        <div id="main-content" tabIndex={-1} className="flex flex-col gap-5">
          {children}
        </div>
      </div>
    </main>
  );
}
