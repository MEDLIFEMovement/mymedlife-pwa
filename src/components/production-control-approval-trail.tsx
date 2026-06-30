import type { ProductionControlApprovalRecord } from "@/services/production-control-approvals";

type ProductionControlApprovalTrailProps = {
  title: string;
  description: string;
  emptyMessage: string;
  records: ProductionControlApprovalRecord[];
};

export function ProductionControlApprovalTrail({
  title,
  description,
  emptyMessage,
  records,
}: ProductionControlApprovalTrailProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <p className="app-eyebrow app-eyebrow-blue">Production approval trail</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-4 grid gap-3">
        {records.length > 0 ? (
          records.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill>{record.scope}</StatusPill>
                <StatusPill>{record.targetKey}</StatusPill>
                <StatusPill>{record.approvalReference}</StatusPill>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {record.reason}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                production / {record.createdAt}
                {record.expiresAt ? ` / expires ${record.expiresAt}` : ""}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4 text-sm text-slate-600">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {children}
    </span>
  );
}
