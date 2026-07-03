import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getPointsKpiMaterializationPacket,
} from "@/services/points-kpi-materialization-packet";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

describe("points and KPI materialization packet", () => {
  it("hides the packet from operating roles", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const packet = getPointsKpiMaterializationPacket(
      actor,
      getMockReadOnlyAppData("Testing hidden state."),
    );

    expect(packet.canReadPacket).toBe(false);
    expect(packet.status).toBe("hidden");
  });

  it("blocks review while the app is still on mock fallback data", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getPointsKpiMaterializationPacket(
      actor,
      getMockReadOnlyAppData("Testing mock fallback."),
    );

    expect(packet.canReadPacket).toBe(true);
    expect(packet.status).toBe("blocked_until_local_supabase");
    expect(packet.checks.find((check) => check.key === "local_supabase_reads")?.passed).toBe(
      false,
    );
  });

  it("shows observed materialization when one approved proof path creates one matching row per type", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getPointsKpiMaterializationPacket(actor, buildSupabaseReadyData());

    expect(packet.canReadPacket).toBe(true);
    expect(packet.status).toBe("evidence_observed");
    expect(packet.candidate).toMatchObject({
      assignmentId: "d9000000-0000-4000-8000-000000000001",
      pointsRowCount: 1,
      kpiRowCount: 1,
      pointsConfigured: 15,
      kpiConfigured: "students_invited",
      duplicateMaterializationDetected: false,
      usesSupabaseUuids: true,
    });
    expect(packet.readbackEvidence.map((item) => item.status)).toEqual([
      "observed",
      "observed",
      "observed",
      "observed",
      "observed",
      "observed",
    ]);
  });

  it("flags duplicate materialization for the same approval path", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const data = buildSupabaseReadyData();

    data.pointsEventRows = [
      ...data.pointsEventRows,
      {
        ...data.pointsEventRows[0],
        id: "d9300000-0000-4000-8000-000000000099",
        created_at: "2026-06-19T12:12:00.000Z",
      },
    ];

    const packet = getPointsKpiMaterializationPacket(actor, data);

    expect(packet.status).toBe("duplicate_materialization_detected");
    expect(
      packet.readbackEvidence.find((item) => item.key === "points_row")?.status,
    ).toBe("manual_check_needed");
  });
});

function buildSupabaseReadyData(): ReadOnlyAppData {
  const data = getMockReadOnlyAppData("Testing points packet.");

  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing points and KPI materialization packet.",
    },
    assignments: [
      {
        id: "d9000000-0000-4000-8000-000000000001",
        title: "Goal 115 approve proof",
        ownerRole: "General Member",
        lane: "Member",
        dueLabel: "Friday",
        status: "approved",
        evidenceRequired: "Short testimonial from the owner.",
        instructions: "Approve this submitted proof for chapter completion.",
        points: 15,
        kpi: "students_invited",
      },
    ],
    evidenceItems: [
      {
        id: "d9100000-0000-4000-8000-000000000001",
        assignmentId: "d9000000-0000-4000-8000-000000000001",
        submittedBy: "Local Supabase member",
        evidenceType: "testimonial_text",
        summary: "Goal 115 proof ready for leader approval.",
        status: "approved",
        storagePath:
          "chapters/10000000-0000-4000-8000-000000000001/evidence/d9100000-0000-4000-8000-000000000001/testimonial.txt",
      },
    ],
    pointsEventRows: [
      {
        id: "d9300000-0000-4000-8000-000000000001",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: "d9000000-0000-4000-8000-000000000001",
        chapter_event_id: null,
        evidence_item_id: "d9100000-0000-4000-8000-000000000001",
        approval_id: "d9200000-0000-4000-8000-000000000001",
        awarded_to_user_id: "member.a@mymedlife.test",
        points_delta: 15,
        reason: "Leader approved chapter proof for completion.",
        created_by: "leader.a@mymedlife.test",
        created_at: "2026-06-19T12:10:00.000Z",
      },
    ],
    kpiEventRows: [
      {
        id: "d9400000-0000-4000-8000-000000000001",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        phase_id: null,
        assignment_id: "d9000000-0000-4000-8000-000000000001",
        chapter_event_id: null,
        evidence_item_id: "d9100000-0000-4000-8000-000000000001",
        metric_key: "students_invited",
        metric_value: 1,
        unit: "count",
        source: "leader_proof_decision",
        created_by: "leader.a@mymedlife.test",
        created_at: "2026-06-19T12:10:05.000Z",
      },
    ],
    eventRows: [
      {
        id: "d9500000-0000-4000-8000-000000000001",
        event_type: "evidence_approved",
        actor_user_id: "leader.a@mymedlife.test",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: "d9000000-0000-4000-8000-000000000001",
        chapter_event_id: null,
        payload: {},
        correlation_id: null,
        occurred_at: "2026-06-19T12:10:10.000Z",
        created_at: "2026-06-19T12:10:10.000Z",
      },
      {
        id: "d9500000-0000-4000-8000-000000000002",
        event_type: "hq_sharing_decision_logged",
        actor_user_id: "admin@mymedlife.test",
        chapter_id: "chapter-northview",
        campaign_id: "rush-month-2026",
        assignment_id: "d9000000-0000-4000-8000-000000000001",
        chapter_event_id: null,
        payload: {},
        correlation_id: null,
        occurred_at: "2026-06-19T12:11:00.000Z",
        created_at: "2026-06-19T12:11:00.000Z",
      },
    ],
    integrationEventRows: [
      {
        id: "d9600000-0000-4000-8000-000000000001",
        source_event_id: "d9500000-0000-4000-8000-000000000001",
        chapter_id: "chapter-northview",
        event_type: "evidence_approved",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: "d9100000-0000-4000-8000-000000000001",
        status: "disabled",
        payload: {},
        created_by: "leader.a@mymedlife.test",
        created_at: "2026-06-19T12:10:11.000Z",
        updated_at: "2026-06-19T12:10:11.000Z",
      },
      {
        id: "d9600000-0000-4000-8000-000000000002",
        source_event_id: "d9500000-0000-4000-8000-000000000002",
        chapter_id: "chapter-northview",
        event_type: "hq_sharing_decision_logged",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: "d9100000-0000-4000-8000-000000000001",
        status: "disabled",
        payload: {},
        created_by: "admin@mymedlife.test",
        created_at: "2026-06-19T12:11:01.000Z",
        updated_at: "2026-06-19T12:11:01.000Z",
      },
    ],
    automationOutboxRows: [
      {
        id: "d9700000-0000-4000-8000-000000000001",
        source_event_id: "d9500000-0000-4000-8000-000000000001",
        integration_event_id: "d9600000-0000-4000-8000-000000000001",
        chapter_id: "chapter-northview",
        destination: "n8n",
        event_type: "evidence_approved",
        payload: {},
        idempotency_key: "leader-proof-approved",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-19T12:10:12.000Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-19T12:10:12.000Z",
        updated_at: "2026-06-19T12:10:12.000Z",
      },
      {
        id: "d9700000-0000-4000-8000-000000000002",
        source_event_id: "d9500000-0000-4000-8000-000000000002",
        integration_event_id: "d9600000-0000-4000-8000-000000000002",
        chapter_id: "chapter-northview",
        destination: "n8n",
        event_type: "hq_sharing_decision_logged",
        payload: {},
        idempotency_key: "hq-sharing-decision",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-19T12:11:02.000Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-19T12:11:02.000Z",
        updated_at: "2026-06-19T12:11:02.000Z",
      },
    ],
    auditLogs: [
      {
        id: "d9800000-0000-4000-8000-000000000001",
        actor_user_id: "leader.a@mymedlife.test",
        chapter_id: "chapter-northview",
        action: "leader_proof_approved",
        target_table: "evidence_items",
        target_id: "d9100000-0000-4000-8000-000000000001",
        before_value: {},
        after_value: { status: "approved" },
        reason: "Leader approved proof for chapter completion.",
        created_at: "2026-06-19T12:10:13.000Z",
      },
      {
        id: "d9800000-0000-4000-8000-000000000002",
        actor_user_id: "admin@mymedlife.test",
        chapter_id: "chapter-northview",
        action: "hq_sharing_decision_logged",
        target_table: "evidence_items",
        target_id: "d9100000-0000-4000-8000-000000000001",
        before_value: {},
        after_value: { sharing_status: "approved_for_sharing" },
        reason: "HQ approved future sharing review.",
        created_at: "2026-06-19T12:11:03.000Z",
      },
    ],
  };
}
