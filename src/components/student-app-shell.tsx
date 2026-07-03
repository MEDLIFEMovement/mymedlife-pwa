import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";

type StudentAppShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideTopHeader?: boolean;
  showMobileQuickItemHelpers?: boolean;
  showDebugTools?: boolean;
};

export function StudentAppShell({
  actor,
  children,
  hideTopHeader = true,
  showMobileQuickItemHelpers = false,
  showDebugTools = false,
}: StudentAppShellProps) {
  return (
    <AppShell
      actor={actor}
      chromeMode="mobile-app"
      hideTopHeader={hideTopHeader}
      showMobileQuickItemHelpers={showMobileQuickItemHelpers}
      showDebugTools={showDebugTools}
    >
      {children}
    </AppShell>
  );
}
