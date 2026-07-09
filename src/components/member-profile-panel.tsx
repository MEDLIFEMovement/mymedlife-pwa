import {
  Award,
  Bell,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Settings,
  Share2,
  Shield,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import type { ProfileWorkspace } from "@/services/profile-workspace";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import { StatusPill, SurfacePanel } from "@/components/visual-primitives";
import type { ReactNode } from "react";

type MemberProfilePanelProps = {
  chapterName: string;
  displayName: string;
  entrySource?: "home" | "points" | null;
  entryEventId?: string | null;
  entryCampaign?: string | null;
  isPreviewMode?: boolean;
  workspace: ProfileWorkspace;
  studentHome: MvpMemberHome;
  recognition: MemberRecognitionSummary;
};

export function MemberProfilePanel({
  chapterName,
  displayName,
  entrySource = null,
  entryEventId = null,
  entryCampaign = null,
  isPreviewMode = false,
  workspace,
  studentHome,
  recognition,
}: MemberProfilePanelProps) {
  const launchLanePointsHref = buildProfilePointsHref(entrySource, entryEventId, entryCampaign);
  const launchLaneEventsHref = buildProfileEventsHref(entrySource, entryEventId, entryCampaign);
  const testDisplayName = ensureVisibleTestLabel(displayName);
  const testChapterName = ensureVisibleTestLabel(chapterName);
  const visibleBadges = getProfileBadges(recognition);
  const profileLabel = workspace.profileLabel;
  const designationOptions = getDesignationOptions(profileLabel);
  const avatarMonogram = getAvatarMonogram(testDisplayName);
  const eventCount = Math.max(
    studentHome.recentHistory.length,
    studentHome.primaryEvent ? 1 : 0,
  );
  const taskCount =
    recognition.selectedMember?.completedActions ?? recognition.recentApprovedActions.length;
  const recentActivity = getRecentActivity(recognition, studentHome);
  const continuityCard =
    entrySource === "home"
      ? {
          eyebrow: "Opened from the TEST home walkthrough",
          body:
            "This profile stays inside the student shell so you can review your TEST identity, points, and next event context without falling out of the member app.",
          href: "/app",
          cta: "Back to Home",
        }
      : entrySource === "points"
        ? {
            eyebrow: "Opened from Points & Recognition",
            body:
              entryEventId
                ? "This profile stays inside the student shell so you can review your TEST identity, chapter standing, and exact event context without breaking the points-to-profile member loop."
                : "This profile stays inside the student shell so you can review your TEST identity and chapter standing without breaking the points-to-profile member loop.",
            href: buildProfilePointsHref("points", entryEventId, entryCampaign),
            cta: "Back to Points",
          }
        : null;

  return (
    <section className="bg-white pb-5">
      <section className="overflow-hidden bg-white">
        <div className="bg-[#1d4ed8] px-5 pb-6 pt-12 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[#facc15] text-2xl font-extrabold text-slate-900 shadow-lg">
                {avatarMonogram}
              </div>
              <div>
                <h1 className="text-xl font-extrabold leading-tight">{testDisplayName}</h1>
                <p className="mt-0.5 text-xs text-blue-100">{testChapterName}</p>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-white/18 px-2.5 py-0.5 text-[11px] font-semibold">
                  {profileLabel}
                </span>
              </div>
            </div>
            <details className="group">
              <summary className="list-none">
                <span className="flex cursor-pointer flex-col items-center gap-1 rounded-[1.15rem] border border-white/18 bg-white/10 p-3 text-[10px] font-semibold text-white transition group-open:bg-white/16">
                  <QrCode size={20} />
                  ID Card
                </span>
              </summary>
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
                <div className="w-full max-w-[430px] rounded-t-[1.8rem] bg-white p-6 pb-10 text-center text-slate-900 shadow-2xl">
                  <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    TEST Member ID
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-950">{testDisplayName}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {testChapterName} · {profileLabel}
                  </p>
                  <div className="my-5 flex justify-center">
                    <div className="rounded-[1.35rem] bg-[#eef3fa] p-4 shadow-inner">
                      <div className="flex h-[180px] w-[180px] items-center justify-center rounded-[1.15rem] bg-white text-[#2563eb]">
                        <QrCode size={136} strokeWidth={1.4} />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="rounded-xl bg-slate-100 py-3">
                      <p className="text-sm font-bold text-slate-950">TEST-UCLA-0847</p>
                      <p className="mt-0.5 text-slate-500">Preview member ID</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 py-3">
                      <p className="text-sm font-bold text-slate-950">{studentHome.pointsTotal} pts</p>
                      <p className="mt-0.5 text-slate-500">Season Points</p>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    QR and ID are preview-only. No check-in, credential issue, or profile write runs from this card.
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <ProfileStatCard value={`${studentHome.pointsTotal}`} label="Total Points" />
            <ProfileStatCard value={`${eventCount}`} label="Events" />
            <ProfileStatCard value={`${taskCount}`} label="Tasks Done" />
          </div>
        </div>

        <div className="space-y-5 px-4 pb-4 pt-5">
          {continuityCard ? (
            <SurfacePanel className="rounded-[1.6rem] border border-[#bfdbfe] bg-[#eff6ff] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#1d4ed8]">
                {continuityCard.eyebrow}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {continuityCard.body}
              </p>
              <a
                href={continuityCard.href}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb]"
              >
                <ChevronLeft size={14} />
                {continuityCard.cta}
              </a>
              {(entrySource === "points" || entrySource === "home") && entryEventId ? (
                <a
                  href={launchLaneEventsHref}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                >
                  <ChevronRight size={14} />
                  Back to TEST event detail
                </a>
              ) : null}
            </SurfacePanel>
          ) : null}

          <section>
            <ProfileSectionLabel>Achievements</ProfileSectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {visibleBadges.map((badge) => (
                <article
                  key={badge.label}
                  className={`flex min-h-[7.4rem] flex-col items-center justify-center rounded-[1.4rem] border border-slate-200 px-2 py-3 text-center ${
                    badge.earned ? "bg-white" : "bg-slate-50 opacity-55"
                  }`}
                >
                  <span className="text-2xl">{getBadgeGlyph(badge.tone)}</span>
                  <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-900">
                    {badge.label}
                  </p>
                  {badge.earned ? (
                    <StatusPill tone="blue" className="mt-2 px-2 py-0.5 text-[9px] tracking-[0.1em]">
                      Earned
                    </StatusPill>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section>
            <ProfileSectionLabel>Recent Activity</ProfileSectionLabel>
            <SurfacePanel className="overflow-hidden rounded-[1.6rem] p-0">
              {recentActivity.map((activity, index) => (
                <div
                  key={`${activity.title}-${index}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    index < recentActivity.length - 1 ? "border-b border-slate-200" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{activity.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {activity.pointsLabel}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 px-4 py-3">
                <a
                  href={launchLanePointsHref}
                  className="block w-full rounded-xl py-1 text-center text-sm font-semibold text-[#2563eb] hover:bg-slate-50"
                >
                  View full history
                </a>
              </div>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Your Designation</ProfileSectionLabel>
            <SurfacePanel className="rounded-[1.6rem] p-4">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-[#2563eb]" />
                <p className="text-sm font-semibold text-slate-950">
                  Switch designation to preview access
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {designationOptions.map((option) => {
                  const isActive = option === profileLabel;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled
                      aria-disabled="true"
                      className={
                        isActive
                          ? "rounded-xl bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500"
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Preview only: designation changes and privileged views stay blocked until approved membership access is wired.
              </p>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Settings</ProfileSectionLabel>
            <SurfacePanel className="overflow-hidden rounded-[1.6rem] p-0">
              <div className="border-b border-slate-200 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-[#2563eb]" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Push Notifications</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Preview-only toggle. Notification preference writes stay blocked here.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-pressed="true"
                    className="relative h-6 w-11 rounded-full bg-[#2563eb] opacity-80"
                  >
                    <span className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow" />
                  </button>
                </div>
              </div>
              <ProfileSettingRow
                icon={<Award size={16} className="text-[#2563eb]" />}
                label="My Certificates"
                detail="Certificates stay blocked until approved document and export flows exist."
                status="Blocked"
              />
              <ProfileSettingRow
                icon={<Share2 size={16} className="text-[#2563eb]" />}
                label="Share Profile"
                detail="Profile sharing is blocked in this preview."
                status="Blocked"
              />
              <ProfileSettingRow
                icon={<Settings size={16} className="text-[#2563eb]" />}
                label="Account Settings"
                detail="Read-only account context stays visible from this profile route."
                status="Read-only"
                isLast
              />
            </SurfacePanel>
          </section>

          <div className="rounded-[1.35rem] border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-[#1d4ed8]">Read-only profile</p>
            <div className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
              <p>No profile save runs from this route.</p>
              <p>No join request, role approval, membership change, or coach assignment runs from this route.</p>
              {isPreviewMode ? (
                <p>Certificates and profile sharing stay blocked in this preview shell.</p>
              ) : null}
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 transition active:scale-[0.98]"
            >
              Sign Out
            </button>
          </form>
          <p className="text-center text-xs text-slate-500">
            myMEDLIFE v1.0 · {testChapterName}
          </p>
        </div>
      </section>
    </section>
  );
}

function buildProfilePointsHref(
  entrySource: "home" | "points" | null,
  entryEventId: string | null,
  entryCampaign: string | null,
) {
  const url = new URL(
    `https://mymedlife.local${
      entrySource === "points"
        ? "/app/points?source=points"
        : entrySource === "home"
          ? "/app/points?source=home"
          : "/app/points?source=profile"
    }`,
  );

  if (entryEventId) {
    url.searchParams.set("event", entryEventId);
  }

  if (entryCampaign && entryCampaign !== "All") {
    url.searchParams.set("campaign", entryCampaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildProfileEventsHref(
  entrySource: "home" | "points" | null,
  entryEventId: string | null,
  entryCampaign: string | null,
) {
  const url = new URL(
    `https://mymedlife.local${
      entryEventId
        ? `/app/events/${entryEventId}?source=${entrySource === "home" ? "home" : "profile"}`
        : `/app/events?source=${entrySource === "home" ? "home" : "profile"}`
    }`,
  );

  if (entrySource === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (entryCampaign && entryCampaign !== "All") {
    url.searchParams.set("campaign", entryCampaign);
  }

  return `${url.pathname}${url.search}`;
}

type ProfileBadge = {
  label: string;
  tone: MemberRecognitionSummary["badges"][number]["tone"];
  earned: boolean;
};

function ProfileSectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

function ProfileStatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="rounded-[1.1rem] border border-white/16 bg-white/12 px-3 py-3 text-center">
      <p className="text-xl font-extrabold text-white">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-blue-100">{label}</p>
    </article>
  );
}

function getProfileBadges(recognition: MemberRecognitionSummary): ProfileBadge[] {
  const earnedBadges = recognition.badges.slice(0, 4).map((badge) => ({
    ...badge,
    label: ensureVisibleTestLabel(badge.label),
    earned: true,
  }));
  const lockedBadges: ProfileBadge[] = [
    { label: "TEST Speaker", tone: "slate", earned: false },
    { label: "TEST Season MVP", tone: "gold", earned: false },
  ];

  return [...earnedBadges, ...lockedBadges].slice(0, 6);
}

function ProfileSettingRow({
  icon,
  label,
  detail,
  status,
  isLast = false,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  status: string;
  isLast?: boolean;
}) {
  return (
    <div className={`px-4 py-3.5 ${isLast ? "" : "border-b border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-950">{label}</p>
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{status}</span>
              <ChevronRight size={15} />
            </div>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ensureVisibleTestLabel(value: string) {
  return /\bTEST\b/.test(value) ? value : `TEST ${value}`;
}

function getAvatarMonogram(value: string) {
  const parts = value
    .replace(/^TEST\s+/u, "")
    .split(" ")
    .filter(Boolean);

  return (parts[0]?.[0] ?? "T") + (parts[1]?.[0] ?? "");
}

function getDesignationOptions(current: string) {
  const options = ["General Member", "E-Board", "Staff", "DS", "Sales", "Super Admin"];
  return options.includes(current) ? options : [current, ...options.filter((option) => option !== current)];
}

function getRecentActivity(
  recognition: MemberRecognitionSummary,
  studentHome: MvpMemberHome,
) {
  const approvedActions = recognition.recentApprovedActions.slice(0, 5).map((action) => ({
    title: ensureVisibleTestLabel(action.title),
    detail: action.detail,
    pointsLabel: action.pointsLabel,
  }));
  const historyActions = studentHome.recentHistory.slice(0, 5).map((entry) => ({
    title: ensureVisibleTestLabel(entry.label),
    detail: entry.detail,
    pointsLabel: "Preview",
  }));

  const combinedActivity = [...approvedActions, ...historyActions].slice(0, 5);

  if (combinedActivity.length > 0) {
    return combinedActivity;
  }

  return studentHome.recentHistory.slice(0, 5).map((entry) => ({
    title: ensureVisibleTestLabel(entry.label),
    detail: entry.detail,
    pointsLabel: "Preview",
  }));
}

function getBadgeGlyph(tone: MemberRecognitionSummary["badges"][number]["tone"]) {
  switch (tone) {
    case "gold":
      return "🏅";
    case "blue":
      return "💙";
    case "green":
      return "🌟";
    case "slate":
      return "✨";
  }
}
