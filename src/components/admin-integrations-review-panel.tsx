import Link from "next/link";

import type { AdminIntegrationOutboxWorkspace } from "@/services/admin-integration-outbox-workspace";
import type { AdminLumaIntegrationStatus } from "@/services/admin-luma-integration-status";
import type {
  IntegrationContractReview,
  IntegrationContractReviewItem,
  IntegrationContractStatus,
} from "@/services/integration-contract-review";
import type { ReadOnlyAppData } from "@/services/read-only-app-data";

type AdminIntegrationsReviewPanelProps = {
  lumaStatus: AdminLumaIntegrationStatus;
  outboxWorkspace: AdminIntegrationOutboxWorkspace;
  source: ReadOnlyAppData["source"];
};

type ProviderReview = {
  key: string;
  title: string;
  status: string;
  mode: string;
  summary: string;
  evidence: string[];
  primaryHref?: string;
  primaryLabel?: string;
};

export function AdminIntegrationsReviewPanel({
  lumaStatus,
  outboxWorkspace,
  source,
}: AdminIntegrationsReviewPanelProps) {
  const providers = buildProviderReviews({
    contractReview: outboxWorkspace.contractReview,
    lumaStatus,
    outboxWorkspace,
  });
  const lumaErrors = lumaStatus.errorLog.slice(0, 3);
  const readbackRows = outboxWorkspace.readbackRows.slice(0, 6);

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-lg border border-sky-500/20 bg-sky-500/8 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">
              Route-backed admin integrations
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Integrations
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This page reads the same Luma provider posture, integration outbox,
              contract review, and secret-safety counts used by the audited admin
              routes. It does not call external providers, reveal keys, or enable
              writes from the browser.
            </p>
          </div>
          <div className="grid gap-2 text-right sm:grid-cols-3 lg:min-w-[390px]">
            <MiniStat label="Source" value={source.mode} />
            <MiniStat label="Secrets" value={`${outboxWorkspace.counts.secretsShown}`} />
            <MiniStat
              label="External writes"
              value={`${outboxWorkspace.counts.externalWritesEnabled}`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Luma mode" value={lumaStatus.environmentLabel} />
        <MiniStat label="Luma test" value={lumaStatus.testConnection.label} />
        <MiniStat
          label="Integration events"
          value={`${outboxWorkspace.counts.rawIntegrationEventRows}`}
        />
        <MiniStat
          label="Outbox rows"
          value={`${outboxWorkspace.counts.rawAutomationOutboxRows}`}
        />
        <MiniStat
          label="Live-send rows"
          value={`${outboxWorkspace.counts.liveSendRows}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {providers.map((provider) => (
          <article
            key={provider.key}
            className="rounded-lg border border-white/[0.06] bg-[#161b22] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {provider.mode}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  {provider.title}
                </h2>
              </div>
              <StatusPill>{provider.status}</StatusPill>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {provider.summary}
            </p>
            <div className="mt-4 space-y-2">
              {provider.evidence.map((item) => (
                <p key={item} className="text-xs leading-5 text-slate-500">
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {provider.primaryHref ? (
                <Link
                  href={provider.primaryHref}
                  className="rounded-md bg-sky-400 px-3 py-2 text-xs font-semibold text-[#07111d]"
                >
                  {provider.primaryLabel}
                </Link>
              ) : null}
              <button
                disabled
                title="Provider writes and connection mutations stay server-gated until explicitly approved."
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-500"
              >
                Test blocked
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-white/[0.06] bg-[#161b22] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Luma status and errors
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {lumaStatus.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {lumaStatus.summary}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail label="Provider mode" value={lumaStatus.environmentLabel} />
            <Detail label="Connection check" value={lumaStatus.testConnection.label} />
            <Detail label="Last test" value={lumaStatus.lastTestTime} />
            <Detail label="Last sync" value={lumaStatus.lastSync} />
          </dl>
          <div className="mt-4 space-y-3">
            {lumaErrors.map((item) => (
              <div
                key={`${item.source}-${item.status}-${item.message}`}
                className="rounded-md border border-white/[0.06] bg-black/20 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
                    {item.source.replaceAll("_", " ")}
                  </p>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-300">
                  {item.message}
                </p>
                <p className="mt-2 text-xs text-slate-600">{item.occurredAt}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-white/[0.06] bg-[#161b22] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Readback rows
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Integration events and outbox
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            These are app-side readbacks for Luma, HubSpot, warehouse, n8n, and
            internal contracts. They are not vendor success claims.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.06]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/20 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">
                    Destination
                  </th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">
                    Event
                  </th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">
                    Status
                  </th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {readbackRows.map((row) => (
                  <tr key={`${row.source}-${row.id}`}>
                    <td className="px-3 py-2 font-semibold">{row.destination}</td>
                    <td className="px-3 py-2">{row.eventType}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2 text-slate-500">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/integration-outbox"
              className="rounded-md bg-sky-400 px-3 py-2 text-xs font-semibold text-[#07111d]"
            >
              Open outbox
            </Link>
            <Link
              href="/admin/audit-log"
              className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200"
            >
              Open audit log
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-white/[0.06] bg-[#161b22] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Locked controls
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              No browser-side provider writes
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Disabled controls stay visible so DS Admin and Super Admin can
              verify the launch boundary. Every live connection, key rotation,
              queue retry, export, or send remains blocked here.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat
              label="Browser writes"
              value={`${outboxWorkspace.counts.browserWritesEnabled}`}
            />
            <MiniStat
              label="Sends"
              value={`${outboxWorkspace.counts.externalWritesEnabled}`}
            />
            <MiniStat label="Secrets" value={`${outboxWorkspace.counts.secretsShown}`} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...new Set([
            ...lumaStatus.blockedControls,
            ...outboxWorkspace.blockedControls,
          ])]
            .slice(0, 16)
            .map((control) => (
              <span
                key={control}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-400"
              >
                {control}
              </span>
            ))}
        </div>
      </section>
    </div>
  );
}

function buildProviderReviews({
  contractReview,
  lumaStatus,
  outboxWorkspace,
}: {
  contractReview: IntegrationContractReview;
  lumaStatus: AdminLumaIntegrationStatus;
  outboxWorkspace: AdminIntegrationOutboxWorkspace;
}): ProviderReview[] {
  const contractByKey = new Map(
    contractReview.items.map((item) => [item.key, item] as const),
  );

  return [
    {
      key: "luma",
      title: "Luma",
      status: lumaStatus.providerStatus.replaceAll("_", " "),
      mode: lumaStatus.environmentLabel,
      summary: lumaStatus.testConnection.detail,
      evidence: [
        `${lumaStatus.counts.calendars} calendar mapping(s), ${lumaStatus.counts.linkedEvents} linked event(s).`,
        `External writes enabled: ${lumaStatus.counts.externalWritesEnabled}. Browser secrets shown: ${lumaStatus.counts.browserSecretsShown}.`,
      ],
      primaryHref: "/admin/integrations/luma",
      primaryLabel: "Open Luma status",
    },
    {
      ...contractProviderReview({
      key: "hubspot",
      title: "HubSpot",
      item: contractByKey.get("hubspot"),
      outboxWorkspace,
      }),
      primaryHref: "/admin/integrations/hubspot",
      primaryLabel: "Open HubSpot sync",
    },
    contractProviderReview({
      key: "warehouse",
      title: "Data warehouse",
      item: contractByKey.get("warehouse_power_bi"),
      outboxWorkspace,
    }),
  ];
}

function contractProviderReview({
  key,
  title,
  item,
  outboxWorkspace,
}: {
  key: string;
  title: string;
  item: IntegrationContractReviewItem | undefined;
  outboxWorkspace: AdminIntegrationOutboxWorkspace;
}): ProviderReview {
  const destination = outboxWorkspace.destinationSummaries.find((summary) => {
    if (key === "hubspot") return summary.destination === "HubSpot";
    return summary.destination === "warehouse";
  });

  return {
    key,
    title,
    status: item ? readableContractStatus(item.status) : "not configured",
    mode: destination?.posture.replaceAll("_", " ") ?? "readback missing",
    summary:
      item?.currentPosture ??
      "No contract readback is visible for this provider. Keep it disabled until seeded.",
    evidence: [
      destination
        ? `${destination.integrationEvents} event(s), ${destination.outboxRows} outbox row(s), ${destination.liveSendRows} live-send row(s).`
        : "No destination summary row is visible.",
      item
        ? `Expected browser writes: ${item.browserWritesExpected}; expected external writes: ${item.externalWritesExpected}.`
        : "Expected browser writes: 0; expected external writes: 0.",
    ],
    primaryHref: "/admin/integration-outbox",
    primaryLabel: "Open outbox",
  };
}

function readableContractStatus(status: IntegrationContractStatus): string {
  switch (status) {
    case "ready":
      return "ready readback";
    case "watch":
      return "setup needed";
    case "blocked":
      return "blocked";
  }
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#161b22] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-black/20 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
      {children}
    </span>
  );
}
