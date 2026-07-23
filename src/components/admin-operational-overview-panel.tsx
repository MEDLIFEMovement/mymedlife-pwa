import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarDays,
  Database,
  FileClock,
  Link2,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { AdminMasterDataWorkspace } from "@/services/admin-master-data-workspace";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type AdminOperationalOverviewPanelProps = {
  data: ReadOnlyAppData;
  workspace: AdminMasterDataWorkspace;
};

type OperationalLink = {
  href: string;
  label: string;
  detail: string;
  icon: typeof Users;
};

export function AdminOperationalOverviewPanel({
  data,
  workspace,
}: Readonly<AdminOperationalOverviewPanelProps>) {
  const isAppOwned = data.source.mode === "supabase";
  const metrics = [
    {
      label: "Users",
      value: workspace.counts.users,
      detail: "profiles and approved directory identities",
      icon: Users,
    },
    {
      label: "Chapters",
      value: workspace.counts.chapters,
      detail: "app-owned chapter records",
      icon: Building2,
    },
    {
      label: "Events",
      value: data.allChapterEventRows.length,
      detail: "chapter event records",
      icon: CalendarDays,
    },
    {
      label: "Points records",
      value: data.allPointsEventRows.length,
      detail: "auditable points ledger rows",
      icon: Activity,
    },
    {
      label: "Campaign templates",
      value: workspace.counts.campaignTemplates,
      detail: "read-only operating templates",
      icon: Megaphone,
    },
    {
      label: "Audit records",
      value: data.allAuditLogs.length,
      detail: "app-owned audit entries",
      icon: FileClock,
    },
  ];

  return (
    <div className="space-y-5 p-6">
      <section
        className={`border px-4 py-3 ${
          isAppOwned
            ? "border-emerald-500/20 bg-emerald-500/8"
            : "border-amber-500/20 bg-amber-500/8"
        }`}
      >
        <div className="flex items-start gap-3">
          <Database
            aria-hidden="true"
            className={isAppOwned ? "text-emerald-400" : "text-amber-400"}
            size={16}
          />
          <div>
            <p
              className={`text-xs font-semibold ${
                isAppOwned ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {isAppOwned
                ? "App-owned operational readback"
                : "TEST review data"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {data.source.message}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="operational-counts-heading">
        <div className="mb-3">
          <h2
            id="operational-counts-heading"
            className="text-sm font-semibold text-slate-100"
          >
            Operational counts
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Counts come from the current app data source. They do not imply
            rollout readiness.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="border border-white/8 bg-[#161b22] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    className="text-sky-400"
                    size={18}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {metric.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="admin-workspaces-heading"
        className="border border-white/8 bg-[#12171e]"
      >
        <div className="border-b border-white/8 px-4 py-3">
          <h2
            id="admin-workspaces-heading"
            className="text-sm font-semibold text-slate-100"
          >
            Route-backed workspaces
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Open a focused operational surface. Mutation controls remain
            governed by each route.
          </p>
        </div>
        <div className="divide-y divide-white/6">
          {operationalLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
              >
                <Icon
                  aria-hidden="true"
                  className="shrink-0 text-sky-400"
                  size={16}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-200">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {item.detail}
                  </span>
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border border-amber-500/20 bg-amber-500/8 px-4 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="shrink-0 text-amber-400"
            size={17}
          />
          <div>
            <h2 className="text-sm font-semibold text-amber-200">
              Readback is not rollout proof
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-100/65">
              This overview performs no browser-side provider writes, user
              mutations, chapter mutations, or external sends. Production
              readiness still requires focused workflow proof and deployed-site
              retesting.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const operationalLinks: readonly OperationalLink[] = [
  {
    href: "/admin/users",
    label: "Users and access",
    detail: "Review app-owned identities, memberships, and role posture.",
    icon: Users,
  },
  {
    href: "/admin/chapters",
    label: "Chapters",
    detail: "Review chapter records, ownership, and lifecycle safeguards.",
    icon: Building2,
  },
  {
    href: "/admin/master-data",
    label: "Master data",
    detail: "Inspect users, roles, chapters, and campaign templates together.",
    icon: Database,
  },
  {
    href: "/admin?view=integrations",
    label: "Integrations",
    detail: "Review provider readback and current external-write posture.",
    icon: Link2,
  },
  {
    href: "/admin/integration-outbox",
    label: "Integration outbox",
    detail: "Inspect queued, blocked, retried, and failed integration events.",
    icon: Activity,
  },
  {
    href: "/admin/audit-log",
    label: "Audit log",
    detail: "Review recorded operational changes and immutable history.",
    icon: FileClock,
  },
  {
    href: "/admin/launch-gate",
    label: "Launch gate",
    detail: "Keep functional proof separate from rollout authorization.",
    icon: ShieldCheck,
  },
];
