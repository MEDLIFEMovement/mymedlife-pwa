import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMvpProgressMap } from "@/services/mvp-progress-map";

describe("mvp progress map", () => {
  it("gives admins a plain-English map of MVP progress and remaining work", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);

    expect(progressMap.canReadProgressMap).toBe(true);
    expect(progressMap.title).toBe("Admin MVP progress map");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/login");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/onboarding");
    expect(progressMap.nextBestSteps.join(" ")).toContain("Goal 157");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/admin/review-path");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/admin/nick-review");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/admin/release-readiness");
    expect(progressMap.nextBestSteps.join(" ")).toContain("production launch gate");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/admin/launch-gate");
    expect(progressMap.nextBestSteps.join(" ")).toContain("database security decision");
    expect(progressMap.nextBestSteps.join(" ")).toContain("/admin/database-security");
    expect(progressMap.nextBestSteps.join(" ")).toContain("production operations runbook");
    expect(progressMap.counts).toEqual({
      total: 13,
      localReviewReady: 4,
      partiallyReady: 6,
      needsApproval: 2,
      futureBuild: 1,
    });
    expect(progressMap.localReviewPercent).toBeGreaterThan(progressMap.liveMvpPercent);
    expect(progressMap.liveMvpPercent).toBeLessThan(50);
    expect(progressMap.plainEnglishSummary).toContain("not a live student launch");
    expect(
      progressMap.subprojects.find((item) => item.key === "app_foundation")
        ?.routeEvidence,
    ).toContain("/offline");
    expect(
      progressMap.subprojects.find((item) => item.key === "app_foundation")
        ?.routeEvidence,
    ).toContain("/chapter");
    expect(
      progressMap.subprojects.find((item) => item.key === "app_foundation")
        ?.plainEnglish,
    ).toContain("Rush Month overview");
    expect(
      progressMap.subprojects.find((item) => item.key === "app_foundation")
        ?.technicalEvidence,
    ).toContain("Rush Month overview route coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/login");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/profile");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/onboarding");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/rush-month");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.plainEnglish,
    ).toContain("Rush Month overview");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("Rush Month overview review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/rush-month/actions/[assignmentId]");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/rush-month/events");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.plainEnglish,
    ).toContain("event-list");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("member assigned-actions review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("member action detail review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("member event-list review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.routeEvidence,
    ).toContain("/rush-month/leaderboard");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.plainEnglish,
    ).toContain("chapter home");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.plainEnglish,
    ).toContain("Goal 157 production auth preflight");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("chapter home route coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("profile workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("auth onboarding workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("Goal 157 production auth preflight");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.technicalEvidence,
    ).toContain("member leaderboard workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.routeEvidence,
    ).toContain("/rush-month");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.plainEnglish,
    ).toContain("campaign front door");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.technicalEvidence,
    ).toContain("Rush Month overview review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.routeEvidence,
    ).toContain("/rush-month/actions");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.plainEnglish,
    ).toContain("member events/NPS");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.technicalEvidence,
    ).toContain("member assigned-actions review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.technicalEvidence,
    ).toContain("member event-list review coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.routeEvidence,
    ).toContain("/rush-month/events/[eventId]");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.routeEvidence,
    ).toContain("/rush-month/actions/[assignmentId]");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.technicalEvidence,
    ).toContain("direct event detail");
    expect(
      progressMap.subprojects.find((item) => item.key === "rush_month_loop")
        ?.technicalEvidence,
    ).toContain("action-detail review coverage");
  });

  it("keeps external automation and proof upload work explicitly unfinished", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);
    const proofUpload = progressMap.subprojects.find(
      (item) => item.key === "proof_upload_storage",
    );
    const automation = progressMap.subprojects.find(
      (item) => item.key === "external_automation",
    );

    expect(proofUpload?.status).toBe("partially_ready");
    expect(proofUpload?.remainingWork).toContain("storage buckets");
    expect(proofUpload?.plainEnglish).toContain("member evidence submission queues");
    expect(proofUpload?.plainEnglish).toContain("Goal 152 proof prep packets");
    expect(proofUpload?.plainEnglish).toContain("Goal 158 proof submission packets");
    expect(proofUpload?.plainEnglish).toContain(
      "Goal 159 proof storage intake packets",
    );
    expect(proofUpload?.plainEnglish).toContain(
      "Goal 153 leader proof review rubrics",
    );
    expect(proofUpload?.technicalEvidence).toContain(
      "member evidence submission workspace",
    );
    expect(proofUpload?.technicalEvidence).toContain("Goal 152 proof prep checklist");
    expect(proofUpload?.technicalEvidence).toContain("Goal 158 proof submission packet");
    expect(proofUpload?.technicalEvidence).toContain(
      "Goal 159 proof storage intake packet",
    );
    expect(proofUpload?.technicalEvidence).toContain(
      "Goal 153 leader proof review rubric",
    );
    expect(proofUpload?.nextReviewStep).toContain("/rush-month/evidence");
    expect(proofUpload?.nextReviewStep).toContain("Goal 158");
    expect(proofUpload?.nextReviewStep).toContain("/proof-library/upload");
    expect(proofUpload?.nextReviewStep).toContain("Goal 159");
    expect(proofUpload?.nextReviewStep).toContain("/rush-month/review");
    expect(automation?.status).toBe("needs_approval");
    expect(automation?.plainEnglish).toContain("no real external systems");
    expect(automation?.liveMvpWeight).toBe(0);
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.remainingWork,
    ).toContain("Goal 149 device/PWA smoke matrix");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.routeEvidence,
    ).toContain("/admin/design-qa");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.routeEvidence,
    ).toContain("/admin/nick-review");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.technicalEvidence,
    ).toContain("eight mobile visual smoke checks");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.technicalEvidence,
    ).toContain("seven accessibility smoke checks");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.technicalEvidence,
    ).toContain("seven device/PWA smoke checks");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.technicalEvidence,
    ).toContain("route smoke manifest");
    expect(
      progressMap.subprojects.find((item) => item.key === "design_qa_readiness")
        ?.nextReviewStep,
    ).toContain("Goal 149");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused stakeholder review path");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused Goal 151 Nick final review route");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/nick-review");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused release readiness route");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused launch gate route");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("Goal 150 launch evidence checklist");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused design QA route");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused operations route");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.remainingWork,
    ).toContain("Pick the first pilot group");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("coach support notes");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("Goal 154 coach intervention checklists");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("leader proof decision workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("leader proof decision result states");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/operations");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/staff-dry-run");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/pilot-scope");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/admin/first-write");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.routeEvidence,
    ).toContain("/rush-month/events/[eventId]");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("Rush Month event detail workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.technicalEvidence,
    ).toContain("Goal 150 launch evidence checklist");
    expect(
      progressMap.subprojects.find((item) => item.key === "controlled_pilot_readiness")
        ?.remainingWork,
    ).toContain("Goal 150 launch evidence checklist");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.routeEvidence,
    ).toContain("/admin/first-write");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.routeEvidence,
    ).toContain("/admin/coach-write");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("coach support notes");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("Goal 154 coach intervention checklist coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("leader proof decision workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("leader proof decision result-state coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("Goal 115 leader proof SQL/RLS coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.technicalEvidence,
    ).toContain("Goal 116 leader proof server-action coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.remainingWork,
    ).toContain("Goal 115 SQL/RLS packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "local_write_paths")
        ?.remainingWork,
    ).toContain("Goal 116 leader proof server-action packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.plainEnglish,
    ).toContain("exact required starter campaign shells");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/planning-goal-setting");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/chapter-engagement");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/slt-promotion");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/moving-mountains");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/leadership-transition");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/grow-the-movement");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.routeEvidence,
    ).toContain("/campaigns/start-a-chapter");
    expect(
      progressMap.subprojects.find((item) => item.key === "campaign_templates")
        ?.remainingWork,
    ).toContain("production campaign-template workflows");
  });

  it("gives DS Admin the automation-aware progress map without granting ownership", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const progressMap = getMvpProgressMap(actor);

    expect(progressMap.canReadProgressMap).toBe(true);
    expect(progressMap.title).toBe("DS Admin MVP progress and automation map");
    expect(progressMap.nextBestSteps.join(" ")).toContain("n8n");
    expect(
      progressMap.subprojects.find((item) => item.key === "external_automation")
        ?.routeEvidence,
    ).toContain("/admin/integration-outbox");
    expect(
      progressMap.subprojects.find((item) => item.key === "external_automation")
        ?.technicalEvidence,
    ).toContain("admin integration outbox workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "external_automation")
        ?.plainEnglish,
    ).toContain("Goal 155 live-send preflight");
    expect(
      progressMap.subprojects.find((item) => item.key === "external_automation")
        ?.technicalEvidence,
    ).toContain("Goal 155 live-send preflight checklist");
    expect(
      progressMap.subprojects.find((item) => item.key === "role_aware_views")
        ?.remainingWork,
    ).toContain("membership truth");
    expect(
      progressMap.subprojects.find((item) => item.key === "supabase_rls_foundation")
        ?.remainingWork,
    ).toContain("DS database decision sign-off");
    expect(
      progressMap.subprojects.find((item) => item.key === "supabase_rls_foundation")
        ?.routeEvidence,
    ).toContain("/admin/database-security");
    expect(
      progressMap.subprojects.find((item) => item.key === "supabase_rls_foundation")
        ?.nextReviewStep,
    ).toContain("/admin/database-security");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.routeEvidence,
    ).toContain("/profile");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.plainEnglish,
    ).toContain("formal review path");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.plainEnglish,
    ).toContain("Goal 157 production auth preflight");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.plainEnglish,
    ).toContain("Goal 160 membership approval packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.plainEnglish,
    ).toContain("Goal 161 membership approval result states");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.technicalEvidence,
    ).toContain("route smoke coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.technicalEvidence,
    ).toContain("production auth preflight coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.technicalEvidence,
    ).toContain("Goal 160 membership approval packet coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.technicalEvidence,
    ).toContain("Goal 161 membership approval result-state coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.nextReviewStep,
    ).toContain("/login");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.routeEvidence,
    ).toContain("/onboarding");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.technicalEvidence,
    ).toContain("auth onboarding workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_auth")
        ?.remainingWork,
    ).toContain("preflight evidence");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.status,
    ).toBe("partially_ready");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("admin master data workspace");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.plainEnglish,
    ).toContain("focused master data inventory");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.routeEvidence,
    ).toContain("/admin/master-data");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.routeEvidence,
    ).toContain("/admin/audit-log");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.plainEnglish,
    ).toContain("role coverage");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.plainEnglish,
    ).toContain("Goal 160 membership approval packets");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.plainEnglish,
    ).toContain("Goal 161 membership result states");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.plainEnglish,
    ).toContain("Goal 156 write-audit preflight");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("focused audit log route");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("audit log review");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("Goal 156 write-audit preflight checklist");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("Goal 160 membership approval packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.technicalEvidence,
    ).toContain("Goal 161 membership approval result states");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.nextReviewStep,
    ).toContain("Goal 160 membership approval packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "admin_operations")
        ?.nextReviewStep,
    ).toContain("Goal 161 result states");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("focused system health route");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/review-path");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/release-readiness");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/launch-gate");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/operations");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/database-security");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.routeEvidence,
    ).toContain("/admin/design-qa");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.nextReviewStep,
    ).toContain("/admin/review-path");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.nextReviewStep,
    ).toContain("/admin/release-readiness");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.nextReviewStep,
    ).toContain("/admin/launch-gate");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.nextReviewStep,
    ).toContain("Goal 150 launch evidence packet");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.nextReviewStep,
    ).toContain("/admin/system-health");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("system health review");
    expect(
      progressMap.subprojects.find((item) => item.key === "production_deploy_qa")
        ?.technicalEvidence,
    ).toContain("production operations runbook");
  });

  it("hides the build-status map from chapter and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getMvpProgressMap(member).canReadProgressMap).toBe(false);
    expect(getMvpProgressMap(leader).canReadProgressMap).toBe(false);
    expect(getMvpProgressMap(coach).canReadProgressMap).toBe(false);
  });
});
