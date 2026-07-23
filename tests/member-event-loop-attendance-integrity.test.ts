import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260723170721_member_event_loop_attendance_integrity.sql",
  ),
  "utf8",
);

describe("member event-loop attendance integrity migration", () => {
  it("keeps one current attendance award per member and event", () => {
    expect(migration).toContain(
      "create unique index if not exists points_events_member_event_loop_attendance_once_idx",
    );
    expect(migration).toContain(
      "on conflict (chapter_event_id, awarded_to_user_id)",
    );
    expect(migration).toContain("do nothing");
  });

  it("keeps RSVP cancellation auditable and locks changes after check-in", () => {
    expect(migration).toContain("'event_rsvp_cancelled'");
    expect(migration).toContain("'previousRsvpEventId', latest_intent.id");
    expect(migration).toContain("'rsvp_locked_checked_in'::text");
    expect(migration).toContain("'rsvp_cancel_blocked_checked_in'::text");
  });

  it("updates attendance without completing the event for every other member", () => {
    expect(migration).toContain("set attendance_count = next_attendance_count");
    expect(migration).not.toContain("set status = 'feedback_collected'");
  });

  it("keeps the privileged RPC private to the service role", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });
});
