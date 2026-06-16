import {
  localActorOptions,
  type LocalActorContext,
} from "@/services/local-actor-context";

type LocalRoleSwitcherProps = {
  actor: LocalActorContext;
};

export function LocalRoleSwitcher({ actor }: LocalRoleSwitcherProps) {
  const isUsingAuthSession = actor.identitySource === "local_auth_session";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
          Local role switcher
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {isUsingAuthSession
            ? "Signed-in local auth user controls the current role."
            : "Set `MYMEDLIFE_LOCAL_ACTOR_EMAIL` to preview another fake role."}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          {isUsingAuthSession
            ? "Sign out or sign in as another fake local seed user to preview a different role. Browser writes and production auth remain disabled."
            : "This is a local-only debug panel. It does not create browser sessions, sign-ins, cookies, production users, or app writes."}
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {localActorOptions.map((option) => {
          const isSelected = option.email === actor.selectedEmail.toLowerCase();

          return (
            <article
              key={option.email}
              className={
                isSelected
                  ? "rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3"
                  : "rounded-2xl border border-white/10 bg-black/20 p-3"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{option.displayName}</p>
                  <p className="mt-1 text-xs text-white/52">{option.email}</p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/64">
                  {option.audience.replace("_", " ")}
                </span>
              </div>
              <p className="mt-3 rounded-xl bg-black/20 px-3 py-2 font-mono text-xs text-emerald-100/80">
                MYMEDLIFE_LOCAL_ACTOR_EMAIL={option.email}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
