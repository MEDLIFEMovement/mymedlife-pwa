import { describe, expect, it } from "vitest";

import { getAdminShellRedirect } from "@/services/admin-shell-routing";

describe("admin shell routing", () => {
  it("redirects dedicated pages to canonical query-backed views", () => {
    expect(getAdminShellRedirect("apikeys", "audit")).toBe(
      "/admin?view=apikeys",
    );
    expect(getAdminShellRedirect(["mcp"], "health")).toBe("/admin?view=mcp");
  });

  it("redirects dedicated pages to other route-backed views", () => {
    expect(getAdminShellRedirect("health", "audit")).toBe(
      "/admin/system-health",
    );
    expect(getAdminShellRedirect("luma", "health")).toBe(
      "/admin/integrations/luma",
    );
  });

  it("ignores the current, missing, and unknown views", () => {
    expect(getAdminShellRedirect("audit", "audit")).toBeNull();
    expect(getAdminShellRedirect(undefined, "audit")).toBeNull();
    expect(getAdminShellRedirect("unknown", "audit")).toBeNull();
  });
});
