import {
  removePrivateProofUploadAction,
  submitPrivateProofUploadAction,
} from "@/app/proof-library/upload/actions";
import {
  getPrivateProofUploadResultState,
  type PrivateProofUploadResultCode,
} from "@/services/private-proof-upload-result-states";
import type { PrivateProofUploadWorkspace } from "@/services/private-proof-upload-write";

type PrivateProofUploadPanelProps = {
  workspace: PrivateProofUploadWorkspace;
  resultCode?: PrivateProofUploadResultCode;
};

export function PrivateProofUploadPanel({
  workspace,
  resultCode,
}: PrivateProofUploadPanelProps) {
  const resultState = resultCode
    ? getPrivateProofUploadResultState(resultCode)
    : null;

  return (
    <section className="grid gap-4">
      <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/78">
              Local private upload lane
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <UploadStat label="Pending" value={`${workspace.counts.pendingUpload}`} />
            <UploadStat label="Uploaded" value={`${workspace.counts.uploaded}`} />
            <UploadStat label="Removable" value={`${workspace.counts.removable}`} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">Current gate</p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            {workspace.config.reason}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/46">
            Raw proof stays private. Public proof publishing and external sends stay off.
          </p>
        </div>

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
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            File limits
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Only the approved private formats are accepted.
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <UploadStat
              label="Max size"
              value={`${workspace.maxFileSizeMb} MB`}
            />
            <UploadStat
              label="Reads"
              value={workspace.signedInAsSelectedActor ? "signed in" : "preview"}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Allowed file types</p>
            <p className="mt-2 text-sm leading-6 text-white/64">
              {workspace.allowedMimeTypes.join(", ")}
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Consent boundary
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            MEDLIFE review consent is mandatory.
          </h3>
          <ul className="mt-4 grid gap-3">
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/66">
              Private upload only supports HQ review. Nothing becomes public from this step.
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/66">
              Future sharing consent must still be explicitly marked as granted or declined.
            </li>
            <li className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/66">
              Raw files do not flow to n8n, warehouse, Power BI, HubSpot, Luma, email, SMS, or AI.
            </li>
          </ul>
        </article>
      </section>

      {workspace.rows.length > 0 ? (
        <section className="grid gap-4">
          {workspace.rows.map((row) => (
            <article
              key={row.evidenceItemId}
              className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                    {row.chapterName}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {row.assignmentTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {row.summary}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/42">
                    {row.evidenceType} • submitted by {row.submittedBy}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <UploadPill label={row.status} tone="neutral" />
                  <UploadPill label={row.sharingStatus} tone="neutral" />
                  <UploadPill
                    label={row.storagePath ? "private file attached" : "metadata only"}
                    tone={row.storagePath ? "success" : "warning"}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/72">{row.helperText}</p>
                {row.storagePath ? (
                  <p className="mt-2 break-all font-mono text-xs text-white/46">
                    {row.storagePath}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <form
                  action={submitPrivateProofUploadAction}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <input type="hidden" name="evidenceItemId" value={row.evidenceItemId} />
                  <p className="text-sm font-semibold text-white">Attach private file</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    One private raw file per proof row. Public proof stays disabled.
                  </p>

                  <label
                    className="mt-4 block text-sm font-semibold text-white"
                    htmlFor={`proofFile-${row.evidenceItemId}`}
                  >
                    Raw proof file
                  </label>
                  <input
                    id={`proofFile-${row.evidenceItemId}`}
                    name="proofFile"
                    type="file"
                    accept={workspace.allowedMimeTypes.join(",")}
                    className="mt-2 block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-sky-200 file:px-4 file:py-2 file:font-semibold file:text-[#06211d]"
                    disabled={!row.canUpload}
                  />

                  <label
                    className="mt-4 block text-sm font-semibold text-white"
                    htmlFor={`futureSharing-${row.evidenceItemId}`}
                  >
                    Future sharing consent
                  </label>
                  <select
                    id={`futureSharing-${row.evidenceItemId}`}
                    name="consentToFutureSharing"
                    defaultValue="declined"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-white/38"
                    disabled={!row.canUpload}
                  >
                    <option value="declined">Declined</option>
                    <option value="granted">Granted</option>
                  </select>

                  <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-white/72">
                    <input
                      type="checkbox"
                      name="consentToMedlifeReview"
                      value="true"
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
                      disabled={!row.canUpload}
                    />
                    <span>
                      I confirm this file may be stored privately for MEDLIFE review only.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!row.canUpload}
                    className="mt-4 w-full rounded-full bg-sky-200 px-5 py-3 text-sm font-semibold text-[#06211d] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/38"
                  >
                    {row.canUpload ? "Upload private proof locally" : "Upload locked"}
                  </button>
                </form>

                <form
                  action={removePrivateProofUploadAction}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <input type="hidden" name="evidenceItemId" value={row.evidenceItemId} />
                  <p className="text-sm font-semibold text-white">Remove private file</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Use this when the file was attached incorrectly or consent changed.
                  </p>

                  <label
                    className="mt-4 block text-sm font-semibold text-white"
                    htmlFor={`removalReason-${row.evidenceItemId}`}
                  >
                    Removal reason
                  </label>
                  <textarea
                    id={`removalReason-${row.evidenceItemId}`}
                    name="removalReason"
                    className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-white/34 disabled:cursor-not-allowed disabled:text-white/38"
                    placeholder="Explain why the private file should be removed."
                    disabled={!row.canRemove}
                  />

                  <button
                    type="submit"
                    disabled={!row.canRemove}
                    className="mt-4 w-full rounded-full border border-rose-300/30 bg-rose-300/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/12 disabled:text-white/38"
                  >
                    {row.canRemove ? "Remove private file locally" : "Removal locked"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
            Upload queue
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {workspace.emptyStateTitle}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            {workspace.emptyStateMessage}
          </p>
        </section>
      )}
    </section>
  );
}

function UploadStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function UploadPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={[
        "rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "success"
          ? "border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
          : tone === "warning"
            ? "border-amber-300/30 bg-amber-300/12 text-amber-100"
            : "border-white/10 bg-black/20 text-white/68",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
