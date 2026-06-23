import { getActorPrimaryRoleLabel, getActorSurfaceLabel } from "@/services/actor-role-display";
import type { LocalActorContext } from "@/services/local-actor-context";

type LocalActorNoticeProps = {
  actor: LocalActorContext;
};

export function LocalActorNotice({ actor }: LocalActorNoticeProps) {
  const chapterList = actor.chapterNames.length > 0 ? actor.chapterNames.join(", ") : "No chapter";
  const portfolioList =
    actor.coachPortfolioChapterNames.length > 0
      ? actor.coachPortfolioChapterNames.join(", ")
      : "No active coach portfolio";
  const roleList = [...actor.chapterRoles, ...actor.staffRoles];
  const identityLabel =
    actor.identitySource === "local_auth_session"
      ? "Local auth session"
      : actor.identitySource === "local_preview_cookie"
        ? "Local preview role"
        : "Local actor email";

  return (
    <section className="app-surface-info rounded-[1.75rem] p-4">
      <p className="app-eyebrow app-eyebrow-blue">Local role context</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Actor</p>
          <p className="mt-1 font-semibold text-slate-950">{actor.user.displayName}</p>
          <p className="mt-1 text-xs text-slate-500">{actor.user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Role view</p>
          <p className="mt-1 font-semibold text-slate-950">{getActorSurfaceLabel(actor)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {roleList.length > 0 ? roleList.join(", ") : getActorPrimaryRoleLabel(actor)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scope</p>
          <p className="mt-1 font-semibold text-slate-950">{chapterList}</p>
          {actor.coachPortfolioChapterNames.length > 0 ? (
            <p className="mt-1 text-xs text-slate-500">Portfolio: {portfolioList}</p>
          ) : null}
        </div>
      </div>
      <div className="app-surface mt-3 rounded-[1.1rem] px-3 py-2 text-xs leading-5 text-slate-600">
        Identity source: <span className="font-semibold text-[#1d4ed8]">{identityLabel}</span>.
        Auth session: <span className="font-semibold text-[#1d4ed8]">{actor.authSessionStatus}</span>.
      </div>
      <p className="app-copy mt-3">{actor.accessSummary}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Local-only role context. Preview switching does not add production auth,
        production users, or app write permissions.
      </p>
    </section>
  );
}
