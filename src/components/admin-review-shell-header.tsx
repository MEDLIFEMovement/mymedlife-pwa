type AdminReviewShellView =
  | "overview"
  | "users"
  | "chapters"
  | "modules"
  | "luma"
  | "points"
  | "integrations"
  | "audit"
  | "health"
  | "apikeys"
  | "mcp"
  | "settings";

type AdminReviewShellHeaderProps = {
  activeView: AdminReviewShellView;
  eyebrow: string;
  title: string;
  description: string;
};

const shellLinks: Array<{
  label: string;
  href: string;
  view: AdminReviewShellView;
}> = [
  { label: "Overview", href: "/admin", view: "overview" },
  { label: "Users", href: "/admin/users", view: "users" },
  { label: "Chapters", href: "/admin/chapters", view: "chapters" },
  { label: "Modules", href: "/admin?view=modules", view: "modules" },
  { label: "Luma Events", href: "/admin?view=luma", view: "luma" },
  { label: "Points", href: "/admin?view=points", view: "points" },
  { label: "Integrations", href: "/admin?view=integrations", view: "integrations" },
  { label: "Audit Logs", href: "/admin/audit-log", view: "audit" },
  { label: "System Health", href: "/admin/system-health", view: "health" },
  { label: "API Keys", href: "/admin?view=apikeys", view: "apikeys" },
  { label: "MCP Connections", href: "/admin?view=mcp", view: "mcp" },
  { label: "Settings", href: "/admin?view=settings", view: "settings" },
];

const blockedShellItems = [
  "SOP Builder",
  "Task Assignment",
  "UGC / Feed",
  "MCP Analytics",
];

export function AdminReviewShellHeader({
  activeView,
  eyebrow,
  title,
  description,
}: AdminReviewShellHeaderProps) {
  return (
    <header className="space-y-4 pr-40 lg:pr-52">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">
            myMEDLIFE DS Admin shell
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <a
          href="/admin"
          className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
        >
          Return to Command Center
        </a>
      </div>

      <nav
        aria-label="DS Admin Figma menu"
        className="rounded-lg border border-white/10 bg-[#0f141b] p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              DS Admin Figma menu
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Same command-center menu family maintained on Users and Chapters.
            </p>
          </div>
          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200">
            route-backed
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shellLinks.map((item) => {
            const isActive = item.view === activeView;

            return (
              <a
                key={item.view}
                aria-current={isActive ? "page" : undefined}
                href={item.href}
                className={
                  isActive
                    ? "flex items-center justify-between rounded-md border border-sky-400/40 bg-sky-400/15 px-3 py-2 text-xs font-semibold text-sky-100"
                    : "flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]"
                }
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-sky-200">
                    active
                  </span>
                )}
              </a>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {blockedShellItems.map((item) => (
            <span
              key={item}
              aria-disabled="true"
              className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-500"
            >
              {item} <span className="font-normal text-slate-600">blocked</span>
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Keep the full DS Admin menu family visible during walkthroughs. Route-backed reviews stay
          open from here while writes, sends, and provider actions remain blocked or preview-only.
        </p>
      </nav>
    </header>
  );
}
