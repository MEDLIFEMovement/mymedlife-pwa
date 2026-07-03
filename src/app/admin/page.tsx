import { redirect } from "next/navigation";
import { AdminAppShell } from "@/components/admin-app-shell";
import { AdminBackendLaneNav } from "@/components/admin-backend-lane-nav";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { MetricCard } from "@/components/metric-card";
import { RestrictedState } from "@/components/restricted-state";
import {
  PanelButton,
  SurfacePanel,
  StatusPill,
} from "@/components/visual-primitives";
import { getPilotEventLoopReadModel } from "@/services/event-loop";
import { getLandingRouteForActor } from "@/services/landing-route";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import {
  canReadAdminIntegrationsSecurity,
  canReadIntegrationOutbox,
  getActorSurfaceFamily,
} from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("admin");
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [data, actor] = await Promise.all([
    getReadOnlyAppData(),
    getLocalActorContext(),
  ]);
  const surfaceFamily = getActorSurfaceFamily(actor);
  const canReadAdminBackend =
    surfaceFamily === "ds_admin" || surfaceFamily === "super_admin";

  if (shouldRedirectActorToLogin(actor)) {
    return redirect(buildLoginRedirectHref("/admin"));
  }

  if (!canReadAdminBackend) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <RestrictedState
            title="This admin backend is not visible to this role."
            message="Members, leaders, and coaches should use their own student or staff workspaces. Admin tools stay limited to HQ, DS Admin, and Super Admin contexts."
            nextHref={getLandingRouteForActor(actor)}
            nextLabel="Go to your app"
          />
        </div>
      </main>
    );
  }

  const lumaEventLoopReadModel = getPilotEventLoopReadModel({
    mode: "staging",
    data,
  });
  const backendLaneLinks = getBackendLaneLinks();
  const outboxDisabledCount = data.outboxItems.filter(
    (item) => item.status === "disabled",
  ).length;

  return (
    <AdminAppShell actor={actor}>
      <DataSourceNotice source={data.source} />
      <AdminBackendLaneNav
        current="overview"
        builderLink={{
          href: "/admin/sop-builder/rush-month?tab=steps",
          label: "SOP Builder",
        }}
        showIntegrations={canReadAdminIntegrationsSecurity(actor)}
      />

      <SurfacePanel
        as="section"
        className="app-surface-info rounded-[2rem] p-5"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] xl:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                Admin permission proof
              </p>
              <span className="rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                DS / Super Admin backend
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-950">
              DS and Super Admin context is role-aware and read-only.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              This overview stays intentionally small. Its job is to prove the
              live event loop, show that non-approved sends stay off, and point
              reviewers to the exact routes that matter.
            </p>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Everything else can live on deeper routes, but it should not be
              the first thing a reviewer sees while we are making Events +
              Points real.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard
              label="Backend posture"
              value="Read-only"
              note="No live mutation lane enabled here"
            />
            <MetricCard
              label="Sensitive access"
              value="Restricted"
              note="DS and Super Admin only"
            />
            <MetricCard
              label="External writes"
              value="Off"
              note="No non-approved sends or syncs"
            />
          </div>
        </div>
      </SurfacePanel>

      <SurfacePanel
        as="section"
        className="rounded-[2rem] border border-[#5d8ff6]/25 bg-[#f4f8ff] p-5"
      >
        <p className="app-eyebrow app-eyebrow-blue">Event loop</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Luma event creation, RSVP, attendance, and points stay app-owned.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Keep the admin story anchored to one truth: chapter events create RSVP
          signals, attendance creates trustworthy points, and the leaderboard is
          the visible readback of what happened.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <MetricCard
            label="RSVPs visible"
            value={`${lumaEventLoopReadModel.summary.rsvpCount}`}
            note="Member intent recorded in app-owned state"
          />
          <MetricCard
            label="Attendance"
            value={`${lumaEventLoopReadModel.summary.attendanceCount}`}
            note="Confirmed attendance from the staging loop"
          />
          <MetricCard
            label="Points"
            value={`${lumaEventLoopReadModel.summary.pointsAwarded}`}
            note="Awarded from confirmed attendance only"
          />
          <MetricCard
            label="Outbox blocked"
            value={`${outboxDisabledCount}`}
            note="Disabled rows with no external execution"
          />
        </div>
      </SurfacePanel>

      <SurfacePanel as="section" className="rounded-[1.75rem] border border-slate-200 p-5">
        <p className="app-eyebrow app-eyebrow-blue">Overview focus</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Keep this overview narrow while the launch lane is active
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The deeper review packets still exist on their own routes, but this
          homepage stays centered on the live event loop, audit proof, and the
          small-pilot launch gate so the staging story stays easy to review.
        </p>
      </SurfacePanel>

      <SurfacePanel as="section" className="rounded-[1.75rem] border border-slate-200 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-eyebrow app-eyebrow-slate">What this admin surface actually owns</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Review the loop, not the whole platform
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              The overview should answer five questions: can a chapter event be
              linked, can RSVP be seen, can attendance be confirmed, can points
              be read back, and did anything external fire when it should not have.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Overview focus"
              value="Events + Points"
              note="One loop first"
            />
            <MetricCard
              label="Review routes"
              value={`${backendLaneLinks.length}`}
              note="Only the routes needed now"
            />
            <MetricCard
              label="Pilot posture"
              value="Controlled"
              note="Widen only after proof"
            />
            <MetricCard
              label="Launch story"
              value="Simple"
              note="No kitchen-sink homepage"
            />
          </div>
        </div>
      </SurfacePanel>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {backendLaneLinks.map((lane) => (
          <PanelButton
            href={lane.href}
            variant="secondary"
            key={lane.href}
            className="app-surface rounded-[1.6rem] p-4 text-left transition hover:border-slate-300/80"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="app-eyebrow app-eyebrow-slate">{lane.eyebrow}</p>
              <StatusPill tone="white">Read-only</StatusPill>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              {lane.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {lane.summary}
            </p>
          </PanelButton>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <SurfacePanel className="rounded-[1.75rem] border border-slate-200 p-5">
          <p className="app-eyebrow app-eyebrow-blue">Review in this order</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Keep the reviewer path human-sized
          </h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <li className="rounded-[1.25rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
              1. Open <strong>Luma Pilot</strong> and verify the chapter event
              can be linked to the app-owned loop.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
              2. Confirm member, leader, and staff surfaces all tell the same
              RSVP -&gt; attendance -&gt; points story.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
              3. Check <strong>Audit Log</strong> to make sure approved actions
              leave a clear trail.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
              4. Check <strong>Integration Outbox</strong> to make sure no
              non-approved sends or external jobs fired.
            </li>
            <li className="rounded-[1.25rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
              5. Use <strong>Launch Gate</strong> and <strong>Pilot Scope</strong>{" "}
              for the final go/no-go conversation.
            </li>
          </ol>
        </SurfacePanel>

        <SurfacePanel className="rounded-[1.75rem] border border-slate-200 p-5">
          <p className="app-eyebrow app-eyebrow-blue">Hidden on purpose</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Broader modules stay out of the way for now
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            We are deliberately not leading reviewers into the broader platform
            while the event loop is the live product priority.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "SOP Builder",
              "Committee registry",
              "Workflow tools",
              "Theme settings",
              "Feature flags",
              "Broader review packets",
              "Non-approved integrations",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Those lanes still exist on deeper routes for internal work, but they
            are not the story we want a reviewer to follow during this launch pass.
          </p>
        </SurfacePanel>
      </section>

      {canReadIntegrationOutbox(actor) ? (
        <EventOutboxLog
          events={data.integrationEvents}
          outboxItems={data.outboxItems}
        />
      ) : (
        <RestrictedState
          eyebrow="Integration controls"
          title="Outbox records are hidden for this role."
          message="Only DS Admin and Super Admin can inspect disabled/mock external-send posture."
        />
      )}
    </AdminAppShell>
  );
}

function getBackendLaneLinks() {
  return [
    {
      href: "/admin/luma-live-pilot",
      eyebrow: "Pilot",
      title: "Luma Pilot",
      summary:
        "Create or link chapter events, review RSVP writeback, import attendance, and watch points read back from the same event loop.",
    },
    {
      href: "/admin/integration-outbox",
      eyebrow: "Safety",
      title: "Integration Outbox",
      summary:
        "Confirm the event loop stays mock-safe, idempotent, and free of non-approved external sends.",
    },
    {
      href: "/admin/audit-log",
      eyebrow: "Audit",
      title: "Audit Log",
      summary:
        "Check that the chapter event loop leaves actor, target, and result evidence behind every approved write.",
    },
    {
      href: "/admin/launch-gate",
      eyebrow: "Gate",
      title: "Production Launch Gate",
      summary:
        "Track the small pilot path from reviewer proof to launch approval without widening scope too early.",
    },
    {
      href: "/admin/pilot-scope",
      eyebrow: "Pilot",
      title: "Pilot Scope",
      summary:
        "Keep the first live chapter, named owners, and safety boundaries explicit before widening to five chapters.",
    },
  ];
}
