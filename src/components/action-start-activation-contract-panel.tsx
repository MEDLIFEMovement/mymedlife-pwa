import type {
  ActionStartActivationContract,
  DisabledActionStartActivationAttempt,
} from "@/services/action-start-activation-contract";

type ActionStartActivationContractPanelProps = {
  contract: ActionStartActivationContract;
  attempt: DisabledActionStartActivationAttempt;
};

export function ActionStartActivationContractPanel({
  contract,
  attempt,
}: ActionStartActivationContractPanelProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
        Action-start activation contract
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Future save path is specified, but still disabled.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        This is the contract for the first recommended browser write. It
        documents what the client may send, what the server must derive, and
        why the current attempt still returns a disabled result.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Future server action</p>
          <p className="mt-2 font-mono text-xs text-[var(--mymedlife-badge-background)]/80">
            {contract.serverActionName}
            {" -> "}
            {contract.localFunction}
          </p>
          <p className="mt-2 text-xs leading-5 text-white/58">
            Route: {contract.route}. Browser control enabled now?{" "}
            {contract.browserControlEnabled ? "yes" : "no"}.
          </p>
          <p className="mt-2 text-xs leading-5 text-white/54">
            {contract.serverIdentityRule}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
          <p className="text-sm font-semibold text-white">Disabled attempt now</p>
          <p className="mt-2 text-xs leading-5 text-white/58">
            Request: assignmentId = {attempt.request.assignmentId}.
          </p>
          <p className="mt-2 text-xs leading-5 text-white/58">
            Result: {attempt.success ? "enabled" : "disabled"}. Future tables:
            {" "}
            {attempt.wouldWriteTables.join(" -> ")}.
          </p>
          <p className="mt-2 text-xs leading-5 text-white/54">{attempt.reason}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--mymedlife-border)]/40 p-3">
        <p className="text-sm font-semibold text-white">Required before save button</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {contract.approvalRequirements.map((requirement) => (
            <p key={requirement} className="rounded-xl bg-white/[0.05] p-3 text-xs leading-5 text-white/58">
              {requirement}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
