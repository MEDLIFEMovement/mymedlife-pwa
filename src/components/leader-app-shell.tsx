import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";

type LeaderAppShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideTopHeader?: boolean;
  showDebugTools?: boolean;
};

export function LeaderAppShell({
  actor,
  children,
  hideTopHeader = true,
  showDebugTools = false,
}: LeaderAppShellProps) {
  return (
    <AppShell
      actor={actor}
      hideTopHeader={hideTopHeader}
      showDebugTools={showDebugTools}
    >
      {children}
    </AppShell>
  );
}
