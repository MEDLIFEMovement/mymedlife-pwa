import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import {
  getAdminIntegrationOutboxWorkspace,
  type AdminLiveSendPreflightItem,
  type AdminLiveSendPreflightStatus,
} from "@/services/admin-integration-outbox-workspace";
import type { IntegrationContractStatus } from "@/services/integration-contract-review";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminIntegrationOutbox");
export const dynamic = "force-dynamic";

export default async function AdminIntegrationOutboxPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getAdminIntegrationOutboxWorkspace(actor, data);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="integration_outbox"
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="app-surface-info rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  Admin integration outbox
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MiniStat
              label="Events"
              value={`${workspace.counts.structuredEvents}`}
            />
            <MiniStat
              label="Outbox"
              value={`${workspace.counts.visibleOutboxRows}`}
            />
            <MiniStat
              label="Raw events"
              value={`${workspace.counts.rawIntegrationEventRows}`}
            />
            <MiniStat
              label="Raw queue"
              value={`${workspace.counts.rawAutomationOutboxRows}`}
            />
            <MiniStat label="Live sends" value={`${workspace.counts.liveSendRows}`} />
            <MiniStat label="Secrets" value={`${workspace.counts.secretsShown}`} />
          </section>

          <section className="grid gap-3 lg:grid-cols-5">
            {workspace.destinationSummaries.map((destination) => (
              <article
                key={destination.destination}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-950">
                    {destination.destination}
                  </h2>
                  <Pill>{destination.posture.replaceAll("_", " ")}</Pill>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {destination.integrationEvents + destination.outboxRows}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {destination.integrationEvents} events, {destination.outboxRows} rows
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {destination.detail}
                </p>
              </article>
            ))}
          </section>

          <section className="app-surface rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                  Contract review
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {workspace.contractReview.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.contractReview.summary}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                <MiniStat
                  label="Items"
                  value={`${workspace.contractReview.counts.total}`}
                />
                <MiniStat
                  label="Ready"
                  value={`${workspace.contractReview.counts.ready}`}
                />
                <MiniStat
                  label="Watch"
                  value={`${workspace.contractReview.counts.watch}`}
                />
                <MiniStat
                  label="Blocked"
                  value={`${workspace.contractReview.counts.blocked}`}
                />
                <MiniStat
                  label="Writes"
                  value={`${workspace.contractReview.counts.browserWritesEnabled}`}
                />
                <MiniStat
                  label="Sends"
                  value={`${workspace.contractReview.counts.externalWritesEnabled}`}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.contractReview.items.map((item) => (
                <article
                  key={item.key}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <ReviewStatusPill status={item.status} />
                      <h3 className="mt-3 text-base font-semibold text-slate-950">
                        {item.label}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SmallToken label="Writes" value={`${item.browserWritesExpected}`} />
                      <SmallToken label="Sends" value={`${item.externalWritesExpected}`} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.currentPosture}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-[var(--mymedlife-info)]">
                    Source of truth: {item.sourceOfTruth}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Required: {item.requiredEvidence}
                  </p>
                  <p className="mt-3 rounded-2xl bg-white p-3 text-xs leading-5 text-slate-500">
                    Live gate: {item.liveGate}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.requiredFields.map((field) => (
                      <span
                        key={`${item.key}-${field}`}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.routeEvidence.map((route) => (
                      <span
                        key={`${item.key}-${route}`}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.contractReview.blockedControls.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500"
                >
                  Locked {item}
                </span>
              ))}
            </div>
          </section>

          <InventorySection
            title="Structured integration events"
            count={workspace.integrationEvents.length}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.integrationEvents.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {event.title}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-[var(--mymedlife-badge-background)]/70">
                        {event.eventType}
                      </p>
                    </div>
                    <Pill>{event.status}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {event.detail}
                  </p>
                  <p className="mt-2 text-xs text-white/44">
                    {event.destination} / {event.occurredAt}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <InventorySection
            title="Automation outbox"
            count={workspace.outboxItems.length}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {workspace.outboxItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {item.destination}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-[var(--mymedlife-badge-background)]/70">
                        source: {item.sourceEventId}
                      </p>
                    </div>
                    <Pill>{item.status}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {item.payloadSummary}
                  </p>
                  <p className="mt-3 rounded-xl border border-white/10 bg-[var(--mymedlife-admin-blue)]/70 p-3 text-xs leading-5 text-white/52">
                    {item.safety}
                  </p>
                </article>
              ))}
            </div>
          </InventorySection>

          <section className="grid gap-3 lg:grid-cols-2">
            <InventorySection
              title="Local readback rows"
              count={workspace.readbackRows.length}
            >
              {workspace.readbackRows.length === 0 ? (
                <EmptyState>
                  No persisted integration/outbox readback rows are visible in the
                  current {workspace.sourceLabel} data source.
                </EmptyState>
              ) : (
                <div className="grid gap-2">
                  {workspace.readbackRows.map((row) => (
                    <article key={row.id} className="rounded-xl bg-[var(--mymedlife-border)]/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {row.eventType}
                          </p>
                          <p className="mt-1 text-xs text-white/46">
                            {row.source.replaceAll("_", " ")} / {row.destination}
                          </p>
                        </div>
                        <Pill>{row.status}</Pill>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/52">
                        Payload: {row.payloadSummary}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </InventorySection>

            <InventorySection
              title="Audit posture"
              count={
                workspace.counts.visibleAuditRows + workspace.counts.hiddenAuditRows
              }
            >
              {!workspace.canReadAuditRows ? (
                <EmptyState>
                  DS Admin can confirm that {workspace.counts.hiddenAuditRows} audit
                  rows exist, but row-level chapter/member details stay hidden.
                </EmptyState>
              ) : workspace.auditRows.length === 0 ? (
                <EmptyState>
                  No persisted audit rows are visible yet. Local write/readback
                  drills must prove audit rows before live writes are approved.
                </EmptyState>
              ) : (
                <div className="grid gap-2">
                  {workspace.auditRows.map((row) => (
                    <article key={row.id} className="rounded-xl bg-[var(--mymedlife-border)]/40 p-3">
                      <p className="text-sm font-semibold text-white">{row.action}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--mymedlife-badge-background)]/70">
                        {row.target}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/52">
                        {row.reason}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </InventorySection>
          </section>

          <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
                  Live-send preflight
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {workspace.liveSendPreflight.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
                  {workspace.liveSendPreflight.summary}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                <MiniStat
                  label="Items"
                  value={`${workspace.liveSendPreflight.counts.total}`}
                />
                <MiniStat
                  label="Ready"
                  value={`${workspace.liveSendPreflight.counts.ready}`}
                />
                <MiniStat
                  label="Watch"
                  value={`${workspace.liveSendPreflight.counts.watch}`}
                />
                <MiniStat
                  label="Blocked"
                  value={`${workspace.liveSendPreflight.counts.blocked}`}
                />
                <MiniStat
                  label="Writes"
                  value={`${workspace.liveSendPreflight.counts.browserWritesEnabled}`}
                />
                <MiniStat
                  label="Sends"
                  value={`${workspace.liveSendPreflight.counts.externalWritesEnabled}`}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.liveSendPreflight.items.map((item) => (
                <PreflightCard key={item.key} item={item} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.liveSendPreflight.blockedControls.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-1 text-xs font-semibold text-white/64"
                >
                  Locked {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Blocked live controls
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.blockedControls.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-1 text-xs font-semibold text-white/64"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {workspace.safetyNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-3 text-sm leading-6 text-white/64"
                >
                  {note}
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminAppShell>
  );
}

function PreflightCard({ item }: { item: AdminLiveSendPreflightItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PreflightStatusPill status={item.status} />
          <h3 className="mt-3 text-base font-semibold text-white">{item.label}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallToken label="Writes" value={`${item.browserWritesExpected}`} />
          <SmallToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/72">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--mymedlife-badge-background)]/72">
        Required: {item.requiredEvidence}
      </p>
      <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/54">
        Current: {item.currentPosture}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-2.5 py-1 text-xs font-semibold text-white/58"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function InventorySection({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-1 text-xs font-semibold text-white/64">
          {count}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SmallToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
      {label} {value}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PreflightStatusPill({
  status,
}: {
  status: AdminLiveSendPreflightStatus;
}) {
  const className =
    status === "ready"
      ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
      : status === "watch"
        ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
        : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function ReviewStatusPill({
  status,
}: {
  status: IntegrationContractStatus;
}) {
  const className =
    status === "ready"
      ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
      : status === "watch"
        ? "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]"
        : "border-[var(--mymedlife-focus-blue)]/30 bg-[var(--mymedlife-focus-blue)]/15 text-[var(--mymedlife-badge-background)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-full border border-[var(--mymedlife-focus-blue)]/20 bg-[var(--mymedlife-focus-blue)]/10 px-3 py-1 text-xs font-semibold text-[var(--mymedlife-badge-background)]">
      {children}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-[var(--mymedlife-border)]/40 p-4 text-sm leading-6 text-white/60">
      {children}
    </p>
  );
}
