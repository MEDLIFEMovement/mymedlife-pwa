import { describe, expect, it } from "vitest";

import { getLocalSandboxAuthLandingRoute } from "@/services/local-sandbox-auth-routing";

describe("local sandbox auth routing", () => {
  it("routes local sandbox member, leader, staff, and admin sign-ins to the expected shells", () => {
    expect(
      getLocalSandboxAuthLandingRoute("test.bu.general.member.1@example.com"),
    ).toBe("/app");
    expect(
      getLocalSandboxAuthLandingRoute("test.bu.president.jamie@example.com"),
    ).toBe("/leader?view=overview");
    expect(
      getLocalSandboxAuthLandingRoute("test.sales.coach@example.com"),
    ).toBe("/staff?view=chapters");
    expect(
      getLocalSandboxAuthLandingRoute("test.revops.systems.manager@example.com"),
    ).toBe("/admin");
  });

  it("does not invent a sandbox route for unknown emails", () => {
    expect(getLocalSandboxAuthLandingRoute("unknown@example.com")).toBeNull();
    expect(getLocalSandboxAuthLandingRoute(null)).toBeNull();
  });
});
