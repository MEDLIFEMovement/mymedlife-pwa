import type { ReactNode } from "react";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { RestrictedState } from "@/components/restricted-state";
import { getLumaLivePilotGateDurable } from "@/services/luma-live-pilot";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
import { getStagingLumaEventLoopReadModel } from "@/services/staging-luma-event-loop";
import {
  runLumaAttendanceImportAction,
  runLumaEventUpsertAction,
  runLumaRsvpWriteAction,
} from "./actions";

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
  const [actor, data, resolvedSearchParams] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const canRead = canReadAdminIntegrationsSecurity(actor);
  const gate = await getLumaLivePilotGateDurable();
  const eventLoop = getStagingLumaEventLoopReadModel({
    mode: "staging",
    data,
  });
  const pendingHostCheckIn = eventLoop.pendingHostCheckIn;
  const result = normalizeResult(resolvedSearchParams?.lumaResult);
  const message = resolvedSearchParams?.lumaMessage ?? null;

  return (
    <AdminAppShell actor={actor}>
      <AdminBackendLaneNav current="integration_outbox" showIntegrations={canRead} />

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

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

          {pendingHostCheckIn ? (
            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="app-eyebrow text-amber-700">Pending host step</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    One Luma guest still needs a real host-side check-in.
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                    {pendingHostCheckIn.detail}
                  </p>
                </div>
                <a
                  href={`https://luma.com/event/manage/${pendingHostCheckIn.eventId}/guests`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Open Luma guest list
                </a>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <PendingFact label="Event id" value={pendingHostCheckIn.eventId} mono />
                <PendingFact
                  label="Guest"
                  value={
                    pendingHostCheckIn.guestEmail ??
                    pendingHostCheckIn.guestEmailHint ??
                    "Review RSVP row"
                  }
                />
                <PendingFact
                  label="Last RSVP"
                  value={formatShortTimestamp(pendingHostCheckIn.lastRsvpRecordedAt)}
                />
                <PendingFact
                  label="Last import"
                  value={
                    pendingHostCheckIn.lastAttendanceImportAt
                      ? formatShortTimestamp(pendingHostCheckIn.lastAttendanceImportAt)
                      : "Not imported yet"
                  }
                />
                <PendingFact
                  label="Approved guests returned"
                  value={`${pendingHostCheckIn.importedGuestCount}`}
                />
              </div>
            </section>
          ) : null}

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
              </div>
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
                <SubmitButton disabled={!gate.eventWritesEnabled}>
                  Create/update Luma event
                </SubmitButton>
              </form>
            </LivePilotForm>

            <LivePilotForm title="Write RSVP back to Luma" detail="Adds one guest as Going with send_email=false so Luma does not send email/SMS from this pilot control. Treat the lane as passed only after that guest appears in Luma's approved guest list.">
              <form action={runLumaRsvpWriteAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <Field label="Luma event id">
                  <input
                    required
                    name="eventId"
                    className={inputClassName}
                    placeholder="evt-..."
                    defaultValue={pendingHostCheckIn?.eventId ?? ""}
                  />
                </Field>
                <Field label="Guest email">
                  <input
                    required
                    name="email"
                    type="email"
                    className={inputClassName}
                    defaultValue={pendingHostCheckIn?.guestEmail ?? "nellis@medlifemovement.org"}
                  />
                </Field>
                <Field label="Guest name">
                  <input
                    name="name"
                    className={inputClassName}
                    defaultValue="Nick Ellis"
                  />
                </Field>
                <SubmitButton disabled={!gate.rsvpWritesEnabled}>
                  Write RSVP to Luma
                </SubmitButton>
              </form>
            </LivePilotForm>

            <LivePilotForm title="Import attendance from Luma" detail="Reads approved guests and checked_in_at state into a browser-safe summary. Raw secrets and QR codes are not returned. To prove points, first verify the RSVP guest is visible in Luma, then complete a host-side Luma check-in because the public API does not expose a public attendee check-in write.">
              <form action={runLumaAttendanceImportAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <Field label="Luma event id">
                  <input
                    required
                    name="eventId"
                    className={inputClassName}
                    placeholder="evt-..."
                    defaultValue={pendingHostCheckIn?.eventId ?? ""}
                  />
                </Field>
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
                <SubmitButton disabled={!gate.attendanceImportEnabled}>
                  Import attendance
                </SubmitButton>
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

function PendingFact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        {label}
      </p>
      <p
        className={[
          "mt-2 break-words text-sm font-semibold text-slate-950",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function formatShortTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Review timestamp";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
