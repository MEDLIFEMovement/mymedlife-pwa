import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { AdminAppShell } from "@/components/admin-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import {
  PanelButton,
  SurfacePanel,
  SurfaceTable,
  SurfaceTd,
  SurfaceTableRow,
  SurfaceTh,
  StatusPill,
  VisualTabStrip,
} from "@/components/visual-primitives";
import { RestrictedState } from "@/components/restricted-state";
import { getAdminPermissionsWorkspace } from "@/services/admin-permissions-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("adminPermissions");
export const dynamic = "force-dynamic";

type AdminPermissionsPageProps = {
  searchParams?: Promise<{
    focus?: string;
    section?: string;
    permission?: string;
  }>;
};

export default async function AdminPermissionsPage({
  searchParams,
}: AdminPermissionsPageProps) {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = getAdminPermissionsWorkspace(
    actor,
    undefined,
    resolvedSearchParams,
  );

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="permissions"
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
          <SurfacePanel className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mymedlife-primary-button)]">
                  Admin permissions
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-right">
                <p className="w-full text-xs text-slate-500 lg:w-auto">
                  {workspace.nextStep.detail}
                </p>
                <PanelButton
                  href={workspace.nextStep.href}
                  className="rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                >
                  {workspace.nextStep.label}
                </PanelButton>
              </div>
            </div>
          </SurfacePanel>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniStat label="Personas" value={`${workspace.counts.personas}`} />
            <MiniStat
              label="Canonical roles"
              value={`${workspace.counts.canonicalRoles}`}
            />
            <MiniStat
              label="Backend routes"
              value={`${workspace.counts.backendRoutes}`}
            />
            <MiniStat label="Browser writes" value="0" />
            <MiniStat label="External writes" value="0" />
          </section>

          <SurfacePanel as="section" className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Registry controls
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Keep the permissions registry route-owned. Reviewers should be
                  able to move between route families and local personas without
                  turning this backend lane into a disconnected set of pages.
                </p>
              </div>
              <VisualTabStrip
                label="Permission section selector"
                items={workspace.sectionOptions.map((option) => ({
                  href: option.href,
                  label: option.label,
                  active: option.selected,
                }))}
                className="w-full lg:max-w-md"
              />
            </div>
          </SurfacePanel>

          <SurfacePanel as="section" className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">
                {workspace.focusedSection.title}
              </h2>
              <StatusPill tone="blue">
                {workspace.focusedSection.cards.length}
              </StatusPill>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {workspace.focusedSection.summary}
            </p>

            {workspace.focusedSection.selectedCard ? (
              <SurfacePanel
                as="section"
                className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mymedlife-primary-button)]">
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
                    <p className="mt-3 text-sm leading-6 text-[var(--mymedlife-primary-button)]">
                      {workspace.focusedSection.selectedCard.footer}
                    </p>
                    {workspace.focusedSection.selectedCard.pills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.focusedSection.selectedCard.pills.map((pill) => (
                          <StatusPill
                            key={`${workspace.focusedSection.selectedCard?.key}-${pill}`}
                            tone="white"
                          >
                            {pill}
                          </StatusPill>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="white">
                      {workspace.focusedSection.selectedCard.statusLabel}
                    </StatusPill>
                    {workspace.focusedSection.selectedCard.href ? (
                      <PanelButton
                        href={workspace.focusedSection.selectedCard.href}
                        variant="secondary"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {workspace.focusedSection.selectedCard.hrefLabel ??
                          "Open route"}
                      </PanelButton>
                    ) : null}
                  </div>
                </div>
              </SurfacePanel>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {workspace.focusedSection.cards.map((card) => (
                <article
                  key={card.key}
                  className={[
                    "rounded-2xl border p-4",
                    workspace.focusedSection.selectedKey === card.key
                      ? "border-[var(--mymedlife-border)] bg-[var(--mymedlife-badge-background)]"
                      : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {card.title}
                      </h3>
                    </div>
                    <StatusPill tone="blue">{card.statusLabel}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--mymedlife-primary-button)]">
                    {card.footer}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PanelButton
                      href={card.focusHref}
                      variant={
                        workspace.focusedSection.selectedKey === card.key
                          ? "primary"
                          : "secondary"
                      }
                      className={
                        workspace.focusedSection.selectedKey === card.key
                          ? "rounded-full bg-[var(--mymedlife-primary-button)] px-3 py-1.5 text-sm font-semibold text-white"
                          : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      }
                    >
                      {workspace.focusedSection.selectedKey === card.key
                        ? "Selected"
                        : "Open in registry"}
                    </PanelButton>
                    {card.href ? (
                      <PanelButton
                        href={card.href}
                        variant="secondary"
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        {card.hrefLabel ?? "Open route"}
                      </PanelButton>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </SurfacePanel>

          <SurfacePanel as="section" className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
              Workflow permission inventory
            </p>
            <SurfaceTable wrapperClassName="mt-4" className="min-w-[1080px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <SurfaceTh>Workflow</SurfaceTh>
                  <SurfaceTh>Operation</SurfaceTh>
                  <SurfaceTh>Allowed Roles</SurfaceTh>
                  <SurfaceTh>Scopes</SurfaceTh>
                  <SurfaceTh>Approval Needed</SurfaceTh>
                  <SurfaceTh>Authority Status</SurfaceTh>
                  <SurfaceTh>Backend Only</SurfaceTh>
                  <SurfaceTh>Review</SurfaceTh>
                </tr>
              </thead>
              <tbody>
                {workspace.workflowPermissionInventory.map((row) => (
                  <SurfaceTableRow key={row.key}>
                    <SurfaceTd>
                      <div>
                        <p className="font-semibold text-slate-950">{row.workflowName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {row.workflowSlug} · {row.versionLabel}
                        </p>
                      </div>
                    </SurfaceTd>
                    <SurfaceTd className="text-sm text-slate-600">
                      {row.operation.replaceAll("_", " ")}
                    </SurfaceTd>
                    <SurfaceTd className="text-sm leading-6 text-slate-600">
                      {row.allowedRoles.join(", ").replaceAll("_", " ")}
                    </SurfaceTd>
                    <SurfaceTd className="text-sm leading-6 text-slate-600">
                      {row.allowedScopes.join(", ").replaceAll("_", " ")}
                    </SurfaceTd>
                    <SurfaceTd className="text-sm text-slate-600">
                      {row.approvalRequired ? "Yes" : "No"}
                    </SurfaceTd>
                    <SurfaceTd className="text-sm text-slate-600">
                      {row.authorityStatus.replaceAll("_", " ")}
                    </SurfaceTd>
                    <SurfaceTd className="text-sm text-slate-600">
                      {row.backendOnly ? "Yes" : "No"}
                    </SurfaceTd>
                    <SurfaceTd>
                      <PanelButton
                        href={`/admin/permissions?section=${workspace.selectedSection}&focus=${encodeURIComponent(
                          workspace.focusedSection.selectedKey ?? "",
                        )}&permission=${encodeURIComponent(row.key)}`}
                        variant="secondary"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        Review config
                      </PanelButton>
                    </SurfaceTd>
                  </SurfaceTableRow>
                ))}
              </tbody>
            </SurfaceTable>
          </SurfacePanel>

          {workspace.permissionConfigState ? (
            <SurfacePanel className="rounded-[2rem] border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
                    Mock-safe configuration
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.permissionConfigState.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {workspace.permissionConfigState.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PanelButton
                    href={workspace.permissionConfigState.returnHref}
                    variant="secondary"
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    Return to registry
                  </PanelButton>
                  <PanelButton
                    href={workspace.permissionConfigState.builderHref}
                    className="rounded-full bg-[var(--mymedlife-primary-button)] px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Open SOP builder
                  </PanelButton>
                  <PanelButton
                    href={workspace.permissionConfigState.proposalHref}
                    variant="secondary"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    Open proposal in builder
                  </PanelButton>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {workspace.permissionConfigState.rows.map((row) => (
                  <article
                    key={row.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mymedlife-primary-button)]">
                      {row.label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{row.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {row.note}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {workspace.permissionConfigState.guardrails.map((item) => (
                  <p
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </SurfacePanel>
          ) : null}

          <SurfacePanel
            className="rounded-[2rem] border border-[var(--mymedlife-border)]/20 bg-[var(--mymedlife-border)]/10 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-badge-background)]/80">
              Guardrails
            </p>
            <div className="mt-4 grid gap-2">
              {workspace.guardrails.map((item) => (
                <p
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                >
                  {item}
                </p>
              ))}
            </div>
          </SurfacePanel>
        </>
      )}
    </AdminAppShell>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <SurfacePanel as="article" className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--mymedlife-primary-button)]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{props.value}</p>
    </SurfacePanel>
  );
}
