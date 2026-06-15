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
          ? "rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4"
          : "rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4"
      }
    >
      <p
        className={
          isSupabase
            ? "text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100"
            : "text-xs font-semibold uppercase tracking-[0.22em] text-amber-100"
        }
      >
        {isSupabase ? "Local Supabase read path" : "Mock fallback"}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/68">{source.message}</p>
    </section>
  );
}
