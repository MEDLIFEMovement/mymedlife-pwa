import Link from "next/link";

type AdminBackendLaneKey =
  | "overview"
  | "permissions"
  | "committees"
  | "workflows"
  | "integration_outbox"
  | "database_security"
  | "system_health"
  | "sop_library"
  | "master_data"
  | "sop_builder"
  | "review_path"
  | "nick_review"
  | "release_readiness"
  | "launch_gate"
  | "audit_log"
  | "operations"
  | "design_qa"
  | "pilot_scope";

type AdminBackendLaneNavProps = {
  current: AdminBackendLaneKey;
  builderLink?: {
    href: string;
    label: string;
  };
};

const baseLanes = [
  {
    key: "overview",
    label: "Overview",
    href: "/admin",
  },
  {
    key: "permissions",
    label: "Permissions",
    href: "/admin/permissions",
  },
  {
    key: "committees",
    label: "Committees",
    href: "/admin/committees",
  },
  {
    key: "workflows",
    label: "Workflows",
    href: "/admin/workflows",
  },
  {
    key: "integration_outbox",
    label: "Outbox",
    href: "/admin/integration-outbox",
  },
  {
    key: "database_security",
    label: "Database Security",
    href: "/admin/database-security",
  },
  {
    key: "system_health",
    label: "System Health",
    href: "/admin/system-health",
  },
  {
    key: "sop_library",
    label: "SOP Library",
    href: "/admin/sop-library",
  },
  {
    key: "master_data",
    label: "Master Data",
    href: "/admin/master-data",
  },
] as const;

const reviewPacketLanes = [
  {
    key: "review_path",
    label: "Review Path",
    href: "/admin/review-path",
  },
  {
    key: "nick_review",
    label: "Nick Review",
    href: "/admin/nick-review",
  },
  {
    key: "release_readiness",
    label: "Release Readiness",
    href: "/admin/release-readiness",
  },
  {
    key: "launch_gate",
    label: "Launch Gate",
    href: "/admin/launch-gate",
  },
  {
    key: "audit_log",
    label: "Audit Log",
    href: "/admin/audit-log",
  },
  {
    key: "operations",
    label: "Operations",
    href: "/admin/operations",
  },
  {
    key: "design_qa",
    label: "Design QA",
    href: "/admin/design-qa",
  },
  {
    key: "pilot_scope",
    label: "Pilot Scope",
    href: "/admin/pilot-scope",
  },
] as const;

export function AdminBackendLaneNav({
  current,
  builderLink,
}: AdminBackendLaneNavProps) {
  const lanes =
    builderLink
      ? [
          ...baseLanes,
          {
            key: "sop_builder" as const,
            label: builderLink.label,
            href: builderLink.href,
          },
        ]
      : baseLanes;

  return (
    <section className="app-surface rounded-[1.6rem] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-slate">Backend route family</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Keep internal tooling inside one owned admin lane
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Permissions, committees, workflows, SOP tooling, and approval packets
            should stay visibly connected so reviewers can move across backend
            routes without falling back into the broader staff command-center
            surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lanes.map((lane) => {
            const selected = lane.key === current;

            return (
              <div key={lane.key} className="relative">
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition",
                    selected ? "text-white" : "text-slate-500",
                  ].join(" ")}
                >
                  <AdminLaneIcon lane={lane.key} />
                </span>
                <Link
                  href={lane.href}
                  aria-current={selected ? "page" : undefined}
                  className={
                    selected
                      ? "block rounded-full bg-slate-950 px-3 py-1.5 pl-9 text-sm font-semibold text-white"
                      : "block rounded-full border border-slate-200 bg-white px-3 py-1.5 pl-9 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                  }
                >
                  {lane.label}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Review packets
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reviewPacketLanes.map((lane) => {
            const selected = lane.key === current;

            return (
              <Link
                key={lane.key}
                href={lane.href}
                aria-current={selected ? "page" : undefined}
                className={
                  selected
                    ? "rounded-full bg-sky-950 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                }
              >
                {lane.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdminLaneIcon({ lane }: { lane: AdminBackendLaneKey }) {
  const iconClassName = "h-[1rem] w-[1rem]";

  switch (lane) {
    case "overview":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="5" width="7" height="6" rx="1.6" />
          <rect x="13" y="5" width="7" height="6" rx="1.6" />
          <rect x="4" y="13" width="7" height="6" rx="1.6" />
          <rect x="13" y="13" width="7" height="6" rx="1.6" />
        </svg>
      );
    case "permissions":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M12 4.5 18 7v4.6c0 3.5-2.4 6.7-6 7.9-3.6-1.2-6-4.4-6-7.9V7l6-2.5Z" />
          <path d="M9.5 12 11 13.5l3.5-4" />
        </svg>
      );
    case "committees":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h10" />
        </svg>
      );
    case "workflows":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <rect x="4" y="5" width="6" height="5" rx="1.2" />
          <rect x="14" y="14" width="6" height="5" rx="1.2" />
          <path d="M10 7.5h4a2 2 0 0 1 2 2V14" />
          <path d="m12 12 4 4" />
        </svg>
      );
    case "integration_outbox":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 6.5h14v11H5z" />
          <path d="M5 10h14" />
          <path d="M8 14h3" />
        </svg>
      );
    case "database_security":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" />
          <path d="M5.5 6.5v7c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-7" />
          <path d="M5.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
        </svg>
      );
    case "system_health":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 12h3l2-5 4 10 2-5h3" />
          <path d="M4 4.5h16v15H4z" />
        </svg>
      );
    case "sop_library":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M6 5.5h10a2 2 0 0 1 2 2V19l-4-2-4 2-4-2V7.5a2 2 0 0 1 2-2Z" />
          <path d="M9 9h6" />
          <path d="M9 12h6" />
        </svg>
      );
    case "master_data":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M6 6.5h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
          <path d="M8 10h8" />
          <path d="M8 13h5" />
        </svg>
      );
    case "sop_builder":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClassName}>
          <path d="M5 18h4l9-9-4-4-9 9v4Z" />
          <path d="m12.5 6.5 4 4" />
        </svg>
      );
  }
}
