import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";

type LeaderAppShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideDesktopRail?: boolean;
  hideTopHeader?: boolean;
  showDebugTools?: boolean;
};

export function LeaderAppShell({
  actor,
  children,
  hideDesktopRail = false,
  hideTopHeader = true,
  showDebugTools = false,
}: LeaderAppShellProps) {
  return (
    <AppShell
      actor={actor}
      hideDesktopRail={hideDesktopRail}
      hideTopHeader={hideTopHeader}
      showDebugTools={showDebugTools}
    >
      {children}
    </AppShell>
  );
}
