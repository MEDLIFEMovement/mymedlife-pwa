import { describe, expect, it } from "vitest";

import {
  getMemberEventLoopWriteConfig,
  mapMemberEventLoopWriteResultMessage,
  memberEventLoopPointAward,
  recordMemberEventLoopStep,
  type SupabaseServiceClient,
} from "@/services/member-event-loop-write";

describe("member event-loop write gate", () => {
  it("stays disabled by default", () => {
    expect(getMemberEventLoopWriteConfig({})).toMatchObject({
      enabled: false,
      environment: "local",
      externalWritesEnabled: false,
    });
  });

  it("requires a server-only service-role key", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      }),
    ).toMatchObject({
      enabled: false,
      reason:
        "Member event-loop writes are disabled because the server-only Supabase service-role key is missing.",
    });
  });

  it("requires explicit production approval before enabling production writes", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-only",
      }),
    ).toMatchObject({
      enabled: false,
      environment: "production",
    });
  });

  it("enables only the internal event loop when both production flags are approved", () => {
    expect(
      getMemberEventLoopWriteConfig({
        MYMEDLIFE_AUTH_MODE: "production_supabase",
        MYMEDLIFE_ENABLE_MEMBER_EVENT_LOOP_WRITE: "true",
        MYMEDLIFE_ALLOW_PRODUCTION_MEMBER_EVENT_LOOP_WRITE: "true",
        SUPABASE_SERVICE_ROLE_KEY: "server-only",
      }),
    ).toMatchObject({
      enabled: true,
      environment: "production",
      externalWritesEnabled: false,
    });
  });

  it("maps check-in success to the duplicate-points honesty message", () => {
    expect(mapMemberEventLoopWriteResultMessage("checked_in")).toMatchObject({
      tone: "success",
      message:
        "Check-in recorded, attendance updated, and points awarded once in the myMEDLIFE ledger. External writes stayed off.",
    });
  });

  it("records a TEST RSVP row when the member, membership, campaign, and event are valid", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "then", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "rsvp_recorded",
      eventId: chapterEventRow.id,
      pointsAwarded: 0,
      attendanceCount: chapterEventRow.attendance_count,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events).toContainEqual(
      expect.objectContaining({
        event_type: "event_rsvp_recorded",
        actor_user_id: profileRow.id,
        chapter_event_id: chapterEventRow.id,
        payload: expect.objectContaining({ liveExternalWrite: false }),
      }),
    );
  });

  it("does not duplicate an RSVP that already exists", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    client.enqueue("events", "maybeSingle", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "already_rsvpd",
      eventId: chapterEventRow.id,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events ?? []).toHaveLength(0);
  });

  it("records an RSVP cancellation event before check-in", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("points_events", "maybeSingle", { data: null });
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "then", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "cancel_rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "rsvp_cancelled",
      eventId: chapterEventRow.id,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events).toContainEqual(
      expect.objectContaining({
        event_type: "event_rsvp_cancelled",
        actor_user_id: profileRow.id,
        chapter_event_id: chapterEventRow.id,
        payload: expect.objectContaining({
          operation: "cancel_rsvp",
          previousRsvpEventId: "event-rsvp-1",
          liveExternalWrite: false,
        }),
      }),
    );
  });

  it("keeps RSVP cancellation idempotent when no active RSVP exists", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("points_events", "maybeSingle", { data: null });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "maybeSingle", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "cancel_rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "rsvp_cancel_not_found",
      eventId: chapterEventRow.id,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events ?? []).toHaveLength(0);
  });

  it("blocks RSVP cancellation after points have been awarded", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("points_events", "maybeSingle", {
      data: { id: "points-1", awarded_to_user_id: profileRow.id, points_delta: 20 },
    });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "cancel_rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: false,
      code: "rsvp_cancel_blocked_checked_in",
      eventId: chapterEventRow.id,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events ?? []).toHaveLength(0);
  });

  it("allows a member to RSVP again after a newer cancellation event", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-cancel-1",
        event_type: "event_rsvp_cancelled",
        occurred_at: "2026-11-14T12:30:00Z",
      },
    });
    client.enqueue("events", "then", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "rsvp",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "rsvp_recorded",
      eventId: chapterEventRow.id,
      externalWritesEnabled: false,
    });
    expect(client.inserts.events).toContainEqual(
      expect.objectContaining({
        event_type: "event_rsvp_recorded",
        actor_user_id: profileRow.id,
        chapter_event_id: chapterEventRow.id,
      }),
    );
  });

  it("records check-in, attendance, and points exactly once", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("points_events", "maybeSingle", { data: null });
    client.enqueue("points_events", "single", { data: { id: "points-1" } });
    client.enqueue("points_events", "then", {
      data: [
        { awarded_to_user_id: profileRow.id },
        { awarded_to_user_id: "profile-2" },
        { awarded_to_user_id: profileRow.id },
        { awarded_to_user_id: "" },
      ],
    });
    client.enqueue("events", "then", { data: null });
    client.enqueue("chapter_events", "then", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "checkin",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "checked_in",
      pointsAwarded: memberEventLoopPointAward,
      attendanceCount: 2,
      externalWritesEnabled: false,
    });
    expect(client.inserts.points_events).toContainEqual(
      expect.objectContaining({
        chapter_event_id: chapterEventRow.id,
        awarded_to_user_id: profileRow.id,
        points_delta: memberEventLoopPointAward,
      }),
    );
    expect(client.inserts.events).toContainEqual(
      expect.objectContaining({
        event_type: "event_attendance_recorded",
        payload: expect.objectContaining({
          attendanceCount: 2,
          duplicatePointsPrevented: true,
          liveExternalWrite: false,
        }),
      }),
    );
    expect(client.updates.chapter_events).toContainEqual(
      expect.objectContaining({
        status: "feedback_collected",
        attendance_count: 2,
        attendance_rate: 1,
      }),
    );
  });

  it("blocks duplicate check-in points when points already exist", async () => {
    const client = new FakeSupabaseClient();
    enqueueValidActorPath(client);
    client.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("points_events", "maybeSingle", {
      data: { id: "points-1", awarded_to_user_id: profileRow.id, points_delta: 20 },
    });
    client.enqueue("points_events", "then", {
      data: [{ awarded_to_user_id: profileRow.id }],
    });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "checkin",
      routeEventId: "chapter-event-ucla-kickoff",
      actorUserId: profileRow.id,
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "already_checked_in",
      pointsAwarded: 20,
      attendanceCount: 1,
    });
    expect(client.inserts.points_events ?? []).toHaveLength(0);
  });

  it("falls back to email lookup and materializes the TEST event when needed", async () => {
    const client = new FakeSupabaseClient();
    client.enqueue("profiles", "maybeSingle", { data: null, error: { message: "not found" } });
    client.enqueue("profiles", "maybeSingle", { data: profileRow });
    client.enqueue("memberships", "maybeSingle", { data: membershipRow });
    client.enqueue("campaigns", "maybeSingle", { data: null });
    client.enqueue("campaigns", "maybeSingle", { data: campaignRow });
    client.enqueue("chapter_events", "maybeSingle", { data: null });
    client.enqueue("chapter_events", "single", {
      data: { ...chapterEventRow, id: "materialized-event", attendance_count: 0 },
    });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "maybeSingle", { data: null });
    client.enqueue("events", "then", { data: null });

    const result = await recordMemberEventLoopStep(asServiceClient(client), {
      operation: "rsvp",
      routeEventId: "unknown-test-alias",
      actorUserId: "auth-user-id",
      actorEmail: profileRow.email,
    });

    expect(result).toMatchObject({
      success: true,
      code: "rsvp_recorded",
      eventId: "materialized-event",
    });
    expect(client.inserts.chapter_events).toContainEqual(
      expect.objectContaining({
        title: "TEST Intro GBM",
        warehouse_status: "disabled",
        eligible_member_count: 1,
      }),
    );
  });

  it("fails closed when the member profile, membership, or event is not eligible", async () => {
    const inactiveProfileClient = new FakeSupabaseClient();
    inactiveProfileClient.enqueue("profiles", "maybeSingle", {
      data: { ...profileRow, status: "invited" },
    });

    await expect(
      recordMemberEventLoopStep(asServiceClient(inactiveProfileClient), {
        operation: "rsvp",
        routeEventId: "chapter-event-ucla-kickoff",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "profile_not_found" });

    const noMembershipClient = new FakeSupabaseClient();
    noMembershipClient.enqueue("profiles", "maybeSingle", { data: profileRow });
    noMembershipClient.enqueue("memberships", "maybeSingle", { data: null });

    await expect(
      recordMemberEventLoopStep(asServiceClient(noMembershipClient), {
        operation: "rsvp",
        routeEventId: "chapter-event-ucla-kickoff",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "membership_required" });

    const missingEventClient = new FakeSupabaseClient();
    missingEventClient.enqueue("profiles", "maybeSingle", { data: profileRow });
    missingEventClient.enqueue("memberships", "maybeSingle", { data: membershipRow });
    missingEventClient.enqueue("campaigns", "maybeSingle", { data: campaignRow });
    missingEventClient.enqueue("chapter_events", "maybeSingle", { data: null });

    await expect(
      recordMemberEventLoopStep(asServiceClient(missingEventClient), {
        operation: "rsvp",
        routeEventId: "00000000-0000-4000-8000-000000000001",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "event_not_found" });
  });

  it("fails closed for chapter mismatch and write errors", async () => {
    const mismatchClient = new FakeSupabaseClient();
    enqueueValidActorPath(mismatchClient, {
      event: { ...chapterEventRow, chapter_id: "other-chapter" },
    });

    await expect(
      recordMemberEventLoopStep(asServiceClient(mismatchClient), {
        operation: "rsvp",
        routeEventId: "chapter-event-ucla-kickoff",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "permission_denied" });

    const rsvpInsertErrorClient = new FakeSupabaseClient();
    enqueueValidActorPath(rsvpInsertErrorClient);
    rsvpInsertErrorClient.enqueue("events", "maybeSingle", { data: null });
    rsvpInsertErrorClient.enqueue("events", "maybeSingle", { data: null });
    rsvpInsertErrorClient.enqueue("events", "then", {
      data: null,
      error: { message: "insert rejected" },
    });

    await expect(
      recordMemberEventLoopStep(asServiceClient(rsvpInsertErrorClient), {
        operation: "rsvp",
        routeEventId: "chapter-event-ucla-kickoff",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "server_error" });

    const pointsInsertErrorClient = new FakeSupabaseClient();
    enqueueValidActorPath(pointsInsertErrorClient);
    pointsInsertErrorClient.enqueue("events", "maybeSingle", {
      data: {
        id: "event-rsvp-1",
        event_type: "event_rsvp_recorded",
        occurred_at: "2026-11-14T12:00:00Z",
      },
    });
    pointsInsertErrorClient.enqueue("events", "maybeSingle", { data: null });
    pointsInsertErrorClient.enqueue("points_events", "maybeSingle", { data: null });
    pointsInsertErrorClient.enqueue("points_events", "single", {
      data: null,
      error: { message: "points rejected" },
    });

    await expect(
      recordMemberEventLoopStep(asServiceClient(pointsInsertErrorClient), {
        operation: "checkin",
        routeEventId: "chapter-event-ucla-kickoff",
        actorUserId: profileRow.id,
        actorEmail: profileRow.email,
      }),
    ).resolves.toMatchObject({ success: false, code: "server_error" });
  });

  it("covers every result-code message branch", () => {
    const expectedTones = new Map([
      ["rsvp_recorded", "success"],
      ["already_rsvpd", "info"],
      ["rsvp_cancelled", "success"],
      ["rsvp_cancel_not_found", "info"],
      ["checked_in", "success"],
      ["already_checked_in", "info"],
      ["write_disabled", "warning"],
      ["missing_auth", "warning"],
      ["profile_not_found", "warning"],
      ["membership_required", "warning"],
      ["event_not_found", "warning"],
      ["permission_denied", "warning"],
      ["rsvp_cancel_blocked_checked_in", "warning"],
      ["server_error", "warning"],
    ]);

    for (const [code, tone] of expectedTones) {
      expect(mapMemberEventLoopWriteResultMessage(code)).toMatchObject({ tone });
    }

    expect(mapMemberEventLoopWriteResultMessage(undefined)).toBeNull();
  });
});

type FakeQueryOutcome = {
  data?: unknown;
  error?: { message?: string } | null;
};

const profileRow = {
  id: "profile-1",
  display_name: "TEST Member",
  email: "member.a@mymedlife.test",
  status: "active",
};

const membershipRow = {
  id: "membership-1",
  chapter_id: "chapter-1",
  role_key: "member",
  status: "approved",
};

const campaignRow = {
  id: "campaign-1",
  chapter_id: "chapter-1",
  status: "active",
};

const chapterEventRow = {
  id: "chapter-event-1",
  chapter_id: "chapter-1",
  campaign_id: "campaign-1",
  title: "TEST Intro GBM",
  status: "published",
  attendance_count: 7,
};

class FakeSupabaseClient {
  readonly inserts: Record<string, Record<string, unknown>[]> = {};
  readonly updates: Record<string, Record<string, unknown>[]> = {};
  private readonly queues = new Map<string, FakeQueryOutcome[]>();

  schema(schemaName: "app") {
    expect(schemaName).toBe("app");

    return {
      from: (tableName: string) => new FakeTableClient(this, tableName),
    };
  }

  enqueue(tableName: string, method: "maybeSingle" | "single" | "then", outcome: FakeQueryOutcome) {
    const key = this.key(tableName, method);
    const queue = this.queues.get(key) ?? [];
    queue.push({ data: null, error: null, ...outcome });
    this.queues.set(key, queue);
  }

  pushInsert(tableName: string, row: Record<string, unknown>) {
    this.inserts[tableName] = [...(this.inserts[tableName] ?? []), row];
  }

  pushUpdate(tableName: string, row: Record<string, unknown>) {
    this.updates[tableName] = [...(this.updates[tableName] ?? []), row];
  }

  take(tableName: string, method: "maybeSingle" | "single" | "then") {
    const key = this.key(tableName, method);
    const queue = this.queues.get(key) ?? [];
    const next = queue.shift() ?? { data: null, error: null };
    this.queues.set(key, queue);

    return { data: next.data ?? null, error: next.error ?? null };
  }

  private key(tableName: string, method: string) {
    return `${tableName}:${method}`;
  }
}

class FakeTableClient {
  constructor(
    private readonly client: FakeSupabaseClient,
    private readonly tableName: string,
  ) {}

  select() {
    return new FakeQueryBuilder(this.client, this.tableName);
  }

  insert(row: Record<string, unknown>) {
    this.client.pushInsert(this.tableName, row);

    return new FakeQueryBuilder(this.client, this.tableName);
  }

  update(row: Record<string, unknown>) {
    this.client.pushUpdate(this.tableName, row);

    return new FakeQueryBuilder(this.client, this.tableName);
  }
}

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: { message?: string } | null }> {
  constructor(
    private readonly client: FakeSupabaseClient,
    private readonly tableName: string,
  ) {}

  select() {
    return this;
  }

  eq() {
    return this;
  }

  ilike() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  maybeSingle() {
    return Promise.resolve(this.client.take(this.tableName, "maybeSingle"));
  }

  single() {
    return Promise.resolve(this.client.take(this.tableName, "single"));
  }

  then<TResult1 = { data: unknown; error: { message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: { message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.client.take(this.tableName, "then")).then(onfulfilled, onrejected);
  }
}

function enqueueValidActorPath(
  client: FakeSupabaseClient,
  overrides: {
    profile?: typeof profileRow;
    membership?: typeof membershipRow;
    campaign?: typeof campaignRow;
    event?: typeof chapterEventRow;
  } = {},
) {
  client.enqueue("profiles", "maybeSingle", { data: overrides.profile ?? profileRow });
  client.enqueue("memberships", "maybeSingle", { data: overrides.membership ?? membershipRow });
  client.enqueue("campaigns", "maybeSingle", { data: overrides.campaign ?? campaignRow });
  client.enqueue("chapter_events", "maybeSingle", { data: overrides.event ?? chapterEventRow });
}

function asServiceClient(client: FakeSupabaseClient) {
  return client as unknown as SupabaseServiceClient;
}
