import { describe, expect, it } from "vitest";

import { getAdminUserLifecycleConfig } from "@/services/admin-user-lifecycle";

describe("admin user lifecycle production gates", () => {
  it("stays disabled without explicit lifecycle approval", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
    })).toMatchObject({
      enabled: false,
      environment: "production",
    });
  });

  it("requires the production lifecycle flag", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE: "true",
    })).toMatchObject({ enabled: false });
  });

  it("enables the server path only with both explicit production flags", () => {
    expect(getAdminUserLifecycleConfig({
      MYMEDLIFE_AUTH_MODE: "production_supabase",
      SUPABASE_SERVICE_ROLE_KEY: "server-only",
      MYMEDLIFE_ENABLE_ADMIN_USER_LIFECYCLE: "true",
      MYMEDLIFE_ALLOW_PRODUCTION_ADMIN_USER_LIFECYCLE: "true",
    })).toMatchObject({
      enabled: true,
      environment: "production",
    });
  });
});
