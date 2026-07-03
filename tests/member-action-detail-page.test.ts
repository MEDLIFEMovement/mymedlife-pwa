import { describe, expect, it, vi } from "vitest";
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
  it("returns members to the member events lane by default", async () => {
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
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/events");
  });

  it("returns event-context member requests to the specific event detail route", async () => {
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
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          event: "event-rush-social-001",
          source: "home",
          step: "submit",
        }),
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/app/events/event-rush-social-001?source=home",
    );
  });

  it("returns proof and points handoffs to the leaderboard lane", async () => {
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
    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "points",
          step: "submit",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "evidence",
          step: "submitted",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/app/points?source=points");
  });

  it("returns profile-origin requests to the member profile route", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getMockLocalActorContext("member.a@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing member profile action handoff."),
    );

    const { default: ActionDetailPage } = await import(
      "@/app/rush-month/actions/[assignmentId]/page"
    );

    await expect(
      ActionDetailPage({
        params: Promise.resolve({ assignmentId: "member-push" }),
        searchParams: Promise.resolve({
          source: "profile",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/profile");
  });
});
