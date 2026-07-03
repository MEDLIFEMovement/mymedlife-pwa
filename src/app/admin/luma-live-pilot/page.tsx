import type { ReactNode } from "react";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { RestrictedState } from "@/components/restricted-state";
import {
  getPilotCrossRoleEventProof,
  getPilotEventLoopReadModel,
} from "@/services/event-loop";
import {
  getChapterLumaRolloutWorkspace,
} from "@/services/chapter-luma-rollout-workspace";
import { getLumaLivePilotGateDurable } from "@/services/luma-live-pilot";
import { getLumaPilotPersistenceReadiness } from "@/services/luma-live-pilot-persistence";
import {
  getDefaultLinkedLaunchLaneEventOption,
  getLinkedLaunchLaneEventOptions,
} from "@/services/launch-lane-linked-events";
import { getLocalActorContext } from "@/services/local-actor-context";
import {
  getReadOnlyAppData,
} from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import {
  runLumaAttendanceImportAction,
  runLumaEventUpsertAction,
  runLumaRsvpWriteAction,
  saveChapterLumaCalendarAction,
} from "./actions";

export const metadata = getStaticRouteMetadata("adminLumaLivePilot");
export const dynamic = "force-dynamic";

type LumaLivePilotPageProps = {
  searchParams?: Promise<{
    lumaResult?: string;
    lumaMessage?: string;
  }>;
};

export default async function LumaLivePilotPage({
  searchParams,
}: LumaLivePilotPageProps) {
  const [actor, data, resolvedSearchParams, proofReadiness] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ? searchParams : Promise.resolve(undefined),
    getLumaPilotPersistenceReadiness(),
  ]);
  const canRead = canReadAdminIntegrationsSecurity(actor);
  const gate = await getLumaLivePilotGateDurable();
  const chapterRollout = getChapterLumaRolloutWorkspace({
    chapters: data.chapterRows,
    persistedRows: data.chapterLumaCalendarRows,
  });
  const chapterCalendars = chapterRollout.summary;
  const chapterRolloutStages = chapterRollout.stages;
  const mappingEnvironment =
    gate.environment === "local" || gate.environment === "production"
      ? gate.environment
      : "staging";
  const linkedEventOptions = getLinkedLaunchLaneEventOptions(data);
  const defaultLinkedEventOption = getDefaultLinkedLaunchLaneEventOption(data);
  const eventLoop = getPilotEventLoopReadModel({
    mode: "staging",
    data,
  });
  const crossRoleProof = getPilotCrossRoleEventProof({
    mode: "staging",
    data,
  });
  const result = normalizeResult(resolvedSearchParams?.lumaResult);
  const message = resolvedSearchParams?.lumaMessage ?? null;

  return (
    <AdminAppShell actor={actor}>
      <AdminBackendLaneNav current="luma_live_pilot" showIntegrations={canRead} />

      {!canRead ? (
        <RestrictedState
          title="Luma live pilot restricted"
          message="Only DS Admin and Super Admin can run staging Luma write or import controls."
          nextHref="/admin"
          nextLabel="Back to admin"
        />
      ) : (
        <main className="space-y-5">
          <section className="app-surface-info rounded-[2rem] p-5">
            <p className="app-eyebrow app-eyebrow-blue">Staging Luma pilot</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">
                  Turn on the event, RSVP, and attendance loop for staging.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  These controls call Luma from the server only. They are scoped to staging,
                  suppress Luma update notifications, keep RSVP email sending off, and
                  leave production Luma plus n8n execution disabled.
                </p>
              </div>
              <a
                href="/admin/integration-outbox?source=luma-live-pilot"
                className="w-fit rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
              >
                Open outbox
              </a>
            </div>
          </section>

          {message ? (
            <section
              className={`rounded-2xl border p-4 text-sm font-semibold ${
                result === "success"
                  ? "border-[var(--mymedlife-border)] bg-[var(--background)] text-[var(--mymedlife-info)]"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MiniStat
              label="Event writes"
              value={gate.eventWritesEnabled ? "On" : "Off"}
            />
            <MiniStat
              label="RSVP writes"
              value={gate.rsvpWritesEnabled ? "On" : "Off"}
            />
            <MiniStat
              label="Attendance import"
              value={gate.attendanceImportEnabled ? "On" : "Off"}
            />
            <MiniStat label="Production" value={gate.productionBlocked ? "Blocked" : "Off"} />
            <MiniStat label="Proof rows" value={proofReadiness.ready ? "Ready" : "Blocked"} />
          </section>

          <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">Event and points evidence</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  RSVP, attendance, and leaderboard impact stay tied together.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  This readback is the staging pilot proof path reviewers should compare
                  against the live Luma controls below. These counters are cumulative staging
                  proof totals, while the success banner above is the latest event-specific
                  result. Review both before treating a single import as points-ready.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <Pill>{eventLoop.providerStatusLabel}</Pill>
                <Pill>{eventLoop.summary.duplicatePointsPrevented ? "deduped points" : "review points"}</Pill>
                <Pill>{eventLoop.summary.externalWritesEnabled ? "external writes on" : "external sends off"}</Pill>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MiniStat
                label="RSVPs"
                value={`${eventLoop.summary.rsvpCount}`}
              />
              <MiniStat
                label="Attendance"
                value={`${eventLoop.summary.attendanceCount}`}
              />
              <MiniStat
                label="Points"
                value={`${eventLoop.summary.pointsAwarded}`}
              />
              <MiniStat
                label="Leaderboard"
                value={eventLoop.summary.pointsAwarded > 0 ? "Updated" : "Pending"}
              />
              <MiniStat
                label="Outbox sends"
                value={eventLoop.summary.externalWritesEnabled ? "Review" : "0"}
              />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {eventLoop.sequence.map((step) => (
                <article
                  key={step.eventType}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mymedlife-primary-button)]">
                    {step.eventType}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-950">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {step.detail}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ...eventLoop.safetyNotes,
                "Audit/outbox review remains visible before pilot expansion.",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-[var(--background)] px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">Cross-role readback</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Review the same event story in every workspace.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Hosted proof is only complete when member, leader, staff, and admin
                  surfaces all tell the same event-to-points story after RSVP and
                  attendance import.
                </p>
              </div>
              <a
                href="/admin/launch-gate"
                className="w-fit rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-primary-button)] transition hover:bg-[var(--mymedlife-surface-hover)]"
              >
                Back to launch gate
              </a>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              {crossRoleProof.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">{card.title}</h3>
                    <Pill>{card.verdict === "ready" ? "ready" : "needs proof"}</Pill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
                  <div className="mt-3 grid gap-2">
                    {card.checks.map((check) => (
                      <div
                        key={`${card.id}-${check.label}`}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {check.label}
                          </p>
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
                              check.status === "ready"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {check.status === "ready" ? "ready" : "review"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{check.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.routeLinks.map((link) => (
                      <a
                        key={`${card.id}-${link.href}`}
                        href={link.href}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[var(--mymedlife-border)] hover:text-[var(--mymedlife-primary-button)]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--mymedlife-border)] bg-[var(--background)] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">Current gate</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {gate.enabledOperations} staging operation
                  {gate.enabledOperations === 1 ? "" : "s"} enabled
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {gate.detail}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <Pill>{gate.environment}</Pill>
                <Pill>{gate.apiKeyConfigured ? "key configured" : "key missing"}</Pill>
                <Pill>
                  {gate.calendarIdConfigured ? "calendar configured" : "calendar missing"}
                </Pill>
                <Pill>{proofReadiness.ready ? "proof rows ready" : "proof rows blocked"}</Pill>
              </div>
            </div>
            <p
              className={[
                "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
                proofReadiness.ready
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              ].join(" ")}
            >
              {proofReadiness.message}
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">Chapter calendar coverage</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Keep chapter-to-Luma mapping simple before scaling.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {chapterCalendars.detail}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <MiniStat label="Seeded chapters" value={`${chapterCalendars.totalCount}`} />
                <MiniStat label="Ready now" value={`${chapterCalendars.readyCount}`} />
                <MiniStat label="Saved maps" value={`${chapterCalendars.savedReadyCount}`} />
                <MiniStat label="Temporary maps" value={`${chapterCalendars.temporaryReadyCount}`} />
                <MiniStat label="Needs setup" value={`${chapterCalendars.needsSetupCount}`} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--mymedlife-border)] bg-[var(--background)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Save chapter mapping
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Store the chapter calendar in myMEDLIFE.
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    This is the simplest scale-up step: choose a visible chapter, paste the
                    Luma calendar id, and save it for the current {mappingEnvironment} event
                    loop. Use the shared default only for the narrow pilot.
                  </p>
                </div>
                <Pill>{mappingEnvironment}</Pill>
              </div>

              <form action={saveChapterLumaCalendarAction} className="mt-4 grid gap-4 xl:grid-cols-2">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <input type="hidden" name="environment" value={mappingEnvironment} />

                <Field label="Chapter">
                  <select
                    name="chapterId"
                    defaultValue={
                      chapterCalendars.rows.find((row) => !row.wideningReady)?.chapterId ??
                      chapterCalendars.rows[0]?.chapterId ??
                      ""
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none"
                  >
                    {chapterCalendars.rows.map((row) => (
                      <option key={`chapter-mapping-${row.chapterId}`} value={row.chapterId}>
                        {row.chapterName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Luma calendar id">
                  <input
                    type="text"
                    name="calendarId"
                    placeholder="cal-..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Calendar label">
                  <input
                    type="text"
                    name="calendarLabel"
                    placeholder="UCLA chapter calendar"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Reason for the audit log">
                  <input
                    type="text"
                    name="reason"
                    placeholder="Save UCLA for the staging event loop."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Optional reviewer note about this chapter mapping."
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </Field>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">Pilot default</p>
                  <label className="mt-3 flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input
                      type="checkbox"
                      name="isDefault"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--mymedlife-primary-button)]"
                    />
                    <span>
                      Mark this chapter as the shared default for the current {mappingEnvironment}
                      pilot lane. Keep this narrow and temporary.
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="mt-4 inline-flex items-center rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)]"
                  >
                    Save chapter mapping
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              {chapterRolloutStages.map((stage) => (
                <article
                  key={stage.key}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {stage.label}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {stage.mappedChapters} / {stage.targetChapters}
                      </h3>
                    </div>
                    <Pill>{stage.status === "ready" ? "ready" : "blocked"}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {stage.detail}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pilot chapter
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {chapterRollout.pilotChapter?.chapterName ?? "No pilot chapter selected yet"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {chapterRollout.pilotChapter
                    ? `${chapterRollout.pilotChapter.statusLabel} • ${chapterRollout.pilotChapter.note}`
                    : "Save one chapter calendar first so the staging pilot does not stay abstract."}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  First five chapter plan
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {chapterRollout.firstFivePlan.mappedNowCount} / {chapterRollout.firstFivePlan.targetChapters} ready
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {chapterRollout.firstFivePlan.detail}
                </p>
                {chapterRollout.firstFivePlan.caution ? (
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    {chapterRollout.firstFivePlan.caution}
                  </p>
                ) : null}
              </article>

              <article className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Next rollout action
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  {chapterRollout.nextAction.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {chapterRollout.nextAction.detail}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Next chapters to map
                </p>
                <div className="mt-2 grid gap-2">
                  {chapterRollout.firstFivePlan.chaptersToMapNext.length > 0 ? (
                    chapterRollout.firstFivePlan.chaptersToMapNext.map((row) => (
                      <div
                        key={`admin-next-map-${row.chapterId}`}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-950">{row.chapterName}</p>
                        <p className="mt-1 text-xs text-slate-600">{row.campus} • {row.region}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-slate-600">
                      The visible first-five chapter set is already mapped. Focus on event-loop proof before broadening the rollout.
                    </p>
                  )}
                </div>
              </article>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {[chapterRollout.scaleGaps.wave25, chapterRollout.scaleGaps.wave300].map((gap) => (
                <article
                  key={gap.label}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {gap.label}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {gap.explicitMappedCount} explicit / {gap.targetChapters}
                      </h3>
                    </div>
                    <Pill>{gap.remainingExplicitMaps === 0 ? "ready" : `${gap.remainingExplicitMaps} left`}</Pill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{gap.detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {chapterCalendars.rows.map((row) => (
                <article
                  key={row.chapterId}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{row.chapterName}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {row.campus} · {row.region}
                      </p>
                    </div>
                    <Pill>{row.readyForPilot ? "pilot ready" : "setup needed"}</Pill>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{row.note}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {row.calendarLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {row.mappingSourceLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {row.calendarIdHint ? `Calendar ${row.calendarIdHint}` : "No calendar id yet"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="app-eyebrow app-eyebrow-blue">Hosted reviewer proof</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Use this route as the staging evidence checklist.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  A reviewer should complete these checks on staging.mymedlife.org
                  from a signed-in Vercel SSO session, then record screenshots or
                  route evidence before any live pilot approval.
                </p>
              </div>
              <a
                href="/admin/audit-log"
                className="w-fit rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--mymedlife-primary-button)] transition hover:bg-[var(--mymedlife-surface-hover)]"
              >
                Open audit log
              </a>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {[
                {
                  label: "Reviewer access path",
                  detail:
                    "Open staging.mymedlife.org, pass Vercel SSO, sign in as an approved DS/Admin reviewer, then open /admin/luma-live-pilot.",
                },
                {
                  label: "Luma event create/update",
                  detail:
                    "Run the event form only when the staging gate says event writes are On, then record the returned Luma event id.",
                },
                {
                  label: "RSVP writeback",
                  detail:
                    "Write the approved reviewer RSVP to that event with Luma email sending suppressed, then verify the guest appears in Luma's approved guest list before treating the RSVP lane as proven.",
                },
                {
                  label: "Attendance import",
                  detail:
                    "After the approved guest is visible in Luma, complete a real host-side Luma check-in for that guest, then import the same event and confirm the page returns attendance rows without QR codes or secrets.",
                },
                {
                  label: "Points and leaderboard readback",
                  detail:
                    "Confirm this page, member surfaces, leader surfaces, and staff/admin surfaces show the same event-to-points story.",
                },
                {
                  label: "Audit/outbox safety",
                  detail:
                    "Open /admin/audit-log and /admin/integration-outbox to confirm audit visibility and zero unapproved external sends.",
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-[var(--background)] p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-950">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <LivePilotForm title="Create or update Luma event" detail="Leave event id blank to create a staging event. Add an event id to update an existing Luma event with notifications suppressed.">
              <form action={runLumaEventUpsertAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <Field label="Chapter">
                  <select
                    required
                    name="chapterId"
                    className={inputClassName}
                    defaultValue={
                      chapterCalendars.rows.find((row) => row.readyForPilot)?.chapterId ??
                      chapterCalendars.rows[0]?.chapterId ??
                      ""
                    }
                  >
                    {chapterCalendars.rows.map((row) => (
                      <option key={row.chapterId} value={row.chapterId}>
                        {row.chapterName} - {row.readyForPilot ? row.calendarLabel : "Needs setup"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Event id for update">
                  <input name="eventId" className={inputClassName} placeholder="evt-..." />
                </Field>
                <Field label="Event name">
                  <input
                    required
                    name="name"
                    className={inputClassName}
                    defaultValue="myMEDLIFE Staging Luma Pilot Event"
                  />
                </Field>
                <Field label="Start time">
                  <input
                    required
                    name="startAt"
                    className={inputClassName}
                    defaultValue="2026-07-20T23:00:00.000Z"
                  />
                </Field>
                <Field label="End time">
                  <input
                    name="endAt"
                    className={inputClassName}
                    defaultValue="2026-07-21T00:00:00.000Z"
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    required
                    name="timezone"
                    className={inputClassName}
                    defaultValue="America/Los_Angeles"
                  />
                </Field>
                <Field label="Address">
                  <input
                    name="address"
                    className={inputClassName}
                    defaultValue="UCLA, Los Angeles, CA"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    name="descriptionMd"
                    className={inputClassName}
                    rows={4}
                    defaultValue="Staging pilot event created from myMEDLIFE. Do not use for production launch."
                  />
                </Field>
                <SubmitButton disabled={!gate.eventWritesEnabled || !proofReadiness.ready}>
                  Create/update Luma event
                </SubmitButton>
                {!proofReadiness.ready ? (
                  <FormBlockerNote message={proofReadiness.message} />
                ) : null}
              </form>
            </LivePilotForm>

            <LivePilotForm title="Write RSVP back to Luma" detail="Adds one guest as Going with send_email=false so Luma does not send email/SMS from this pilot control. Start from the mapped chapter event, then treat the lane as passed only after that guest appears in Luma's approved guest list.">
              <form action={runLumaRsvpWriteAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                {linkedEventOptions.length > 0 ? (
                  <Field label="Mapped Luma event">
                    <select
                      required
                      name="chapterEventId"
                      className={inputClassName}
                      defaultValue={defaultLinkedEventOption?.chapterEventId ?? ""}
                    >
                      {linkedEventOptions.map((option) => (
                        <option key={`${option.chapterEventId}-${option.eventId}`} value={option.chapterEventId}>
                          {option.optionLabel}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    Create or update a mapped chapter event first. RSVP proof only opens after myMEDLIFE has linked that chapter event to Luma.
                  </p>
                )}
                <Field label="Guest email">
                  <input
                    required
                    name="email"
                    type="email"
                    className={inputClassName}
                    defaultValue="nellis@medlifemovement.org"
                  />
                </Field>
                <Field label="Guest name">
                  <input
                    name="name"
                    className={inputClassName}
                    defaultValue="Nick Ellis"
                  />
                </Field>
                <SubmitButton
                  disabled={
                    !gate.rsvpWritesEnabled ||
                    !proofReadiness.ready ||
                    linkedEventOptions.length === 0
                  }
                >
                  Write RSVP to Luma
                </SubmitButton>
                {linkedEventOptions.length > 0 ? (
                  <p className="text-xs leading-5 text-slate-500">
                    Choose a mapped chapter event instead of typing ids by hand. The server resolves the linked Luma event from that chapter event.
                  </p>
                ) : null}
                {!proofReadiness.ready ? (
                  <FormBlockerNote message={proofReadiness.message} />
                ) : null}
              </form>
            </LivePilotForm>

            <LivePilotForm title="Import attendance from Luma" detail="Reads approved guests and checked_in_at state into a browser-safe summary. Raw secrets and QR codes are not returned. To prove points, first verify the RSVP guest is visible in Luma, then complete a host-side Luma check-in because the public API does not expose a public attendee check-in write.">
              <form action={runLumaAttendanceImportAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                {linkedEventOptions.length > 0 ? (
                  <Field label="Mapped Luma event">
                    <select
                      required
                      name="chapterEventId"
                      className={inputClassName}
                      defaultValue={defaultLinkedEventOption?.chapterEventId ?? ""}
                    >
                      {linkedEventOptions.map((option) => (
                        <option key={`${option.chapterEventId}-${option.eventId}`} value={option.chapterEventId}>
                          {option.optionLabel}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    Link a chapter event to Luma first. Attendance import proof only opens from a mapped chapter event.
                  </p>
                )}
                <Field label="Rows to inspect">
                  <input
                    required
                    name="limit"
                    type="number"
                    min="1"
                    max="100"
                    className={inputClassName}
                    defaultValue="50"
                  />
                </Field>
                <SubmitButton
                  disabled={
                    !gate.attendanceImportEnabled ||
                    !proofReadiness.ready ||
                    linkedEventOptions.length === 0
                  }
                >
                  Import attendance
                </SubmitButton>
                {linkedEventOptions.length > 0 ? (
                  <p className="text-xs leading-5 text-slate-500">
                    Start from a mapped chapter event so attendance, points, and leaderboard proof stay tied to one app-owned event record.
                  </p>
                ) : null}
                {!proofReadiness.ready ? (
                  <FormBlockerNote message={proofReadiness.message} />
                ) : null}
              </form>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Review note: Luma&apos;s public API lets myMEDLIFE create events, add RSVP
                guests, update guest status, and read <code>checked_in_at</code>, but the
                pilot still relies on a human host check-in inside Luma, and the RSVP guest
                must actually appear in Luma&apos;s approved guest list, before this import
                can create attendance-backed points proof.
              </p>
            </LivePilotForm>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
            <p className="app-eyebrow app-eyebrow-blue">Still off</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "n8n execution",
                "HubSpot writes",
                "warehouse / Power BI writes",
                "SMS / email sends outside Luma RSVP suppression",
                "production Luma setup",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-[var(--background)] px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </main>
      )}
    </AdminAppShell>
  );
}

const inputClassName =
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[var(--mymedlife-primary-button)] focus:ring-2 focus:ring-[var(--mymedlife-border)]";

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-[var(--mymedlife-border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--mymedlife-info)]">
      {children}
    </span>
  );
}

function LivePilotForm({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function FormBlockerNote({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
      Proof capture is blocked: {message}
    </p>
  );
}

function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-full bg-[var(--mymedlife-primary-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mymedlife-info)] disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {children}
    </button>
  );
}

function normalizeResult(value: string | undefined) {
  return value === "success" ? "success" : value === "error" ? "error" : null;
}
