import type { ReviewPacketRecord } from "@/services/review-packet-registry";

type ReviewPacketHistorySectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  records: ReviewPacketRecord[];
};

export function ReviewPacketHistorySection({
  title,
  description,
  emptyMessage,
  records,
}: ReviewPacketHistorySectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <p className="app-eyebrow app-eyebrow-blue">Packet history</p>
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
                <StatusPill>{record.recordKey}</StatusPill>
                <StatusPill>{record.actorRole}</StatusPill>
                <StatusPill>{record.updatedAt}</StatusPill>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {record.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {record.reason ?? "No reason recorded."}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Updated by {record.updatedBy}
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
