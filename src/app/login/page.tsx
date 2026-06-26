import Link from "next/link";
import { AuthSessionPanel } from "@/components/auth-session-panel";
import { LoginForm } from "@/components/login-form";
import { createLocalSupabaseServerClient } from "@/lib/supabase-server";
import {
  getAuthSessionState,
  getDisabledAuthSessionState,
  normalizeLoginRedirect,
} from "@/services/auth-session";
import { getStaticRouteMetadata } from "@/services/static-route-metadata";

export const metadata = getStaticRouteMetadata("login");
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

type WorkspaceCard = {
  label: string;
  description: string;
  routeLabel: string;
  href: string;
  icon: WorkspaceIconKey;
  accent: string;
  selected?: boolean;
};

type WorkspaceIconKey =
  | "member"
  | "leader"
  | "coach"
  | "staff"
  | "admin"
  | "super";

export default async function LoginPage(props: LoginPageProps) {
  const query = (await props.searchParams) ?? {};
  const redirectTo = normalizeLoginRedirect(query.redirectTo);
  const workspaceCards = getWorkspaceCards(redirectTo);
  const { client, config } = await createLocalSupabaseServerClient();
  const session = client
    ? await getAuthSessionState(client, {
        isLocalOnly: config.isLocalOnly,
        sessionLabel:
          config.reviewEnvironment === "staging"
            ? "hosted staging Supabase Auth"
            : "local Supabase Auth",
      })
    : getDisabledAuthSessionState(config);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <a
        href="#main-content"
        className="sr-only rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-[#08224c] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to sign in
      </a>

      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl items-stretch gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#bfdbfe] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8 xl:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(93,143,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(191,219,254,0.42),transparent_34%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                  myMEDLIFE
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Role-based access
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <p className="app-eyebrow app-eyebrow-blue">Sign in</p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Choose your myMEDLIFE workspace.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Each workspace card is only an entry point into a different role-based shell.
                  After authentication, myMEDLIFE routes you by your actual role and permission.
                  Eligible travelers also see SLT Prep inside the member experience after
                  sign-in.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {workspaceCards.map((card) => (
                <WorkspaceEntryCard key={card.label} card={card} />
              ))}
            </div>

            <div className="app-surface-info rounded-[1.75rem] p-4 sm:p-5">
              <p className="text-sm font-semibold text-slate-950">
                Current access boundaries
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                <li>Accounts stay limited to seeded review users.</li>
                <li>The selected card is only a starting point, not the access rule.</li>
                <li>Sales and non-sales staff share the staff shell, but role checks still decide what each account can do.</li>
                <li>Broader browser saves stay held back.</li>
                <li>Proof uploads and public sharing stay held back.</li>
                <li>Eligible travelers see SLT Prep inside the member app.</li>
                <li>HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI remain off.</li>
              </ul>
              <Link
                href="/onboarding"
                className="mt-4 inline-flex rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                See onboarding flow
              </Link>
            </div>
          </div>
        </section>

        <section
          id="main-content"
          tabIndex={-1}
          className="flex flex-col gap-4 rounded-[2.25rem] border border-slate-200 bg-white/96 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-6"
        >
          <LoginForm redirectTo={redirectTo} />
          <AuthSessionPanel session={session} />

          <section className="app-surface rounded-[1.75rem] p-5">
            <h2 className="text-xl font-semibold text-slate-950">Use a seeded account</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Choose one of the seeded emails from the sign-in list below.</li>
              <li>
                Most seeded accounts use the shared review password{" "}
                <code className="text-[#2563eb]">password</code>, and the reviewer
                account <code className="text-[#2563eb]">nellis@medlifemovement.org</code>{" "}
                uses <code className="text-[#2563eb]">6598</code>.
              </li>
              <li>After sign-in, continue into the member, leader, staff, admin, or SLT Prep view that matches the account.</li>
              <li>
                Use <Link href="/admin" className="text-[#2563eb] underline">Admin</Link>{" "}
                when you need to inspect broader system posture.
              </li>
            </ol>
          </section>
        </section>
      </div>
    </main>
  );
}

function getWorkspaceCards(redirectTo: string): WorkspaceCard[] {
  const selectedWorkspace = getWorkspaceSelectionRoute(redirectTo);

  return [
      {
        label: "General Member",
        description:
          "Assigned actions, campaigns, events, evidence, points, leaderboard, profile, and SLT Prep for eligible travelers.",
        routeLabel: "/app",
        href: "/login?redirectTo=/app",
        icon: "member",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/app",
      },
      {
        label: "Student Leader",
        description: "Chapter command center for roster, committees, events, proof review, and chapter KPIs.",
        routeLabel: "/leader",
        href: "/login?redirectTo=/leader",
        icon: "leader",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/leader",
      },
      {
        label: "Sales Coach / Sales Staff",
        description: "Portfolio support, chapter health, validation tasks, notes, and review queues.",
        routeLabel: "/staff",
        href: "/login?redirectTo=/staff",
        icon: "coach",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/staff",
      },
      {
        label: "Staff",
        description: "Approved department dashboards, queues, and review surfaces in staff scope.",
        routeLabel: "/staff",
        href: "/login?redirectTo=/staff",
        icon: "staff",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/staff",
      },
      {
        label: "Data Solutions / Admin",
        description: "Users, roles, permissions, integrations, audit, and system controls.",
        routeLabel: "/admin",
        href: "/login?redirectTo=/admin",
        icon: "admin",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/admin",
      },
      {
        label: "Super Admin",
        description: "Breakglass platform access with the highest-risk controls and audit posture.",
        routeLabel: "/admin",
        href: "/login?redirectTo=/admin",
        icon: "super",
        accent: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
        selected: selectedWorkspace === "/admin",
    },
  ];
}

function getWorkspaceSelectionRoute(redirectTo: string): string {
  if (redirectTo.startsWith("/app/slt-prep")) {
    return "/app";
  }

  if (redirectTo.startsWith("/app")) {
    return "/app";
  }

  if (redirectTo.startsWith("/leader")) {
    return "/leader";
  }

  if (redirectTo.startsWith("/staff/general")) {
    return "/staff";
  }

  if (redirectTo.startsWith("/staff")) {
    return "/staff";
  }

  if (redirectTo.startsWith("/admin")) {
    return "/admin";
  }

  return "/app";
}

type WorkspaceEntryCardProps = {
  card: WorkspaceCard;
};

function WorkspaceEntryCard({ card }: WorkspaceEntryCardProps) {
  return (
    <article
      className={[
        "rounded-[1.4rem] border bg-white/92 p-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.05)] transition",
        card.selected ? "border-[#93c5fd] ring-1 ring-[#bfdbfe]" : "border-slate-200 hover:-translate-y-0.5 hover:border-[#bfdbfe] hover:shadow-[0_18px_30px_rgba(59,115,231,0.1)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${card.accent}`}>
            <WorkspaceGlyph kind={card.icon} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">{card.label}</p>
            <p className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Workspace entry
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
          Routes to {card.routeLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
      <Link
        href={card.href}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
      >
        Sign in
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function WorkspaceGlyph({ kind }: { kind: WorkspaceIconKey }) {
  switch (kind) {
    case "member":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="8.2" r="3.1" />
          <path d="M6.3 19.4c1.1-3.1 3.2-4.7 5.7-4.7s4.6 1.6 5.7 4.7" />
        </svg>
      );
    case "leader":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M4 17.4c1.2-2.6 3.5-4 8-4s6.8 1.4 8 4" />
          <path d="M8 9.7a4 4 0 1 1 8 0" />
          <path d="M12 3.6v1.8" />
        </svg>
      );
    case "coach":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M5.5 15.5c1.2-2.4 3.4-3.7 6.5-3.7s5.3 1.3 6.5 3.7" />
          <path d="M7.5 10.2h9" />
          <path d="M8.8 6.4h6.4" />
        </svg>
      );
    case "staff":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <rect x="4.5" y="5" width="15" height="14" rx="2.5" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
        </svg>
      );
    case "admin":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 3.8 19 7v5.2c0 4.4-3 7.8-7 8.9-4-1.1-7-4.5-7-8.9V7l7-3.2Z" />
          <path d="m9.2 12 2.1 2.1 3.6-4" />
        </svg>
      );
    case "super":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 3.5 19 7v5.2c0 4.4-3 7.7-7 8.8-4-1.1-7-4.4-7-8.8V7l7-3.5Z" />
          <path d="m8.3 12.2 2 2 4.5-4.6" />
        </svg>
      );
  }
}
