import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EventOutboxLog } from "@/components/event-outbox-log";
import {
  getAuthOnboardingWorkspace,
  type AuthOnboardingLaunchPreflight,
  type AuthOnboardingPreflightItem,
  type AuthOnboardingPreflightStatus,
} from "@/services/auth-onboarding-workspace";
import {
  buildLoginRedirectHref,
  shouldRedirectActorToLogin,
} from "@/services/login-route";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("onboarding");
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const actor = await getLocalActorContext();

  if (shouldRedirectActorToLogin(actor)) {
    redirect(buildLoginRedirectHref("/onboarding"));
  }

  const workspace = getAuthOnboardingWorkspace(actor);

  return (
    <AppShell actor={actor}>
      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Auth and onboarding
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {workspace.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
              {workspace.summary}
            </p>
          </div>
          <div className="w-fit rounded-3xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/72">
              Local reviewer
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {workspace.actorLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
              What should I do next?
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {workspace.nextStep.detail}
            </h2>
          </div>
          <Link
            href={workspace.nextStep.href}
            className="w-fit rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
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

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Future onboarding sequence
        </p>
        <div className="mt-4 grid gap-3">
          {workspace.stepRows.map((step, index) => (
            <article key={step.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">
                    Step {index + 1} / {step.ownerLabel}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{step.label}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={step.actorCanOwn ? "ready" : "muted"}>
                    {step.actorCanOwn ? "owned here" : "not this role"}
                  </Pill>
                  <Pill tone="locked">browser off</Pill>
                  <Pill tone="ready">event-ready</Pill>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">{step.notes}</p>
              <p className="mt-3 font-mono text-xs text-emerald-100/64">
                {step.futureEventType}
              </p>
            </article>
          ))}
        </div>
      </section>

      {workspace.launchPreflight ? (
        <AuthLaunchPreflightPanel preflight={workspace.launchPreflight} />
      ) : null}

      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
          Blocked until approval
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {workspace.blockedWrites.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <EventOutboxLog events={workspace.futureStructuredEvents} outboxItems={[]} />

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
          Safety notes
        </p>
        <div className="mt-4 grid gap-2">
          {workspace.safetyNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/64"
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
    <section className="rounded-[2rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">
            Staff auth preflight
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {preflight.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {preflight.summary}
          </p>
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
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/64"
          >
            Locked {control}
          </span>
        ))}
      </div>
    </section>
  );
}

function AuthPreflightCard({ item }: { item: AuthOnboardingPreflightItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AuthPreflightStatusPill status={item.status} />
          <h3 className="mt-3 text-base font-semibold text-white">{item.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {item.ownerLane}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MiniToken label="Writes" value={`${item.browserWritesExpected}`} />
          <MiniToken label="Sends" value={`${item.externalWritesExpected}`} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/72">{item.question}</p>
      <p className="mt-2 text-xs leading-5 text-sky-100/72">
        Required: {item.requiredEvidence}
      </p>
      <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-xs leading-5 text-white/56">
        Current: {item.currentPosture}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.routeEvidence.map((route) => (
          <span
            key={`${item.key}-${route}`}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/58"
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
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : status === "watch"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-rose-300/30 bg-rose-300/15 text-rose-100";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniToken({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/58">
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
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : tone === "locked"
        ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
        : "border-white/10 bg-white/[0.04] text-white/58";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
