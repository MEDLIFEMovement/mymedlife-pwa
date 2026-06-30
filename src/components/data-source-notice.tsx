import type { DataSourceMeta } from "@/services/read-only-app-data";

type DataSourceNoticeProps = {
  source: DataSourceMeta;
};

export function DataSourceNotice({ source }: DataSourceNoticeProps) {
  const isSupabase = source.status === "supabase_ready";

  return (
    <section
      aria-label="Data source status"
      className={[
        "rounded-[1.2rem] border px-3 py-2 shadow-[0_8px_20px_rgb(var(--mymedlife-shadow-rgb)/0.04)] sm:px-4",
        isSupabase
          ? "border-[var(--mymedlife-border)]/90 bg-[var(--mymedlife-badge-background)]/88"
          : "border-[var(--mymedlife-border)]/85 bg-[var(--mymedlife-surface-hover)]/94",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full bg-[var(--mymedlife-primary-button)]"
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          <span
            className="rounded-full border border-[var(--mymedlife-border)] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-[var(--mymedlife-info)] sm:text-[0.66rem]"
          >
            {isSupabase ? "Connected preview data" : "Preview data"}
          </span>
          <p className="min-w-0 flex-1 text-xs leading-5 text-slate-600 sm:text-[0.9rem]">
            {source.message}
          </p>
        </div>
      </div>
    </section>
  );
}
