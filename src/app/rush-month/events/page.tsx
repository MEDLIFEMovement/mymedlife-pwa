import { StudentAppShell } from "@/components/student-app-shell";
import { DataSourceNotice } from "@/components/data-source-notice";
import { MemberRushMonthEventsPanel } from "@/components/member-rush-month-events-panel";
import { RestrictedState } from "@/components/restricted-state";
import { RushMonthEventProofBridgePanel } from "@/components/rush-month-event-proof-bridge-panel";
import { RushMonthEventReadinessPanel } from "@/components/rush-month-event-readiness-panel";
import { getEventProofBridgeWorkspace } from "@/services/rush-month-event-proof-bridge";
import { getLocalActorContext } from "@/services/local-actor-context";
import { type MemberActionRouteSource } from "@/services/member-action-route-href";
import { getRushMonthEventsRouteRedirectHref } from "@/services/owned-route-redirect";
import { getRushMonthEventReadinessWorkspace } from "@/services/rush-month-event-readiness";
import { getActorSurfaceFamily } from "@/services/role-visibility";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";
import { redirect } from "next/navigation";

export const metadata = getStaticRouteMetadata("rushMonthEvents");
export const dynamic = "force-dynamic";

type RushMonthEventsPageProps = {
  searchParams?: Promise<{
    returnTo?: string;
    source?: string;
  }>;
};

export default async function RushMonthEventsPage({
  searchParams,
}: RushMonthEventsPageProps) {
  const actor = await getLocalActorContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const memberEventSource = parseMemberEventSource(resolvedSearchParams?.source);
  const redirectHref = getRushMonthEventsRouteRedirectHref(actor, {
    source: resolvedSearchParams?.source,
  });

  if (redirectHref) {
    redirect(redirectHref);
  }

  const chapterEventContext = getChapterEventSourceContext(
    resolvedSearchParams?.source,
    resolvedSearchParams?.returnTo,
  );
  const workspace = getRushMonthEventReadinessWorkspace(actor);
  const bridgeWorkspace = getEventProofBridgeWorkspace(actor);
  const isMemberWorkspace =
    getActorSurfaceFamily(actor) === "member" && workspace.canReadWorkspace;

  return (
    <StudentAppShell
      actor={actor}
      hideTopHeader={isMemberWorkspace}
      showMobileQuickItemHelpers={!isMemberWorkspace}
      showDebugTools={!isMemberWorkspace}
    >
      {!workspace.canReadWorkspace ? (
        <RestrictedState
          title={workspace.title}
          message={workspace.summary}
          nextHref="/admin"
          nextLabel="Open integration outbox"
        />
      ) : isMemberWorkspace ? (
        <>
          <MemberRushMonthEventsPanel
            workspace={workspace}
            source={memberEventSource}
          />
        </>
      ) : (
        <>
          {chapterEventContext ? (
            <section className="rounded-[2rem] border border-[#bfdbfe] bg-[#f8fbff] p-5">
              <p className="app-eyebrow app-eyebrow-blue">{chapterEventContext.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {chapterEventContext.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {chapterEventContext.detail}
              </p>
              <a
                href={chapterEventContext.href}
                className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
              >
                {chapterEventContext.backLabel}
              </a>
            </section>
          ) : null}
          <RushMonthEventReadinessPanel workspace={workspace} />
          <DataSourceNotice source={actor.source} />
          <RushMonthEventProofBridgePanel workspace={bridgeWorkspace} />
        </>
      )}
    </StudentAppShell>
  );
}

function parseMemberEventSource(value: string | undefined): MemberActionRouteSource | null {
  switch (value) {
    case "home":
    case "campaigns":
    case "events":
    case "points":
    case "profile":
      return value;
    default:
      return null;
  }
}

function getChapterEventSourceContext(
  source: string | undefined,
  returnTo: string | undefined,
) {
  if (source !== "chapter_create_event") {
    return null;
  }

  return {
    eyebrow: "From chapter events",
    title: "Keep chapter event ownership in view.",
    detail:
      "Use the broader event flow without losing the committee focus, event ownership, or follow-through that opened this from the command center.",
    href: normalizeChapterEventReturnTo(returnTo),
    backLabel: "Back to chapter events",
  };
}

function normalizeChapterEventReturnTo(value: string | undefined) {
  if (!value) {
    return "/chapter?view=events";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/chapter?view=events";
  }

  return value;
}
