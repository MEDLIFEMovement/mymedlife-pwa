import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
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

function getSignedInActor(email: string) {
  return getMockLocalActorContext(
    email,
    "Using signed-in test actor.",
    "mock_fallback",
    "local_auth_session",
    "signed_in",
  );
}

describe("proof library routes", () => {
  beforeEach(async () => {
    const dataModule = await import("@/services/read-only-app-data");
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Using TEST proof fixtures."),
    );
  });

  it("renders the private upload route with explicit publishing and export guards", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("member.a@mymedlife.test"),
    );

    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");
    const html = renderToStaticMarkup(await ProofLibraryUploadPage({}));

    expect(html).toContain("Private proof upload");
    expect(html).toContain("Attach source media for private MEDLIFE review");
    expect(html).toContain("Uploads locked");
    expect(html).toContain("No public publishing");
    expect(html).toContain("No external exports");
    expect(html).toContain("MEDLIFE review consent is mandatory");
  });

  it("renders HQ proof posture for admin reviewers without enabling sharing", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("HQ proof-sharing review");
    expect(html).toContain("Open HQ review posture");
    expect(html).toContain("Publish now: no");
    expect(html).toContain("No public proof page, warehouse export, n8n workflow, HubSpot, or Luma write happens.");
  });

  it("labels the production private upload lane as live without widening publishing claims", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "production_supabase");
    vi.stubEnv("MYMEDLIFE_ENABLE_PRIVATE_PROOF_UPLOAD_WRITE", "true");
    vi.stubEnv("MYMEDLIFE_ALLOW_PRODUCTION_PRIVATE_PROOF_UPLOAD_WRITE", "true");

    const actorModule = await import("@/services/local-actor-context");
    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Mixed live / TEST preview");
    expect(html).toContain("Manage private proof uploads");
    expect(html).toContain("Public publishing and external exports stay off.");
    expect(html).toContain("No publish");

    vi.unstubAllEnvs();
  });

  it("renders only app-owned proof records in hosted mode", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const data = getMockReadOnlyAppData("test");
    const assignment = {
      ...data.assignments[0],
      id: "assignment-live-1",
      title: "Host Persisted Proof Night",
    };

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_ready",
        message: "Persisted proof data loaded.",
      },
      assignments: [assignment],
      evidenceItems: [
        {
          id: "evidence-live-1",
          assignmentId: assignment.id,
          submittedBy: "Persisted Member",
          evidenceType: "testimonial_text",
          summary: "A persisted member reflection.",
          status: "pending_review",
        },
      ],
      evidenceItemRows: [
        {
          id: "evidence-live-1",
          assignment_id: assignment.id,
          chapter_id: data.chapter.id,
          chapter_event_id: null,
          submitted_by_user_id: "member-live-1",
          evidence_type: "testimonial_text",
          summary: "A persisted member reflection.",
          url: null,
          storage_path: null,
          target_audiences: ["chapter leaders"],
          proof_categories: [],
          messenger_type: null,
          lifecycle_stage: null,
          hesitation_addressed: "I did not know how to join.",
          status: "pending_review",
          sharing_status: "in_hq_review",
          nps_score: null,
          activity_label: "Persisted Proof Night",
          submitted_at: "2026-07-23T12:00:00Z",
          created_at: "2026-07-23T12:00:00Z",
          updated_at: "2026-07-23T12:00:00Z",
        },
      ],
    });

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("App-owned readback");
    expect(html).toContain("Host Persisted Proof Night");
    expect(html).toContain("Persisted Proof Night");
    expect(html).not.toContain("Tabling at Bruin Walk");
  });

  it("does not substitute TEST proof rows when hosted data is unavailable", async () => {
    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const data = getMockReadOnlyAppData("test");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("admin@mymedlife.test"),
    );
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue({
      ...data,
      source: {
        mode: "supabase",
        status: "supabase_error",
        message: "Operational data could not be read.",
      },
      assignments: [],
      evidenceItems: [],
      evidenceItemRows: [],
    });

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const html = renderToStaticMarkup(await ProofLibraryPage());

    expect(html).toContain("Operational data unavailable");
    expect(html).toContain("No visible app-owned assignment");
    expect(html).toContain("No TEST assignment has been substituted.");
    expect(html).not.toContain("Tabling at Bruin Walk");
  });

  it("keeps DS Admin out of student proof routes", async () => {
    const actorModule = await import("@/services/local-actor-context");

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(
      getSignedInActor("ds.admin@mymedlife.test"),
    );

    const { default: ProofLibraryPage } = await import("@/app/proof-library/page");
    const { default: ProofLibraryUploadPage } = await import("@/app/proof-library/upload/page");

    await expect(ProofLibraryPage()).rejects.toThrow("NEXT_REDIRECT:/admin");
    await expect(ProofLibraryUploadPage({})).rejects.toThrow("NEXT_REDIRECT:/admin");
  });
});
