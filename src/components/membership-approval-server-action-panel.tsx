import { submitMembershipApprovalAction } from "@/app/chapter/members/actions";
import type {
  ChapterJoinRequest,
  ChapterMemberRow,
  MembershipApprovalPacket,
} from "@/services/chapter-membership-workspace";
import {
  getMembershipApprovalResultState,
  type MembershipApprovalResultCode,
} from "@/services/membership-approval-result-states";
import { getMembershipApprovalReadbackState } from "@/services/membership-approval-write";

type MembershipApprovalServerActionPanelProps = {
  packet: MembershipApprovalPacket | null;
  members: readonly ChapterMemberRow[];
  joinRequests: readonly ChapterJoinRequest[];
  resultCode?: MembershipApprovalResultCode;
  applicantEmail?: string;
  joinRequestId?: string;
};

export function MembershipApprovalServerActionPanel({
  packet,
  members,
  joinRequests,
  resultCode,
  applicantEmail,
  joinRequestId,
}: MembershipApprovalServerActionPanelProps) {
  const resultState = resultCode
    ? getMembershipApprovalResultState(resultCode)
    : null;
  const readbackState = getMembershipApprovalReadbackState(
    members,
    joinRequests,
    resultCode,
    applicantEmail ?? packet?.applicantEmail,
    joinRequestId ?? packet?.joinRequestId,
  );
  const buttonLabel = packet?.writeReadiness.canSubmit
    ? "Approve membership locally"
    : "Membership approval locked";

  if (!packet && !resultState) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
        Local membership approval
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        {packet?.writeReadiness.canSubmit
          ? "This join request can be approved in local Supabase."
          : "Membership approval is still safely gated."}
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/68">
        {packet?.writeReadiness.reason ??
          "This panel is showing the most recent membership approval result and safe readback."}
      </p>

      {resultState ? (
        <div
          className={[
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            resultState.tone === "success"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : resultState.tone === "warning"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : resultState.tone === "error"
                  ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
                  : "border-sky-300/30 bg-sky-300/10 text-sky-100",
          ].join(" ")}
          role="status"
        >
          <p className="font-semibold">{resultState.title}</p>
          <p className="mt-1">{resultState.plainEnglishMessage}</p>
        </div>
      ) : null}

      {readbackState ? (
        <div
          className={[
            "mt-3 rounded-2xl border px-4 py-3 text-sm leading-6",
            readbackState.tone === "success"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : readbackState.tone === "warning"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-white/10 bg-black/18 text-white/68",
          ].join(" ")}
        >
          <p className="font-semibold">Local readback</p>
          <p className="mt-1">{readbackState.message}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-75">
            Membership: {readbackState.currentMembershipStatus.replaceAll("_", " ")} · Join
            request {readbackState.joinRequestStillVisible ? "still visible" : "cleared"}
          </p>
        </div>
      ) : null}

      {packet ? (
        <>
          <form action={submitMembershipApprovalAction} className="mt-5 space-y-4">
            <input type="hidden" name="chapterId" value={packet.payload.chapterId} />
            <input type="hidden" name="joinRequestId" value={packet.payload.joinRequestId} />
            <input type="hidden" name="applicantEmail" value={packet.payload.applicantEmail} />
            <input
              type="hidden"
              name="requestedRoleKey"
              value={packet.payload.requestedRoleKey}
            />
            <input type="hidden" name="returnTo" value={packet.targetRoute} />

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-4 sm:grid-cols-2">
              <Field label="Applicant" value={packet.applicantName} />
              <Field label="Requested role" value={packet.requestedRoleLabel} />
              <Field label="Email" value={packet.applicantEmail} />
              <Field label="Committee lane" value={packet.payload.requestedCommitteeLane} />
            </div>

            <label className="block text-sm font-semibold text-white" htmlFor="membershipAuditReason">
              Approval reason
            </label>
            <textarea
              id="membershipAuditReason"
              name="auditReason"
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
              defaultValue={packet.payload.auditReason}
              disabled={!packet.writeReadiness.canSubmit}
            />

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/18 p-4 text-sm leading-6 text-white/72">
              <input
                type="checkbox"
                name="accuracyConfirmed"
                value="yes"
                defaultChecked
                disabled={!packet.writeReadiness.canSubmit}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
              />
              <span>
                I confirmed this join request belongs to the right chapter and the role is
                accurate for local approval testing.
              </span>
            </label>

            <button
              type="submit"
              disabled={!packet.writeReadiness.canSubmit}
              className="w-full rounded-full bg-emerald-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38 sm:w-auto"
            >
              {buttonLabel}
            </button>
          </form>

          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {packet.writeReadiness.checks.map((check) => (
              <div
                key={check.key}
                className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  {check.passed ? "Ready" : "Blocked"}
                </p>
                <p className="mt-1 text-sm text-white/72">{check.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/78">{value}</p>
    </div>
  );
}
