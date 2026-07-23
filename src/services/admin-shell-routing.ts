export type AdminShellView =
  | "overview"
  | "users"
  | "chapters"
  | "modules"
  | "luma"
  | "points"
  | "integrations"
  | "audit"
  | "health"
  | "apikeys"
  | "mcp"
  | "settings";

const adminShellViews = new Set<AdminShellView>([
  "overview",
  "users",
  "chapters",
  "modules",
  "luma",
  "points",
  "integrations",
  "audit",
  "health",
  "apikeys",
  "mcp",
  "settings",
]);

const directAdminRoutes: Partial<Record<AdminShellView, string>> = {
  overview: "/admin",
  users: "/admin/users",
  chapters: "/admin/chapters",
  luma: "/admin/integrations/luma",
  audit: "/admin/audit-log",
  health: "/admin/system-health",
};

export function getAdminShellRedirect(
  requestedView: string | string[] | undefined,
  currentView: AdminShellView,
): string | null {
  const view = Array.isArray(requestedView) ? requestedView[0] : requestedView;

  if (!view || view === currentView || !isAdminShellView(view)) {
    return null;
  }

  return directAdminRoutes[view] ?? `/admin?view=${view}`;
}

function isAdminShellView(view: string): view is AdminShellView {
  return adminShellViews.has(view as AdminShellView);
}
