import type {
  AdminAuditPreflightItem,
  AdminAuditPreflightStatus,
  AdminAuditLogPosture,
  AdminAuditLogReview,
  AdminAuditLogReviewRow,
} from "@/services/admin-audit-log-review";

type AdminAuditLogReviewPanelProps = {
  review: AdminAuditLogReview;
};

export function AdminAuditLogReviewPanel({
  review,
}: AdminAuditLogReviewPanelProps) {
  if (!review.canReadReview) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-violet-300/20 bg-violet-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-100/80">
            Audit log review
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{review.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {review.summary}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Rows" value={`${review.counts.visibleRows}`} />
          <MiniStat label="Writes" value={`${review.counts.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${review.counts.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill posture={review.posture} />
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
          Source {review.sourceLabel}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
          Secrets {review.counts.secretsShown}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
          Hidden rows {review.counts.hiddenRows}
        </span>
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        This review route shows audit posture and readback evidence only. Audit
        edits, exports, retention changes, secret reveals, and production write
        approvals remain blocked from the browser.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
              Audit preflight
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {review.auditPreflight.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
              {review.auditPreflight.summary}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
            <MiniStat label="Items" value={`${review.auditPreflight.counts.total}`} />
            <MiniStat label="Ready" value={`${review.auditPreflight.counts.ready}`} />
            <MiniStat label="Watch" value={`${review.auditPreflight.counts.watch}`} />
            <MiniStat
              label="Blocked"
              value={`${review.auditPreflight.counts.blocked}`}
            />
            <MiniStat
              label="Writes"
              value={`${review.auditPreflight.counts.browserWritesEnabled}`}
            />
            <MiniStat
              label="Sends"
              value={`${review.auditPreflight.counts.externalWritesEnabled}`}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {review.auditPreflight.items.map((item) => (
            <AuditPreflightCard key={item.key} item={item} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {review.auditPreflight.blockedControls.map((control) => (
            <span
              key={control}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64"
            >
              Blocked here {control}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/54">
          This review stays read-only. No audit export, retention change, secret
          reveal, or production-write approval runs from this surface.
        </p>
      </div>

      {review.canReadRows ? (
        <div className="mt-5 grid gap-3">
          {review.rows.length > 0 ? (
            <>
              <p className="rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
                Visible rows below are local TEST audit readback only. Keep this route in review mode until approved write paths create real production evidence.
              </p>
              {review.rows.map((row) => <AuditRowCard key={row.id} row={row} />)}
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">
                No persisted audit rows visible yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {review.posture === "mock_intent_only"
                  ? "Mock review mode can prove audit intent, but production readiness needs readback from actual audit_logs rows after guarded local write drills run."
                  : "The authenticated data source returned no visible audit rows. Verify audit RLS and the approved write path before treating audit coverage as complete."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-white">
            Row-level audit details hidden.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            This role can inspect safety posture but not chapter/member audit row
            details from the admin review surface.
          </p>
        </div>
      )}

      <p className="mt-4 rounded-2xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/58">
        {review.nextStep}
      </p>
    </section>
  );
}

function AuditPreflightCard({ item }: { item: AdminAuditPreflightItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AuditPreflightStatusPill status={item.status} />
          <h4 className="mt-3 text-base font-semibold text-white">{item.label}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/72">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-violet-100/72">
        Required: {item.requiredEvidence}
      </p>
      <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/54">
        Current: {item.currentPosture}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function AuditRowCard({ row }: { row: AdminAuditLogReviewRow }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/70">
            {row.action.replaceAll("_", " ")}
          </p>
          <h3 className="mt-2 break-words text-sm font-semibold text-white">
            {row.target}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/58">
          {row.createdAt}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <MiniFact label="Actor" value={row.actorUserId} />
        <MiniFact label="Chapter" value={row.chapterId} />
        <MiniFact label="Before" value={row.beforeSummary} />
        <MiniFact label="After" value={row.afterSummary} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/62">{row.reason}</p>
    </article>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.05] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 break-words text-xs text-white/64">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AuditPreflightStatusPill({
  status,
}: {
  status: AdminAuditPreflightStatus;
}) {
  const className =
    status === "ready"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "watch"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function StatusPill({ posture }: { posture: AdminAuditLogPosture }) {
  let className = "border-amber-300/30 bg-amber-300/15 text-amber-100";

  if (posture === "persisted_readback_visible") {
    className = "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  } else if (posture === "mock_intent_only") {
    className = "border-sky-300/30 bg-sky-300/15 text-sky-100";
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {posture.replaceAll("_", " ")}
    </span>
  );
}
