import Link from "next/link";
import type { CampaignShell } from "@/shared/types/campaigns";

type CampaignCardProps = {
  campaign: CampaignShell;
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="app-surface flex h-full flex-col rounded-[2rem] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            {campaign.status} / {campaign.family.replaceAll("_", " ")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{campaign.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-slate-600">
          {campaign.primaryKpis.length} KPIs
        </span>
      </div>

      <div className="app-surface-soft mt-4 rounded-2xl p-3">
        <p className="app-eyebrow app-eyebrow-slate">Student promise</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.studentPromise}</p>
      </div>

      {campaign.workflowSnapshot ? (
        <div className="app-surface-soft mt-4 rounded-2xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="app-eyebrow app-eyebrow-blue">Current workflow state</p>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              {campaign.workflowSnapshot.versionLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              source {campaign.workflowSnapshot.sourceKind.replaceAll("_", " ")}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-950">
            {campaign.workflowSnapshot.currentPhaseLabel}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {campaign.workflowSnapshot.currentPhaseObjective}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Exit signal: {campaign.workflowSnapshot.currentPhaseExitSignal}
          </p>
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-[#08224c] transition hover:bg-[#93c5fd] sm:w-auto"
        >
          Open campaign shell
        </Link>
      </div>
    </article>
  );
}
