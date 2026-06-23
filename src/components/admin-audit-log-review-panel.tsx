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
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Audit log review
          </p>
          <h2 className="app-title mt-2">{review.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{review.summary}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Rows" value={`${review.counts.visibleRows}`} />
          <MiniStat label="Writes" value={`${review.counts.browserWritesEnabled}`} />
          <MiniStat label="Sends" value={`${review.counts.externalWritesEnabled}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill posture={review.posture} />
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          Source {review.sourceLabel}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          Secrets {review.counts.secretsShown}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          Hidden rows {review.counts.hiddenRows}
        </span>
      </div>

      <div className="app-surface rounded-[1.4rem] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="app-eyebrow app-eyebrow-slate">
              Audit preflight
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">{review.auditPreflight.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{review.auditPreflight.summary}</p>
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
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500"
            >
              Locked {control}
            </span>
          ))}
        </div>
      </div>

      {review.canReadRows ? (
        <div className="mt-5 grid gap-3">
          {review.rows.length > 0 ? (
            review.rows.map((row) => <AuditRowCard key={row.id} row={row} />)
          ) : (
            <div className="app-surface rounded-[1.25rem] p-4">
              <p className="text-sm font-semibold text-slate-950">
                No persisted audit rows visible yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mock review mode can prove audit intent, but production readiness
                needs readback from actual `audit_logs` rows after guarded local
                write drills run.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="app-surface rounded-[1.25rem] p-4">
          <p className="text-sm font-semibold text-slate-950">
            Row-level audit details hidden.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This role can inspect safety posture but not chapter/member audit row
            details from the admin review surface.
          </p>
        </div>
      )}

      <p className="app-surface-soft mt-4 rounded-[1.1rem] p-3 text-xs leading-5 text-slate-500">
        {review.nextStep}
      </p>
    </section>
  );
}

function AuditPreflightCard({ item }: { item: AdminAuditPreflightItem }) {
  return (
    <article className="app-surface rounded-[1.25rem] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AuditPreflightStatusPill status={item.status} />
          <h4 className="mt-3 text-base font-semibold text-slate-950">{item.label}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-[#2563eb]">
        Required: {item.requiredEvidence}
      </p>
      <p className="app-surface-soft mt-3 rounded-[1.05rem] p-3 text-xs leading-5 text-slate-500">
        Current: {item.currentPosture}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500"
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
    <article className="app-surface rounded-[1.25rem] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            {row.action.replaceAll("_", " ")}
          </p>
          <h3 className="mt-2 break-words text-sm font-semibold text-slate-950">
            {row.target}
          </h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
          {row.createdAt}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <MiniFact label="Actor" value={row.actorUserId} />
        <MiniFact label="Chapter" value={row.chapterId} />
        <MiniFact label="Before" value={row.beforeSummary} />
        <MiniFact label="After" value={row.afterSummary} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{row.reason}</p>
    </article>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
      {label} {value}
    </span>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 break-words text-xs text-slate-600">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "watch"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function StatusPill({ posture }: { posture: AdminAuditLogPosture }) {
  const className =
    posture === "persisted_readback_visible"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : posture === "mock_intent_only"
        ? "border-[#bfdbfe] bg-[#eaf2ff] text-[#2563eb]"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {posture.replaceAll("_", " ")}
    </span>
  );
}
