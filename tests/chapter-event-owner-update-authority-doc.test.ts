import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("chapter event owner update authority doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/chapter-event-owner-update-authority.md"),
    "utf8",
  );

  it("makes the current owner and planner caveat explicit", () => {
    expect(doc).toContain("chapter_events_update_owner_leaders_staff");
    expect(doc).toContain("owner_user_id");
    expect(doc).toContain("planned_by_user_id");
    expect(doc).toContain("row-wide `using` and `with check` clauses");
  });

  it("names the risky authoritative fields and the lack of a current member write path", () => {
    expect(doc).toContain("attendance_count");
    expect(doc).toContain("starts_at");
    expect(doc).toContain("ends_at");
    expect(doc).toContain("luma_event_link_id");
    expect(doc).toContain("browserWritesExpected: 0");
    expect(doc).toContain("does not perform a chapter-event update");
  });

  it("keeps the hardening recommendation and matrix boundary honest", () => {
    expect(doc).toContain("replace owner/planner");
    expect(doc).toContain("audited RPC or trigger-backed write path");
    expect(doc).toContain("production signed-in proof");
    expect(doc).toContain("rollout gate");
    expect(doc).toContain("events writes/integrations readiness");
    expect(doc).toContain("local policy proof only");
  });
});
