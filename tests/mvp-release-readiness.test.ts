import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpReleaseReadinessSummary } from "@/services/mvp-release-readiness";
import {
  getMockReadOnlyAppData,
  type ReadOnlyAppData,
} from "@/services/read-only-app-data";

describe("mvp release readiness", () => {
  it("marks the MVP ready for local review but not live launch", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);

    expect(summary.canReadSummary).toBe(true);
    expect(summary.localReviewReady).toBe(true);
    expect(summary.liveLaunchReady).toBe(false);
    expect(summary.browserWritesEnabled).toBe(0);
    expect(summary.externalWritesEnabled).toBe(0);
    expect(summary.plainEnglishVerdict).toContain("not ready for live student launch");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Controlled pilot decision packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Staff dry-run guide");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("First pilot scope planner");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Phase 2 live MVP closeout packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Goal 90-97 role model checkpoint");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member leaderboard route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Rush Month event detail route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member Rush Month events review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Evidence submission readiness route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Proof submission packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Proof storage intake packet");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Evidence submission readiness route",
      )?.plainEnglish,
    ).toContain("Goal 152 proof prep checklist");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Proof submission packet",
      )?.plainEnglish,
    ).toContain("Goal 158");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Proof storage intake packet",
      )?.plainEnglish,
    ).toContain("Goal 159");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Read-only profile route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Auth onboarding readiness route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Production auth preflight checklist");
    expect(
      summary.achievements.find(
        (achievement) =>
          achievement.label === "Production auth preflight checklist",
      )?.plainEnglish,
    ).toContain("Goal 157");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Membership approval packet");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Membership approval packet",
      )?.plainEnglish,
    ).toContain("Goal 160");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Membership approval result states");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Membership approval result states",
      )?.plainEnglish,
    ).toContain("Goal 161");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Membership approval write readiness");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Membership approval write readiness",
      )?.plainEnglish,
    ).toContain("Goal 162");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Local sign-in review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member chapter home review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member Rush Month overview review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member assigned-actions review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member action detail review coverage");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Member walkthrough sequence");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Leader walkthrough sequence");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Coach walkthrough sequence");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin walkthrough sequence");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Stakeholder review phase map");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Nick final review packet");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Nick final review packet",
      )?.plainEnglish,
    ).toContain("pilot scope");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Mobile visual smoke plan");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Mobile route smoke manifest bridge");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Accessibility smoke plan");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Device and PWA smoke matrix");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin review path route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin release readiness route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Discourse bake-off recommendation");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Discourse bake-off recommendation",
      )?.plainEnglish,
    ).toContain("Discourse prototype");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Production launch gate");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin launch gate route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Launch evidence checklist");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Database security decision packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin database security route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin audit log review");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin audit log route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin write-audit preflight");
    expect(
      summary.achievements.find(
        (achievement) => achievement.label === "Admin audit log route",
      )?.plainEnglish,
    ).toContain("Goal 156 write-audit preflight");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin master data inventory");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin master data route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin integration outbox route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Integration live-send preflight");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("System health review");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin system health route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin design QA route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Production operations runbook");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Admin operations route");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("PWA offline recovery shell");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Coach support notes");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Coach intervention checklist");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Leader proof decision workspace");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Leader proof review rubric");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Leader proof decision result states");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Leader proof decision local write packet");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("First-write activation drill");
    expect(
      summary.achievements.map((achievement) => achievement.label),
    ).toContain("Coach decision packet");
  });

  it("lists the key live-launch blockers", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);
    const blockerLabels = summary.blockers.map((blocker) => blocker.label);

    expect(blockerLabels).toEqual(
      expect.arrayContaining([
        "Live auth and real users",
        "Browser writes",
        "Proof uploads and public proof sharing",
        "External integrations",
        "Production environment and visual QA",
      ]),
    );
    expect(
      summary.blockers.find((blocker) => blocker.label === "Browser writes")
        ?.plainEnglish,
    ).toContain("membership approval");
    expect(blockerLabels).toContain("Named pilot owners and rollback");
    expect(summary.phase2Closeout?.packetPath).toBe(
      "docs/review/2026-06-29-med-500-hosted-staging-route-and-write-proof.md",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "action_started",
    );
    expect(summary.phase2Closeout?.stillBlocked).toContain(
      "External acceptance of the hosted `action_started` proof and approval recording",
    );
    expect(summary.phase2Closeout?.namedOwnersStillNeeded).toContain(
      "rollback owner",
    );
  });

  it("surfaces recorded production packet state in the release summary", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor, {
      env: {
        MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF: "prod-ref-123",
        MYMEDLIFE_PRODUCTION_SUPABASE_MIGRATION_OWNER: "DS Platform",
        MYMEDLIFE_PRODUCTION_VERCEL_PROJECT: "mymedlife-pwa-production",
        MYMEDLIFE_PRODUCTION_DEPLOY_SOURCE: "main",
        MYMEDLIFE_PRODUCTION_ROLLBACK_TARGET: "previous stable deployment",
        MYMEDLIFE_PRODUCTION_ENV_PACKET_STATUS: "names-only manifest recorded",
        MYMEDLIFE_PRODUCTION_SECRET_OWNER: "DS Admin",
        MYMEDLIFE_PRODUCTION_CONTROL_LAYER_STATUS:
          "staging control proof recorded",
        MYMEDLIFE_PRODUCTION_CONTROL_LAYER_PROOF_NOTE:
          "Feature-flag save, theme save, durable step-up, and approval-row readback recorded on staging",
        MYMEDLIFE_PRODUCTION_AUTH_CALLBACK_URL:
          "https://www.mymedlife.org/auth/callback",
        MYMEDLIFE_STAGING_AUTH_CALLBACK_URL:
          "https://staging.mymedlife.org/auth/callback",
        MYMEDLIFE_PRODUCTION_DNS_OWNER: "HQ Ops",
        MYMEDLIFE_PRODUCTION_REGISTRAR: "GoDaddy",
        MYMEDLIFE_PRODUCTION_BACKUP_OWNER: "Platform",
        MYMEDLIFE_PRODUCTION_RESTORE_PATH: "Supabase PITR + SQL restore runbook",
      },
      hostedStagingEvidenceObserved: true,
    });

    expect(summary.productionReadiness).not.toBeNull();
    expect(summary.productionReadiness?.recordedEnvironmentCount).toBe(7);
    expect(summary.productionReadiness?.missingEnvironmentCount).toBe(1);
    expect(summary.productionReadiness?.stagingEvidenceRecordedCount).toBe(4);
    expect(summary.productionReadiness?.missingEvidenceCount).toBe(7);
    expect(
      summary.productionReadiness?.recordedNow.map((item) => item.label),
    ).toContain("Production Supabase project");
    expect(
      summary.productionReadiness?.recordedNow.map((item) => item.label),
    ).toContain("Production Vercel environment");
    expect(
      summary.productionReadiness?.recordedNow.map((item) => item.label),
    ).toContain("Rollout control layer readiness");
    expect(
      summary.productionReadiness?.recordedNow.map((item) => item.label),
    ).toContain("Rollout control layer readback");
    expect(
      summary.productionReadiness?.stillMissing.map((item) => item.label),
    ).toContain("Rollback and support owners");
  });

  it("keeps DS Admin on the same conservative release-readiness summary", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);

    expect(summary.canReadSummary).toBe(true);
    expect(summary.title).toBe("DS Admin release-readiness summary");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 149");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 148");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 147");
    expect(summary.nextApprovals.join(" ")).toContain("/admin");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 146");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/design-qa");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 151");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/nick-review");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 144");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 143");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 142");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 154");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 141");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 140");
    expect(summary.nextApprovals.join(" ")).toContain("/rush-month");
    expect(summary.nextApprovals.join(" ")).toContain("/rush-month/actions");
    expect(summary.nextApprovals.join(" ")).toContain("/rush-month/events");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 139");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 138");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 137");
    expect(summary.nextApprovals.join(" ")).toContain("/chapter");
    expect(summary.nextApprovals.join(" ")).toContain("/rush-month/actions/member-push");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 136");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 135");
    expect(summary.nextApprovals.join(" ")).toContain("/login");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 134");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/review-path");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 133");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/release-readiness");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 132");
    expect(summary.nextApprovals.join(" ")).toContain("production launch gate");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/launch-gate");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 150");
    expect(summary.nextApprovals.join(" ")).toContain("launch evidence checklist");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 131");
    expect(summary.nextApprovals.join(" ")).toContain("database security decision");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/database-security");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 130");
    expect(summary.nextApprovals.join(" ")).toContain("audit log readback");
    expect(summary.nextApprovals.join(" ")).toContain("system health");
    expect(summary.nextApprovals.join(" ")).toContain("production operations runbook");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 117 PWA offline shell");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 118");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 119");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 120");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 121");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 122");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 157");
    expect(summary.nextApprovals.join(" ")).toContain("production auth preflight");
    expect(summary.nextApprovals.join(" ")).toContain(
      "2026-06-29-med-500-hosted-staging-route-and-write-proof.md",
    );
    expect(summary.nextApprovals.join(" ")).toContain("/admin/pilot-scope");
    expect(summary.nextApprovals.join(" ")).toContain("/admin/first-write");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 160");
    expect(summary.nextApprovals.join(" ")).toContain("membership approval packet");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 161");
    expect(summary.nextApprovals.join(" ")).toContain(
      "membership approval result states",
    );
    expect(summary.nextApprovals.join(" ")).toContain("Goal 162");
    expect(summary.nextApprovals.join(" ")).toContain(
      "membership approval write readiness",
    );
    expect(summary.nextApprovals.join(" ")).toContain("Goal 152");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 158");
    expect(summary.nextApprovals.join(" ")).toContain("proof submission packet");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 159");
    expect(summary.nextApprovals.join(" ")).toContain("proof storage intake packet");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 153");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 124");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 125");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 155");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 126");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 156");
    expect(summary.nextApprovals.join(" ")).toContain("write-audit preflight");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 127");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 128");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 129");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 115 leader proof decision");
    expect(summary.nextApprovals.join(" ")).toContain("Goal 116 local leader proof decision");
    expect(summary.nextApprovals.join(" ")).toContain("n8n");
    expect(summary.nextApprovals.join(" ")).toContain("first pilot");
  });

  it("summarizes the Goal 90-97 role model checkpoint for Nick review", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor);
    const checkpoint = summary.roleModelReviewCheckpoint;

    expect(checkpoint?.title).toBe("Goal 90-97 role model checkpoint");
    expect(checkpoint?.items).toHaveLength(8);
    expect(
      checkpoint?.items.every(
        (item) =>
          item.browserWritesExpected === 0 &&
          item.externalWritesExpected === 0 &&
          item.passSignal.length > 30,
      ),
    ).toBe(true);
    expect(checkpoint?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route: "/rush-month/dashboard",
          reviewerActorEmail: "leader.a@mymedlife.test",
          label: "President / VP dashboard accountability",
        }),
        expect.objectContaining({
          route: "/rush-month/dashboard",
          reviewerActorEmail: "eboard.a@mymedlife.test",
          label: "E-Board dashboard execution follow-up",
        }),
        expect.objectContaining({
          route: "/admin",
          reviewerActorEmail: "admin@mymedlife.test",
          label: "Admin responsibility summary",
        }),
      ]),
    );
    expect(checkpoint?.finalDecisionPrompt).toContain("auth/onboarding approval");
  });

  it("reflects recorded Phase 2 owner answers in the closeout snapshot", () => {
    const originalRollback = process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER;
    const originalSupport = process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL;

    process.env.MYMEDLIFE_PILOT_ROLLBACK_OWNER = "Kiomi Matsukawa";
    process.env.MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL = "#mymedlife-pilot-watch";

    try {
      const summary = getMvpReleaseReadinessSummary(
        getMockLocalActorContext("admin@mymedlife.test"),
      );

      expect(summary.phase2Closeout?.recordedOwnerAnswers).toEqual(
        expect.arrayContaining([
          "Rollback owner: Kiomi Matsukawa",
          "Support and pause channel: #mymedlife-pilot-watch",
        ]),
      );
      expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
        "proof metadata packet now frames the smallest hosted proof loop",
      );
      expect(summary.phase2Closeout?.namedOwnersStillNeeded).not.toContain(
        "rollback owner",
      );
      expect(summary.phase2Closeout?.namedOwnersStillNeeded).not.toContain(
        "support and pause channel",
      );
    } finally {
      restoreEnv("MYMEDLIFE_PILOT_ROLLBACK_OWNER", originalRollback);
      restoreEnv("MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL", originalSupport);
    }
  });

  it("surfaces concrete hosted proof anchors in the closeout snapshot when staging evidence is loaded", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const summary = getMvpReleaseReadinessSummary(actor, {
      data: withHostedPhase2Evidence(),
      env: {
        MYMEDLIFE_AUTH_MODE: "staging_supabase",
      },
    });

    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "50000000-0000-4000-8000-000000000002",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "80326f8b-2436-409b-9a7d-454006c76772",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "20033a9c-f891-43c6-88ca-0e3bf0b03a8c",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "3e7b2ab6-8770-488f-9637-90cbaa863b62",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "e80798d1-18cb-4441-8d94-84a56bc1ad0c",
    );
    expect(summary.phase2Closeout?.provenNow.join(" ")).toContain(
      "Hosted staging proof drill: Sofia finished the Rush Month outreach follow-up",
    );
  });

  it("hides release readiness from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const committeeMember = getMockLocalActorContext("committee.member@mymedlife.test");
    const committeeChair = getMockLocalActorContext("committee.chair@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpReleaseReadinessSummary(member).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(committeeMember).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(committeeChair).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(leader).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(coach).canReadSummary).toBe(false);
    expect(getMvpReleaseReadinessSummary(member).roleModelReviewCheckpoint).toBeNull();
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function withHostedPhase2Evidence(): ReadOnlyAppData {
  const assignmentId = "50000000-0000-4000-8000-000000000002";
  const actionStartedEventId = "80326f8b-2436-409b-9a7d-454006c76772";
  const actionStartedIntegrationEventId = "20033a9c-f891-43c6-88ca-0e3bf0b03a8c";
  const evidenceSubmittedEventId = "cca7640b-149f-45b7-8efe-c6c50b5815cf";
  const evidenceSubmittedIntegrationEventId = "b95589cd-1000-4435-a28d-3fbb9a168a4a";
  const evidenceItemId = "3e7b2ab6-8770-488f-9637-90cbaa863b62";
  const data = getMockReadOnlyAppData("Testing hosted release summary proof.");

  return {
    ...data,
    source: {
      mode: "supabase",
      status: "supabase_ready",
      message: "Testing hosted staging readback evidence.",
    },
    assignments: data.assignments.map((assignment, index) => {
      if (index !== 0) {
        return assignment;
      }

      return {
        ...assignment,
        id: assignmentId,
        status: "submitted",
        lane: "Member",
        title: "Invite three more students to Rush Month",
      };
    }),
    evidenceItems: [
      {
        id: evidenceItemId,
        assignmentId,
        submittedBy: "Sofia Alvarez",
        evidenceType: "testimonial_text",
        summary:
          "Hosted staging proof drill: Sofia finished the Rush Month outreach follow-up and captured the exact member invite context for leader review.",
        status: "pending_review",
      },
    ],
    eventRows: [
      {
        id: "luma-pilot-event-created",
        event_type: "luma_event_upserted",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
        },
        correlation_id: "luma-pilot:event-created",
        occurred_at: "2026-06-29T15:20:00Z",
        created_at: "2026-06-29T15:20:00Z",
      },
      {
        id: "luma-pilot-rsvp",
        event_type: "event_rsvp_recorded",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
          rsvpCount: 4,
        },
        correlation_id: "luma-pilot:rsvp",
        occurred_at: "2026-06-29T15:40:00Z",
        created_at: "2026-06-29T15:40:00Z",
      },
      {
        id: "luma-pilot-attendance",
        event_type: "event_attendance_recorded",
        actor_user_id: "00000000-0000-4000-8000-000000000010",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        payload: {
          source: "luma_live_pilot",
          attendanceCount: 2,
        },
        correlation_id: "luma-pilot:attendance",
        occurred_at: "2026-06-29T16:05:00Z",
        created_at: "2026-06-29T16:05:00Z",
      },
      {
        id: actionStartedEventId,
        event_type: "action_started",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.start_assignment_action",
        },
        correlation_id: "action_started:assignment-2:member-1",
        occurred_at: "2026-06-29T15:33:24Z",
        created_at: "2026-06-29T15:33:24Z",
      },
      {
        id: evidenceSubmittedEventId,
        event_type: "evidence_submitted",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: assignmentId,
        chapter_event_id: null,
        payload: {
          source: "app.submit_proof_metadata",
          evidenceItemId,
        },
        correlation_id: "evidence_submitted:assignment-2:member-1",
        occurred_at: "2026-06-29T15:51:53Z",
        created_at: "2026-06-29T15:51:53Z",
      },
    ],
    integrationEventRows: [
      {
        id: actionStartedIntegrationEventId,
        source_event_id: actionStartedEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "action_started",
        destination: "internal",
        external_object_type: "assignment",
        external_object_id: assignmentId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-29T15:33:24Z",
        updated_at: "2026-06-29T15:33:24Z",
      },
      {
        id: evidenceSubmittedIntegrationEventId,
        source_event_id: evidenceSubmittedEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "evidence_submitted",
        destination: "internal",
        external_object_type: "evidence_item",
        external_object_id: evidenceItemId,
        status: "recorded",
        payload: {
          liveExternalWrite: false,
        },
        created_by: "00000000-0000-4000-8000-000000000001",
        created_at: "2026-06-29T15:51:53Z",
        updated_at: "2026-06-29T15:51:53Z",
      },
      {
        id: "luma-pilot-linked",
        source_event_id: "luma-pilot-event-created",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_event_linked",
        destination: "luma",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T15:20:00Z",
        updated_at: "2026-06-29T15:20:00Z",
      },
      {
        id: "luma-pilot-rsvp-integration",
        source_event_id: "luma-pilot-rsvp",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_rsvp_recorded",
        destination: "internal",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
          rsvpCount: 4,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T15:40:00Z",
        updated_at: "2026-06-29T15:40:00Z",
      },
      {
        id: "luma-pilot-attendance-integration",
        source_event_id: "luma-pilot-attendance",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        event_type: "luma_attendance_imported",
        destination: "internal",
        external_object_type: "chapter_event",
        external_object_id: "evt-bJE178Q02N5DaLH",
        status: "recorded",
        payload: {
          source: "luma_live_pilot",
          attendanceCount: 2,
        },
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T16:05:00Z",
        updated_at: "2026-06-29T16:05:00Z",
      },
    ],
    automationOutboxRows: [
      {
        id: "e80798d1-18cb-4441-8d94-84a56bc1ad0c",
        source_event_id: evidenceSubmittedEventId,
        integration_event_id: evidenceSubmittedIntegrationEventId,
        chapter_id: "10000000-0000-4000-8000-000000000001",
        destination: "n8n",
        event_type: "evidence_submitted",
        payload: {
          disabled: true,
        },
        idempotency_key: "evidence_submitted:assignment-2:member-1",
        status: "disabled",
        attempt_count: 0,
        available_at: "2026-06-29T15:51:53Z",
        locked_at: null,
        sent_at: null,
        last_error: null,
        created_at: "2026-06-29T15:51:53Z",
        updated_at: "2026-06-29T15:51:53Z",
      },
    ],
    auditLogs: [
      {
        id: "99ad7242-b46c-48d4-a573-79eef122fa74",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "action_started",
        target_table: "assignments",
        target_id: assignmentId,
        before_value: {
          status: "not_started",
        },
        after_value: {
          status: "in_progress",
          eventId: actionStartedEventId,
        },
        reason: "Hosted preview action-start proof save.",
        created_at: "2026-06-29T15:33:24Z",
      },
      {
        id: "bf1c1538-6983-46f6-b0f5-d4053be65da5",
        actor_user_id: "00000000-0000-4000-8000-000000000001",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        action: "evidence_submitted",
        target_table: "evidence_items",
        target_id: evidenceItemId,
        before_value: null,
        after_value: {
          assignmentId,
          eventId: evidenceSubmittedEventId,
        },
        reason: "Hosted preview proof metadata save.",
        created_at: "2026-06-29T15:51:53Z",
      },
    ],
    pointsEventRows: [
      {
        id: "00000000-0000-4000-8000-000000000901",
        chapter_id: "10000000-0000-4000-8000-000000000001",
        campaign_id: "40000000-0000-4000-8000-000000000001",
        assignment_id: null,
        chapter_event_id: "evt-bJE178Q02N5DaLH",
        evidence_item_id: null,
        approval_id: null,
        awarded_to_user_id: "00000000-0000-4000-8000-000000000001",
        points_delta: 20,
        reason: "Attendance confirmed for Intro GBM",
        created_by: "00000000-0000-4000-8000-000000000010",
        created_at: "2026-06-29T16:05:00Z",
      },
    ],
  };
}
