import Link from "next/link";
import type {
  AdminControlCenterSummary,
  AdminControlStatus,
} from "@/services/admin-control-center";

type AdminControlCenterPanelProps = {
  summary: AdminControlCenterSummary;
};

export function AdminControlCenterPanel({ summary }: AdminControlCenterPanelProps) {
  const blockedHealthCount = summary.healthItems.filter((item) => item.status === "blocked").length;

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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Fake users" value={`${summary.userCount}`} />
        <Metric label="Role audiences" value={`${summary.roleAudienceCount}`} />
        <Metric
          label="Named roles"
          value={`${summary.namedRoleCount}/${summary.roleCoverage.length}`}
        />
        <Metric label="Campaign shells" value={`${summary.campaignTemplateCount}`} />
        <Metric label="Disabled outbox" value={`${summary.disabledOutboxCount}`} />
        <Metric label="Audit rows" value={`${summary.auditLogCount}`} />
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Safety posture</p>
        <p className="mt-2 text-xs leading-5 text-white/58">
          Admin writes enabled: {summary.canWriteAdminChanges ? "yes" : "no"}.
          Production auth enabled: {summary.productionAuthEnabled ? "yes" : "no"}.
          External writes enabled: {summary.externalWritesEnabled ? "yes" : "no"}.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Master data inventory
            </p>
            <p className="mt-1 text-xs leading-5 text-white/56">
              Read-only admin view of fake users, role coverage, chapter scope,
              and campaign templates.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            {summary.masterDataInventory.mutationControlsEnabled} mutation controls
          </span>
          <Link
            href="/admin/master-data"
            className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-[#06211d]"
          >
            Open inventory
          </Link>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Users
              </p>
              <span className="text-xs font-semibold text-emerald-100">
                {summary.masterDataInventory.users.length}
              </span>
            </div>
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {summary.masterDataInventory.users.map((user) => (
                <article key={user.email} className="rounded-xl bg-white/[0.05] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {user.displayName}
                      </p>
                      <p className="mt-1 break-words font-mono text-xs text-emerald-100/70">
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass(user.status)}`}
                    >
                      {user.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/48">
                    {user.audience.replace("_", " ")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    {roleSummary([...user.chapterRoles, ...user.staffRoles])}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Roles
              </p>
              <span className="text-xs font-semibold text-emerald-100">
                {summary.masterDataInventory.roles.length}
              </span>
            </div>
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {summary.masterDataInventory.roles.map((role) => (
                <article key={role.role} className="rounded-xl bg-white/[0.05] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{role.role}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass(role.status)}`}
                    >
                      {role.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/48">
                    {role.audience.replace("_", " ")}
                  </p>
                  <p className="mt-2 break-words font-mono text-xs text-emerald-100/70">
                    {role.localActorEmail ?? "missing local actor"}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Chapters
              </p>
              <span className="text-xs font-semibold text-emerald-100">
                {summary.masterDataInventory.chapters.length}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {summary.masterDataInventory.chapters.map((chapter) => (
                <article key={chapter.id} className="rounded-xl bg-white/[0.05] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {chapter.name}
                      </p>
                      <p className="mt-1 text-xs text-white/48">
                        {chapter.campus} / {chapter.region}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${statusClass(chapter.status)}`}
                    >
                      {chapter.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    Coach: {chapter.coachName}. {chapter.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44">
                Campaign templates
              </p>
              <span className="text-xs font-semibold text-emerald-100">
                {summary.masterDataInventory.campaignTemplates.length}
              </span>
            </div>
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {summary.masterDataInventory.campaignTemplates.map((template) => (
                <article key={template.slug} className="rounded-xl bg-white/[0.05] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {template.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-white/44">
                        {template.slug}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold ${shellStatusClass(template.status)}`}
                    >
                      {template.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/58">
                    KPIs: {template.primaryKpis.slice(0, 3).join(", ")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/44">
                    {template.integrationPosture}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-white/50">
          External writes expected from this inventory:{" "}
          {summary.masterDataInventory.externalWritesExpected}.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Operating responsibility summary
            </p>
            <p className="mt-1 text-xs leading-5 text-white/52">
              Same role-responsibility model used by the write sequence and
              staff dry-run views.
            </p>
          </div>
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
            {summary.operatingResponsibilities.length} guarded writes
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {summary.operatingResponsibilities.map((item) => (
            <article
              key={item.operationKey}
              className="rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                {item.operationKey.replaceAll("_", " ")}
              </p>
              <h3 className="mt-2 text-sm font-semibold text-white">{item.label}</h3>
              <p className="mt-2 break-words text-xs font-semibold text-sky-100/80">
                {item.responsibleRole}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {item.responsibility}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/52">
                {item.reviewPrompt}
              </p>
              <p className="mt-3 rounded-xl border border-white/10 bg-[#071d1a]/70 p-3 text-xs leading-5 text-white/50">
                {item.safetyBoundary}
              </p>
            </article>
          ))}
        </div>
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
            {area.key === "system_health" ? (
              <Link
                href="/admin/system-health"
                className="mt-3 inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-semibold text-[#13230b]"
              >
                Open health
              </Link>
            ) : area.key === "audit_logs" ? (
              <Link
                href="/admin/audit-log"
                className="mt-3 inline-flex rounded-full bg-violet-300 px-3 py-1 text-xs font-semibold text-[#170d29]"
              >
                Open audit log
              </Link>
            ) : area.key === "integration_outbox" ? (
              <Link
                href="/admin/integration-outbox"
                className="mt-3 inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-[#05242a]"
              >
                Open outbox
              </Link>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">System health signals</p>
            <p className="mt-1 text-xs leading-5 text-white/56">
              {summary.healthItems.length} local checks are visible here. {blockedHealthCount} stay
              blocked until live approvals, auth, and production monitoring exist.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/72">
            Read-only
          </span>
        </div>
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

function roleSummary(roles: readonly string[]): string {
  return roles.length > 0 ? `Roles: ${roles.join(", ")}` : "No chapter or staff role.";
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

function shellStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-300/20 text-emerald-100";
    case "template":
      return "bg-sky-300/20 text-sky-100";
    default:
      return "bg-amber-300/20 text-amber-100";
  }
}
