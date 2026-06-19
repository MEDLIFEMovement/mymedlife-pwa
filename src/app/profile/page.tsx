import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { EventOutboxLog } from "@/components/event-outbox-log";
import { getLocalActorContext } from "@/services/local-actor-context";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("profile");
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getProfileWorkspace(actor, data);

  return (
    <AppShell actor={actor}>
      <DataSourceNotice source={actor.source} />

      <section className="rounded-[2rem] border border-white/12 bg-[#071d1a]/90 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Profile
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
              Active scope
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {workspace.profileLabel}
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Chapter roles" value={`${workspace.counts.chapterRoles}`} />
        <MiniStat label="Staff roles" value={`${workspace.counts.staffRoles}`} />
        <MiniStat label="Chapters" value={`${workspace.counts.chapterScopes}`} />
        <MiniStat
          label="External writes"
          value={`${workspace.counts.externalWritesExpected}`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfilePanel title="Identity" rows={workspace.identityRows} />
        <ProfilePanel title="Role and scope" rows={workspace.scopeRows} />
      </section>

      <EventOutboxLog
        events={workspace.futureStructuredEvents}
        outboxItems={[]}
      />

      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">
          Safety boundary
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
        <p className="mt-4 text-xs leading-5 text-white/48">
          Profile writes expected: {workspace.counts.profileWritesExpected}.
          Membership writes expected: {workspace.counts.membershipWritesExpected}.
          Role writes expected: {workspace.counts.roleWritesExpected}. External writes
          expected: {workspace.counts.externalWritesExpected}.
        </p>
      </section>
    </AppShell>
  );
}

function ProfilePanel({
  rows,
  title,
}: {
  rows: Array<{ label: string; value: string; detail: string }>;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/44">
        {title}
      </p>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <article key={row.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
              {row.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{row.value}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
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
