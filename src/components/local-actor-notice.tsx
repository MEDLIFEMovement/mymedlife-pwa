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
    <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
        Local role context
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">Actor</p>
          <p className="mt-1 font-semibold text-white">{actor.user.displayName}</p>
          <p className="mt-1 text-xs text-white/52">{actor.user.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">Audience</p>
          <p className="mt-1 font-semibold text-white">{actor.audienceLabel}</p>
          <p className="mt-1 text-xs text-white/52">
            {roleList.length > 0 ? roleList.join(", ") : "No approved role"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/44">Scope</p>
          <p className="mt-1 font-semibold text-white">{chapterList}</p>
          {actor.coachPortfolioChapterNames.length > 0 ? (
            <p className="mt-1 text-xs text-white/52">Portfolio: {portfolioList}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/18 px-3 py-2 text-xs leading-5 text-white/56">
        Identity source: <span className="font-semibold text-cyan-100">{identityLabel}</span>.
        Auth session: <span className="font-semibold text-cyan-100">{actor.authSessionStatus}</span>.
      </div>
      <p className="mt-3 text-sm leading-6 text-white/68">{actor.accessSummary}</p>
      <p className="mt-2 text-xs leading-5 text-white/46">
        Local-only role context. Preview switching does not add production auth,
        production users, or app write permissions.
      </p>
    </section>
  );
}
