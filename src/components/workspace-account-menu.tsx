import { signOut } from "@/app/login/actions";
import type { LocalActorContext } from "@/services/local-actor-context";
import {
  getAllowedWorkspaces,
  getWorkspaceLabel,
  type WorkspaceKey,
} from "@/services/workspace-access";

export const WORKSPACE_ACCOUNT_MENU_SHELL_CLEARANCE =
  "pr-[4.5rem] sm:pr-[16rem] lg:pr-[19rem] xl:pr-[21rem]";

type WorkspaceAccountMenuProps = {
  actor: LocalActorContext;
  currentWorkspace: WorkspaceKey;
};

export function WorkspaceAccountMenu({
  actor,
  currentWorkspace,
}: WorkspaceAccountMenuProps) {
  const workspaces = getAllowedWorkspaces(actor);

  return (
    <div className="fixed right-3 top-3 z-[70] sm:right-5 sm:top-5">
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/20 bg-[#10223f]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-[#1B4B8E]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5A623] text-[11px] font-black text-[#10223f]">
            {getInitials(actor.user.displayName)}
          </span>
          <span className="hidden max-w-[11rem] truncate sm:inline">
            {actor.user.displayName}
          </span>
          <span aria-hidden="true" className="text-white/60">
            ▾
          </span>
        </summary>

        <section className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-[#10223f] shadow-2xl">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm font-black">{actor.user.displayName}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{actor.user.email}</p>
            <div className="mt-3 grid gap-2 text-xs">
              <span className="rounded-xl bg-[#eef5ff] px-3 py-2">
                Role: <strong>{actor.audienceLabel}</strong>
              </span>
              <span className="rounded-xl bg-[#fff7e6] px-3 py-2">
                Current workspace: <strong>{getWorkspaceLabel(currentWorkspace)}</strong>
              </span>
            </div>
          </div>

          <nav className="p-3" aria-label="Available workspaces">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Available views
            </p>
            <div className="mt-2 grid gap-1">
              {workspaces.map((workspace) => (
                <a
                  key={workspace.key}
                  href={workspace.href}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    workspace.key === currentWorkspace
                      ? "bg-[#1B4B8E] text-white"
                      : "text-[#10223f] hover:bg-[#eef5ff]",
                  ].join(" ")}
                >
                  <span>{workspace.label}</span>
                  {workspace.readOnly ? (
                    <span className="ml-2 rounded-full bg-[#eef5ff] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#1B4B8E]">
                      Preview
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          </nav>

          <form action={signOut} className="border-t border-slate-200 p-3">
            <button
              type="submit"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-[#10223f] transition hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </section>
      </details>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
