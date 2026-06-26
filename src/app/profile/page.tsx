import Link from "next/link";
import { StudentAppShell } from "@/components/student-app-shell";
import { MemberProfilePanel } from "@/components/member-profile-panel";
import { getLocalActorContext, type LocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import { getProfileWorkspace } from "@/services/profile-workspace";
import { getReadOnlyAppData } from "@/services/read-only-app-data";
import { getActorSurfaceLabel } from "@/services/actor-role-display";
import { getLandingRouteForActor } from "@/services/landing-route";
import { getActorSurfaceFamily, isMemberSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { getStudentHomeWorkspace } from "@/services/student-home-workspace";

export const metadata = getStaticRouteMetadata("profile");
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [actor, data] = await Promise.all([
    getLocalActorContext(),
    getReadOnlyAppData(),
  ]);
  const workspace = getProfileWorkspace(actor, data);
  const isMemberProfile = isMemberSurfaceFamily(actor);
  const studentHome = isMemberProfile
    ? getStudentHomeWorkspace(actor, data)
    : null;
  const recognition = isMemberProfile
    ? getMemberRecognitionSummary(actor, data)
    : null;

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberProfile}
      showMobileQuickItemHelpers={!isMemberProfile}
      showDebugTools={false}
    >
      {isMemberProfile ? (
        <>
          {studentHome && recognition ? (
            <MemberProfilePanel
              chapterName={studentHome.chapterName}
              displayName={actor.user.displayName}
              workspace={workspace}
              studentHome={studentHome}
              recognition={recognition}
            />
          ) : null}
        </>
      ) : (
        <>
          <section className="app-surface-info overflow-hidden rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]">
                  Profile
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                  {workspace.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {workspace.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <MiniToken label={workspace.profileLabel} />
                  <MiniToken label={getActorSurfaceLabel(actor)} />
                </div>
              </div>
              <div className="w-fit rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Current role
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {workspace.profileLabel}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 rounded-[2rem] bg-[#eef3fb] p-4 shadow-[0_18px_50px_rgba(5,24,60,0.12)]">
            <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#eaf2ff] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563eb]">
                    Next focus
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {workspace.nextStep.detail}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                    Keep this profile tied to the work that belongs to your role, then jump back
                    into your main operating surface without losing context.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={workspace.nextStep.href}
                    className="w-fit rounded-full bg-[#dbeafe] px-4 py-2 text-sm font-semibold text-[#1e40af]"
                  >
                    {workspace.nextStep.label}
                  </Link>
                  <Link
                    href={getLandingRouteForActor(actor)}
                    className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {getProfileReturnLabel(actor)}
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Chapter roles" value={`${workspace.counts.chapterRoles}`} />
              <MiniStat label="Staff roles" value={`${workspace.counts.staffRoles}`} />
              <MiniStat label="Chapters" value={`${workspace.counts.chapterScopes}`} />
              <MiniStat
                label="Coach portfolio"
                value={`${workspace.counts.coachPortfolioChapters}`}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <ProfilePanel title="Identity" rows={workspace.identityRows} />
              <ProfilePanel title="Role and scope" rows={workspace.scopeRows} />
            </section>
          </div>
        </>
      )}
    </StudentAppShell>
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
    <section className="app-surface rounded-[2rem] p-5">
      <p className="app-eyebrow app-eyebrow-slate">{title}</p>
      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <article key={row.label} className="app-surface-soft rounded-2xl p-4">
            <p className="app-eyebrow app-eyebrow-slate">{row.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{row.value}</p>
            <p className="app-copy mt-2">{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniToken({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/78">
      {label}
    </span>
  );
}

function getProfileReturnLabel(actor: LocalActorContext) {
  switch (getActorSurfaceFamily(actor)) {
    case "leader":
      return "Open Leader Hub";
    case "coach":
      return "Open Staff Command Center";
    case "staff":
      return "Open Staff Command Center";
    case "ds_admin":
    case "super_admin":
      return "Open Admin Backend";
    case "member":
      return "Back to Home";
  }
}
