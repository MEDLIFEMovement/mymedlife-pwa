import {
  localActorOptions,
  type LocalActorContext,
} from "@/services/local-actor-context";
import {
  clearLocalActorPreviewAction,
  setLocalActorPreviewAction,
} from "@/components/local-role-switcher/actions";

type LocalRoleSwitcherProps = {
  actor: LocalActorContext;
};

export function LocalRoleSwitcher({ actor }: LocalRoleSwitcherProps) {
  const isUsingAuthSession = actor.identitySource === "local_auth_session";
  const isUsingPreviewCookie = actor.identitySource === "local_preview_cookie";

  return (
    <section className="app-surface rounded-3xl p-4">
      <div>
        <p className="app-eyebrow app-eyebrow-slate">Local role switcher</p>
        <p className="mt-2 text-xl font-semibold text-slate-950">
          {isUsingAuthSession
            ? "Signed-in local auth user controls the current role."
            : "Preview another local role without leaving the app."}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isUsingAuthSession
            ? "Sign out or sign in as another fake local seed user to preview a different role. Browser writes and production auth remain disabled."
            : "This is a local-only review panel. It stores one preview-role cookie for this browser so you can move through member, leader, coach, and admin surfaces without changing env vars. It does not create production users, auth sessions, or app writes."}
        </p>
      </div>

      {!isUsingAuthSession ? (
        <div className="app-surface-soft mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
          <p className="text-sm leading-6 text-slate-600">
            {isUsingPreviewCookie
              ? "Preview cookie is active for this browser."
              : "No preview cookie is active. The current role comes from the configured local actor email."}
          </p>
          {isUsingPreviewCookie ? (
            <form action={clearLocalActorPreviewAction}>
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950"
              >
                Use configured default
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {localActorOptions.map((option) => {
          const isSelected = option.email === actor.selectedEmail.toLowerCase();
          const scopeSummary = option.chapterNames.length > 0
            ? option.chapterNames.join(", ")
            : option.coachPortfolioChapterNames.length > 0
              ? `Portfolio: ${option.coachPortfolioChapterNames.join(", ")}`
              : "Admin and system-wide review scope";
          const roleSummary = [...option.chapterRoles, ...option.staffRoles].join(", ");

          return (
            <article
              key={option.email}
              className={
                isSelected
                  ? "app-surface-warm rounded-2xl p-3"
                  : "app-surface rounded-2xl p-3"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{option.displayName}</p>
                  <p className="mt-1 text-xs text-slate-500">{option.email}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                  {option.audience.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {roleSummary || "No approved role"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{scopeSummary}</p>
              {isUsingAuthSession ? (
                <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Local auth is active, so the browser session controls this route.
                </p>
              ) : (
                <form action={setLocalActorPreviewAction} className="mt-3">
                  <input type="hidden" name="selectedEmail" value={option.email} />
                  <button
                    type="submit"
                    disabled={isSelected}
                    className={[
                      "w-full rounded-xl px-3 py-2 text-sm font-semibold transition",
                      isSelected
                        ? "cursor-default bg-[#f7d05e] text-[#08224c]"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-[#bfdbfe] hover:bg-[#eef5ff] hover:text-slate-950",
                    ].join(" ")}
                  >
                    {isSelected
                      ? isUsingPreviewCookie
                        ? "Previewing this role"
                        : "Using configured default"
                      : "Preview this role"}
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
