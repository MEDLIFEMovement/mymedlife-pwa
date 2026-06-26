import { describe, expect, it } from "vitest";
import { getEvidenceSubmissionWorkspace } from "@/services/evidence-submission-workspace";
import { getMockLocalActorContext } from "@/services/local-actor-context";

describe("evidence submission workspace", () => {
  it("points members to their next proof submission without enabling writes", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Proof for your next action");
    expect(workspace.nextSubmission).toEqual(
      expect.objectContaining({
        assignmentId: "share-rush-flyer",
        status: "ready_to_submit",
        canPrepareNow: true,
        canUseLocalWritePath: true,
        isRecommended: true,
        actionHref: "/rush-month/actions/share-rush-flyer?source=evidence",
        proofIntakeHref:
          "/rush-month/actions/share-rush-flyer?step=submit&source=evidence#submit-evidence",
        proofIntakeLabel: "Open submit evidence",
      }),
    );
    expect(workspace.nextSubmission?.storyPrompt).toContain(
      "Story screenshot or post link with chapter branding visible.",
    );
    expect(workspace.nextSubmission?.preparationChecklist).toEqual(
      expect.arrayContaining([
        "What happened, in plain English?",
        "Which student hesitation or concern does this proof answer?",
      ]),
    );
    expect(workspace.counts.readyToSubmit).toBe(1);
    expect(workspace.counts.prepPackets).toBeGreaterThan(0);
    expect(workspace.counts.localWriteControlsEnabled).toBe(0);
    expect(workspace.counts.uploadsEnabled).toBe(0);
    expect(workspace.counts.externalSendsEnabled).toBe(0);
    expect(workspace.counts.submissionPackets).toBe(1);
    expect(workspace.summary).toContain("Current phase exit signal:");
    expect(workspace.submissionPacket).toEqual(
      expect.objectContaining({
        title: "Proof submission path preview",
        assignmentId: "share-rush-flyer",
        localFunction: "app.submit_assignment_proof_metadata",
        targetRoute:
          "/rush-month/actions/share-rush-flyer?step=submit&source=evidence#submit-evidence",
        reviewRoute: "/rush-month/review",
        currentResultCode: "write_disabled",
        futureResultCode: "proof_submitted",
      }),
    );
    expect(workspace.submissionPacket?.payload).toEqual(
      expect.objectContaining({
        evidenceType: "testimonial_text",
      }),
    );
    expect(workspace.submissionPacket?.payload.summary).toContain(
      "Story screenshot or post link with chapter branding visible.",
    );
    expect(workspace.submissionPacket?.readinessChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "local_writes_requested",
          passed: false,
        }),
        expect.objectContaining({
          key: "actor_can_submit_proof",
          passed: true,
        }),
        expect.objectContaining({
          key: "assignment_ready_for_proof",
          passed: true,
        }),
      ]),
    );
    expect(workspace.submissionPacket?.recordPreview).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Structured event",
          value: "evidence_submitted",
        }),
        expect.objectContaining({
          label: "Held handoff",
          value: "n8n disabled",
        }),
        expect.objectContaining({
          label: "Audit action",
          value: "evidence_submitted",
        }),
      ]),
    );
    expect(workspace.submissionPacket?.blockedControls).toEqual(
      expect.arrayContaining([
        "proof summary save",
        "file upload",
        "external handoff",
      ]),
    );
  });

  it("keeps committee members on the same member-owned proof submission surface", () => {
    const actor = getMockLocalActorContext("committee.member@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(true);
    expect(workspace.title).toBe("Proof for your next action");
    expect(workspace.nextSubmission).toEqual(
      expect.objectContaining({
        assignmentId: "share-rush-flyer",
        actionHref: "/rush-month/actions/share-rush-flyer?source=evidence",
        proofIntakeHref:
          "/rush-month/actions/share-rush-flyer?step=submit&source=evidence#submit-evidence",
      }),
    );
  });

  it("prioritizes changes-requested proof for leaders", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.title).toBe("Proof follow-up board");
    expect(workspace.nextSubmission).toEqual(
      expect.objectContaining({
        assignmentId: "proof-pack",
        status: "changes_requested",
        canPrepareNow: true,
        isRecommended: true,
        reviewLane:
          "Action Committee Chair revises context before leader or HQ review continues.",
      }),
    );
    expect(workspace.submissionPacket?.assignmentId).toBe("proof-pack");
    expect(workspace.submissionPacket?.payload.evidenceType).toBe("bridge_video");
    expect(workspace.submissionPacket?.futureResultCode).toBe("proof_submitted");
    expect(
      workspace.rows.map((row) => [row.assignmentId, row.status]),
    ).toEqual([
      ["open-home", "approved_internal"],
      ["assign-eboard", "waiting_review"],
      ["member-push", "action_not_ready"],
      ["share-rush-flyer", "ready_to_submit"],
      ["welcome-table", "waiting_review"],
      ["proof-pack", "changes_requested"],
    ]);
  });

  it("lets coaches inspect posture without submitting proof", () => {
    const actor = getMockLocalActorContext("coach@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.title).toBe("Proof follow-up signal");
    expect(workspace.nextSubmission).toBeNull();
    expect(
      workspace.rows.find((row) => row.assignmentId === "coach-summary"),
    ).toEqual(
      expect.objectContaining({
        status: "action_not_ready",
        canPrepareNow: false,
        canUseLocalWritePath: false,
        disabledReason:
          "This local role can inspect the row but cannot submit proof for it.",
        disabledControls: expect.arrayContaining([
          "proof summary save",
          "file upload",
          "external handoff",
        ]),
      }),
    );
  });

  it("keeps DS Admin out of student proof submission queues", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.canReadWorkspace).toBe(false);
    expect(workspace.rows).toEqual([]);
    expect(workspace.nextSubmission).toBeNull();
    expect(workspace.submissionPacket).toBeNull();
    expect(workspace.counts.prepPackets).toBe(0);
    expect(workspace.counts.submissionPackets).toBe(0);
  });

  it("names future records and blocked writes while keeping everything disabled", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const workspace = getEvidenceSubmissionWorkspace(actor);

    expect(workspace.futureStructuredEvents.map((event) => event.eventType)).toEqual(
      [
        "proof_submission_queue_viewed",
        "luma_event_linked",
        "luma_attendance_import_mocked",
        "kpi_event_recorded",
        "evidence_submitted",
        "audit_log_recorded",
        "hubspot_handoff_mocked",
      ],
    );
    expect(
      workspace.futureStructuredEvents.every((event) => event.status === "disabled"),
    ).toBe(true);
    expect(workspace.blockedWrites).toEqual(
      expect.arrayContaining([
        "proof summary saves",
        "file uploads",
        "broader proof publishing",
        "warehouse proof exports",
        "AI proof summaries",
      ]),
    );
    expect(workspace.safetyNotes.join(" ")).toContain(
      "simple summary and link until storage, consent, audit, and rollback approvals are in place",
    );
    expect(workspace.safetyNotes.join(" ")).toContain("Current phase objective:");
  });
});
