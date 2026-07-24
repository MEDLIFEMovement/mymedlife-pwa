import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260723235500_member_event_loop_walk_in_rsvp_integrity.sql",
  ),
  "utf8",
);

describe("member event-loop walk-in RSVP integrity migration", () => {
  it("records an auditable RSVP before an allowed walk-in check-in", () => {
    const rsvpInsert = migration.indexOf("insert into app.events");
    const atomicCheckIn = migration.indexOf(
      "app.record_member_event_loop_step_without_walk_in_rsvp",
      rsvpInsert,
    );

    expect(migration).toContain("operation_input = 'checkin'");
    expect(migration).toContain("'event_rsvp_recorded'");
    expect(migration).toContain("'walkIn', true");
    expect(rsvpInsert).toBeGreaterThan(-1);
    expect(atomicCheckIn).toBeGreaterThan(rsvpInsert);
  });

  it("does not append a duplicate RSVP when the latest intent is active", () => {
    expect(migration).toContain(
      "latest_intent.id is null or latest_intent.event_type <> 'event_rsvp_recorded'",
    );
  });

  it("keeps the public RPC service-role only", () => {
    expect(migration).toContain(
      "revoke all on function app.record_member_event_loop_step_without_walk_in_rsvp",
    );
    expect(migration).toContain("from public, anon, authenticated, service_role");
    expect(migration).toContain("to service_role");
  });
});
