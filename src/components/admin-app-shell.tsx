import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";

type AdminAppShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideTopHeader?: boolean;
  showDebugTools?: boolean;
};

export function AdminAppShell({
  actor,
  children,
  hideTopHeader = true,
  showDebugTools = false,
}: AdminAppShellProps) {
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
