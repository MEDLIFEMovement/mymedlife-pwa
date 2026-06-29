import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { assignments } from "@/data/mock-rush-month";
import {
  getActionDetailFacts,
  getActionWorkflowPhase,
  getActionSteps,
  getActionWorkflowStep,
  getActionWhyItMatters,
} from "@/services/member-action-detail";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound should not be called in this test");
  }),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  usePathname: () => "/rush-month/actions/member-push",
  useSearchParams: () => new URLSearchParams(),
}));

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

describe("member action detail copy", () => {
  const assignment = assignments.find((item) => item.id === "member-push");

  if (!assignment) {
    throw new Error("Expected member-push mock assignment");
  }

  it("builds a why-it-matters summary around the current action and KPI", () => {
    expect(getActionWhyItMatters(assignment)).toContain("30-point action");
    expect(getActionWhyItMatters(assignment)).toContain("Start one concrete member action");
    expect(getActionWhyItMatters(assignment)).toContain("Student invites sent");
    expect(getActionWhyItMatters(assignment)).toContain("Current phase objective:");
  });

  it("keeps the steps explicit about workflow completion, evidence, and local confirmation", () => {
    expect(getActionSteps(assignment)).toEqual([
      "Invite three students to the Intro GBM using the approved chapter message, then submit proof that shows the real outreach happened.",
      'Advance the "Start one concrete member action" workflow step by meeting this completion signal: Assignment detail exposes due date, status, why-it-matters context, and the guarded start path.',
      "Keep the broader phase on track by preserving this exit signal: Action status moves to in progress and the proof expectations are visible before submission.",
      "Capture proof that answers this requirement: Message screenshot, invite list, or event RSVP link.",
      "Confirm the proof is accurate, preview the submission locally, and use the confirmation state before any real save path is approved.",
    ]);
  });

  it("resolves the member action against the Rush Month workflow runtime", () => {
    const workflowStep = getActionWorkflowStep(assignment);
    const workflowPhase = getActionWorkflowPhase(assignment);

    expect(workflowStep?.id).toBe("rush-actions");
    expect(workflowStep?.route).toBe("/rush-month/actions/member-push");
    expect(workflowPhase?.id).toBe("rush-month-phase-3");
    expect(workflowPhase?.label).toBe("Recruitment");
  });

  it("surfaces due date, assignee, status, and the 30-point detail facts", () => {
    expect(getActionDetailFacts(assignment)).toEqual([
      expect.objectContaining({ label: "Due date", value: "Nov 15" }),
      expect.objectContaining({ label: "Assignee", value: "General Member" }),
      expect.objectContaining({ label: "Status", value: "not started" }),
      expect.objectContaining({ label: "Points", value: "30" }),
    ]);
  });

  it("provides mockup-aligned member detail labels for the member route", () => {
    const workspace = getMemberActionDetailWorkspace(assignment);

    expect(workspace.title).toBe("Invite 3 friends to the Intro GBM");
    expect(workspace.dueLabel).toBe("Due Nov 15");
    expect(workspace.statusLabel).toBe("Not started");
    expect(workspace.pointsApprovalLabel).toBe("30 points if approved");
  });
});

describe("member action detail page", () => {
  it("lets the member action-detail route lead with the mobile task surface only", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action detail page."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    );

    expect(html).toContain("Action Detail");
    expect(html).toMatch(
      /Action Detail<\/p>/,
    );
    expect(html).toContain('role="heading"');
    expect(html).toContain('aria-level="2"');
    expect(html.indexOf("Action Detail")).toBeLessThan(
      html.indexOf("Invite 3 friends to the Intro GBM"),
    );
    expect(html).toContain("Action loop");
    expect(html).toContain("Start the action, capture proof, and submit it when the chapter story is ready to be reviewed.");
    expect(html).toContain("Due");
    expect(html).toContain("Owner");
    expect(html).toContain("Points");
    expect(html).toContain("Scope");
    expect(html).toContain("Submit evidence");
    expect(html).toContain("Evidence preview");
    expect(html).toContain("Submission path");
    expect(html.match(/Evidence Required/g)?.length).toBe(1);
    expect(html.match(/Submit evidence/g)?.length).toBe(1);
    expect(html).not.toContain("Mock-seeded review data");
    expect(html).not.toContain("Submit state");
    expect(html).not.toContain('id="submit-evidence"');
    expect(html).not.toContain("After you submit");
    expect(html).not.toContain("See your proof queue");
    expect(html).not.toContain("Back to all actions");
    expect(html).not.toContain("Action flow");
    expect(html).not.toContain("Member action detail");
    expect(html).not.toContain("Local preview tools");
    expect(html).not.toContain("Review only");
  });

  it("opens the submit-evidence state on the same member action route when the route step asks for it", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action submit state."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({ step: "submit" }),
      }),
    );

    expect(html).toContain("Submit Evidence");
    expect(html).toContain("Back to action details");
    expect(html).toContain('id="submit-evidence"');
    expect(html).toContain(
      'action="/rush-month/actions/member-push?step=submitted#submit-evidence"',
    );
    expect(html).not.toContain("Action Detail");
    expect(html).not.toContain("Why This Matters");
    expect(html).not.toContain("After you submit");
    expect(html).not.toContain("This mirrors the prototype clickthrough");
    expect(html).toContain("Share one clear screenshot, link, or short note.");
    expect(html).toContain(
      "Add one short note below so the screenshot still tells a clear proof story.",
    );
    expect(html).toContain("This action is still worth");
    expect(html).toContain("Points move once the proof is approved.");
    expect(html).not.toContain("Upload stays mock-only here.");
    expect(html).not.toContain("Local confirmation only.");
  });

  it("opens a route-backed submitted state on the same member action route after submit", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action submitted state."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({ step: "submitted" }),
      }),
    );

    expect(html).toContain("Submitted for Review");
    expect(html).toContain("Submitted for review");
    expect(html).toContain("See your proof queue");
    expect(html).toContain("Edit evidence");
    expect(html).toContain("Back to action details");
    expect(html).toContain('href="/rush-month/evidence"');
    expect(html).toContain(
      'href="/rush-month/actions/member-push?step=submit#submit-evidence"',
    );
    expect(html).toContain('href="/rush-month/actions/member-push"');
    expect(html).not.toContain("Action Detail");
    expect(html).not.toContain("Why This Matters");
    expect(html).not.toContain("Submit for review");
  });

  it("preserves event context when the member action route is opened from event detail", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          step: "submit",
          event: "event-rush-social-001",
        }),
      }),
    );

    expect(html).toContain("From event");
    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Back to event detail");
    expect(html).toContain('href="/rush-month/events/event-rush-social-001"');
    expect(html).toContain(
      'href="/rush-month/actions/member-push?event=event-rush-social-001&amp;source=events"',
    );
    expect(html.indexOf("From event")).toBeLessThan(html.indexOf("Submit Evidence"));
  });

  it("keeps the action-detail hero first when home context is attached on the default member route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action home detail handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "home",
        }),
      }),
    );

    expect(html).toContain("Action Detail");
    expect(html).toContain("From home");
    expect(html).toContain(
      "Keep the action tied to the weekly priority you opened from the home route so the member loop still feels like one clear next step.",
    );
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/app"');
    expect(html.indexOf("Action Detail")).toBeLessThan(html.indexOf("From home"));
  });

  it("keeps campaign context attached when the member action route was opened from a campaign event", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action campaign event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-med-talk-001",
          source: "campaigns",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("Intro GBM");
    expect(html).toContain("Back to event detail");
    expect(html).toContain(
      'href="/rush-month/events/event-rush-med-talk-001?source=campaigns"',
    );
    expect(html).toContain(
      'href="/rush-month/actions/member-push?event=event-rush-med-talk-001&amp;source=campaigns"',
    );
  });

  it("keeps home context attached when the member action route was opened from a home event card", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action home event handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-social-001",
          source: "home",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("Tabling at Bruin Walk");
    expect(html).toContain("Back to event detail");
    expect(html).toContain('href="/rush-month/events/event-rush-social-001?source=home"');
    expect(html).toContain(
      'href="/rush-month/actions/member-push?event=event-rush-social-001&amp;source=home"',
    );
  });

  it("preserves points context when the member action route is opened from recognition", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member action points handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );
    const html = renderToStaticMarkup(
      await ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "points",
          step: "submit",
        }),
      }),
    );

    expect(html).toContain("From points");
    expect(html).toContain(
      "You are submitting from the recognition handoff. Keep the proof clear enough that the later review can explain why the points should move.",
    );
    expect(html).toContain("Back to points");
    expect(html).toContain('href="/rush-month/leaderboard"');
    expect(html).toContain('href="/rush-month/actions/member-push?source=points"');
  });
});
