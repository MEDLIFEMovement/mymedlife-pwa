import Link from "next/link";
import type { ReactNode } from "react";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminWorkflowsWorkspace } from "@/services/admin-workflows-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminWorkflows");
export const dynamic = "force-dynamic";

type AdminWorkflowsPageProps = {
  searchParams?: Promise<{
    focus?: string;
    section?: string;
  }>;
};

export default async function AdminWorkflowsPage({
  searchParams,
}: AdminWorkflowsPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getAdminWorkflowsWorkspace(actor, data, resolvedSearchParams);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav current="workflows" />

      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="rounded-[2rem] border border-white/12 bg-[#141f3d] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                  Admin workflows
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                  {workspace.summary}
                </p>
              </div>
              <Link
                href={workspace.nextStep.href}
                className="w-fit rounded-full bg-sky-200 px-4 py-2 text-sm font-semibold text-[#10203a]"
              >
                {workspace.nextStep.label}
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Workflow lanes" value={`${workspace.counts.lanes}`} />
            <MiniStat
              label="Onboarding steps"
              value={`${workspace.counts.onboardingSteps}`}
            />
            <MiniStat
              label="Write operations"
              value={`${workspace.counts.writeOperations}`}
            />
            <MiniStat label="Browser writes" value="0" />
            <MiniStat label="External writes" value="0" />
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Registry controls</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
                  Keep the workflow registry route-owned. Each section and selected
                  record should stay on `/admin/workflows` instead of turning into
                  a disconnected backend screen.
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
                        ? "rounded-full bg-sky-200 px-3 py-1.5 text-sm font-semibold text-[#10203a]"
                        : "rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#071d1a]/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">
                {workspace.focusedSection.title}
              </h2>
              <Pill>{workspace.focusedSection.cards.length}</Pill>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
              {workspace.focusedSection.summary}
            </p>

            {workspace.focusedSection.selectedCard ? (
              <section className="mt-4 rounded-[1.5rem] border border-sky-200/18 bg-sky-200/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                  Selected in registry
                </p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-100/72">
                      {workspace.focusedSection.selectedCard.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {workspace.focusedSection.selectedCard.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">
                      {workspace.focusedSection.selectedCard.detail}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-sky-100/78">
                      {workspace.focusedSection.selectedCard.footer}
                    </p>
                    {workspace.focusedSection.selectedCard.pills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.focusedSection.selectedCard.pills.map((pill) => (
                          <span
                            key={`${workspace.focusedSection.selectedCard?.key}-${pill}`}
                            className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/72"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>{workspace.focusedSection.selectedCard.statusLabel}</Pill>
                    {workspace.focusedSection.selectedCard.href ? (
                      <Link
                        href={workspace.focusedSection.selectedCard.href}
                        className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        {workspace.focusedSection.selectedCard.hrefLabel ?? "Open route"}
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
                      ? "border-sky-200/24 bg-sky-200/10"
                      : "border-white/10 bg-black/20",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-100/72">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {card.title}
                      </h3>
                    </div>
                    <Pill>{card.statusLabel}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/66">
                    {card.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-sky-100/72">
                    {card.footer}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={card.focusHref}
                      aria-current={workspace.focusedSection.selectedKey === card.key ? "page" : undefined}
                      className={
                        workspace.focusedSection.selectedKey === card.key
                          ? "rounded-full bg-sky-200 px-3 py-1.5 text-sm font-semibold text-[#10203a]"
                          : "rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                      }
                    >
                      {workspace.focusedSection.selectedKey === card.key
                        ? "Selected"
                        : "Open in registry"}
                    </Link>
                    {card.href ? (
                      <Link
                        href={card.href}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        {card.hrefLabel ?? "Open route"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

        </>
      )}
    </AppShell>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#071d1a]/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{props.value}</p>
    </article>
  );
}

function Pill(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/72">
      {props.children}
    </span>
  );
}
