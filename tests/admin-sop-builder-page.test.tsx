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
    expect(
      (
        html.match(
          /href="\/admin\/sop-builder\/rush-month\?tab=version&amp;focus=current-version"/g,
        ) ?? []
      ).length,
    ).toBeGreaterThanOrEqual(3);
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
      'href="/local-preview?selectedEmail=admin%40mymedlife.test&amp;returnTo=%2Fstaff%3Fview%3Dproof_ugc"',
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
    expect(versionHtml).toContain("Selected version detail");
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
