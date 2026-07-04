/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";
import {
  ChevronRight, Plus, Settings, Eye, GitBranch, Users,
  CheckCircle, Award, Bell, ArrowLeft, MoreHorizontal,
  Search, Copy, Archive, Zap, Shield, Clock, AlertTriangle,
  Star, TrendingUp, FileText, RotateCcw, X, Edit3,
  Upload, Info, BookOpen, Filter, Check, Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "live" | "draft" | "archived" | "scheduled";
type StepStatus = "live" | "draft" | "inactive" | "deprecated";
type BuilderTab = "steps" | "role-matrix" | "completion" | "points" | "comms" | "preview" | "version";
type RolePermission = "read" | "submit" | "approve" | "configure" | "—";

interface Campaign {
  id: number;
  name: string;
  status: CampaignStatus;
  version: string;
  lastEditedBy: string;
  lastPublished: string;
  stepCount: number;
  description: string;
}

// Exported so host app can type the selectedSOPCampaign state
export type { Campaign as SOPCampaign };

interface Step {
  id: number;
  number: number;
  name: string;
  phase: string;
  ownerRole: string;
  affectedRoles: string[];
  evidenceRequired: boolean;
  approvalRequired: boolean;
  pointsEnabled: boolean;
  kpiTag: string;
  commCount: number;
  status: StepStatus;
  required: boolean;
  purpose: string;
  entryCriteria: string;
  exitCriteria: string;
  dueTiming: string;
  riskNotes: string;
}

interface RoleMatrixEntry {
  role: string;
  visible: boolean;
  actionRequired: boolean;
  permission: RolePermission;
  proofRequired: string;
  afterCompletion: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    name: "Chapter Organization / Planning",
    status: "live",
    version: "v3.2",
    lastEditedBy: "Maya Chen",
    lastPublished: "May 12, 2026",
    stepCount: 8,
    description: "Annual chapter setup, goal setting, and planning workflow for new academic year.",
  },
  {
    id: 2,
    name: "Rush Month / Recruitment",
    status: "draft",
    version: "v2.1",
    lastEditedBy: "Jordan Park",
    lastPublished: "Mar 1, 2026",
    stepCount: 12,
    description: "Full recruitment cycle from info sessions through bid day and member onboarding.",
  },
  {
    id: 3,
    name: "Chapter Engagement",
    status: "live",
    version: "v4.0",
    lastEditedBy: "Sam Rivera",
    lastPublished: "Apr 20, 2026",
    stepCount: 6,
    description: "Ongoing member engagement, attendance tracking, and activity completion.",
  },
  {
    id: 4,
    name: "SLT Promotion / Recruitment",
    status: "scheduled",
    version: "v1.5",
    lastEditedBy: "Alex Kim",
    lastPublished: "Nov 10, 2025",
    stepCount: 9,
    description: "Student leader track identification, vetting, and promotion process.",
  },
  {
    id: 5,
    name: "Moving Mountains",
    status: "archived",
    version: "v2.0",
    lastEditedBy: "Taylor Brooks",
    lastPublished: "Aug 15, 2025",
    stepCount: 7,
    description: "Annual large-scale community service campaign with partner organizations.",
  },
  {
    id: 6,
    name: "Leadership Transition",
    status: "draft",
    version: "v1.0",
    lastEditedBy: "Chris Morgan",
    lastPublished: "—",
    stepCount: 5,
    description: "End-of-year e-board handoff, documentation, and incoming leader onboarding.",
  },
];

const ROLES = [
  "General Member",
  "Action Committee Member",
  "Action Committee Chair",
  "E-board",
  "Coach",
  "Sales Admin",
  "General Staff",
  "DS Admin",
  "Super Admin",
];

const STEPS: Step[] = [
  {
    id: 1,
    number: 1,
    name: "Define Campaign Goals & KPIs",
    phase: "Planning",
    ownerRole: "E-board",
    affectedRoles: ["Coach", "DS Admin"],
    evidenceRequired: true,
    approvalRequired: true,
    pointsEnabled: false,
    kpiTag: "Chapter Health",
    commCount: 2,
    status: "live",
    required: true,
    purpose: "Establish measurable goals and KPI targets for the campaign before any member-facing steps begin.",
    entryCriteria: "Previous campaign archived. Academic calendar confirmed.",
    exitCriteria: "Goals document approved by Coach. KPIs entered in myMEDLIFE.",
    dueTiming: "7 days before campaign launch",
    riskNotes: "If goals not set by deadline, campaign launch is blocked automatically.",
  },
  {
    id: 2,
    number: 2,
    name: "Intro GBM — Member Attendance",
    phase: "Launch",
    ownerRole: "Action Committee Chair",
    affectedRoles: ["General Member", "Action Committee Member", "E-board"],
    evidenceRequired: true,
    approvalRequired: false,
    pointsEnabled: true,
    kpiTag: "Attendance Rate",
    commCount: 4,
    status: "live",
    required: true,
    purpose: "Open campaign to general membership via intro general body meeting. Attendance is tracked and earns points.",
    entryCriteria: "Step 1 complete. Event created in myMEDLIFE calendar.",
    exitCriteria: "Attendance log submitted. Check-in data synced.",
    dueTiming: "Week 1 of campaign",
    riskNotes: "Attendance below 40% triggers escalation to Coach.",
  },
  {
    id: 3,
    number: 3,
    name: "Recruit 5 Friends to Intro GBM",
    phase: "Recruitment",
    ownerRole: "General Member",
    affectedRoles: ["Action Committee Member", "Action Committee Chair"],
    evidenceRequired: true,
    approvalRequired: false,
    pointsEnabled: true,
    kpiTag: "Recruitment Rate",
    commCount: 3,
    status: "live",
    required: false,
    purpose: "Drive peer-to-peer recruitment through member referrals. Each referral is tracked via a unique link.",
    entryCriteria: "Intro GBM completed and logged.",
    exitCriteria: "5 referral check-ins submitted or 2-week window closes.",
    dueTiming: "Within 14 days of Intro GBM",
    riskNotes: "Low recruitment triggers a chapter-level alert for Coach review.",
  },
  {
    id: 4,
    number: 4,
    name: "Complete Onboarding Checklist",
    phase: "Onboarding",
    ownerRole: "General Member",
    affectedRoles: ["Coach", "DS Admin"],
    evidenceRequired: false,
    approvalRequired: false,
    pointsEnabled: true,
    kpiTag: "Onboarding Completion",
    commCount: 5,
    status: "live",
    required: true,
    purpose: "Members complete profile, HIPAA acknowledgment, chapter agreement, and intro module.",
    entryCriteria: "Member account created.",
    exitCriteria: "All 5 checklist items marked complete in myMEDLIFE.",
    dueTiming: "Within 7 days of account creation",
    riskNotes: "Incomplete onboarding blocks points eligibility for subsequent steps.",
  },
  {
    id: 5,
    number: 5,
    name: "E-board Mid-Campaign Review",
    phase: "Review",
    ownerRole: "E-board",
    affectedRoles: ["Coach", "DS Admin", "Super Admin"],
    evidenceRequired: true,
    approvalRequired: true,
    pointsEnabled: false,
    kpiTag: "Campaign Health",
    commCount: 1,
    status: "draft",
    required: true,
    purpose: "Structured midpoint review of campaign KPIs, attendance trends, and escalated issues.",
    entryCriteria: "Steps 1–4 complete for at least 60% of enrolled members.",
    exitCriteria: "Review report submitted and approved by Coach.",
    dueTiming: "Week 4 of campaign",
    riskNotes: "If KPIs are below 50% threshold, campaign enters watchlist status.",
  },
];

const ROLE_MATRIX_STEP1: RoleMatrixEntry[] = [
  { role: "General Member", visible: false, actionRequired: false, permission: "—", proofRequired: "None", afterCompletion: "No action" },
  { role: "Action Committee Member", visible: false, actionRequired: false, permission: "—", proofRequired: "None", afterCompletion: "No action" },
  { role: "Action Committee Chair", visible: true, actionRequired: false, permission: "read", proofRequired: "None", afterCompletion: "Notified when complete" },
  { role: "E-board", visible: true, actionRequired: true, permission: "configure", proofRequired: "Goals doc upload", afterCompletion: "Step 2 unlocked" },
  { role: "Coach", visible: true, actionRequired: true, permission: "approve", proofRequired: "None", afterCompletion: "Approval triggers launch" },
  { role: "Sales Admin", visible: false, actionRequired: false, permission: "—", proofRequired: "None", afterCompletion: "No action" },
  { role: "General Staff", visible: true, actionRequired: false, permission: "read", proofRequired: "None", afterCompletion: "No action" },
  { role: "DS Admin", visible: true, actionRequired: true, permission: "configure", proofRequired: "KPI targets entered", afterCompletion: "KPIs published to dashboard" },
  { role: "Super Admin", visible: true, actionRequired: false, permission: "read", proofRequired: "None", afterCompletion: "Audit log entry created" },
];

const COMM_TRIGGERS = [
  { id: 1, trigger: "Step becomes active", audience: "All enrolled members", channel: "Push notification", timing: "Immediately", source: "myMEDLIFE", status: "live" as const },
  { id: 2, trigger: "Member submits evidence", audience: "Coach, DS Admin", channel: "In-app message", timing: "Immediately", source: "myMEDLIFE", status: "live" as const },
  { id: 3, trigger: "Step deadline approaching (48h)", audience: "Assigned member", channel: "Email + Push", timing: "48h before deadline", source: "HubSpot", status: "live" as const },
  { id: 4, trigger: "Step overdue — no submission", audience: "E-board + Coach", channel: "Escalation message", timing: "1h after deadline passes", source: "myMEDLIFE", status: "live" as const },
  { id: 5, trigger: "Step approved & completed", audience: "Member", channel: "In-app + Feed update", timing: "Immediately on approval", source: "myMEDLIFE", status: "draft" as const },
];

const POINTS_DATA = [
  { role: "General Member", points: 30, enabled: true },
  { role: "Action Committee Member", points: 35, enabled: true },
  { role: "Action Committee Chair", points: 40, enabled: true },
  { role: "E-board", points: 50, enabled: true },
  { role: "Coach", points: 0, enabled: false },
  { role: "Sales Admin", points: 0, enabled: false },
  { role: "General Staff", points: 0, enabled: false },
  { role: "DS Admin", points: 0, enabled: false },
  { role: "Super Admin", points: 0, enabled: false },
];

const ROLE_PREVIEWS = [
  {
    role: "General Member",
    accent: "border-blue-300 bg-blue-50",
    avatarBg: "bg-blue-100 text-blue-700",
    sees: "Step card in their campaign dashboard with completion status and deadline",
    action: "Submit evidence via upload form in myMEDLIFE",
    evidence: "Document upload or form response",
    approval: "Not required for this role on this step",
    points: "30 points awarded upon completion",
    kpi: "+1 to Recruitment Rate",
    hubspot: "2 email reminders via HubSpot: 48h and 24h before deadline",
  },
  {
    role: "Action Committee Chair",
    accent: "border-purple-300 bg-purple-50",
    avatarBg: "bg-purple-100 text-purple-700",
    sees: "Step card + member progress table showing all submissions",
    action: "Monitor submissions, flag outliers, escalate if needed",
    evidence: "None required from this role",
    approval: "Can approve submissions if delegated by Coach",
    points: "40 points upon completion",
    kpi: "+1 Recruitment Rate + role-level modifier applied",
    hubspot: "1 escalation alert if chapter falls below 40% completion",
  },
  {
    role: "Coach",
    accent: "border-emerald-300 bg-emerald-50",
    avatarBg: "bg-emerald-100 text-emerald-700",
    sees: "Chapter-level dashboard with all step statuses and KPI trends",
    action: "Approve or reject E-board submission",
    evidence: "Not required from Coach on this step",
    approval: "Final approver — approval triggers next step unlock",
    points: "No points (staff role)",
    kpi: "Campaign Health KPI updated immediately on approval",
    hubspot: "Approval request email sent via HubSpot on submission",
  },
  {
    role: "DS Admin",
    accent: "border-slate-300 bg-slate-50",
    avatarBg: "bg-slate-100 text-slate-700",
    sees: "Admin panel with full audit log and chapter-wide view",
    action: "Configure KPI targets and review audit logs",
    evidence: "KPI target entry required in admin console",
    approval: "Can override approvals if escalated",
    points: "No points (admin role)",
    kpi: "Direct KPI write access — changes apply to all chapters",
    hubspot: "No trigger — internal system only",
  },
];

// ─── Utility Components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CampaignStatus | StepStatus | "live" | "draft" }) {
  const config: Record<string, string> = {
    live: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    draft: "bg-amber-50 text-amber-700 border border-amber-200",
    archived: "bg-slate-100 text-slate-500 border border-slate-200",
    scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
    inactive: "bg-slate-100 text-slate-500 border border-slate-200",
    deprecated: "bg-red-50 text-red-600 border border-red-200",
  };
  const labels: Record<string, string> = {
    live: "Live", draft: "Draft", archived: "Archived",
    scheduled: "Scheduled", inactive: "Inactive", deprecated: "Deprecated",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide font-mono ${config[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

function VersionBadge({ version }: { version: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono border border-slate-200">
      {version}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${checked ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Library Screen ───────────────────────────────────────────────────────────

export function LibraryScreen({ onOpen }: { onOpen: (c: Campaign) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = CAMPAIGNS.filter((c) => {
    const matchStatus = filter === "all" || c.status === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: CAMPAIGNS.length,
    live: CAMPAIGNS.filter((c) => c.status === "live").length,
    draft: CAMPAIGNS.filter((c) => c.status === "draft").length,
    scheduled: CAMPAIGNS.filter((c) => c.status === "scheduled").length,
    archived: CAMPAIGNS.filter((c) => c.status === "archived").length,
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="bg-card border-b border-border px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>myMEDLIFE Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-semibold">Campaign SOP Library</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Campaign SOP Library</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            New Campaign SOP
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total SOPs", value: CAMPAIGNS.length, color: "text-foreground" },
            { label: "Live", value: counts.live, color: "text-emerald-700" },
            { label: "In Draft / Scheduled", value: counts.draft + counts.scheduled, color: "text-amber-700" },
            { label: "Archived", value: counts.archived, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border px-5 py-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            {(["all", "live", "draft", "scheduled", "archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f === "all"
                  ? `All (${counts.all})`
                  : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f as keyof typeof counts] ?? 0})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
        </div>

        {/* Campaign table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Edited By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Published</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground text-sm">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{campaign.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-4">
                    <VersionBadge version={campaign.version} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-foreground">{campaign.stepCount}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary text-xs font-bold">{campaign.lastEditedBy[0]}</span>
                      </div>
                      <span className="text-sm text-foreground">{campaign.lastEditedBy}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-muted-foreground">{campaign.lastPublished}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpen(campaign)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Open Builder
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

function StepCard({ step, selected, onClick }: { step: Step; selected: boolean; onClick: () => void }) {
  const borderAccent: Record<StepStatus, string> = {
    live: "border-l-emerald-500",
    draft: "border-l-amber-400",
    inactive: "border-l-slate-300",
    deprecated: "border-l-red-400",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-l-4 rounded-xl p-4 cursor-pointer transition-all select-none ${borderAccent[step.status]} ${
        selected
          ? "border-primary/40 shadow-md ring-2 ring-primary/15"
          : "border-border hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {step.number}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-snug">{step.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.phase} &middot; {step.ownerRole}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {!step.required && <span className="text-xs text-muted-foreground italic">optional</span>}
          <StatusBadge status={step.status} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 ml-10">
        {step.evidenceRequired && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">
            <FileText className="w-2.5 h-2.5" />
            Evidence
          </span>
        )}
        {step.approvalRequired && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
            <Shield className="w-2.5 h-2.5" />
            Approval
          </span>
        )}
        {step.pointsEnabled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100">
            <Star className="w-2.5 h-2.5" />
            Points
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded border border-border">
          <TrendingUp className="w-2.5 h-2.5" />
          {step.kpiTag}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded border border-border">
          <Bell className="w-2.5 h-2.5" />
          {step.commCount} msgs
        </span>
      </div>
    </div>
  );
}

// ─── Step Detail Panel ────────────────────────────────────────────────────────

function StepDetailPanel({ step }: { step: Step }) {
  const [evidenceOn, setEvidenceOn] = useState(step.evidenceRequired);
  const [approvalOn, setApprovalOn] = useState(step.approvalRequired);
  const [pointsOn, setPointsOn] = useState(step.pointsEnabled);
  const [requiredOn, setRequiredOn] = useState(step.required);

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
            {step.number}
          </div>
          <span className="text-sm font-semibold text-foreground">Step Details</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step Name</label>
          <p className="text-sm font-semibold text-foreground mt-1">{step.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phase</label>
            <p className="text-sm text-foreground mt-1">{step.phase}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="mt-1">
              <StatusBadge status={step.status} />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purpose</label>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{step.purpose}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner Role</label>
          <div className="mt-1">
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">
              {step.ownerRole}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supporting Roles</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {step.affectedRoles.map((r) => (
              <span key={r} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded border border-border">
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entry Criteria</label>
            <p className="text-sm text-foreground mt-1">{step.entryCriteria}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exit Criteria</label>
            <p className="text-sm text-foreground mt-1">{step.exitCriteria}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Timing</label>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-sm text-foreground">{step.dueTiming}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5 space-y-3.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Rules</label>
          {[
            { label: "Evidence Required", checked: evidenceOn, onChange: setEvidenceOn },
            { label: "Approval Required", checked: approvalOn, onChange: setApprovalOn },
            { label: "Points Enabled", checked: pointsOn, onChange: setPointsOn },
            { label: "Required Step", checked: requiredOn, onChange: setRequiredOn },
          ].map(({ label, checked, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <Toggle checked={checked} onChange={onChange} />
            </div>
          ))}
        </div>

        {step.riskNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-0.5">Risk / Escalation</p>
                <p className="text-xs text-amber-700 leading-relaxed">{step.riskNotes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="pb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KPI Impact</label>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground">{step.kpiTag}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Steps Tab ────────────────────────────────────────────────────────────────

function StepsTab({
  selectedStep,
  onSelectStep,
}: {
  selectedStep: Step | null;
  onSelectStep: (s: Step) => void;
}) {
  return (
    <>
      {/* Left sidebar */}
      <div className="w-52 bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sections</p>
          {["Planning", "Launch", "Recruitment", "Onboarding", "Review"].map((s) => (
            <button
              key={s}
              className="w-full text-left px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Versions</p>
          {[{ v: "v3.2", active: true }, { v: "v3.1", active: false }, { v: "v3.0", active: false }].map(({ v, active }) => (
            <button
              key={v}
              className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
                active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="font-mono text-xs">{v}</span>
              {active && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Live</span>}
            </button>
          ))}
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</p>
          <button className="w-full text-left px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            Campaign Config
          </button>
        </div>
      </div>

      {/* Center canvas */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-[520px] mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground">Workflow Steps</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{STEPS.length} steps</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>

          {STEPS.map((step, i) => (
            <div key={step.id}>
              <StepCard
                step={step}
                selected={selectedStep?.id === step.id}
                onClick={() => onSelectStep(step)}
              />
              {i < STEPS.length - 1 && (
                <div className="flex flex-col items-center py-1 gap-1">
                  <div className="w-px h-4 bg-border" />
                  <button className="flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full border border-dashed border-border hover:border-primary/30 transition-colors">
                    <Plus className="w-3 h-3" />
                    Add Step
                  </button>
                  <div className="w-px h-4 bg-border" />
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-center mt-3">
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors w-full justify-center">
              <Plus className="w-4 h-4" />
              Add Step After Last
            </button>
          </div>
        </div>
      </div>

      {/* Right detail panel */}
      {selectedStep && (
        <div className="w-[340px] bg-card border-l border-border overflow-y-auto shrink-0">
          <StepDetailPanel step={selectedStep} />
        </div>
      )}
    </>
  );
}

// ─── Role Matrix Tab ──────────────────────────────────────────────────────────

function RoleMatrixTab({ step }: { step: Step | null }) {
  const [activeStep, setActiveStep] = useState(step?.id ?? 1);
  const entries = ROLE_MATRIX_STEP1;

  const permColor = (p: RolePermission) => {
    if (p === "configure") return "bg-purple-100 text-purple-700 border-purple-200";
    if (p === "approve") return "bg-blue-100 text-blue-700 border-blue-200";
    if (p === "submit") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (p === "read") return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-slate-50 text-slate-400 border-slate-100";
  };

  const currentStep = STEPS.find((s) => s.id === activeStep) ?? STEPS[0];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Role Action Matrix</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Step {currentStep.number}: {currentStep.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Viewing step:</span>
          <select
            value={activeStep}
            onChange={(e) => setActiveStep(Number(e.target.value))}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {STEPS.map((s) => (
              <option key={s.id} value={s.id}>
                Step {s.number}: {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">Role</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visible</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action Required</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permission</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proof Required</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">After Completion</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.role}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
              >
                <td className="px-5 py-3.5">
                  <span className={`font-semibold text-sm ${entry.actionRequired ? "text-foreground" : "text-muted-foreground"}`}>
                    {entry.role}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  {entry.visible ? (
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {entry.actionRequired ? (
                    <span className="inline-block w-2 h-2 bg-primary rounded-full mx-auto" />
                  ) : (
                    <span className="inline-block w-2 h-2 bg-border rounded-full mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold border font-mono ${permColor(entry.permission)}`}>
                    {entry.permission}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{entry.proofRequired}</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{entry.afterCompletion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Permission levels:</span>
        {(["read", "submit", "approve", "configure"] as RolePermission[]).map((p) => (
          <span key={p} className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold border font-mono ${permColor(p)}`}>
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Completion Tab ───────────────────────────────────────────────────────────

function CompletionTab({ step }: { step: Step | null }) {
  const [evidenceItems, setEvidenceItems] = useState([true, true, false]);
  const [approvalOn, setApprovalOn] = useState(step?.approvalRequired ?? true);
  const [autoComplete, setAutoComplete] = useState(false);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Completion / Proof / Approval Rules</h2>
        {step && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Step {step.number}: {step.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Completion Condition
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Method</label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setAutoComplete(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!autoComplete ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
                >
                  Manual Review
                </button>
                <button
                  onClick={() => setAutoComplete(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${autoComplete ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
                >
                  Auto-Complete
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Condition</label>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{step?.exitCriteria ?? "All required fields submitted."}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            Evidence Required
          </h3>
          <div className="space-y-2.5">
            {["Document upload (PDF or image)", "Form submission in myMEDLIFE", "Coach verbal confirmation"].map((e, i) => (
              <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={evidenceItems[i]}
                  onChange={() => {
                    const next = [...evidenceItems];
                    next[i] = !next[i];
                    setEvidenceItems(next);
                  }}
                  className="w-4 h-4 accent-primary"
                />
                <span className={`text-sm transition-colors ${evidenceItems[i] ? "text-foreground" : "text-muted-foreground"}`}>{e}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Approval Rules
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Approval Required</span>
              <Toggle checked={approvalOn} onChange={setApprovalOn} />
            </div>
            {approvalOn && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Reviewer Role</label>
                  <p className="text-sm text-foreground mt-1 font-semibold">Coach</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">SLA</label>
                  <p className="text-sm text-foreground mt-1">48 hours from submission</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Overdue & Escalation
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Overdue Trigger</label>
              <p className="text-sm text-foreground mt-1">After deadline passes with no submission</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Escalation Path</label>
              <p className="text-sm text-foreground mt-1">DS Admin &rarr; Super Admin (48h)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Audit Log</label>
              <p className="text-sm text-foreground mt-1">All actions logged with timestamp + user ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Points & KPI Tab ─────────────────────────────────────────────────────────

function PointsKPITab({ step }: { step: Step | null }) {
  const [pointsEnabled, setPointsEnabled] = useState(true);
  const [chapterPoints, setChapterPoints] = useState(true);
  const [leaderboard, setLeaderboard] = useState(true);
  const [approvalForPoints, setApprovalForPoints] = useState(false);
  const [internalOnly, setInternalOnly] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Points & KPI Impact</h2>
        {step && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Step {step.number}: {step.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Role points table */}
        <div className="col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Points by Role
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Points Enabled</span>
              <Toggle checked={pointsEnabled} onChange={setPointsEnabled} />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enabled</th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Point Value</th>
              </tr>
            </thead>
            <tbody>
              {POINTS_DATA.map((entry, i) => (
                <tr key={entry.role} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${entry.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                      {entry.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Toggle checked={entry.enabled && pointsEnabled} onChange={() => {}} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {entry.enabled ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          defaultValue={entry.points}
                          disabled={!pointsEnabled}
                          className="w-20 text-right px-2 py-1.5 border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 bg-card"
                        />
                        <span className="text-xs text-muted-foreground font-mono w-6">pts</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right config column */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              KPI Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">KPI Impacted</label>
                <p className="text-sm font-semibold text-foreground mt-1">{step?.kpiTag ?? "Attendance Rate"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">KPI Event Type</label>
                <span className="mt-1 inline-flex px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded border border-border">
                  increment
                </span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Approver Role</label>
                <p className="text-sm text-foreground mt-1">Coach</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Chapter & Caps</h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Chapter Points</span>
                <Toggle checked={chapterPoints} onChange={setChapterPoints} />
              </div>
              {chapterPoints && (
                <div>
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Chapter Point Value</label>
                  <input
                    type="number"
                    defaultValue={25}
                    className="mt-1.5 w-full px-3 py-1.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Cap per User</label>
                <input
                  type="number"
                  defaultValue={1}
                  className="mt-1.5 w-full px-3 py-1.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Cap per Chapter</label>
                <input
                  type="number"
                  placeholder="No cap"
                  className="mt-1.5 w-full px-3 py-1.5 border border-border rounded-lg text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Rules</h3>
            <div className="space-y-3.5">
              {[
                { label: "Leaderboard Visible", checked: leaderboard, onChange: setLeaderboard },
                { label: "Approval for Points", checked: approvalForPoints, onChange: setApprovalForPoints },
                { label: "Internal-Only Tracking", checked: internalOnly, onChange: setInternalOnly },
                { label: "Allow Manual Override", checked: manualOverride, onChange: setManualOverride },
              ].map(({ label, checked, onChange }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{label}</span>
                  <Toggle checked={checked} onChange={onChange} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comm Triggers Tab ────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  "Push notification": "bg-blue-50 text-blue-700 border-blue-200",
  "In-app message": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Email + Push": "bg-violet-50 text-violet-700 border-violet-200",
  "Escalation message": "bg-red-50 text-red-600 border-red-200",
  "In-app + Feed update": "bg-teal-50 text-teal-700 border-teal-200",
};

function CommTriggersTab({ step }: { step: Step | null }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Communication Trigger Matrix</h2>
          {step && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Step {step.number}: {step.name} &middot; {step.commCount} active triggers
            </p>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />
          Add Trigger
        </button>
      </div>

      <div className="space-y-3">
        {COMM_TRIGGERS.map((t) => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.trigger}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">&rarr; {t.audience}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                    CHANNEL_COLORS[t.channel] ?? "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Bell className="w-3 h-3" />
                  {t.channel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs border border-border">
                  <Clock className="w-3 h-3" />
                  {t.timing}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                    t.source === "HubSpot"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Send className="w-3 h-3" />
                  {t.source}
                </span>
              </div>
            </div>
            <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Orange-tagged triggers fire via HubSpot. All others are handled by myMEDLIFE internal systems. Workflow first — communications are downstream.
      </p>
    </div>
  );
}

// ─── Role Preview Tab ─────────────────────────────────────────────────────────

function RolePreviewTab() {
  const [activeRole, setActiveRole] = useState(0);
  const r = ROLE_PREVIEWS[activeRole];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Role Preview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">What each role sees, does, earns, and triggers across this workflow</p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {ROLE_PREVIEWS.map((rp, i) => (
          <button
            key={rp.role}
            onClick={() => setActiveRole(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
              activeRole === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
            }`}
          >
            {rp.role}
          </button>
        ))}
      </div>

      <div className={`bg-card rounded-xl border-2 ${r.accent} p-6`}>
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${r.avatarBg}`}>
            {r.role[0]}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{r.role}</h3>
            <p className="text-xs text-muted-foreground">Role outcome preview for selected step</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {[
            { label: "What They See", value: r.sees, icon: <Eye className="w-4 h-4 text-primary" />, span: false },
            { label: "Required Action", value: r.action, icon: <Zap className="w-4 h-4 text-amber-600" />, span: false },
            { label: "Evidence to Submit", value: r.evidence, icon: <FileText className="w-4 h-4 text-purple-600" />, span: false },
            { label: "Approval Involvement", value: r.approval, icon: <Shield className="w-4 h-4 text-blue-600" />, span: false },
            { label: "Points Earned", value: r.points, icon: <Star className="w-4 h-4 text-amber-500" />, span: false },
            { label: "KPI Impact", value: r.kpi, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, span: false },
            { label: "HubSpot Reminders", value: r.hubspot, icon: <Bell className="w-4 h-4 text-orange-500" />, span: true },
          ].map((field) => (
            <div key={field.label} className={field.span ? "col-span-2" : ""}>
              <div className="flex items-center gap-1.5 mb-1">
                {field.icon}
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</label>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Version Review Tab ───────────────────────────────────────────────────────

function VersionReviewTab({ campaign }: { campaign: Campaign }) {
  const [showModal, setShowModal] = useState(false);

  const CHANGES = [
    { type: "modified", section: "Step 3 — Recruit 5 Friends", detail: "Points value updated: General Member 25 → 30 pts, E-board 45 → 50 pts" },
    { type: "added", section: "Step 5 — E-board Mid-Campaign Review", detail: "New required step added with approval gate. Reviewer: Coach." },
    { type: "modified", section: "Step 2 — Role Matrix", detail: "DS Admin visibility toggled ON. Proof required field updated to KPI entry." },
    { type: "removed", section: "Step 4 — Comm Trigger", detail: "SMS reminder removed — channel deprecated by platform policy." },
  ];

  const changeStyle = (type: string) => {
    if (type === "added") return { border: "border-l-emerald-500", bg: "", label: "bg-emerald-100 text-emerald-700" };
    if (type === "removed") return { border: "border-l-red-400", bg: "", label: "bg-red-100 text-red-700" };
    return { border: "border-l-amber-400", bg: "", label: "bg-amber-100 text-amber-700" };
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Version Review & Publish</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{campaign.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Rollback to v3.1
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload className="w-3.5 h-3.5" />
            Publish Now
          </button>
        </div>
      </div>

      {/* Version comparison */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Live</span>
            <VersionBadge version="v3.1" />
          </div>
          <p className="text-sm text-foreground font-semibold mb-1">Published {campaign.lastPublished}</p>
          <p className="text-xs text-muted-foreground">by {campaign.lastEditedBy}</p>
          <p className="text-xs text-muted-foreground mt-1.5">8 steps &middot; 5 roles affected &middot; 12 comm triggers</p>
        </div>
        <div className="bg-card rounded-xl border-2 border-primary/30 ring-2 ring-primary/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Draft — Pending Publish</span>
            <VersionBadge version={campaign.version} />
          </div>
          <p className="text-sm text-foreground font-semibold mb-1">Last edited Jun 22, 2026</p>
          <p className="text-xs text-muted-foreground">by {campaign.lastEditedBy}</p>
          <p className="text-xs text-muted-foreground mt-1.5">9 steps &middot; 4 changes &middot; 11 comm triggers</p>
        </div>
      </div>

      {/* Impact summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Roles Affected", value: "6 of 9", icon: <Users className="w-4 h-4 text-primary" /> },
          { label: "Comms Affected", value: "4 triggers", icon: <Bell className="w-4 h-4 text-purple-600" /> },
          { label: "Points / KPI Changes", value: "2 steps", icon: <Award className="w-4 h-4 text-amber-600" /> },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-base font-bold text-foreground">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Change list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">Changes in This Draft ({CHANGES.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {CHANGES.map((c, i) => {
            const s = changeStyle(c.type);
            return (
              <div key={i} className={`px-5 py-4 border-l-4 ${s.border}`}>
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize shrink-0 ${s.label}`}>{c.type}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.section}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Publish {campaign.version}?</h3>
                <p className="text-sm text-muted-foreground mt-0.5">This will replace v3.1 as the live version.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-5">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>4 changes</strong> will go live immediately. 6 roles will see updated workflows. This action is logged and can be rolled back.
              </p>
            </div>
            <div className="space-y-2.5 mb-5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publish timing</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Publish Now
                </button>
                <button className="flex-1 py-2.5 border border-border text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                  Schedule Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 border border-border text-muted-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Builder Screen ───────────────────────────────────────────────────────────

export function BuilderScreen({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<BuilderTab>("steps");
  const [selectedStep, setSelectedStep] = useState<Step | null>(STEPS[0]);

  const TABS: { id: BuilderTab; label: string; icon: React.ReactNode }[] = [
    { id: "steps" as BuilderTab, label: "Steps", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "role-matrix" as BuilderTab, label: "Role Matrix", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "completion" as BuilderTab, label: "Completion Rules", icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { id: "points" as BuilderTab, label: "Points & KPI", icon: <Award className="w-3.5 h-3.5" /> },
    { id: "comms" as BuilderTab, label: "Comm Triggers", icon: <Bell className="w-3.5 h-3.5" /> },
    { id: "preview" as BuilderTab, label: "Role Preview", icon: <Eye className="w-3.5 h-3.5" /> },
    { id: "version" as BuilderTab, label: "Version Review", icon: <GitBranch className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Builder header */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Library
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">{campaign.name}</span>
          <VersionBadge version={campaign.version} />
          <StatusBadge status={campaign.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 font-semibold">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-card border-b border-border px-6 flex items-center gap-0 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "steps" && (
          <StepsTab selectedStep={selectedStep} onSelectStep={setSelectedStep} />
        )}
        {activeTab === "role-matrix" && <RoleMatrixTab step={selectedStep} />}
        {activeTab === "completion" && <CompletionTab step={selectedStep} />}
        {activeTab === "points" && <PointsKPITab step={selectedStep} />}
        {activeTab === "comms" && <CommTriggersTab step={selectedStep} />}
        {activeTab === "preview" && <RolePreviewTab />}
        {activeTab === "version" && <VersionReviewTab campaign={campaign} />}
      </div>
    </div>
  );
}

// LibraryScreen and BuilderScreen are exported above.
// This module is integrated into the myMEDLIFE Staff Command Center.
