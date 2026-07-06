import { describe, expect, it } from "vitest";

import {
  buildLocalSupabaseAuthUsersCompatibilitySql,
  getLocalTestProductionDbContainerName,
  getSupabaseProjectId,
} from "@/services/test-production-seed-apply";

describe("test production seed apply helpers", () => {
  it("reads the Supabase project id from config.toml", () => {
    expect(
      getSupabaseProjectId(`
        project_id = "mymedlife-pwa"

        [api]
        enabled = true
      `),
    ).toBe("mymedlife-pwa");
  });

  it("builds the expected local database container name from the project id", () => {
    expect(
      getLocalTestProductionDbContainerName('project_id = "mymedlife-pwa"'),
    ).toBe("supabase_db_mymedlife-pwa");
  });

  it("prefers an explicit local container override", () => {
    expect(
      getLocalTestProductionDbContainerName(
        'project_id = "mymedlife-pwa"',
        "custom-db-container",
      ),
    ).toBe("custom-db-container");
  });

  it("fails clearly when the project id is missing", () => {
    expect(() => getLocalTestProductionDbContainerName("[api]\nenabled = true")).toThrow(
      "Could not determine the local Supabase project_id from supabase/config.toml.",
    );
  });

  it("builds a local auth compatibility update for legacy nullable auth.users fields", () => {
    const sql = buildLocalSupabaseAuthUsersCompatibilitySql();

    expect(sql).toContain("update auth.users");
    expect(sql).toContain("confirmation_token = coalesce(confirmation_token, '')");
    expect(sql).toContain("email_change = coalesce(email_change, '')");
    expect(sql).toContain("reauthentication_token = coalesce(reauthentication_token, '')");
    expect(sql).toContain("is_super_admin = coalesce(is_super_admin, false)");
  });
});
