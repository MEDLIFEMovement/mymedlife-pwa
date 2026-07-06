import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("event loop data auth readiness doc", () => {
  const doc = readFileSync(
    join(process.cwd(), "docs/event-loop-data-auth-readiness.md"),
    "utf8",
  );

  it("separates real read models from rehearsal-only logic", () => {
    expect(doc).toContain("What Is Real App or Service Logic Today");
    expect(doc).toContain("What Is Local, Test, Sandbox, or Rehearsal Only");
    expect(doc).toContain("staging-luma-event-loop.ts");
    expect(doc).toContain("do **not** count as production proof");
  });

  it("names the launch-lane tables and gaps that still block production proof", () => {
    expect(doc).toContain("`app.chapter_events`");
    expect(doc).toContain("`app.luma_event_links`");
    expect(doc).toContain("`app.points_events`");
    expect(doc).toContain("`app.audit_logs`");
    expect(doc).toContain("`app.automation_outbox`");
    expect(doc).toContain("`supabase/tests/database/rls_goal_333.test.sql`");
    expect(doc).toContain("No proved production member RSVP browser write path in this lane");
    expect(doc).toContain("No proved production attendance import or check-in replay path in this lane");
  });

  it("keeps the rollout evidence requirements explicit", () => {
    expect(doc).toContain("Evidence Needed To Move The Matrix");
    expect(doc).toContain("`pnpm production:pilot-event-proof`");
    expect(doc).toContain("`pnpm production:data-counts`");
    expect(doc).toContain("approved 30-chapter rollout packet");
    expect(doc).toContain("real production signed-in route proof");
    expect(doc).toContain("five ready pilot proof rows");
  });
});
