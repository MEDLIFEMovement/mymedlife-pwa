import {
  Award,
  Bell,
  ChevronRight,
  QrCode,
  Settings,
  Share2,
  Shield,
} from "lucide-react";
import {
  getLaunchLaneMemberEventsHref,
  getLaunchLaneMemberPointsHref,
} from "@/services/events-points-launch-lane";
import type { MvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import type { ProfileWorkspace } from "@/services/profile-workspace";
import type { MemberRecognitionSummary } from "@/services/member-recognition";
import {
  PanelButton,
  StatusPill,
  SurfacePanel,
} from "@/components/visual-primitives";
import type { ReactNode } from "react";

type MemberProfilePanelProps = {
  chapterName: string;
  displayName: string;
  entrySource?: "home" | null;
  workspace: ProfileWorkspace;
  studentHome: MvpMemberHome;
  recognition: MemberRecognitionSummary;
};

export function MemberProfilePanel({
  chapterName,
  displayName,
  entrySource = null,
  workspace,
  studentHome,
  recognition,
}: MemberProfilePanelProps) {
  const launchLaneHomeHref = "/app";
  const launchLaneEventsHref = getLaunchLaneMemberEventsHref("profile");
  const launchLanePointsHref = getLaunchLaneMemberPointsHref("profile");
  const testDisplayName = ensureVisibleTestLabel(displayName);
  const testChapterName = ensureVisibleTestLabel(chapterName);
  const featuredHomeEvent = studentHome.primaryEvent;
  const testFeaturedHomeEventTitle = featuredHomeEvent?.title
    ? ensureVisibleTestLabel(featuredHomeEvent.title)
    : "Open the next chapter event";
  const visibleBadges = recognition.badges.slice(0, 6);
  const profileLabel = workspace.profileLabel;
  const designationOptions = getDesignationOptions(profileLabel);
  const avatarMonogram = getAvatarMonogram(testDisplayName);
  const eventCount = Math.max(studentHome.recentHistory.length, featuredHomeEvent ? 1 : 0);
  const taskCount = recognition.selectedMember?.completedActions ?? recognition.recentApprovedActions.length;
  const visibleIdentityRows = workspace.identityRows.map((row) => ({
    ...row,
    value:
      row.label === "Name" || row.label === "Chapter scope"
        ? ensureVisibleTestLabel(row.value)
        : row.value,
  }));
  const visibleScopeRows = workspace.scopeRows.map((row) => ({
    ...row,
    value: row.label === "Chapter scope" ? ensureVisibleTestLabel(row.value) : row.value,
  }));
  const recentActivity = getRecentActivity(recognition, studentHome);

  return (
    <section className="space-y-4 pb-5">
      <section className="overflow-hidden bg-white">
        <div className="bg-[#1d4ed8] px-5 pb-6 pt-12 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white/18 text-2xl font-extrabold shadow-lg">
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
            <details className="group relative">
              <summary className="list-none">
                <span className="flex cursor-pointer flex-col items-center gap-1 rounded-[1.15rem] border border-white/18 bg-white/10 p-3 text-[10px] font-semibold text-white transition group-open:bg-white/16">
                  <QrCode size={20} />
                  Member ID
                </span>
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-10 w-[18rem] rounded-[1.6rem] border border-white/20 bg-white p-4 text-left text-slate-900 shadow-2xl">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  TEST member ID
                </p>
                <h2 className="mt-2 text-lg font-bold text-slate-950">{testDisplayName}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {testChapterName} · {profileLabel}
                </p>
                <div className="mt-4 grid gap-3 rounded-[1.35rem] bg-[#eff6ff] p-4">
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-[1.35rem] bg-white text-[#2563eb] shadow-inner">
                    <QrCode size={120} strokeWidth={1.4} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-[1rem] bg-white px-3 py-2">
                      <p className="text-sm font-bold text-slate-950">TEST-UCLA-0847</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Preview member ID</p>
                    </div>
                    <div className="rounded-[1rem] bg-white px-3 py-2">
                      <p className="text-sm font-bold text-slate-950">{studentHome.pointsTotal} pts</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Current points</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  QR and ID readback stay preview-only here. No check-in, credential issue, or profile write runs from this card.
                </p>
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
          {entrySource ? (
            <SurfacePanel tone="info" className="rounded-[1.5rem] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Opened from the TEST home walkthrough
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Keep home, profile, and the next event in one member flow.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Home sent you here to confirm your TEST chapter scope and role without leaving the
                student shell. Keep profile read-only, then step back into the next event or points move when
                you are ready.
              </p>
              <div className="mt-3">
                <PanelButton href={launchLaneHomeHref} variant="secondary">
                  Back to Home
                </PanelButton>
              </div>
            </SurfacePanel>
          ) : null}

          <section>
            <ProfileSectionLabel>Read-only profile</ProfileSectionLabel>
            <SurfacePanel tone="info" className="rounded-[1.6rem] p-4">
              <p className="text-sm leading-6 text-slate-600">
                This mobile profile stays source-faithful and read-only: identity, chapter scope, next event,
                and points stay visible without turning this route into a live editing workspace.
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {workspace.safetyNotes.slice(0, 3).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Achievements</ProfileSectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {visibleBadges.map((badge) => (
                <article
                  key={badge.label}
                  className="flex min-h-[7.4rem] flex-col items-center justify-center rounded-[1.4rem] border border-slate-200 bg-white px-2 py-3 text-center"
                >
                  <span className="text-2xl">{getBadgeGlyph(badge.tone)}</span>
                  <p className="mt-2 text-[11px] font-semibold leading-tight text-slate-900">
                    {ensureVisibleTestLabel(badge.label)}
                  </p>
                  <StatusPill tone="blue" className="mt-2 px-2 py-0.5 text-[9px] tracking-[0.1em]">
                    Earned
                  </StatusPill>
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
                <PanelButton href={launchLanePointsHref} variant="secondary" className="w-full">
                  View full history
                </PanelButton>
              </div>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Your Designation</ProfileSectionLabel>
            <SurfacePanel className="rounded-[1.6rem] p-4">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-[#2563eb]" />
                <p className="text-sm font-semibold text-slate-950">
                  Preview designations stay visible, but switching is blocked on this route.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {designationOptions.map((option) => {
                  const isActive = option === profileLabel;
                  return (
                    <span
                      key={option}
                      className={
                        isActive
                          ? "rounded-xl bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500"
                      }
                    >
                      {option}
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Role previews stay blocked here. Any real role change must come from approved membership and access paths.
              </p>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Profile Details</ProfileSectionLabel>
            <div className="grid gap-3">
              {[...visibleIdentityRows, ...visibleScopeRows].map((row) => (
                <SurfacePanel key={row.label} className="rounded-[1.45rem] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{row.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
                </SurfacePanel>
              ))}
            </div>
          </section>

          <section>
            <ProfileSectionLabel>Next chapter moment</ProfileSectionLabel>
            <SurfacePanel tone="info" className="rounded-[1.6rem] p-4">
              <h2 className="text-lg font-semibold text-slate-950">{testFeaturedHomeEventTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep profile lightweight. From here, the next useful move is to open an event,
                review RSVP or attendance posture, and then step back into points when the chapter loop moves.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PanelButton href={launchLaneEventsHref} variant="secondary">
                  Open events
                </PanelButton>
                <PanelButton href={launchLanePointsHref}>Open points</PanelButton>
              </div>
            </SurfacePanel>
          </section>

          <section>
            <ProfileSectionLabel>Settings</ProfileSectionLabel>
            <SurfacePanel className="overflow-hidden rounded-[1.6rem] p-0">
              <ProfileSettingRow
                icon={<Bell size={16} className="text-[#2563eb]" />}
                label="Push Notifications"
                detail="Preview-only toggle. Notification preference writes stay blocked here."
                status="Preview only"
              />
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
                detail="Read-only account context stays available in the account menu."
                status="Read-only"
                isLast
              />
            </SurfacePanel>
          </section>

          <SurfacePanel tone="info" className="rounded-[1.6rem] p-4">
            <div className="flex flex-wrap gap-2">
              <PanelButton href={launchLaneHomeHref} variant="secondary">
                Back to Home
              </PanelButton>
              <PanelButton href={launchLaneEventsHref} variant="secondary">
                Open events
              </PanelButton>
              <PanelButton href={launchLanePointsHref}>Open points</PanelButton>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep profile inside the same member loop: home, events, attendance readback, and points stay one tap away.
            </p>
          </SurfacePanel>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 opacity-80"
          >
            Sign out
          </button>
          <p className="-mt-2 text-center text-xs text-slate-500">
            Sign-out stays in the account menu for this preview shell.
          </p>
        </div>
      </section>
    </section>
  );
}

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
  const options = ["General Member", "E-Board", "Staff"];
  return options.includes(current) ? options : [current, ...options.filter((option) => option !== current)];
}

function getRecentActivity(
  recognition: MemberRecognitionSummary,
  studentHome: MvpMemberHome,
) {
  if (recognition.recentApprovedActions.length > 0) {
    return recognition.recentApprovedActions.slice(0, 3).map((action) => ({
      title: ensureVisibleTestLabel(action.title),
      detail: action.detail,
      pointsLabel: action.pointsLabel,
    }));
  }

  return studentHome.recentHistory.slice(0, 3).map((entry) => ({
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
