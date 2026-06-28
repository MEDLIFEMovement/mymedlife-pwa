import type { ReactNode } from "react";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { RestrictedState } from "@/components/restricted-state";
import { getLumaLivePilotGate } from "@/services/luma-live-pilot";
import { getLocalActorContext } from "@/services/local-actor-context";
import { canReadAdminIntegrationsSecurity } from "@/services/role-visibility";
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
  const [actor, resolvedSearchParams] = await Promise.all([
    getLocalActorContext(),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  const canRead = canReadAdminIntegrationsSecurity(actor);
  const gate = getLumaLivePilotGate();
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
                className="w-fit rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Open outbox
              </a>
            </div>
          </section>

          {message ? (
            <section
              className={`rounded-2xl border p-4 text-sm font-semibold ${
                result === "success"
                  ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
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

          <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
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

            <LivePilotForm title="Write RSVP back to Luma" detail="Adds one guest as Going with send_email=false so Luma does not send email/SMS from this pilot control.">
              <form action={runLumaRsvpWriteAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <Field label="Luma event id">
                  <input required name="eventId" className={inputClassName} placeholder="evt-..." />
                </Field>
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
                <SubmitButton disabled={!gate.rsvpWritesEnabled}>
                  Write RSVP to Luma
                </SubmitButton>
              </form>
            </LivePilotForm>

            <LivePilotForm title="Import attendance from Luma" detail="Reads approved guests and check-in status into a browser-safe summary. Raw secrets and QR codes are not returned.">
              <form action={runLumaAttendanceImportAction} className="space-y-3">
                <input type="hidden" name="returnTo" value="/admin/luma-live-pilot" />
                <Field label="Luma event id">
                  <input required name="eventId" className={inputClassName} placeholder="evt-..." />
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
                  className="rounded-full border border-slate-200 bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-slate-600"
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
  "mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]";

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
    <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
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
      className="w-full rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {children}
    </button>
  );
}

function normalizeResult(value: string | undefined) {
  return value === "success" ? "success" : value === "error" ? "error" : null;
}
