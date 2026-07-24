import type { MemberMobileCampaignContext } from "@/services/member-mobile-event-context";

export function getMemberEventCampaignFallback(
  activeCampaign: string,
  memberCampaign: MemberMobileCampaignContext | null,
) {
  if (activeCampaign === "Luma calendar history") {
    return {
      name: activeCampaign,
      phase: "Imported provider history - read-only",
      color: "from-slate-700 to-slate-600",
      accent: "bg-slate-100 text-slate-700 border-slate-200",
      description:
        "Completed chapter events imported from Luma. RSVP and check-in are closed, and provider writes remain disabled.",
      progress: 100,
    };
  }

  return {
    name: activeCampaign,
    phase: "Active chapter campaign",
    color: "from-primary to-blue-600",
    accent: "bg-primary/10 text-primary border-primary/20",
    description:
      memberCampaign?.objective ??
      "Chapter campaign details are not available yet.",
    progress: 0,
  };
}
