import type { DataSourceMeta } from "@/services/read-only-app-data";

type DataSourceNoticeProps = {
  source: DataSourceMeta;
};

export function DataSourceNotice({ source }: DataSourceNoticeProps) {
  const isSupabase = source.status === "supabase_ready";

  return (
    <section
      className={
        isSupabase
          ? "rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3"
          : "rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              isSupabase
                ? "rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-100"
                : "rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100"
            }
          >
            {isSupabase ? "Local Supabase review data" : "Mock-seeded review data"}
          </span>
          <p className="text-sm leading-6 text-white/68">{source.message}</p>
        </div>
      </div>
    </section>
  );
}
