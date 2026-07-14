import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260714124058_admin_test_visibility.sql",
  ),
  "utf8",
);

describe("Staff/Admin TEST visibility migration", () => {
  it("defines an explicit TEST role and chapter marker", () => {
    expect(migration).toContain("values ('test', 'TEST'");
    expect(migration).toContain("add column if not exists is_test boolean");
    expect(migration).toContain("admin_set_chapter_test");
  });

  it("keeps TEST users and chapters out of non-admin read policies", () => {
    expect(migration).toContain("create or replace function app.is_test_user");
    expect(migration).toContain("create or replace function app.is_test_chapter");
    expect(migration).toContain("not app.is_test_user(user_id)");
    expect(migration).toContain("not app.is_test_chapter(chapter_id)");
    expect(migration).toContain("key <> 'test' or app.is_admin()");
  });
});
