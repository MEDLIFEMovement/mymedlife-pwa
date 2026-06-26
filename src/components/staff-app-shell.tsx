import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";

type StaffAppShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideTopHeader?: boolean;
  showDebugTools?: boolean;
};

export function StaffAppShell({
  actor,
  children,
  hideTopHeader = true,
  showDebugTools = false,
}: StaffAppShellProps) {
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
