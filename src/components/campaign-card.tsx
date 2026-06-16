import Link from "next/link";
import type { CampaignShell } from "@/shared/types/campaigns";

type CampaignCardProps = {
  campaign: CampaignShell;
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
            {campaign.status} / {campaign.family.replaceAll("_", " ")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{campaign.name}</h2>
          <p className="mt-2 text-sm leading-6 text-white/64">{campaign.summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70">
          {campaign.primaryKpis.length} KPIs
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
          Student promise
        </p>
        <p className="mt-2 text-sm leading-6 text-white/70">{campaign.studentPromise}</p>
      </div>

      <Link
        href={`/campaigns/${campaign.slug}`}
        className="mt-4 inline-flex rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#06211d]"
      >
        Open campaign shell
      </Link>
    </article>
  );
}
