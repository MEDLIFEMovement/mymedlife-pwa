import { describe, expect, it } from "vitest";

import { buildAdminShellHref } from "@/components/figma-admin-panel";

describe("admin shell navigation", () => {
  it("leaves dedicated admin routes for canonical query-backed views", () => {
    expect(
      buildAdminShellHref("apikeys", "/admin/audit-log", "view=audit"),
    ).toBe("/admin?view=apikeys");
    expect(
      buildAdminShellHref("mcp", "/admin/system-health", ""),
    ).toBe("/admin?view=mcp");
  });

  it("uses dedicated routes for route-backed admin views", () => {
    expect(buildAdminShellHref("users", "/admin", "")).toBe("/admin/users");
    expect(buildAdminShellHref("audit", "/admin?view=settings", "")).toBe(
      "/admin/audit-log",
    );
  });

  it("preserves embedded staff context while changing the admin preview", () => {
    expect(
      buildAdminShellHref(
        "health",
        "/staff",
        "view=admin&chapter=chapter-test",
      ),
    ).toBe("/staff?view=admin&chapter=chapter-test&adminView=health");
  });
});
