import Link from "next/link";

import type { MemberActionDetailWorkspace } from "@/services/member-action-detail-workspace";

type MemberActionDetailSourceContext = {
  eyebrow: string;
  detail: string;
  href: string;
  backLabel: string;
};

type MemberActionDetailPanelProps = {
  workspace: MemberActionDetailWorkspace;
  actionHref?: string;
  actionLabel?: string;
  sourceContext?: MemberActionDetailSourceContext | null;
};

export function MemberActionDetailPanel({
  workspace,
  actionHref,
  actionLabel,
  sourceContext = null,
}: MemberActionDetailPanelProps) {
  return (
    <section className="grid gap-3">
      <section className="overflow-hidden rounded-[2rem] border border-[#5d8ff6]/30 bg-[linear-gradient(180deg,#2455a4_0%,#2a5fb5_48%,#21457d_100%)] p-4 shadow-[0_24px_80px_rgba(2,14,38,0.28)]">
        <h1 className="text-[2rem] font-semibold leading-tight text-white sm:text-[2.35rem]">
          Action Detail
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82">
            {workspace.campaignLabel}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {workspace.statusLabel}
          </span>
        </div>
        <h2 className="mt-3 text-[1.55rem] font-semibold leading-tight text-white">
          {workspace.title}
        </h2>
        <p className="mt-2 text-sm text-white/82">{workspace.dueLabel}</p>
        <p className="mt-2 text-sm text-white/78">{workspace.assignedByLabel}</p>
        <p className="mt-3 text-sm font-semibold text-[#f7d05e]">
          {workspace.pointsApprovalLabel}
        </p>
        <p className="mt-2 text-sm text-white/78">{workspace.appliesToLabel}</p>
        {sourceContext ? (
          <div className="mt-4 rounded-[1.3rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#dbe8ff]">
                  {sourceContext.eyebrow}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {sourceContext.detail}
                </p>
              </div>
              <Link
                href={sourceContext.href}
                className="inline-flex w-fit rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/24 hover:bg-white/14"
              >
                {sourceContext.backLabel}
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.whyItMattersTitle}</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {workspace.whyItMattersBody}
        </p>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.stepsTitle}</p>
        <div className="mt-3 grid gap-2.5">
          {workspace.steps.map((step, index) => (
            <article
              key={`${index + 1}-${step}`}
              className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#bfdbfe] bg-white text-sm font-semibold text-[#2563eb]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-4">
        <p className="app-eyebrow app-eyebrow-blue">{workspace.evidenceTitle}</p>
        <div className="mt-3 grid gap-2.5">
          {workspace.evidenceItems.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3.5"
            >
              <p className="text-sm font-semibold text-slate-950">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">{workspace.helperLabel}</p>
        <Link
          href={actionHref ?? workspace.submitEvidenceHref}
          className="mt-4 inline-flex rounded-full bg-[#2b5fb4] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2455a4]"
        >
          {actionLabel ?? workspace.submitEvidenceLabel}
        </Link>
      </section>
    </section>
  );
}
