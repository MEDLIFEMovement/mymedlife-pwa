import Link from "next/link";
import type { CampaignShell } from "@/shared/types/campaigns";

type CampaignCardProps = {
  campaign: CampaignShell;
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="app-surface rounded-3xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="app-eyebrow app-eyebrow-blue">
            {campaign.status} / {campaign.family.replaceAll("_", " ")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{campaign.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {campaign.primaryKpis.length} KPIs
        </span>
      </div>

      <div className="app-surface-soft mt-4 rounded-2xl p-3">
        <p className="app-eyebrow app-eyebrow-slate">Student promise</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.studentPromise}</p>
      </div>

      <Link
        href={`/campaigns/${campaign.slug}`}
        className="mt-4 inline-flex rounded-full bg-[#f7d05e] px-4 py-2 text-sm font-semibold text-[#08224c]"
      >
        Open campaign shell
      </Link>
    </article>
  );
}
