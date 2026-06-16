import type {
  AdminControlCenterSummary,
  AdminControlStatus,
} from "@/services/admin-control-center";

type AdminControlCenterPanelProps = {
  summary: AdminControlCenterSummary;
};

export function AdminControlCenterPanel({ summary }: AdminControlCenterPanelProps) {
  return (
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
        Admin control center
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Admin coverage is visible, but mutation controls stay off.
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/66">
        This panel names the MVP admin surfaces for users, roles, chapters,
        campaign templates, integrations, audit logs, and system health. It is
        read-only and mock-safe until auth, RLS, audit, and rollback are approved.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Fake users" value={`${summary.userCount}`} />
        <Metric label="Role audiences" value={`${summary.roleAudienceCount}`} />
        <Metric
          label="Named roles"
          value={`${summary.namedRoleCount}/${summary.roleCoverage.length}`}
        />
        <Metric label="Campaign shells" value={`${summary.campaignTemplateCount}`} />
        <Metric label="Disabled outbox" value={`${summary.disabledOutboxCount}`} />
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Safety posture</p>
        <p className="mt-2 text-xs leading-5 text-white/58">
          Admin writes enabled: {summary.canWriteAdminChanges ? "yes" : "no"}.
          Production auth enabled: {summary.productionAuthEnabled ? "yes" : "no"}.
          External writes enabled: {summary.externalWritesEnabled ? "yes" : "no"}.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Named MVP role coverage
            </p>
            <p className="mt-1 text-xs leading-5 text-white/52">
              These are local review personas, not production users or role writes.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {summary.namedRoleCount}/{summary.roleCoverage.length} ready
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {summary.roleCoverage.map((item) => (
            <article key={item.role} className="rounded-2xl bg-white/[0.05] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.role}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass(item.status)}`}
                >
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-xs text-white/46">
                {item.audience.replace("_", " ")}
              </p>
              <p className="mt-2 break-words font-mono text-xs text-emerald-100/70">
                {item.localActorEmail ?? "missing local actor"}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {summary.areas.map((area) => (
          <article
            key={area.key}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                  {area.key.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{area.title}</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(area.status)}`}
              >
                {area.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{area.primaryMetric}</p>
            <p className="mt-2 text-sm leading-6 text-white/64">{area.detail}</p>
            <p className="mt-2 text-xs leading-5 text-white/46">Next: {area.nextAction}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">System health placeholders</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {summary.healthItems.map((item) => (
            <article key={item.key} className="rounded-2xl bg-white/[0.05] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                >
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/58">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function statusClass(status: AdminControlStatus): string {
  switch (status) {
    case "ready_readonly":
      return "bg-emerald-300/20 text-emerald-100";
    case "mock_only":
      return "bg-sky-300/20 text-sky-100";
    case "blocked":
      return "bg-amber-300/20 text-amber-100";
  }
}
