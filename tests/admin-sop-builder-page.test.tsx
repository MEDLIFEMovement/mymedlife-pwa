import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error("notFound");
    }),
    usePathname: () => "/admin/sop-builder/rush-month",
    useSearchParams: () => new URLSearchParams(),
  };
});

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();

  return {
    ...actual,
    getLocalActorContext: vi.fn(),
  };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();

  return {
    ...actual,
    getReadOnlyAppData: vi.fn(),
  };
});

describe("admin SOP builder page", () => {
  it("renders real tab links and route-backed builder content", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder page."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({ tab: "steps" }),
      }),
    );

    expect(html).toContain("Backend route family");
    expect(html).toContain('href="/admin/permissions"');
    expect(html).toContain('href="/admin/committees"');
    expect(html).toContain('href="/admin/workflows"');
    expect(html).toContain('href="/admin/sop-library"');
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain("Rush Month Builder");
    expect(html).toContain("Current tab");
    expect(html).toContain("Current focus");
    expect(html).toContain("Current workbench focus");
    expect(html).toContain("Library");
    expect(html).toContain("Publish");
    expect(html).toContain("Workflow Steps");
    expect(html).toContain("Sections");
    expect(html).toContain("Versions");
    expect(html).toContain("Step Details");
    expect(html).toContain("Add Step");
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=steps&amp;focus=rush-visibility&amp;mode=add_step"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=steps&amp;focus=rush-recognition&amp;mode=add_step_after_last"',
    );
    expect(html).toContain('href="/admin/workflows?section=lanes&amp;focus=campaign-config"');
    expect(html).toContain("Rush Month SOP builder");
    expect(html).toContain("/admin/sop-builder/rush-month?tab=role-matrix");
    expect(html).toContain("/rush-month/dashboard");
    expect(html).toContain("Preview as committee chair");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=committee.chair%40mymedlife.test&amp;returnTo=%2Frush-month%2Fdashboard"',
    );
    expect(html).toContain("Start one concrete member action");
  });

  it("keeps builder focus state on the same route when a specific step is selected", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder focus state."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "steps",
          focus: "rush-actions",
        }),
      }),
    );

    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=steps"');
    expect(html).toContain("Step Details");
    expect(html).toContain("Due Timing");
    expect(html).toContain("Risk / Escalation");
    expect(html).toContain("Start one concrete member action");
    expect(html).toContain("href=\"/admin/sop-builder/rush-month?tab=steps&amp;focus=rush-actions\"");
    expect(html).toContain("Selected</a>");
    expect(html).toContain("Open in workspace");
    expect(html).toContain("/rush-month/actions/member-push");
  });

  it("shows the current template posture as a first-class record on the version tab", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder version posture."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "version",
        }),
      }),
    );

    expect(html).toContain("Version workbench");
    expect(html).toContain("Default focus: v2.1");
    expect(html).toContain("Current template posture");
    expect(html).toContain("v2.1");
    expect(html).toContain("package-backed structured draft");
    expect(html).toContain("33-59 coach pages");
    expect(html).toContain("214-240 chapter pages");
    expect(html).toContain("Source perspectives");
    expect(html).toContain("Coach perspective");
    expect(html).toContain("Chapter / platform perspective");
    expect(html).toContain("/coach?view=chapters");
    expect(html).toContain("/rush-month/dashboard");
    expect(html).toContain("review ready");
    expect(html).toContain("draft");
    expect(html).toContain('href="/admin/sop-builder/rush-month?tab=version&amp;focus=current-version"');
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=current-version&amp;mode=filter"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=current-version&amp;mode=publish"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=current-version&amp;mode=schedule"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=current-version&amp;mode=rollback"',
    );
    expect(html).toContain("Current draft");
    expect(html).toContain("Current live version");
    expect(html).toContain("Local draft session");
    expect(html).toContain("Draft session comparison");
    expect(html).toContain("Current draft vs local draft session");
    expect(html).toContain("Current draft baseline");
    expect(html).toContain("Draft session package");
    expect(html).toContain("Draft session review lanes");
    expect(html).toContain("Grouped packet review inside the builder");
    expect(html).toContain("Runtime controls");
    expect(html).toContain("Feature flags and rollout posture");
    expect(html).toContain("Audit and rollout posture");
    expect(html).toContain("Integration boundaries and audit expectations");
    expect(html).toContain("Campaign template linkage");
    expect(html).toContain("Committee owner mapping");
    expect(html).toContain("Workflow permission posture");
    expect(html).toContain("Local draft proposals");
    expect(html).toContain("Backend config proposals feeding this workflow");
    expect(html).toContain("local draft session");
    expect(html).toContain("Edit draft session");
    expect(html).toContain("Committee registry campaign link review");
    expect(html).toContain("Permissions registry workflow operation review");
    expect(html).toContain("Edit draft proposal");
    expect(
      (
        html.match(
          /href="\/admin\/sop-builder\/rush-month\?tab=version&amp;focus=current-version"/g,
        ) ?? []
      ).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("opens a local draft proposal as a builder version focus record", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder local draft proposal."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "version",
          focus: "proposal-permission-planning-goal-setting-publish_approve",
        }),
      }),
    );

    expect(html).toContain("Selected version or source record");
    expect(html).toContain("Local draft proposal");
    expect(html).toContain("publish approve permission review");
    expect(html).toContain("Open source route");
    expect(html).toContain(
      'href="/admin/permissions?section=routes&amp;focus=admin_backend&amp;permission=planning-goal-setting-publish_approve"',
    );
  });

  it("opens the mock-safe draft proposal editor on the version lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder draft proposal editor."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "version",
          focus: "proposal-permission-planning-goal-setting-publish_approve",
          mode: "edit_proposal",
        }),
      }),
    );

    expect(html).toContain("Mock-safe builder action");
    expect(html).toContain("Edit draft proposal:");
    expect(html).toContain("Allowed roles");
    expect(html).toContain("Allowed scopes");
    expect(html).toContain("Authority review lane");
    expect(html).toContain("draft proposal");
    expect(html).toContain("Return to workflow");
  });

  it("opens the mock-safe draft session editor on the version lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder draft session editor."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "version",
          focus: "draft-session-planning-goal-setting",
          mode: "edit_draft_session",
        }),
      }),
    );

    expect(html).toContain("Mock-safe builder action");
    expect(html).toContain("Edit draft session:");
    expect(html).toContain("Proposal count");
    expect(html).toContain("Review lanes");
    expect(html).toContain("Affected roles");
    expect(html).toContain("Bundled change themes");
    expect(html).toContain("draft session");
    expect(html).toContain("Return to workflow");
  });

  it("renders structured import review posture for Planning / Goal Setting", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder structured import posture."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "version",
        }),
      }),
    );

    expect(html).toContain("Structured import review");
    expect(html).toContain("v0 reviewed import posture");
    expect(html).toContain("draft reviewed");
    expect(html).toContain("package-backed structured draft");
    expect(html).toContain("0 source gaps");
    expect(html).toContain("1-32 coach pages");
    expect(html).toContain("184-213 chapter pages");
    expect(html).toContain("Imported phases");
    expect(html).toContain("Imported steps");
    expect(html).toContain("Unresolved import warnings");
    expect(html).toContain("Imported source coverage");
    expect(html).toContain("Script templates");
    expect(html).toContain("Resource links");
    expect(html).toContain("workflow.planning_goal_setting.builder_preview");
    expect(html).toContain("workflow.planning_goal_setting.runtime_reads");
    expect(html).toContain("audit.record.created");
    expect(html).toContain("crm.coach_decisions");
    expect(html).toContain("Goal alignment meeting prompt");
    expect(html).toContain("Run A source map");
    expect(html).toContain("Selected version or source record");
  });

  it("shows repo-defined import provenance for Grow the Movement on the version tab", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing builder repo-defined import posture."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "grow-the-movement" }),
        searchParams: Promise.resolve({
          tab: "version",
        }),
      }),
    );

    expect(html).toContain("Structured import review");
    expect(html).toContain("repo-defined structured draft");
    expect(html).toContain("source gaps");
    expect(html).toContain(
      "still leans on repo-defined campaign artifacts where the rollout package has source gaps",
    );
  });

  it("renders Planning / Goal Setting steps from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting steps."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "steps",
          focus: "planning-goal-brief",
        }),
      }),
    );

    expect(html).toContain("Imported phases");
    expect(html).toContain("Structured imported draft");
    expect(html).toContain("Define the chapter goal and deadline");
    expect(html).toContain("Goal brief is specific, owned, and time-bound");
    expect(html).toContain("Expected Outputs");
    expect(html).toContain("chapter_goal");
    expect(html).toContain("Open linked route");
  });

  it("renders Planning / Goal Setting role matrix from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting role matrix."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "role-matrix",
          focus: "planning-president-chapter",
        }),
      }),
    );

    expect(html).toContain("Imported workflow behavior");
    expect(html).toContain("Role Matrix");
    expect(html).toContain("Define the chapter goal and deadline");
    expect(html).toContain("Goals set");
    expect(html).toContain("campaign.phase.started");
    expect(html).toContain("Open role route");
  });

  it("renders Planning / Goal Setting completion rules from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting completion."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "completion",
          focus: "planning-coach-approval",
        }),
      }),
    );

    expect(html).toContain("Workflow completion gates");
    expect(html).toContain("Imported completion rows");
    expect(html).toContain("Imported risk posture");
    expect(html).toContain("Escalation follow-through");
    expect(html).toContain("Closeout requirements");
    expect(html).toContain("Escalate missing owner gaps");
    expect(html).toContain("Approved goal brief");
    expect(html).toContain("Coach readiness validation");
    expect(html).toContain("Human review gates remain explicit");
    expect(html).toContain("Selected workflow rule");
  });

  it("renders Planning / Goal Setting points and KPI rules from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting points and KPI."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "points-kpi",
          focus: "points-president",
        }),
      }),
    );

    expect(html).toContain("Recognition and measurement rules");
    expect(html).toContain("roles with points");
    expect(html).toContain("Goals set");
    expect(html).toContain("40 points");
    expect(html).toContain("Selected points or KPI rule");
  });

  it("renders Planning / Goal Setting communications from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting comms."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "comms",
          focus: "planning-coach-checkin-reminder",
        }),
      }),
    );

    expect(html).toContain("Communication triggers");
    expect(html).toContain("coach and president");
    expect(html).toContain("approval required");
    expect(html).toContain("Integration boundary");
    expect(html).toContain("kpi.event.created");
    expect(html).toContain("Selected communication trigger");
  });

  it("opens preview scenarios through role-correct local preview handoffs", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder preview handoffs."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "preview",
        }),
      }),
    );

    expect(html).toContain("Preview by role");
    expect(html).toContain("Screen / Page Changes");
    expect(html).toContain("Action That Appears");
    expect(html).toContain("Proof Requested");
    expect(html).toContain("Communication Trigger Generated");
    expect(html).toContain("Preview as student member");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=member.a%40mymedlife.test&amp;returnTo=%2Frush-month%2Fdashboard"',
    );
    expect(html).toContain("Preview as president");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=leader.a%40mymedlife.test&amp;returnTo=%2Fchapter%3Fview%3Dmembers"',
    );
    expect(html).toContain(">Open raw route<");
  });

  it("extends role-aware preview handoffs across other route-backed SOP tabs", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder route-backed role previews."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );

    const roleMatrixHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "role-matrix",
        }),
      }),
    );

    expect(roleMatrixHtml).toContain("Role matrix");
    expect(roleMatrixHtml).toContain("Preview as student member");
    expect(roleMatrixHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=role-matrix&amp;focus=student_member-own-%2Frush-month%2Factions&amp;mode=filter"',
    );
    expect(roleMatrixHtml).toContain(
      'href="/local-preview?selectedEmail=member.a%40mymedlife.test&amp;returnTo=%2Frush-month%2Factions"',
    );

    const completionHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "completion",
        }),
      }),
    );

    expect(completionHtml).toContain("Completion / Proof / Approval");
    expect(completionHtml).toContain("Workflow completion gates");
    expect(completionHtml).toContain("Completion Type");
    expect(completionHtml).toContain("Evidence Type");
    expect(completionHtml).toContain("Audit Behavior");
    expect(completionHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=completion&amp;focus=rush-action-started&amp;mode=filter"',
    );
    expect(completionHtml).toContain("Preview as president");
    expect(completionHtml).toContain(
      'href="/local-preview?selectedEmail=leader.a%40mymedlife.test&amp;returnTo=%2Frush-month%2Freview"',
    );
    expect(completionHtml).toContain("Preview as department staff");
    expect(completionHtml).toContain(
      'href="/local-preview?selectedEmail=general.staff%40mymedlife.test&amp;returnTo=%2Fstaff%3Fview%3Dproof_ugc"',
    );

    const previewHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "preview",
        }),
      }),
    );

    expect(previewHtml).toContain("Preview by role");
    expect(previewHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=preview&amp;focus=rush-member-loop&amp;mode=filter"',
    );
    expect(previewHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=preview&amp;focus=rush-member-loop"',
    );
  });

  it("renders Planning / Goal Setting preview from the imported template surface", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing template-driven Planning / Goal Setting preview."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "planning-goal-setting" }),
        searchParams: Promise.resolve({
          tab: "preview",
          focus: "planning-goal-brief",
        }),
      }),
    );

    expect(html).toContain("Preview by role");
    expect(html).toContain("5 preview scenarios");
    expect(html).toContain("Define the chapter goal and deadline");
    expect(html).toContain("Leadership goal note");
    expect(html).toContain("Goals set");
    expect(html).toContain("40 points");
    expect(html).toContain("Open raw route");
    expect(html).toContain(
      'href="/local-preview?selectedEmail=leader.a%40mymedlife.test&amp;returnTo=%2Fchapter%3Fview%3Doverview"',
    );
  });

  it("opens the route-owned filter review state on the same builder screen", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder filter review state."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "role-matrix",
          focus: "student_member-own-/rush-month/actions",
          mode: "filter",
        }),
      }),
    );

    expect(html).toContain("Filter review state");
    expect(html).toContain(
      "This route keeps the filter posture visible on the same builder tab before any editable filter presets or saved views exist.",
    );
    expect(html).toContain("No saved-view mutation or preference write runs from this review state.");
    expect(html).toContain("Keep route state readable enough that a reviewer can share the exact filtered URL.");
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=role-matrix&amp;focus=student_member-own-%2Frush-month%2Factions"',
    );
  });

  it("shows role-based points and KPI logic in the same builder lane", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder points and KPI posture."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "points-kpi",
        }),
      }),
    );

    expect(html).toContain("Points &amp; KPI Impact");
    expect(html).toContain("Recognition and measurement rules");
    expect(html).toContain("Role-based points");
    expect(html).toContain("Imported KPI rules");
    expect(html).toContain("KPI rules");
    expect(html).toContain("Leads Captured");
    expect(html).toContain("leads_captured");
    expect(html).toContain("80");
    expect(html).toContain("Approval Before Points");
    expect(html).toContain("Leaderboard Visible");
    expect(html).toContain("Caps / Manual Override");
  });

  it("keeps communication triggers and integration boundaries explicit", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder communications posture."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "comms",
        }),
      }),
    );

    expect(html).toContain("Communication triggers");
    expect(html).toContain("Trigger Condition");
    expect(html).toContain("Source System");
    expect(html).toContain("Mock / Live Status");
    expect(html).toContain("Integration boundary");
    expect(html).toContain("HubSpot");
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=comms&amp;focus=rush-month-internal"',
    );
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=comms&amp;focus=boundary-hubspot"',
    );
  });

  it("lets visible preview, comms, and version records drive same-route focus", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder direct visible-record focus."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );

    const previewHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "preview",
          focus: "rush-member-loop",
        }),
      }),
    );

    expect(previewHtml).toContain('aria-current="page"');
    expect(previewHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=preview&amp;focus=rush-member-loop"',
    );
    expect(previewHtml).toContain("Selected preview scenario");

    const commsHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "comms",
          focus: "boundary-hubspot",
        }),
      }),
    );

    expect(commsHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=comms&amp;focus=boundary-hubspot"',
    );
    expect(commsHtml).toContain("Selected communication trigger");
    expect(commsHtml).toContain("Mode: disabled");

    const versionHtml = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "version",
          focus: "version-0",
        }),
      }),
    );

    expect(versionHtml).toContain(
      'href="/admin/sop-builder/rush-month?tab=version&amp;focus=version-0"',
    );
    expect(versionHtml).toContain("Selected version or source record");
  });

  it("turns visible builder controls into route-owned mock-safe action states", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing SOP builder action states."),
    );

    const { default: AdminSopBuilderPage } = await import(
      "@/app/admin/sop-builder/[campaignSlug]/page"
    );
    const html = renderToStaticMarkup(
      await AdminSopBuilderPage({
        params: Promise.resolve({ campaignSlug: "rush-month" }),
        searchParams: Promise.resolve({
          tab: "steps",
          focus: "rush-actions",
          mode: "duplicate_step",
        }),
      }),
    );

    expect(html).toContain("Mock-safe builder action");
    expect(html).toContain("Duplicate step: Start one concrete member action");
    expect(html).toContain("Return to workflow");
    expect(html).toContain(
      'href="/admin/sop-builder/rush-month?tab=steps&amp;focus=rush-actions"',
    );
    expect(html).toContain("Duplicate Step");
    expect(html).toContain("Disable Step");
  });
});
