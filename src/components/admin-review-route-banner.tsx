import Link from "next/link";

type AdminReviewRouteBannerProps = {
  activeLabel: string;
  summary: string;
};

const ADMIN_SHELL_LINKS = [
  { label: "Overview", href: "/admin?view=overview" },
  { label: "Users", href: "/admin?view=users" },
  { label: "Chapters", href: "/admin?view=chapters" },
  { label: "Modules", href: "/admin?view=modules" },
  { label: "Luma Events", href: "/admin?view=luma-events" },
  { label: "Points", href: "/admin?view=points" },
  { label: "Integrations", href: "/admin?view=integrations" },
  { label: "Audit Logs", href: "/admin?view=audit" },
  { label: "System Health", href: "/admin?view=health" },
  { label: "API Keys", href: "/admin?view=apikeys" },
  { label: "MCP Connections", href: "/admin?view=mcp" },
  { label: "Settings", href: "/admin?view=settings" },
];

export function AdminReviewRouteBanner({
  activeLabel,
  summary,
}: AdminReviewRouteBannerProps) {
  return (
    <section className="rounded-[1.65rem] border border-white/12 bg-[#071d1a]/90 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
            myMEDLIFE DS Admin shell
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Command Center review route
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/66">
            {summary}
          </p>
        </div>
        <Link
          href="/admin?view=overview"
          className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-cyan-50"
        >
          Return to Command Center
        </Link>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="DS Admin shell routes">
        {ADMIN_SHELL_LINKS.map((item) => {
          const isActive = item.label === activeLabel;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                isActive
                  ? "border-cyan-300/35 bg-cyan-300/18 text-cyan-50"
                  : "border-white/10 bg-black/20 text-white/62"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
