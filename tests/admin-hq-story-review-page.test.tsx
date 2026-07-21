import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import { HqProofDecisionServerActionPanel } from "@/components/hq-proof-decision-server-action-panel";
import type { HqProofDecisionWriteReadiness } from "@/services/hq-proof-decision-write";
import type {
  PrivateProofUploadQueueRow,
  PrivateProofUploadWorkspace,
} from "@/services/private-proof-upload-write";
import type { LocalActorContext } from "@/services/local-actor-context";

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
        searchParams: Promise.resolve({
          hqDecisionResult: "sharing_approved",
          evidenceItemId: "00000000-0000-4000-8000-000000000101",
        }),
      }),
    );

    expect(html).toContain("Review submitted proof for member stories");
    expect(html).toContain("TEST Event photo follow-up");
    expect(html).toContain("Private media attached");
    expect(html).toContain("Approve for member story feed");
    expect(html).toContain("Approved for the member story feed");
    expect(html).toContain("Save HQ decision");
    expect(html).toContain('value="/admin/hq-proof-write"');
    expect(html).not.toContain("HQ decision locked");
  });

  it("renders the empty queue when no eligible proof survives the filter", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "production_supabase");
    const actor = makeAdminActor("production");
    await mockPageDependencies(
      actor,
      makeWorkspace([makeQueueRow({ status: "approved" })], "production"),
    );

    const { default: AdminHqStoryReviewPage } = await import(
      "@/app/admin/hq-proof-write/page"
    );
    const html = renderToStaticMarkup(await AdminHqStoryReviewPage({}));

    expect(html).toContain("No submitted proof is awaiting an HQ decision.");
    expect(html).not.toContain("Local verification and audit packet");
  });

  it("renders metadata-only local proof and the local audit packet", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "local_supabase");
    vi.stubEnv("MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES", "true");
    vi.stubEnv("MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE", "true");
    const actor = makeAdminActor("local");
    await mockPageDependencies(
      actor,
      makeWorkspace(
        [makeQueueRow({ assignmentId: null, storagePath: null })],
        "local",
      ),
    );

    const { default: AdminHqStoryReviewPage } = await import(
      "@/app/admin/hq-proof-write/page"
    );
    const html = renderToStaticMarkup(
      await AdminHqStoryReviewPage({
        searchParams: Promise.resolve({ hqDecisionResult: "not-a-result" }),
      }),
    );

    expect(html).toContain("Metadata only");
    expect(html).toContain("Local verification and audit packet");
  });

  it("keeps the moderation queue hidden from chapter leaders", async () => {
    vi.stubEnv("MYMEDLIFE_AUTH_MODE", "production_supabase");
    const actor = getMockLocalActorContext(
      "leader.a@mymedlife.test",
      "Signed in to production Supabase.",
      "supabase_ready",
      "local_auth_session",
      "signed_in",
    );
    await mockPageDependencies(actor, makeWorkspace([], "production"));

    const { default: AdminHqStoryReviewPage } = await import(
      "@/app/admin/hq-proof-write/page"
    );
    const html = renderToStaticMarkup(await AdminHqStoryReviewPage({}));

    expect(html).toContain("HQ proof decision activation is hidden for this role.");
  });

  it("keeps the legacy review route as the panel default return path", () => {
    const readiness: HqProofDecisionWriteReadiness = {
      operation: "hq_sharing_decision",
      canSubmit: false,
      resultCodeIfSubmitted: "write_disabled",
      reason: "Write remains locked.",
      checks: [],
    };
    const html = renderToStaticMarkup(
      HqProofDecisionServerActionPanel({
        evidenceItem: {
          id: "00000000-0000-4000-8000-000000000101",
          assignmentId: "00000000-0000-4000-8000-000000000102",
          submittedBy: "TEST Member",
          evidenceType: "testimonial_text",
          summary: "TEST proof summary",
          status: "pending_review",
        },
        readiness,
        defaultInput: {
          decision: "changes_requested",
          note: "Request a clearer TEST explanation before approval.",
        },
      }),
    );

    expect(html).toContain('value="/rush-month/review"');
    expect(html).toContain("HQ decision locked");
  });
});

function makeAdminActor(environment: "local" | "production") {
  return getMockLocalActorContext(
    "admin@mymedlife.test",
    environment === "production"
      ? "Signed in to production Supabase."
      : "Signed in to local Supabase.",
    "supabase_ready",
    "local_auth_session",
    "signed_in",
  );
}

async function mockPageDependencies(
  actor: LocalActorContext,
  workspace: PrivateProofUploadWorkspace,
) {
  const actorModule = await import("@/services/local-actor-context");
  const dataModule = await import("@/services/read-only-app-data");
  const workspaceModule = await import("@/services/private-proof-upload-workspace");

  vi.mocked(actorModule.getLocalActorContext).mockResolvedValue(actor);
  vi.mocked(dataModule.getReadOnlyAppData).mockResolvedValue(
    getMockReadOnlyAppData("Testing HQ story moderation branches."),
  );
  vi.mocked(workspaceModule.getPrivateProofUploadWorkspace).mockResolvedValue(workspace);
}

function makeWorkspace(
  rows: PrivateProofUploadQueueRow[],
  environment: "local" | "production",
): PrivateProofUploadWorkspace {
  return {
    sourceMode: "supabase",
    title: "Private proof upload queue",
    summary: "Source-backed queue.",
    config: {
      enabled: true,
      environment,
      isLocalOnly: environment === "local",
      uploadsEnabled: true,
      publicPublishingEnabled: false,
      externalWritesEnabled: false,
      reason: "Private proof upload enabled.",
      bucket: "proof-submissions-private",
    },
    rows,
    counts: {
      pendingUpload: 0,
      uploaded: rows.filter((row) => row.storagePath).length,
      removable: rows.filter((row) => row.canRemove).length,
    },
    emptyStateTitle: "No pending uploads",
    emptyStateMessage: "Nothing is waiting.",
    allowedMimeTypes: ["image/jpeg"],
    maxFileSizeMb: 500,
    signedInAsSelectedActor: true,
  };
}

function makeQueueRow(
  overrides: Partial<PrivateProofUploadQueueRow> = {},
): PrivateProofUploadQueueRow {
  return {
    evidenceItemId: "00000000-0000-4000-8000-000000000101",
    assignmentId: "00000000-0000-4000-8000-000000000102",
    assignmentTitle: "TEST Event photo follow-up",
    chapterName: "TEST Boston University",
    submittedBy: "TEST Member Sam",
    submittedByUserId: "00000000-0000-4000-8000-000000000103",
    evidenceType: "event_photo",
    summary: "TEST member submitted proof for review.",
    status: "pending_review",
    sharingStatus: "in_hq_review",
    storagePath:
      "chapters/00000000-0000-4000-8000-000000000104/evidence/00000000-0000-4000-8000-000000000101/story.jpg",
    canUpload: false,
    canRemove: true,
    helperText: "HQ may review this private upload.",
    ...overrides,
  };
}
