import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260724013000_member_story_like_idempotent_intent.sql",
  ),
  "utf8",
);

describe("member story like idempotency migration", () => {
  it("records a new ledger event only when the desired state changes", () => {
    expect(migration).toContain("current_liked <> liked_input");
    expect(migration).toContain("next_event_type");
    expect(migration).toContain("'previousIntentEventId', latest_intent.id");
  });

  it("removes service-role access to the blind toggle RPC", () => {
    expect(migration).toContain(
      "revoke all on function app.toggle_member_story_like(uuid, uuid)",
    );
    expect(migration).toContain("from public, anon, authenticated, service_role");
  });

  it("keeps the desired-state RPC service-role only", () => {
    expect(migration).toContain(
      "revoke all on function app.set_member_story_like(uuid, uuid, boolean)",
    );
    expect(migration).toContain(
      "grant execute on function app.set_member_story_like(uuid, uuid, boolean)",
    );
    expect(migration).toContain("to service_role");
  });
});
