type ReviewSnapshotItem = {
  label: string;
  detail: string;
};

type ControlReviewSnapshotSectionProps = {
  title: string;
  description: string;
  recordedNow: ReviewSnapshotItem[];
  stillBlocked: ReviewSnapshotItem[];
};

export function ControlReviewSnapshotSection({
  title,
  description,
  recordedNow,
  stillBlocked,
}: ControlReviewSnapshotSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <p className="app-eyebrow app-eyebrow-blue">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
        Control review snapshot
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <SnapshotColumn
          title="Recorded now"
          items={recordedNow}
          emptyMessage="Nothing is recorded here yet."
        />
        <SnapshotColumn
          title="Still blocked"
          items={stillBlocked}
          emptyMessage="No blockers are listed here."
        />
      </div>
    </section>
  );
}

function SnapshotColumn({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ReviewSnapshotItem[];
  emptyMessage: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <div className="mt-3 grid gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <p className="text-sm font-semibold text-slate-950">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.detail}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
            {emptyMessage}
          </p>
        )}
      </div>
    </article>
  );
}
