import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionProofHandoffPanel } from "@/components/action-proof-handoff-panel";
import { MemberProofStatusPanel } from "@/components/member-proof-status-panel";
import { ProofSharingReviewPanel } from "@/components/proof-sharing-review-panel";
import { getActionProofHandoffWorkspace } from "@/services/action-proof-handoff";
import { getLandingRouteForActor } from "@/services/landing-route";
import { buildLoginRedirectHref, shouldRedirectActorToLogin } from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getMemberProofStatusWorkspace } from "@/services/member-proof-status";
import { getPrivateProofUploadWriteConfig } from "@/services/private-proof-upload-write";
import { getAppOwnedProofLibraryItems } from "@/services/proof-library-readback";
import { getProofSharingReviewBoard } from "@/services/proof-sharing-review";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAssignment, getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("proofLibrary");
export const dynamic = "force-dynamic";

export default async function ProofLibraryPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/proof-library"));
  }

  const surfaceFamily = getActorSurfaceFamily(actor);

  if (surfaceFamily === "ds_admin") {
    redirect(getLandingRouteForActor(actor));
  }

  const data = await getReadOnlyAppData(
    surfaceFamily === "member" || surfaceFamily === "leader"
      ? { actorUserId: actor.user.id }
      : {},
  );
  const usesAppOwnedReadback = data.source.mode === "supabase";
  const proofStatus = getMemberProofStatusWorkspace(
    actor,
    data.assignments,
    data.evidenceItems,
  );
  const proofBoard = getProofSharingReviewBoard(
    actor,
    usesAppOwnedReadback ? getAppOwnedProofLibraryItems(data) : undefined,
  );
  const representativeAssignment = data.assignments.find((assignment) =>
    canReadAssignment(actor, assignment),
  );
  const handoff = representativeAssignment
    ? getActionProofHandoffWorkspace(actor, representativeAssignment)
    : null;
  const backHref = getLandingRouteForActor(actor);
  const privateUploadEnabled = getPrivateProofUploadWriteConfig().enabled;
  const quickLinks = getQuickLinks(actor, privateUploadEnabled);
  const sourceLabel = getSourceLabel(data, privateUploadEnabled);
  const sourceSummary = getSourceSummary(data, privateUploadEnabled);

  return (
    <main
      className="min-h-screen bg-[#08131f] px-4 py-8 text-white sm:px-6"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href={backHref}
          className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/72"
        >
          Back to workspace
        </Link>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-black/20 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                Proof library
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Review stories, proof posture, and blocked sharing lanes
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64">
                {sourceSummary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                {sourceLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No publish
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/62">
                No provider sync
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4"
            >
              <p className="text-sm font-semibold text-white">{link.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{link.detail}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-6">
          {handoff ? (
            <ActionProofHandoffPanel workspace={handoff} />
          ) : (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">
                No visible app-owned assignment
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/64">
                There is no assignment available for this role and chapter. No
                TEST assignment has been substituted.
              </p>
            </section>
          )}
          <MemberProofStatusPanel workspace={proofStatus} />
          <ProofSharingReviewPanel board={proofBoard} />
        </div>
      </div>
    </main>
  );
}

function getSourceLabel(
  data: Awaited<ReturnType<typeof getReadOnlyAppData>>,
  privateUploadEnabled: boolean,
) {
  if (data.source.mode === "mock") {
    return privateUploadEnabled ? "Mixed live / TEST preview" : "TEST preview";
  }

  if (data.source.status !== "supabase_ready") {
    return "Operational data unavailable";
  }

  return privateUploadEnabled ? "App-owned / private upload" : "App-owned readback";
}

function getSourceSummary(
  data: Awaited<ReturnType<typeof getReadOnlyAppData>>,
  privateUploadEnabled: boolean,
) {
  if (data.source.mode === "supabase" && data.source.status !== "supabase_ready") {
    return "Operational proof data is unavailable for this signed-in account. The page stays empty rather than substituting TEST assignments or evidence.";
  }

  if (data.source.mode === "supabase") {
    return privateUploadEnabled
      ? "Private source-media upload and removal are live for authenticated eligible roles. Proof status and review posture come from app-owned records, while public publishing, provider sync, automation, and rollout evidence claims remain blocked."
      : "Proof status, consent posture, and HQ review context come from app-owned records. Public proof, provider sync, automation, and production evidence claims stay blocked.";
  }

  return privateUploadEnabled
    ? "Private source-media upload and removal are live for authenticated eligible roles. The remaining review panels stay TEST-backed and preview-safe, while public publishing, provider sync, automation, and rollout evidence claims remain blocked."
    : "This route stays TEST-backed and preview-safe. Story review, proof context, consent posture, and future sharing notes remain visible, while public proof, provider sync, automation, and production evidence claims stay blocked.";
}

function getQuickLinks(
  actor: Awaited<ReturnType<typeof getLocalActorContext>>,
  privateUploadEnabled: boolean,
) {
  if (getActorSurfaceFamily(actor) === "member") {
    return [
      {
        href: "/app/stories",
        label: "Open member stories",
        detail: "Review the member feed without turning on public publishing or social sync.",
      },
      {
        href: "/proof-library/upload",
        label: privateUploadEnabled
          ? "Upload private proof"
          : "Preview proof upload requirements",
        detail: privateUploadEnabled
          ? "Attach approved source media for private MEDLIFE review. Public publishing and external exports stay off."
          : "Inspect consent, storage, and blocked upload controls before any write lane exists.",
      },
      {
        href: "/rush-month/events",
        label: "Return to event loop",
        detail: "Keep RSVP, attendance, proof prompts, and points context route-backed together.",
      },
    ];
  }

  return [
    {
      href: "/rush-month/review",
      label: "Open HQ review posture",
      detail: "Keep review and moderation visible without enabling publish, export, or decision writes.",
    },
    {
      href: "/proof-library/upload",
      label: privateUploadEnabled
        ? "Manage private proof uploads"
        : "Preview proof upload requirements",
      detail: privateUploadEnabled
        ? "Inspect or remove private source media within the authenticated role boundary. Public publishing and external exports stay off."
        : "Inspect storage and consent posture without enabling raw proof upload or provider reads.",
    },
    {
      href: "/campaigns/rush-month",
      label: "Return to campaign closeout",
      detail: "Keep proof posture attached to the Campaigns / Rush Month review flow.",
    },
  ];
}
