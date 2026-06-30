import { describe, expect, it } from "vitest";
import {
  appendAdminReviewFocus,
  applyAdminReviewFocus,
  resolveAdminReviewFocus,
} from "@/services/admin-review-focus";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("admin review focus", () => {
  it("recognizes the staging Luma pilot focus from the query param", () => {
    const focus = resolveAdminReviewFocus("luma-live-pilot");

    expect(focus).toEqual({
      key: "luma-live-pilot",
      sourceParam: "luma-live-pilot",
      label: "Staging Luma pilot",
      summary:
        "Showing only the staging Luma event, RSVP, attendance, points, and blocked-send evidence tied to the pilot loop.",
    });
    expect(resolveAdminReviewFocus("home")).toBeNull();
  });

  it("filters readback data to the staging Luma pilot footprint only", () => {
    const focus = resolveAdminReviewFocus("luma-live-pilot");
    const data = applyAdminReviewFocus(
      {
        ...getMockReadOnlyAppData("Testing focused admin evidence."),
        integrationEvents: [
          {
            id: "luma-integration",
            eventType: "luma_rsvp_recorded",
            title: "Pilot RSVP",
            destination: "Luma",
            status: "recorded",
            occurredAt: "2026-06-29T03:17:53.728Z",
            detail: "Pilot RSVP recorded.",
          },
          {
            id: "generic-integration",
            eventType: "proof_submitted",
            title: "Generic proof",
            destination: "n8n",
            status: "disabled",
            occurredAt: "2026-06-17T00:00:00.000Z",
            detail: "Generic queue row.",
          },
        ],
        outboxItems: [
          {
            id: "luma-outbox",
            sourceEventId: "event-1",
            destination: "n8n",
            status: "disabled",
            payloadSummary: "source, rsvpCount",
          },
          {
            id: "generic-outbox",
            sourceEventId: "event-2",
            destination: "HubSpot",
            status: "disabled",
            payloadSummary: "contactId",
          },
        ],
        integrationEventRows: [
          {
            id: "luma-integration",
            source_event_id: "event-1",
            chapter_id: "chapter-1",
            event_type: "luma_rsvp_recorded",
            destination: "luma",
            external_object_type: "event",
            external_object_id: "evt-1",
            status: "recorded",
            payload: { source: "luma_live_pilot", rsvpCount: 1 },
            created_by: "pilot-user",
            created_at: "2026-06-29T03:17:53.728Z",
            updated_at: "2026-06-29T03:17:53.728Z",
          },
          {
            id: "generic-integration",
            source_event_id: "event-2",
            chapter_id: "chapter-1",
            event_type: "proof_submitted",
            destination: "n8n",
            external_object_type: null,
            external_object_id: null,
            status: "disabled",
            payload: { source: "proof_metadata" },
            created_by: "admin-user",
            created_at: "2026-06-17T00:00:00.000Z",
            updated_at: "2026-06-17T00:00:00.000Z",
          },
        ],
        automationOutboxRows: [
          {
            id: "luma-outbox",
            source_event_id: "event-1",
            integration_event_id: "luma-integration",
            chapter_id: "chapter-1",
            destination: "n8n",
            event_type: "luma_rsvp_external_send_blocked",
            payload: { source: "luma_live_pilot", rsvpCount: 1 },
            idempotency_key: "luma-pilot:rsvp:evt-1:user-1",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-29T03:17:53.728Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-29T03:17:53.728Z",
            updated_at: "2026-06-29T03:17:53.728Z",
          },
          {
            id: "generic-outbox",
            source_event_id: "event-2",
            integration_event_id: "generic-integration",
            chapter_id: "chapter-1",
            destination: "hubspot",
            event_type: "proof_submitted",
            payload: { source: "proof_metadata" },
            idempotency_key: "proof-submitted-1",
            status: "disabled",
            attempt_count: 0,
            available_at: "2026-06-17T00:00:00.000Z",
            locked_at: null,
            sent_at: null,
            last_error: null,
            created_at: "2026-06-17T00:00:00.000Z",
            updated_at: "2026-06-17T00:00:00.000Z",
          },
        ],
        auditLogs: [
          {
            id: "luma-audit",
            actor_user_id: "pilot-user",
            chapter_id: "chapter-1",
            action: "luma_attendance_import_recorded",
            target_table: "chapter_events",
            target_id: "chapter-event-1",
            before_value: null,
            after_value: { attendanceCount: 1 },
            reason: "Recorded the staging Luma attendance proof in app tables.",
            created_at: "2026-06-29T11:09:00.000Z",
          },
          {
            id: "generic-audit",
            actor_user_id: "admin-user",
            chapter_id: "chapter-1",
            action: "proof_submitted",
            target_table: "evidence_items",
            target_id: "evidence-1",
            before_value: null,
            after_value: { status: "pending_review" },
            reason: "Generic proof review.",
            created_at: "2026-06-17T00:00:00.000Z",
          },
        ],
      },
      focus,
    );

    expect(data.integrationEventRows.map((row) => row.id)).toEqual(["luma-integration"]);
    expect(data.automationOutboxRows.map((row) => row.id)).toEqual(["luma-outbox"]);
    expect(data.auditLogs.map((row) => row.id)).toEqual(["luma-audit"]);
    expect(data.integrationEvents.map((row) => row.id)).toEqual(["luma-integration"]);
    expect(data.outboxItems.map((row) => row.id)).toEqual(["luma-outbox"]);
  });

  it("adds the focus query param to admin review links", () => {
    const focus = resolveAdminReviewFocus("luma-live-pilot");

    expect(appendAdminReviewFocus("/admin/audit-log", focus)).toBe(
      "/admin/audit-log?source=luma-live-pilot",
    );
    expect(
      appendAdminReviewFocus("/admin/integration-outbox?view=compact", focus),
    ).toBe("/admin/integration-outbox?view=compact&source=luma-live-pilot");
  });
});
