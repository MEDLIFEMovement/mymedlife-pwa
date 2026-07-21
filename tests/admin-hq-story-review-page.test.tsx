import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/hq-proof-write",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/app/login/actions", () => ({
  signOut: async () => undefined,
}));

vi.mock("@/services/local-actor-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/local-actor-context")>();
  return { ...actual, getLocalActorContext: vi.fn() };
});

vi.mock("@/services/read-only-app-data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/read-only-app-data")>();
  return { ...actual, getReadOnlyAppData: vi.fn() };
});

vi.mock("@/services/private-proof-upload-workspace", () => ({
  getPrivateProofUploadWorkspace: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("admin HQ story review page", () => {
  it("renders a real production decision form for pending source-backed proof", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "production_supabase");
    vi.stubEnv("MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE", "true");
    vi.stubEnv("MYMEDLIFE_ALLOW_PRODUCTION_HQ_PROOF_DECISION_WRITE", "true");

    const actorModule = await import("@/services/local-actor-context");
    const dataModule = await import("@/services/read-only-app-data");
    const workspaceModule = await import("@/services/private-proof-upload-workspace");
    const actor = getMockLocalActorContext(
      "admin@mymedlife.test",
      "Signed in to production Supabase.",
      "supabase_ready",
      "local_auth_session",
      "signed_in",
    );

    vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
    vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
      getMockReadOnlyAppData("Testing production story moderation."),
    );
    vi.mocked(workspaceModule.getPrivateProofUploadWorkspace).mockResolvedValue({
      sourceMode: "supabase",
      title: "Private proof upload queue",
      summary: "Source-backed queue.",
      config: {
        enabled: true,
        environment: "production",
        isLocalOnly: false,
        uploadsEnabled: true,
        publicPublishingEnabled: false,
        externalWritesEnabled: false,
        reason: "Production upload enabled.",
        bucket: "proof-submissions-private",
      },
      rows: [
        {
          evidenceItemId: "00000000-0000-4000-8000-000000000101",
          assignmentId: "00000000-0000-4000-8000-000000000102",
          assignmentTitle: "TEST Event photo follow-up",
          chapterName: "TEST Boston University",
          submittedBy: "TEST Member Sam",
          submittedByUserId: "00000000-0000-4000-8000-000000000103",
          evidenceType: "event_photo",
          summary: "TEST member uploaded a real private event photo for review.",
          status: "pending_review",
          sharingStatus: "in_hq_review",
          storagePath:
            "chapters/00000000-0000-4000-8000-000000000104/evidence/00000000-0000-4000-8000-000000000101/story.jpg",
          canUpload: false,
          canRemove: true,
          helperText: "HQ may review this private upload.",
        },
      ],
      counts: { pendingUpload: 0, uploaded: 1, removable: 1 },
      emptyStateTitle: "No pending uploads",
      emptyStateMessage: "Nothing is waiting.",
      allowedMimeTypes: ["image/jpeg"],
      maxFileSizeMb: 500,
      signedInAsSelectedActor: true,
    });

    const { default: AdminHqStoryReviewPage } = await import(
      "@/app/admin/hq-proof-write/page"
    );
    const html = renderToStaticMarkup(
      await AdminHqStoryReviewPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Review submitted proof for member stories");
    expect(html).toContain("TEST Event photo follow-up");
    expect(html).toContain("Private media attached");
    expect(html).toContain("Approve for member story feed");
    expect(html).toContain("Save HQ decision");
    expect(html).toContain('value="/admin/hq-proof-write"');
    expect(html).not.toContain("HQ decision locked");
  });
});
