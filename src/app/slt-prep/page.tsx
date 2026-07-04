import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { FigmaMissingPageNotice } from "@/components/figma-missing-page-notice";
import { WorkspaceAccountMenu } from "@/components/workspace-account-menu";
import {
  SltPrepMiniStat,
  SltPrepSectionCard,
  SltPrepTonePill,
} from "@/components/slt-prep-primitives";
import { SltPrepSubnav } from "@/components/slt-prep-subnav";
import { RestrictedState } from "@/components/restricted-state";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  getSltTripPrepWorkspace,
  sltTripPrepMobileQuickNavItems,
  sltTripPrepSubnavItems,
} from "@/services/slt-trip-prep-workspace";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("sltPrep");
export const dynamic = "force-dynamic";

export default async function SltPrepPage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getSltTripPrepWorkspace(actor);

  return (
    <AppShell actor={actor} mobileQuickItemsOverride={[...sltTripPrepMobileQuickNavItems]}>
      <WorkspaceAccountMenu actor={actor} currentWorkspace="slt_prep" />
      <DataSourceNotice source={data.source} />
      <FigmaMissingPageNotice
        route="/app/slt-prep and /slt-prep"
        expectedSource="Final SLT Prep Figma export"
        currentSurface="Existing traveler readiness workflow, not Chapter content"
        nextStep="Replace this notice when the finished SLT Prep Figma code is available"
      />
      <SltPrepSubnav items={[...sltTripPrepSubnavItems]} />

      {!workspace.canReadWorkspace || !workspace.traveler ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref={workspace.nextStep.href}
          nextLabel={workspace.nextStep.label}
        />
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#083f8f_0%,#0b4f9b_52%,#081b3c_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.38)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f7d05e]">
                  {workspace.traveler.tripLabel}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {workspace.traveler.displayName}
                </h1>
                <p className="mt-2 text-sm font-medium text-white/72">
                  {workspace.traveler.chapterName} • {workspace.traveler.cityLabel}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/82">
                  {workspace.summary}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <SltPrepTonePill
                    tone={workspace.readiness.tone}
                    label={workspace.readiness.label}
                  />
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
                    {workspace.countdownLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:max-w-xs">
                <Link
                  href={workspace.nextStep.href}
                  className="inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
                >
                  {workspace.nextStep.label}
                </Link>
                <p className="text-sm leading-6 text-white/74">{workspace.nextStep.summary}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SltPrepMiniStat
              label="Readiness"
              value={`${workspace.readiness.score}%`}
              note="Calculated from checklist completion posture"
            />
            <SltPrepMiniStat
              label="Alerts"
              value={`${workspace.counts.alerts}`}
              note="Red, yellow, and green traveler signals"
            />
            <SltPrepMiniStat
              label="Checklist"
              value={`${workspace.counts.checklistComplete}/${workspace.counts.checklistTotal}`}
              note="Completed readiness checkpoints"
            />
            <SltPrepMiniStat
              label="Meetings left"
              value={`${workspace.counts.meetingsRemaining}`}
              note="Upcoming pre-departure touchpoints"
            />
          </section>

          <SltPrepSectionCard eyebrow="Alerts" title="What needs attention right now?">
            <div className="grid gap-3">
              {workspace.traveler.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 transition hover:border-[#f7d05e]/35 hover:bg-white/[0.07]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <SltPrepTonePill tone={alert.tone} label={alert.label} />
                      <p className="max-w-2xl text-sm leading-6 text-white/72">
                        {alert.summary}
                      </p>
                    </div>
                    <div className="text-right text-xs leading-5 text-white/56">
                      <p>{alert.owner}</p>
                      <p>{alert.dueLabel}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SltPrepSectionCard>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workspace.sectionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-4 transition hover:border-[#f7d05e]/35 hover:bg-[#0d2b63]"
              >
                <SltPrepTonePill tone={link.tone} label={link.label} />
                <p className="mt-3 text-sm leading-6 text-white/68">{link.helper}</p>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SltPrepSectionCard eyebrow="Flights" title="Current travel plan">
              <div className="grid gap-3">
                {workspace.traveler.flights.map((flight) => (
                  <article
                    key={flight.id}
                    className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{flight.label}</p>
                        <p className="mt-1 text-sm text-white/64">{flight.route}</p>
                      </div>
                      <SltPrepTonePill
                        tone={
                          flight.status === "missing"
                            ? "red"
                            : flight.status === "watch"
                              ? "yellow"
                              : "green"
                        }
                        label={flight.status.replace("_", " ")}
                      />
                    </div>
                    <p className="mt-3 text-sm text-white/58">{flight.timingLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{flight.summary}</p>
                  </article>
                ))}
              </div>
            </SltPrepSectionCard>

            <SltPrepSectionCard eyebrow="Boundaries" title="Mock-safe integration posture">
              <div className="grid gap-3">
                {workspace.safetyNotes.map((note) => (
                  <p
                    key={note}
                    className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/68"
                  >
                    {note}
                  </p>
                ))}
              </div>
            </SltPrepSectionCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
