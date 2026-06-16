import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LocalActorNotice } from "@/components/local-actor-notice";
import { LocalRoleSwitcher } from "@/components/local-role-switcher";
import { RestrictedState } from "@/components/restricted-state";
import { assignments, evidenceItems } from "@/data/mock-rush-month";
import { getReviewQueueForActor } from "@/services/local-action-contracts";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canReadAssignment } from "@/services/role-visibility";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const actor = await getLocalActorContext();
  const visibleAssignmentIds = new Set(
    assignments
      .filter((assignment) => canReadAssignment(actor, assignment))
      .map((assignment) => assignment.id),
  );
  const hqQueue = getReviewQueueForActor(actor, evidenceItems);
  const visibleEvidence =
    hqQueue.length > 0
      ? hqQueue
      : evidenceItems.filter((item) => visibleAssignmentIds.has(item.assignmentId));

  return (
    <AppShell actor={actor}>
      <LocalActorNotice actor={actor} />
      <LocalRoleSwitcher actor={actor} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
          Evidence
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Mock proof and testimonials</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
          Proof is a testimonial, bridge video, event note, or other experience
          artifact. HQ decides what should be shared broadly; chapter leaders can
          track follow-up but do not own broad proof-sharing decisions.
        </p>
      </section>

      {visibleEvidence.length > 0 ? (
        <section className="grid gap-3">
          {visibleEvidence.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-emerald-100/70">{item.evidenceType}</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{item.summary}</h2>
                  <p className="mt-2 text-sm text-white/62">Submitted by {item.submittedBy}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                  {item.status}
                </span>
              </div>
              <Link
                href={`/rush-month/actions/${item.assignmentId}`}
                className="mt-4 inline-flex text-sm font-semibold text-emerald-100"
              >
                Open linked action
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <RestrictedState
          title="No proof rows are visible to this role."
          message="DS Admin and unrelated local contexts should not see student proof/testimonials. Use the local role switcher to preview member, leader, coach, admin, or super admin views."
        />
      )}
    </AppShell>
  );
}
