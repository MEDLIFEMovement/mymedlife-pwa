import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { LocalActorContext } from "@/services/local-actor-context";
import type { MobileNavigationItem } from "@/services/role-visibility";

type SltPrepShellProps = {
  actor?: LocalActorContext;
  children: ReactNode;
  hideTopHeader?: boolean;
  showDebugTools?: boolean;
  showMobileQuickItemHelpers?: boolean;
  mobileQuickItemsOverride?: MobileNavigationItem[];
};

export function SltPrepShell({
  actor,
  children,
  hideTopHeader = true,
  showDebugTools = false,
  showMobileQuickItemHelpers = false,
  mobileQuickItemsOverride,
}: SltPrepShellProps) {
  return (
    <AppShell
      actor={actor}
      chromeMode="mobile-app"
      hideTopHeader={hideTopHeader}
      mobileQuickItemsOverride={mobileQuickItemsOverride}
      showMobileQuickItemHelpers={showMobileQuickItemHelpers}
      showDebugTools={showDebugTools}
    >
      {children}
    </AppShell>
  );
}
