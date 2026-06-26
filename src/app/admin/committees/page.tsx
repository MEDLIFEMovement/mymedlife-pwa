import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminCommitteesWorkspace } from "@/services/admin-committees-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminCommittees");
export const dynamic = "force-dynamic";

type AdminCommitteesPageProps = {
  searchParams?: Promise<{
    focus?: string;
    section?: string;
    mode?: string;
  }>;
};

export default async function AdminCommitteesPage({
  searchParams,
}: AdminCommitteesPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getAdminCommitteesWorkspace(actor, data, resolvedSearchParams);

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="committees"
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
          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
                  Admin committees
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
                  {workspace.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-blue-200 px-4 py-2 text-sm font-semibold text-[#08224c]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Committees" value={`${workspace.counts.committees}`} />
            <MiniStat
              label="Active lanes"
              value={`${workspace.counts.activeCampaignLinks}`}
            />
            <MiniStat
              label="Template lanes"
              value={`${workspace.counts.templateLinks}`}
            />
            <MiniStat label="Browser writes" value="0" />
            <MiniStat label="External writes" value="0" />
          </section>

          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Registry controls</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep the committee registry route-owned. Reviewers should be able
                  to switch between committee lanes and campaign coverage without
                  leaving `/admin/committees`.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {workspace.sectionOptions.map((option) => (
                  <Link
                    key={option.key}
                    href={option.href}
                    aria-current={option.selected ? "page" : undefined}
                    className={
                      option.selected
                        ? "rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                        : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">
                {workspace.focusedSection.title}
              </h2>
              <Pill>{workspace.focusedSection.cards.length}</Pill>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.focusedSection.summary}
            </p>

            {workspace.focusedSection.selectedCard ? (
              <section className="mt-4 rounded-[1.5rem] border border-[#bfdbfe] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">
                  Selected in registry
                </p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {workspace.focusedSection.selectedCard.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {workspace.focusedSection.selectedCard.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {workspace.focusedSection.selectedCard.detail}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {workspace.focusedSection.selectedCard.footer}
                    </p>
                    {workspace.focusedSection.selectedCard.pills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.focusedSection.selectedCard.pills.map((pill) => (
                          <span
                            key={`${workspace.focusedSection.selectedCard?.key}-${pill}`}
                            className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-slate-600"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {workspace.focusedSection.selectedCard.workflowSnapshot ? (
                      <div className="mt-4 rounded-2xl border border-[#bfdbfe] bg-[#f8fbff] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                          Current workflow state
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                          <span className="rounded-full border border-[#bfdbfe] bg-white px-2.5 py-1">
                            {workspace.focusedSection.selectedCard.workflowSnapshot.versionLabel}
                          </span>
                          <span className="rounded-full border border-[#bfdbfe] bg-white px-2.5 py-1">
                            source{" "}
                            {workspace.focusedSection.selectedCard.workflowSnapshot.sourceKind.replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">
                          {workspace.focusedSection.selectedCard.workflowSnapshot.currentPhaseLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {workspace.focusedSection.selectedCard.workflowSnapshot.currentPhaseObjective}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Exit signal:{" "}
                          {workspace.focusedSection.selectedCard.workflowSnapshot.currentPhaseExitSignal}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{workspace.focusedSection.selectedCard.statusLabel}</Pill>
                    {workspace.focusedSection.selectedCard.href ? (
                      <Link
                        href={workspace.focusedSection.selectedCard.href}
                        className="inline-flex rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        {workspace.focusedSection.selectedCard.hrefLabel ?? "Open route"}
                      </Link>
                    ) : null}
                    {workspace.focusedSection.selectedCard.secondaryHref ? (
                      <Link
                        href={workspace.focusedSection.selectedCard.secondaryHref}
                        className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {workspace.focusedSection.selectedCard.secondaryLabel ?? "Open secondary route"}
                      </Link>
                    ) : null}
                    {workspace.focusedSection.selectedCard.configureHref ? (
                      <Link
                        href={workspace.focusedSection.selectedCard.configureHref}
                        className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                      >
                        {workspace.focusedSection.selectedCard.configureLabel ?? "Review config"}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.focusedSection.cards.map((card) => (
                <article
                  key={card.key}
                  className={[
                    "rounded-2xl border p-4",
                    workspace.focusedSection.selectedKey === card.key
                      ? "border-[#bfdbfe] bg-white"
                      : "border-[#bfdbfe] bg-[#f8fbff]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {card.title}
                      </h3>
                    </div>
                    <Pill>{card.statusLabel}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {card.footer}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={card.focusHref}
                      aria-current={workspace.focusedSection.selectedKey === card.key ? "page" : undefined}
                      className={
                        workspace.focusedSection.selectedKey === card.key
                          ? "rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                          : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
                      }
                    >
                      {workspace.focusedSection.selectedKey === card.key
                        ? "Selected"
                        : "Open in registry"}
                    </Link>
                    {card.href ? (
                      <Link
                        href={card.href}
                        className="rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        {card.hrefLabel ?? "Open route"}
                      </Link>
                    ) : null}
                    {card.secondaryHref ? (
                      <Link
                        href={card.secondaryHref}
                        className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {card.secondaryLabel ?? "Open secondary route"}
                      </Link>
                    ) : null}
                    {card.configureHref ? (
                      <Link
                        href={card.configureHref}
                        className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                      >
                        {card.configureLabel ?? "Review config"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {workspace.configState ? (
            <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                    Mock-safe configuration
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.configState.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {workspace.configState.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workspace.configState.pills.map((pill) => (
                      <Pill key={`${workspace.configState?.mode}-${pill}`}>{pill}</Pill>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={workspace.configState.returnHref}
                    className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    Return to registry
                  </Link>
                  {workspace.configState.primaryHref ? (
                    <Link
                      href={workspace.configState.primaryHref}
                      className="inline-flex rounded-full bg-[#2563eb] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {workspace.configState.primaryLabel ?? "Open primary route"}
                    </Link>
                  ) : null}
                  {workspace.configState.secondaryHref ? (
                    <Link
                      href={workspace.configState.secondaryHref}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                    >
                      {workspace.configState.secondaryLabel ?? "Open secondary route"}
                    </Link>
                  ) : null}
                  {workspace.configState.proposalHref ? (
                    <Link
                      href={workspace.configState.proposalHref}
                      className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8]"
                    >
                      {workspace.configState.proposalLabel ?? "Open proposal in builder"}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {workspace.configState.rows.map((row) => (
                  <article
                    key={row.label}
                    className="rounded-2xl border border-[#bfdbfe] bg-white p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {row.label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{row.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{row.note}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {workspace.configState.guardrails.map((item) => (
                  <p
                    key={item}
                    className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-3 text-sm leading-6 text-slate-600"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
              Guardrails
            </p>
            <div className="mt-4 grid gap-2">
              {workspace.guardrails.map((item) => (
                <p
                  key={item}
                  className="rounded-2xl border border-[#bfdbfe] bg-white p-3 text-sm leading-6 text-slate-600"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminAppShell>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-[#bfdbfe] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{props.value}</p>
    </article>
  );
}

function Pill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-slate-600">
      {props.children}
    </span>
  );
}
