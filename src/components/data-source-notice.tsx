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
        "rounded-[1.2rem] border px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.04)] sm:px-4",
        isSupabase
          ? "border-emerald-200/90 bg-emerald-50/88"
          : "border-amber-200/85 bg-[#fffaf0]/94",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <span
          aria-hidden="true"
          className={[
            "h-2.5 w-2.5 rounded-full",
            isSupabase ? "bg-emerald-500" : "bg-amber-500",
          ].join(" ")}
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          <span
            className={[
              "rounded-full border bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] sm:text-[0.66rem]",
              isSupabase
                ? "border-emerald-200 text-emerald-700"
                : "border-amber-200 text-amber-700",
            ].join(" ")}
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
