import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260723234500_leader_app_owned_event_create.sql",
  "utf8",
);

describe("leader app-owned event creation migration", () => {
  it("creates one idempotent app-owned event transaction", () => {
    expect(migration).toContain(
      "create or replace function app.create_chapter_event_for_leader",
    );
    expect(migration).toContain("creation_request_id uuid");
    expect(migration).toContain(
      "chapter_events_creation_request_unique",
    );
    expect(migration).toContain(
      'drop policy if exists "chapter_events_insert_organizers"',
    );
    expect(migration).toContain(
      "new.location_name is distinct from old.location_name",
    );
    expect(migration).toContain("'chapter_event_created'");
    expect(migration).toContain("'published'");
    expect(migration).toContain("'liveExternalWrite', false");
  });

  it("enforces chapter leadership and records internal audit proof only", () => {
    expect(migration).toContain(
      "if not app.is_chapter_leader(chapter_uuid) and not app.is_admin()",
    );
    expect(migration).toContain("insert into app.events");
    expect(migration).toContain("insert into app.audit_logs");
    expect(migration).not.toContain("insert into app.integration_events");
    expect(migration).not.toContain("insert into app.automation_outbox");
    expect(migration).not.toContain("http");
  });
});
