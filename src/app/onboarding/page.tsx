import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import {
  getAuthOnboardingWorkspace,
  type AuthOnboardingLaunchPreflight,
  type AuthOnboardingPreflightItem,
  type AuthOnboardingPreflightStatus,
} from "@/services/auth-onboarding-workspace";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("onboarding");
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const actor = await getLocalActorContext();
  const workspace = getAuthOnboardingWorkspace(actor);
  const surfaceFamily = getActorSurfaceFamily(actor);
  const showOperationalAudit =
    surfaceFamily === "staff" ||
    surfaceFamily === "ds_admin" ||
    surfaceFamily === "super_admin";

  return (
    <AppShell actor={actor}>
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(145deg,#0a3b88_0%,#0b4f9b_58%,#081a3a_100%)] p-5 shadow-[0_24px_80px_rgba(2,14,38,0.32)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d05e]">
              Auth and onboarding
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {workspace.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              {workspace.summary}
            </p>
          </div>
          <div className="w-fit rounded-[1.5rem] border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
              Local reviewer
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {workspace.actorLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="app-surface-info rounded-[2rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-eyebrow app-eyebrow-blue">
              Next best step
            </p>
            <h2 className="app-title mt-2">{workspace.nextStep.detail}</h2>
          </div>
          <Link
            href={workspace.nextStep.href}
            className="w-fit rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#10223f]"
          >
            {workspace.nextStep.label}
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Steps" value={`${workspace.counts.steps}`} />
        <MiniStat label="Owned here" value={`${workspace.counts.actorOwnedSteps}`} />
        <MiniStat label="Browser steps" value={`${workspace.counts.browserEnabledSteps}`} />
        <MiniStat label="Live auth" value={`${workspace.counts.liveAuthEnabled}`} />
        <MiniStat
          label="External writes"
          value={`${workspace.counts.externalWritesExpected}`}
        />
      </section>

      <section className="app-surface rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">
          Onboarding sequence
        </p>
        <div className="mt-4 grid gap-3">
          {workspace.stepRows.map((step, index) => (
            <article key={step.key} className="app-surface-soft rounded-[1.35rem] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="app-eyebrow app-eyebrow-blue">
                    Step {index + 1} / {step.ownerLabel}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">{step.label}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={step.actorCanOwn ? "ready" : "muted"}>
                    {step.actorCanOwn ? "owned here" : "not this role"}
                  </Pill>
                  <Pill tone="locked">available later</Pill>
                  <Pill tone="ready">tracked</Pill>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.notes}</p>
              <p className="mt-3 font-mono text-xs text-[#2563eb]">
                {step.futureEventType}
              </p>
            </article>
          ))}
        </div>
      </section>

      {workspace.launchPreflight ? (
        <AuthLaunchPreflightPanel preflight={workspace.launchPreflight} />
      ) : null}

      <section className="app-surface-warm rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-warm">
          Held for later
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {workspace.blockedWrites.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#f7d05e]/28 bg-[#fff8df] px-3 py-1 text-xs font-semibold text-[#a16207]"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {showOperationalAudit ? (
        <EventOutboxLog events={workspace.futureStructuredEvents} outboxItems={[]} />
      ) : null}

      <section className="app-surface rounded-[2rem] p-5">
        <p className="app-eyebrow app-eyebrow-slate">
          Safety notes
        </p>
        <div className="mt-4 grid gap-2">
          {workspace.safetyNotes.map((note) => (
            <p
              key={note}
              className="app-surface-soft rounded-[1.1rem] p-3 text-sm leading-6 text-slate-600"
            >
              {note}
            </p>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function AuthLaunchPreflightPanel({
  preflight,
}: {
  preflight: AuthOnboardingLaunchPreflight;
}) {
  return (
    <section className="app-surface-info rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            Staff auth preflight
          </p>
          <h2 className="app-title mt-2">{preflight.title}</h2>
          <p className="app-copy mt-2 max-w-3xl">{preflight.summary}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          <MiniStat label="Items" value={`${preflight.counts.total}`} />
          <MiniStat label="Ready" value={`${preflight.counts.ready}`} />
          <MiniStat label="Watch" value={`${preflight.counts.watch}`} />
          <MiniStat label="Blocked" value={`${preflight.counts.blocked}`} />
          <MiniStat
            label="Users"
            value={`${preflight.counts.productionUsersEnabled}`}
          />
          <MiniStat
            label="Sends"
            value={`${preflight.counts.externalWritesEnabled}`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {preflight.items.map((item) => (
          <AuthPreflightCard key={item.key} item={item} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {preflight.blockedControls.map((control) => (
          <span
            key={control}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500"
          >
            Later: {control}
          </span>
        ))}
      </div>
    </section>
  );
}

function AuthPreflightCard({ item }: { item: AuthOnboardingPreflightItem }) {
  return (
    <article className="app-surface rounded-[1.35rem] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AuthPreflightStatusPill status={item.status} />
          <h3 className="mt-3 text-base font-semibold text-slate-950">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {item.ownerLane}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-[#2563eb]">
        Required: {item.requiredEvidence}
      </p>
      <p className="app-surface-soft mt-3 rounded-[1.05rem] p-3 text-xs leading-5 text-slate-500">
        Current: {item.currentPosture}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500"
          >
            {route}
          </span>
        ))}
      </div>
    </article>
  );
}

function AuthPreflightStatusPill({
  status,
}: {
  status: AuthOnboardingPreflightStatus;
}) {
  const className =
    status === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "watch"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-surface rounded-[1.05rem] px-3 py-2">
      <p className="app-eyebrow app-eyebrow-slate">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
      {label} {value}
    </span>
  );
}

function Pill({
  children,
  tone,
}: {
  children: string;
  tone: "ready" | "locked" | "muted";
}) {
  const className =
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "locked"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-500";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
