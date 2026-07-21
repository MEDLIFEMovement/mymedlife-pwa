import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { HqProofDecisionVerificationPanel } from "@/components/hq-proof-decision-verification-panel";
import { HqProofDecisionServerActionPanel } from "@/components/hq-proof-decision-server-action-panel";
import { RestrictedState } from "@/components/restricted-state";
import { getHqProofDecisionPacket } from "@/services/hq-proof-decision-verification-packet";
import {
  getHqProofDecisionResultStates,
  type HqProofDecisionResultCode,
} from "@/services/hq-proof-decision-result-states";
import {
  getHqProofDecisionWriteConfig,
  getHqProofDecisionWriteReadiness,
} from "@/services/hq-proof-decision-write";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getPrivateProofUploadWorkspace } from "@/services/private-proof-upload-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import type { EvidenceItem } from "@/shared/types/domain";

export const metadata = getStaticRouteMetadata("adminHqProofWrite");
export const dynamic = "force-dynamic";

export default async function HqProofWritePage({
  searchParams,
}: {
  searchParams?: Promise<{ hqDecisionResult?: string; evidenceItemId?: string }>;
}) {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const uploadWorkspace = await getPrivateProofUploadWorkspace(actor);
  const packet = getHqProofDecisionPacket(actor, data);
  const writeConfig = getHqProofDecisionWriteConfig();
  const query = searchParams ? await searchParams : undefined;
  const resultCode = getHqProofDecisionResultStates().some(
    (state) => state.code === query?.hqDecisionResult,
  )
    ? (query?.hqDecisionResult as HqProofDecisionResultCode)
    : undefined;
  const pendingRows = uploadWorkspace.rows.filter(
    (row) =>
      (row.status === "pending_review" || row.status === "changes_requested") &&
      (row.sharingStatus === "submitted" || row.sharingStatus === "in_hq_review"),
  );

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      {packet.canReadPacket ? (
        <div className="grid gap-6">
          <section className="app-surface p-5 sm:p-6">
            <p className="app-eyebrow app-eyebrow-blue">Operational review queue</p>
            <h1 className="app-title mt-2">Review submitted proof for member stories</h1>
            <p className="app-copy mt-3 max-w-4xl">
              Admin and Super Admin reviewers can approve an item for the signed-in member
              story feed, request better context, or keep it internal. Raw uploads remain
              private, and no public publishing or external send occurs here.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                {pendingRows.length} awaiting decision
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                {uploadWorkspace.counts.uploaded} private files attached
              </span>
            </div>
          </section>

          {pendingRows.length > 0 ? (
            pendingRows.map((row) => {
              const evidenceItem: EvidenceItem = {
                id: row.evidenceItemId,
                assignmentId: row.assignmentId ?? row.evidenceItemId,
                submittedBy: row.submittedBy,
                evidenceType: row.evidenceType,
                summary: row.summary,
                status: row.status,
                storagePath: row.storagePath,
              };
              const defaultInput = {
                decision: "approved" as const,
                note: `Reviewed by HQ for the authenticated member story feed: ${row.chapterName}.`,
              };

              return (
                <article key={row.evidenceItemId} className="grid gap-3">
                  <div className="app-surface p-5">
                    <p className="app-eyebrow app-eyebrow-slate">{row.chapterName}</p>
                    <h2 className="app-subtitle mt-2">{row.assignmentTitle}</h2>
                    <p className="app-copy mt-2">{row.summary}</p>
                    <p className="mt-3 text-sm text-slate-600">
                      {row.evidenceType.replaceAll("_", " ")} submitted by {row.submittedBy}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.storagePath ? "Private media attached" : "Metadata only"}
                    </p>
                  </div>
                  <HqProofDecisionServerActionPanel
                    evidenceItem={evidenceItem}
                    readiness={getHqProofDecisionWriteReadiness(
                      actor,
                      evidenceItem,
                      defaultInput,
                    )}
                    resultCode={
                      query?.evidenceItemId === row.evidenceItemId ? resultCode : undefined
                    }
                    defaultInput={defaultInput}
                    returnTo="/admin/hq-proof-write"
                  />
                </article>
              );
            })
          ) : (
            <section className="app-surface p-6">
              <h2 className="app-subtitle">No submitted proof is awaiting an HQ decision.</h2>
              <p className="app-copy mt-2">
                Approved, rejected, and archived items stay out of this action queue.
              </p>
            </section>
          )}

          {writeConfig.environment === "local" ? (
            <details className="app-surface p-5">
              <summary className="cursor-pointer font-semibold text-slate-800">
                Local verification and audit packet
              </summary>
              <div className="mt-5">
                <HqProofDecisionVerificationPanel packet={packet} />
              </div>
            </details>
          ) : null}
        </div>
      ) : (
        <RestrictedState
          title="HQ proof decision activation is hidden for this role."
          message="Students, chapter leaders, and coaches should use their operating routes. HQ proof decision activation is for Admin, DS Admin, and Super Admin review contexts."
          nextHref="/rush-month"
          nextLabel="Back to Rush Month"
        />
      )}
    </AppShell>
  );
}
