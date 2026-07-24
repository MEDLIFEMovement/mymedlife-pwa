import { describe, expect, it } from "vitest";

import { isLocalRolePreviewEnabled } from "@/services/local-role-preview";

describe("local role preview boundary", () => {
  it("keeps seeded role preview available for local and non-production review", () => {
    expect(isLocalRolePreviewEnabled({})).toBe(true);
    expect(isLocalRolePreviewEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(
      isLocalRolePreviewEnabled({ MYMEDLIFE_AUTH_MODE: "local_supabase" }),
    ).toBe(true);
  });

  it("blocks seeded role preview for either production signal", () => {
    expect(
      isLocalRolePreviewEnabled({ VERCEL_ENV: "production" }),
    ).toBe(false);
    expect(
      isLocalRolePreviewEnabled({
        VERCEL_ENV: "preview",
        MYMEDLIFE_AUTH_MODE: "production_supabase",
      }),
    ).toBe(false);
  });
});
