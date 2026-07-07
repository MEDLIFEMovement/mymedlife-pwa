"use client";

import React, { useState } from "react";
import {
  LayoutDashboard, Users, BookOpen, ToggleLeft, CalendarDays,
  Award, Link2, FileText, Activity, Settings, X, Search,
  RefreshCw, CheckCircle2, AlertTriangle, Clock,
  Shield, Zap, Globe, ChevronRight,
  Bell, AlertCircle, Cpu, KeyRound, Eye, EyeOff,
  RotateCcw, Trash2, Copy, Check, Plus,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type ModuleStatus = "enabled" | "disabled" | "staging-only" | "mock-only" | "internal-only" | "emergency-disabled";
type UserStatus = "active" | "inactive" | "pending";

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const USERS_DATA = [
  { id: 1, name: "Aaliyah Johnson", email: "aaliyah.j@medlife.org", role: "Chapter Leader", chapter: "Howard University", workspace: "DC-Metro", modules: ["Events", "RSVP", "Points"], lastLogin: "2026-06-30 14:22", status: "active" as UserStatus },
  { id: 2, name: "Marcus Rivera", email: "m.rivera@medlife.org", role: "Staff", chapter: "UCLA", workspace: "West Coast", modules: ["Events", "RSVP", "Attendance", "Points"], lastLogin: "2026-06-30 11:05", status: "active" as UserStatus },
  { id: 3, name: "Priya Nair", email: "p.nair@medlife.org", role: "Coach", chapter: "Emory University", workspace: "Southeast", modules: ["Events", "Points"], lastLogin: "2026-06-29 09:38", status: "active" as UserStatus },
  { id: 4, name: "Devon Carter", email: "d.carter@medlife.org", role: "Student", chapter: "Morehouse College", workspace: "Southeast", modules: ["Events", "RSVP"], lastLogin: "2026-06-28 16:14", status: "active" as UserStatus },
  { id: 5, name: "Fatima Hassan", email: "f.hassan@medlife.org", role: "Chapter Leader", chapter: "Michigan State", workspace: "Midwest", modules: ["Events", "RSVP", "Points"], lastLogin: "2026-06-27 10:00", status: "inactive" as UserStatus },
  { id: 6, name: "James Okafor", email: "j.okafor@medlife.org", role: "Student", chapter: "Spelman College", workspace: "Southeast", modules: ["Events"], lastLogin: "2026-06-25 08:45", status: "pending" as UserStatus },
  { id: 7, name: "Soledad Vega", email: "s.vega@medlife.org", role: "DS Admin", chapter: "—", workspace: "Global", modules: ["All Modules"], lastLogin: "2026-07-01 09:00", status: "active" as UserStatus },
  { id: 8, name: "Chen Wei", email: "c.wei@medlife.org", role: "Super Admin", chapter: "—", workspace: "Global", modules: ["All Modules"], lastLogin: "2026-07-01 08:30", status: "active" as UserStatus },
];

const CHAPTERS_DATA = [
  { id: 1, name: "Howard University", school: "Howard University", region: "DC-Metro", coach: "Dr. S. Williams", members: 42, upcomingEvents: 3, rsvps: 87, attendance: 74, points: 3240, modules: ["Events", "RSVP", "Attendance", "Points"], risk: "low" },
  { id: 2, name: "UCLA MEDLIFE", school: "UCLA", region: "West Coast", coach: "Dr. R. Patel", members: 68, upcomingEvents: 5, rsvps: 142, attendance: 118, points: 5890, modules: ["Events", "RSVP", "Attendance", "Points"], risk: "low" },
  { id: 3, name: "Emory University", school: "Emory University", region: "Southeast", coach: "Dr. K. Brown", members: 31, upcomingEvents: 1, rsvps: 28, attendance: 20, points: 840, modules: ["Events", "RSVP", "Points"], risk: "medium" },
  { id: 4, name: "Morehouse College", school: "Morehouse College", region: "Southeast", coach: "Dr. T. Jackson", members: 28, upcomingEvents: 2, rsvps: 41, attendance: 35, points: 1450, modules: ["Events", "RSVP", "Attendance", "Points"], risk: "low" },
  { id: 5, name: "Michigan State", school: "Michigan State University", region: "Midwest", coach: "Dr. L. Chen", members: 39, upcomingEvents: 0, rsvps: 12, attendance: 8, points: 290, modules: ["Events"], risk: "high" },
  { id: 6, name: "Spelman College", school: "Spelman College", region: "Southeast", coach: "Dr. N. Osei", members: 24, upcomingEvents: 1, rsvps: 19, attendance: 14, points: 560, modules: ["Events", "RSVP"], risk: "medium" },
];

const MODULES_DATA = [
  { id: "luma-events", name: "Luma Events / RSVP / Attendance / Points", description: "Core launch module. Event creation via Luma, RSVP, attendance tracking, and point awarding.", status: "staging-only" as ModuleStatus, environment: "staging", health: "unknown" as HealthStatus, dependencies: ["Luma staging readback", "Points Service", "Blocked Outbox"], lastChangedBy: "Chen Wei", lastChangedAt: "2026-06-15 10:30", reason: "Staging/mock-safe only — production Luma writes remain disabled" },
  { id: "sop-builder", name: "SOP Builder / Next Actions", description: "Standard operating procedure builder for chapter leaders. In development.", status: "disabled" as ModuleStatus, environment: "staging", health: "unknown" as HealthStatus, dependencies: ["Task Service"], lastChangedBy: "Soledad Vega", lastChangedAt: "2026-05-20 14:00", reason: "Not ready for production — pending UX review" },
  { id: "task-assignment", name: "Task Assignment", description: "Assign and track tasks across chapter members and staff.", status: "disabled" as ModuleStatus, environment: "staging", health: "unknown" as HealthStatus, dependencies: ["Task Service", "Notifications"], lastChangedBy: "Soledad Vega", lastChangedAt: "2026-05-20 14:00", reason: "Deferred to Phase 2" },
  { id: "ugc-feed", name: "UGC / Feed / Proof", description: "User-generated content feed and proof-of-work submissions.", status: "disabled" as ModuleStatus, environment: "internal", health: "unknown" as HealthStatus, dependencies: ["Storage", "Moderation"], lastChangedBy: "Soledad Vega", lastChangedAt: "2026-05-01 09:00", reason: "Deferred to Phase 3" },
  { id: "staff-analytics", name: "Staff Analytics", description: "Chapter performance metrics and coach dashboards.", status: "staging-only" as ModuleStatus, environment: "staging", health: "degraded" as HealthStatus, dependencies: ["BigQuery", "Analytics Service"], lastChangedBy: "Chen Wei", lastChangedAt: "2026-06-01 11:45", reason: "Data model under revision" },
  { id: "integrations-outbox", name: "Integrations / Outbox", description: "Outbound event pipeline to HubSpot, BigQuery, and n8n workflows.", status: "disabled" as ModuleStatus, environment: "staging", health: "unknown" as HealthStatus, dependencies: ["HubSpot disabled", "BigQuery disabled", "n8n disabled"], lastChangedBy: "Chen Wei", lastChangedAt: "2026-06-20 16:00", reason: "Live sends and external writes are blocked in this run" },
  { id: "mcp-analytics", name: "MCP Read-only Analytics", description: "AI-assisted read-only analytics queries via MCP.", status: "internal-only" as ModuleStatus, environment: "internal", health: "unknown" as HealthStatus, dependencies: ["OpenAI", "BigQuery"], lastChangedBy: "Chen Wei", lastChangedAt: "2026-04-10 10:00", reason: "Internal testing only — not user-facing" },
  { id: "theme-tokens", name: "Theme / Design Tokens", description: "Dynamic visual theming and design token overrides per workspace.", status: "disabled" as ModuleStatus, environment: "staging", health: "unknown" as HealthStatus, dependencies: [], lastChangedBy: "Soledad Vega", lastChangedAt: "2026-05-15 13:30", reason: "Design system stabilization in progress" },
];

const INTEGRATIONS_DATA = [
  { id: "luma", name: "Luma", description: "Event creation and RSVP management", enabled: false, environment: "staging", health: "unknown" as HealthStatus, lastTest: "Staging readback only", lastSync: "No live sync", errors: 0 },
  { id: "hubspot", name: "HubSpot", description: "CRM sync for members and events", enabled: false, environment: "disabled", health: "unknown" as HealthStatus, lastTest: "Never", lastSync: "Never", errors: 0 },
  { id: "bigquery", name: "BigQuery", description: "Analytics data warehouse", enabled: false, environment: "disabled", health: "unknown" as HealthStatus, lastTest: "Never", lastSync: "Never", errors: 0 },
  { id: "powerbi", name: "Power BI", description: "Reporting dashboards for leadership", enabled: false, environment: "staging", health: "unknown" as HealthStatus, lastTest: "2026-05-10 10:00", lastSync: "Never", errors: 0 },
  { id: "shopify", name: "Shopify", description: "Merchandise and fundraising store", enabled: false, environment: "disabled", health: "unknown" as HealthStatus, lastTest: "2026-03-01 09:00", lastSync: "Never", errors: 0 },
  { id: "givelively", name: "GiveLively", description: "Donation and fundraising platform", enabled: false, environment: "staging", health: "unknown" as HealthStatus, lastTest: "2026-04-15 14:00", lastSync: "Never", errors: 0 },
  { id: "n8n", name: "n8n", description: "Workflow automation and outbox processing", enabled: false, environment: "disabled", health: "unknown" as HealthStatus, lastTest: "Never", lastSync: "Never", errors: 0 },
  { id: "openai", name: "OpenAI / Agents", description: "AI-assisted analytics and MCP agents", enabled: false, environment: "internal", health: "unknown" as HealthStatus, lastTest: "2026-06-01 10:00", lastSync: "Never", errors: 0 },
  { id: "smileio",   name: "Smile.io",  description: "Loyalty and rewards platform — sync member points, manage tiers, and issue rewards across chapters.", enabled: false, environment: "staging",  health: "unknown" as HealthStatus, lastTest: "Never",              lastSync: "Never",              errors: 0 },
  { id: "meta",      name: "Meta",      description: "Facebook Pages and Instagram Business — post content, sync UGC, and pull engagement analytics for chapter social accounts.", enabled: false, environment: "staging", health: "unknown" as HealthStatus, lastTest: "Never",              lastSync: "Never",              errors: 0 },
  { id: "hootsuite", name: "Hootsuite", description: "Social media management — schedule posts, manage streams, and view cross-platform analytics across all chapter accounts.", enabled: false, environment: "staging",  health: "unknown" as HealthStatus, lastTest: "Never",              lastSync: "Never",              errors: 0 },
];

const AUDIT_LOGS = [
  { id: 1, timestamp: "2026-07-01 09:14:22", actor: "Chen Wei", role: "Super Admin", action: "module.review", target: "Luma Events", oldValue: "disabled", newValue: "staging-only", reason: "Staging/mock-safe review — no production write", status: "warning" },
  { id: 2, timestamp: "2026-07-01 08:55:10", actor: "Soledad Vega", role: "DS Admin", action: "user.role_change", target: "Marcus Rivera", oldValue: "Student", newValue: "Staff", reason: "Promotion approved by Dr. Patel", status: "success" },
  { id: 3, timestamp: "2026-06-30 17:30:04", actor: "system", role: "System", action: "luma.sync_blocked", target: "Luma API", oldValue: "—", newValue: "—", reason: "Live Luma sync disabled in staging/mock-safe mode", status: "warning" },
  { id: 4, timestamp: "2026-06-30 16:45:18", actor: "Soledad Vega", role: "DS Admin", action: "chapter.module_change", target: "Michigan State", oldValue: "Events, RSVP, Points", newValue: "Events only", reason: "Low engagement — reducing scope", status: "success" },
  { id: 5, timestamp: "2026-06-30 14:22:33", actor: "system", role: "System", action: "points.duplicate_blocked", target: "Devon Carter", oldValue: "0", newValue: "0", reason: "Duplicate attendance detected", status: "warning" },
  { id: 6, timestamp: "2026-06-30 11:10:55", actor: "Chen Wei", role: "Super Admin", action: "integration.test_blocked", target: "BigQuery", oldValue: "—", newValue: "—", reason: "Warehouse connector disabled until DS approval", status: "warning" },
  { id: 7, timestamp: "2026-06-29 09:38:14", actor: "system", role: "System", action: "access.denied", target: "Priya Nair", oldValue: "—", newValue: "—", reason: "Attempted SOP Builder (disabled module)", status: "error" },
  { id: 8, timestamp: "2026-06-28 15:00:00", actor: "Soledad Vega", role: "DS Admin", action: "points.previewed", target: "Morehouse College", oldValue: "0", newValue: "+50", reason: "Event attendance preview: Community Health Fair", status: "warning" },
];

const API_KEYS_DATA = [
  { id: "luma", provider: "Luma", label: "Luma API Key", key: "secret-ref:luma:staging:v1", environment: "staging", status: "inactive", lastRotated: "2026-05-10", expiresAt: "2027-05-10", createdBy: "Chen Wei", scopes: ["events:read", "events:write", "rsvp:read"] },
  { id: "hubspot", provider: "HubSpot", label: "HubSpot Private App Token", key: "secret-ref:hubspot:disabled:v1", environment: "disabled", status: "inactive", lastRotated: "2026-04-01", expiresAt: "Never", createdBy: "Soledad Vega", scopes: ["contacts:write", "contacts:read", "deals:read"] },
  { id: "bigquery", provider: "BigQuery", label: "BigQuery Service Account Key", key: "secret-ref:bigquery:disabled:v1", environment: "disabled", status: "inactive", lastRotated: "2026-03-15", expiresAt: "Never", createdBy: "Chen Wei", scopes: ["bigquery.tables.create", "bigquery.jobs.create"] },
  { id: "n8n", provider: "n8n", label: "n8n Webhook Secret", key: "secret-ref:n8n:disabled:v1", environment: "disabled", status: "inactive", lastRotated: "2026-06-01", expiresAt: "Never", createdBy: "Chen Wei", scopes: ["webhook:receive"] },
  { id: "openai", provider: "OpenAI", label: "OpenAI API Key", key: "secret-ref:openai:internal:v1", environment: "internal", status: "inactive", lastRotated: "2026-02-20", expiresAt: "Never", createdBy: "Chen Wei", scopes: ["completions", "chat"] },
  { id: "powerbi", provider: "Power BI", label: "Power BI Client Secret", key: "secret-ref:powerbi:staging:v1", environment: "staging", status: "inactive", lastRotated: "2025-12-01", expiresAt: "2026-12-01", createdBy: "Soledad Vega", scopes: ["dataset:read", "report:read"] },
];

// ─── Utility Components ─────────────────────────────────────────────────────────
const STATUS_CLASSES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  inactive: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  enabled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  disabled: "bg-slate-700/30 text-slate-500 border-slate-600/20",
  "staging-only": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "mock-only": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "internal-only": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  "emergency-disabled": "bg-red-500/15 text-red-400 border-red-500/25",
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  degraded: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  down: "bg-red-500/15 text-red-400 border-red-500/25",
  unknown: "bg-slate-700/30 text-slate-500 border-slate-600/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  error: "bg-red-500/15 text-red-400 border-red-500/25",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  high: "bg-red-500/15 text-red-400 border-red-500/25",
};

function Badge({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border font-mono tracking-wide ${cls}`}>
      {label ?? status}
    </span>
  );
}

function HealthDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: "bg-emerald-400",
    degraded: "bg-amber-400",
    down: "bg-red-400",
    unknown: "bg-slate-600",
  };
  return (
    <span className="relative flex size-2 flex-shrink-0">
      {status === "healthy" && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full size-2 ${colors[status]}`} />
    </span>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
      <h3 className="text-[12px] font-semibold text-slate-300 uppercase tracking-widest">{title}</h3>
      {count !== undefined && <span className="text-[11px] text-slate-600 font-mono">{count} entries</span>}
    </div>
  );
}

// ─── Drawer ─────────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[500px] bg-[#161b22] border-l border-white/[0.08] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">{children}</div>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[500px] bg-[#161b22] border border-white/[0.08] rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────────
const NAV_PRIMARY = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "chapters", label: "Chapters", icon: BookOpen },
  { id: "modules", label: "Modules", icon: ToggleLeft },
  { id: "luma", label: "Luma Events", icon: CalendarDays },
  { id: "points", label: "Points", icon: Award },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "health", label: "System Health", icon: Activity },
  { id: "apikeys", label: "API Keys", icon: KeyRound },
  { id: "mcp", label: "MCP Connections", icon: Cpu },
  { id: "settings", label: "Settings", icon: Settings },
];

const NAV_DISABLED = [
  { id: "sop", label: "SOP Builder", icon: BookOpen },
  { id: "tasks", label: "Task Assignment", icon: CheckCircle2 },
  { id: "ugc", label: "UGC / Feed", icon: Globe },
  { id: "mcp", label: "MCP Analytics", icon: Cpu },
];

function Sidebar({ active, onNav, onBack }: { active: string; onNav: (id: string) => void; onBack?: () => void }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#090d12] border-r border-white/[0.05] flex flex-col z-40">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-300 text-[11px] border-b border-white/[0.05] transition-colors w-full group"
        >
          <ChevronRight size={11} className="rotate-180 text-slate-700 group-hover:text-slate-400 transition-colors" />
          Command Center
        </button>
      )}
      <div className="px-4 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-sky-500 flex items-center justify-center flex-shrink-0">
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">myMEDLIFE</div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">DS Admin · v2.4</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
        <div className="space-y-px">
          {NAV_PRIMARY.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNav(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] transition-all duration-100 text-left ${
                  isActive
                    ? "bg-sky-500/12 text-sky-400 font-semibold"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-sky-400" : "text-slate-600"} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-white/[0.04]">
          <div className="px-3 mb-2">
            <span className="text-[9px] text-slate-700 font-mono uppercase tracking-[0.15em]">Disabled Modules</span>
          </div>
          {NAV_DISABLED.map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex items-center gap-2.5 px-3 py-[7px] text-[12px] text-slate-700 cursor-not-allowed select-none">
              <Icon size={13} className="text-slate-800" />
              {label}
            </div>
          ))}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.05]">
        <div
          aria-disabled="true"
          className="flex items-center gap-2.5 rounded px-2 py-2 opacity-90 select-none"
          title="Use the top-right account menu to switch workspaces or log out."
        >
          <div className="size-6 rounded-full bg-sky-500/20 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] text-sky-400 font-bold">CW</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-slate-300 font-semibold leading-tight">Chen Wei</div>
            <div className="text-[10px] text-slate-600 font-mono">Super Admin</div>
            <div className="mt-1 text-[9px] text-slate-500">
              Use the top-right menu to switch workspaces or log out.
            </div>
          </div>
          <span className="rounded border border-white/[0.06] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-600">
            Account menu
          </span>
        </div>
      </div>
    </aside>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[52px] flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0d1117]/90 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-white">{title}</h1>
        {subtitle && <span className="text-[12px] text-slate-600 border-l border-white/[0.06] pl-3">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded px-2.5 py-1">
          <HealthDot status="healthy" />
          <span className="text-[10px] text-emerald-400 font-mono tracking-wider">SYSTEMS OK</span>
        </div>
        <button disabled title="Admin notifications are blocked in this preview" className="relative p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
          <Bell size={15} />
          <span className="absolute top-1 right-1 size-1.5 bg-red-400 rounded-full" />
        </button>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────────
function OverviewPage() {
  const cards = [
    { label: "Total Users", value: "1,284", sub: "↑ 12 this week", color: "text-white" },
    { label: "Active Chapters", value: "47", sub: "3 flagged high-risk", color: "text-white" },
    { label: "Events Module", value: "Staging", sub: "Mock-safe", color: "text-blue-400" },
    { label: "Luma Integration", value: "Readback only", sub: "No live writes", color: "text-blue-400" },
    { label: "Points System", value: "Preview", sub: "18,340 mock pts", color: "text-blue-400" },
    { label: "Disabled Modules", value: "5", sub: "SOP · Tasks · UGC +2", color: "text-slate-400" },
    { label: "Blocked Sends", value: "0", sub: "No external sends", color: "text-slate-300" },
    { label: "Admin Changes", value: "8", sub: "Last 24 hours", color: "text-slate-300" },
  ];

  const moduleStatus = [
    { name: "Luma Events / RSVP / Attendance / Points", status: "staging-only", note: "Core launch stack" },
    { name: "Integrations / Outbox", status: "disabled", note: "Live sends blocked" },
    { name: "SOP Builder / Next Actions", status: "disabled", note: "Phase 2" },
    { name: "Task Assignment", status: "disabled", note: "Phase 2" },
    { name: "UGC / Feed / Proof", status: "disabled", note: "Phase 3" },
    { name: "Staff Analytics", status: "staging-only", note: "Data model revision" },
    { name: "MCP Analytics", status: "internal-only", note: "Internal only" },
    { name: "Theme / Design Tokens", status: "disabled", note: "In progress" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Launch Mode Banner */}
      <div className="flex items-center gap-3 bg-sky-500/8 border border-sky-500/15 rounded-lg px-4 py-3">
        <Zap size={14} className="text-sky-400 flex-shrink-0" />
        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-[0.12em]">Launch Mode Active</span>
        <span className="text-[12px] text-sky-300/60">Events + RSVP + Attendance + Points</span>
        <span className="ml-auto text-[10px] text-sky-600 font-mono uppercase tracking-wider">Staging</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">{c.label}</div>
            <div className={`text-[22px] font-bold leading-none mb-1.5 ${c.color}`}>{c.value}</div>
            <div className="text-[11px] text-slate-600">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Module Configuration */}
      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
        <SectionHeader title="Active Module Configuration" />
        <div className="p-4 grid grid-cols-2 gap-2">
          {moduleStatus.map((mod) => (
            <div key={mod.name} className="flex items-center justify-between py-2.5 px-3 rounded bg-[#0d1117]/40 border border-white/[0.04]">
              <span className="text-[12px] text-slate-300 truncate mr-3">{mod.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-slate-700 hidden xl:block">{mod.note}</span>
                <Badge status={mod.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Admin Changes */}
      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
        <SectionHeader title="Recent Admin Changes" count={AUDIT_LOGS.length} />
        <div className="divide-y divide-white/[0.04]">
          {AUDIT_LOGS.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-5 py-3">
              <Badge status={log.status} />
              <span className="text-[11px] text-slate-600 font-mono flex-shrink-0">{log.timestamp.split(" ")[1]}</span>
              <span className="text-[13px] text-slate-300">
                <span className="text-white font-semibold">{log.actor}</span>
                <span className="text-slate-600 mx-1.5">·</span>
                <span className="font-mono text-[11px] text-slate-500">{log.action}</span>
              </span>
              <span className="text-[12px] text-slate-600 ml-auto flex-shrink-0">{log.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────────
function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<typeof USERS_DATA[0] | null>(null);

  const filtered = USERS_DATA.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchR = roleFilter === "all" || u.role.toLowerCase().includes(roleFilter);
    return matchQ && matchR;
  });

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-300/80 leading-relaxed">
            This user directory is preview-only. Review seeded access, role posture, and blocked actions here, then use the audited admin workflow for any real user, role, or invite changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-[#161b22] border border-white/[0.08] rounded pl-8 pr-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#161b22] border border-white/[0.08] rounded px-3 py-2 text-[13px] text-slate-400 focus:outline-none focus:border-sky-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="super admin">Super Admin</option>
            <option value="ds admin">DS Admin</option>
            <option value="staff">Staff</option>
            <option value="coach">Coach</option>
            <option value="chapter leader">Chapter Leader</option>
            <option value="student">Student</option>
          </select>
          <span className="ml-auto text-[11px] text-slate-600 font-mono">{filtered.length} users</span>
        </div>

        <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Name / Email", "Role", "Chapter", "Workspace", "Modules", "Last Login", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((u) => (
                <tr key={u.id} onClick={() => setSelected(u)} className="hover:bg-white/[0.015] cursor-pointer transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-200">{u.name}</div>
                    <div className="text-[11px] text-slate-600 font-mono">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.role}</td>
                  <td className="px-4 py-3 text-slate-400">{u.chapter}</td>
                  <td className="px-4 py-3 text-slate-400">{u.workspace}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.modules.slice(0, 2).map((m) => (
                        <span key={m} className="text-[10px] bg-sky-500/8 text-sky-500 border border-sky-500/15 px-1.5 py-0.5 rounded font-mono">{m}</span>
                      ))}
                      {u.modules.length > 2 && (
                        <span className="text-[10px] text-slate-600">+{u.modules.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600 font-mono">{u.lastLogin}</td>
                  <td className="px-4 py-3"><Badge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="User Detail">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/15 rounded p-3">
              <AlertCircle size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-sky-300/80 leading-relaxed">
                Directory details, module access, and activity history shown here are preview/readback data. They do not confirm live production mutations from this shell.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-sky-500/15 border border-sky-500/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sky-400 font-bold text-[13px]">
                  {selected.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{selected.name}</div>
                <div className="text-slate-500 text-[11px] font-mono">{selected.email}</div>
              </div>
              <Badge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Role", value: selected.role },
                { label: "Chapter", value: selected.chapter },
                { label: "Workspace", value: selected.workspace },
                { label: "Last Login", value: selected.lastLogin },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d1117]/60 border border-white/[0.05] rounded p-3">
                  <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-[13px] text-slate-200">{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1117]/60 border border-white/[0.05] rounded p-3">
              <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-2">Module Access</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.modules.map((m) => (
                  <span key={m} className="text-[11px] bg-sky-500/8 text-sky-400 border border-sky-500/15 px-2 py-0.5 rounded font-mono">{m}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-2">Recent Activity</div>
              <div className="space-y-2">
                {[
                  "Attended: Community Health Fair — 2026-06-30",
                  "RSVP: Medical Ethics Symposium — 2026-06-28",
                  "Login from 192.168.1.45 — 2026-06-28",
                ].map((a) => (
                  <div key={a} className="text-[12px] text-slate-400 border-l-2 border-white/[0.06] pl-3 py-0.5">{a}</div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/15 rounded p-3">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-300/80">Sensitive actions on this account are logged and require DS Admin approval.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button disabled title="Role changes require the secure user-management workflow" className="px-3 py-1.5 bg-sky-500/12 text-sky-400 border border-sky-500/20 rounded text-[12px] hover:bg-sky-500/20 transition-colors">Change Role</button>
              <button disabled title="Module edits require the secure module-management workflow" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">Edit Modules</button>
              <button disabled title="Invite emails are blocked until external-send approval is complete" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">Resend Invite</button>
              <button disabled title="User disabling requires the secure user-management workflow" className="px-3 py-1.5 bg-red-500/8 text-red-400 border border-red-500/15 rounded text-[12px] hover:bg-red-500/15 transition-colors">Disable User</button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── Chapters ─────────────────────────────────────────────────────────────────────
function ChaptersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof CHAPTERS_DATA[0] | null>(null);

  const filtered = CHAPTERS_DATA.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-300/80 leading-relaxed">
            This chapter directory is preview-only. Review seeded chapter posture, readback metrics, and blocked admin actions here, then use the audited workflow for any real chapter or owner changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters..."
              className="bg-[#161b22] border border-white/[0.08] rounded pl-8 pr-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors w-64"
            />
          </div>
          <span className="ml-auto text-[11px] text-slate-600 font-mono">{filtered.length} chapters</span>
        </div>

        <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Chapter", "Region", "Coach", "Members", "Events", "RSVPs", "Attendance", "Points", "Risk", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-white/[0.015] cursor-pointer group transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[11px] text-slate-600">{c.school}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.region}</td>
                  <td className="px-4 py-3 text-slate-400">{c.coach}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{c.members}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{c.upcomingEvents}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{c.rsvps}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{c.attendance}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{c.points.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge status={c.risk} label={c.risk.toUpperCase()} /></td>
                  <td className="px-4 py-3"><ChevronRight size={13} className="text-slate-700 group-hover:text-slate-500 transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Chapter Detail">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/15 rounded p-3">
              <AlertCircle size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-sky-300/80 leading-relaxed">
                Chapter metrics, module access, and risk posture shown here are preview/readback data. They do not represent an approved live admin change path from this shell.
              </p>
            </div>

            <div>
              <h2 className="text-white font-bold text-[17px]">{selected.name}</h2>
              <p className="text-slate-500 text-[12px] mt-0.5">{selected.school} · {selected.region}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Coach", value: selected.coach },
                { label: "Active Members", value: String(selected.members) },
                { label: "Upcoming Events", value: String(selected.upcomingEvents) },
                { label: "Total Points", value: selected.points.toLocaleString() },
                { label: "RSVPs", value: String(selected.rsvps) },
                { label: "Attendance", value: String(selected.attendance) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d1117]/60 border border-white/[0.05] rounded p-3">
                  <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-[14px] text-slate-200 font-mono font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1117]/60 border border-white/[0.05] rounded p-3">
              <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-2">Active Modules</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.modules.map((m) => (
                  <span key={m} className="text-[11px] bg-emerald-500/8 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded font-mono">{m}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#0d1117]/60 border border-white/[0.05] rounded p-3">
              <span className="text-[12px] text-slate-400">Risk Status</span>
              <Badge status={selected.risk} label={selected.risk.toUpperCase()} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button disabled title="Chapter event drill-in is handled by the staff events view" className="px-3 py-1.5 bg-sky-500/12 text-sky-400 border border-sky-500/20 rounded text-[12px] hover:bg-sky-500/20 transition-colors">View Events</button>
              <button disabled title="Module edits require the secure module-management workflow" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">Edit Modules</button>
              <button disabled title="Audit drill-in is available from the audit log surface" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">Audit History</button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── Modules / Feature Flags ────────────────────────────────────────────────────
function ModulesPage() {
  const [mods, setMods] = useState(MODULES_DATA);
  const [target, setTarget] = useState<typeof MODULES_DATA[0] | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const openToggle = (mod: typeof MODULES_DATA[0]) => {
    setTarget(mod);
    setReason("");
    setConfirmed(false);
  };

  const confirmToggle = () => {
    if (!target || !reason.trim() || !confirmed) return;
    setMods((prev) =>
      prev.map((m) =>
        m.id === target.id
          ? { ...m, status: (m.status === "enabled" ? "disabled" : "enabled") as ModuleStatus, lastChangedBy: "Chen Wei", lastChangedAt: new Date().toISOString().slice(0, 16).replace("T", " "), reason }
          : m
      )
    );
    setTarget(null);
  };

  const isProductionLike = target?.environment === "production";

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-300/80 leading-relaxed">
            This module surface is preview-only. Review staged module posture and blocked toggle paths here, then use the audited admin workflow after approval for any real module activation or shutdown.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mods.map((mod) => (
            <div
              key={mod.id}
              className={`bg-[#161b22] border rounded-lg p-4 space-y-3 ${mod.status === "emergency-disabled" ? "border-red-500/30" : "border-white/[0.06]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-200 leading-tight">{mod.name}</div>
                  <div className="text-[12px] text-slate-500 mt-1 leading-relaxed">{mod.description}</div>
                </div>
                <Badge status={mod.status} label={mod.status.replace(/-/g, " ")} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Env", value: mod.environment },
                  { label: "Health", isHealth: true, health: mod.health },
                  { label: "Changed by", value: mod.lastChangedBy },
                ].map((col) => (
                  <div key={col.label}>
                    <div className="text-[9px] text-slate-700 font-mono uppercase tracking-wider mb-1">{col.label}</div>
                    {col.isHealth ? (
                      <div className="flex items-center gap-1.5">
                        <HealthDot status={col.health as HealthStatus} />
                        <span className="text-[11px] text-slate-400 font-mono capitalize">{col.health}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-mono">{col.value}</div>
                    )}
                  </div>
                ))}
              </div>

              {mod.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {mod.dependencies.map((dep) => (
                    <span key={dep} className="text-[10px] bg-white/[0.02] text-slate-600 border border-white/[0.05] px-1.5 py-0.5 rounded font-mono">{dep}</span>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-slate-600 italic border-l-2 border-white/[0.05] pl-2">
                &quot;{mod.reason}&quot;
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <span className="text-[10px] text-slate-700 font-mono">{mod.lastChangedAt}</span>
                <button
                  disabled
                  onClick={() => openToggle(mod)}
                  title="Module changes are blocked in this static admin shell; use the audited admin workflow after approval"
                  className={`px-3 py-1 rounded text-[11px] font-semibold border transition-colors cursor-not-allowed ${
                    mod.status === "enabled"
                      ? "bg-red-500/8 text-red-400 border-red-500/15"
                      : "bg-slate-500/8 text-slate-400 border-slate-500/15"
                  }`}
                >
                  {mod.status === "enabled" ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!target} onClose={() => setTarget(null)} title="Toggle Module">
        {target && (
          <div className="space-y-4">
            <div className="bg-[#0d1117]/70 border border-white/[0.06] rounded p-3">
              <div className="text-[14px] font-semibold text-white mb-2">{target.name}</div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-slate-500">Current status:</span>
                <Badge status={target.status} label={target.status} />
                <span className="text-slate-700">→</span>
                <Badge
                  status={target.status === "enabled" ? "disabled" : "enabled"}
                  label={target.status === "enabled" ? "disabled" : "enabled"}
                />
              </div>
            </div>

            {isProductionLike && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/15 rounded p-3">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12px] font-bold text-red-400 mb-0.5">Production Change</div>
                  <div className="text-[12px] text-red-300/70">This change affects live users immediately. Proceed with caution.</div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-600 font-mono uppercase tracking-wider block mb-1.5">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this change is being made..."
                className="w-full bg-[#0d1117] border border-white/[0.08] rounded px-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors resize-none h-20"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="size-3.5"
              />
              <span className="text-[12px] text-slate-400">I confirm this change has been reviewed and approved</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmToggle}
                disabled={!reason.trim() || !confirmed}
                className="flex-1 py-2 bg-sky-500 text-white rounded text-[13px] font-semibold disabled:opacity-25 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
              >
                Confirm Toggle
              </button>
              <button
                onClick={() => setTarget(null)}
                className="px-4 py-2 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[13px] hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── Luma Events ──────────────────────────────────────────────────────────────────
function LumaPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Provider Banner */}
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-amber-500/8 border-amber-500/15">
        <div className="flex items-center gap-3">
          <HealthDot status="unknown" />
          <div>
            <div className="text-[13px] font-semibold text-amber-400">
              Luma Provider: Staging-ready, live writes disabled
            </div>
            <div className="text-[11px] mt-0.5 text-amber-300/60">
              Staging/mock-safe · local events, RSVP, attendance, and points remain active.
            </div>
          </div>
        </div>
        <button
          disabled
          title="Enable Luma only through the audited /admin/integrations/luma setup"
          className="px-3 py-1.5 rounded text-[12px] font-semibold border transition-colors bg-white/[0.04] text-slate-400 border-white/[0.08]"
        >
          Live Writes Off
        </button>
      </div>

      <div className="flex items-center gap-2.5 bg-sky-500/8 border border-sky-500/15 rounded-lg px-4 py-3">
        <Clock size={14} className="text-sky-400 flex-shrink-0" />
        <span className="text-[13px] text-sky-300">Local event creation, RSVP, attendance, and points remain active while live Luma writes are blocked.</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Events Staged", value: "47" },
          { label: "RSVPs Previewed", value: "1,284" },
          { label: "Attendance Previewed", value: "1,042" },
          { label: "Points Previewed", value: "18,340" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">{s.label}</div>
            <div className="text-[22px] font-bold text-white font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      {[
        {
          title: "Provider Status",
          rows: [
            { label: "API Connection", value: "Blocked", status: "inactive" },
            { label: "Environment", value: "Staging/mock-safe", status: "inactive" },
            { label: "API Version", value: "Not called", status: "inactive" },
            { label: "Auth Method", value: "Server-only secret refs", status: "inactive" },
          ],
        },
        {
          title: "Sync Status",
          rows: [
            { label: "Event Sync", value: "Blocked until approval", status: "inactive" },
            { label: "RSVP Sync", value: "Blocked until approval", status: "inactive" },
            { label: "Attendance Sync", value: "Blocked until approval", status: "inactive" },
            { label: "Points Awarding", value: "Local preview only", status: "inactive" },
          ],
        },
      ].map((section) => (
        <div key={section.title} className="bg-[#161b22] border border-white/[0.06] rounded-lg">
          <SectionHeader title={section.title} />
          <div className="divide-y divide-white/[0.04]">
            {section.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-slate-400">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-slate-200 font-mono">{row.value}</span>
                  <Badge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Error Log */}
      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
        <SectionHeader title="Recent Errors" />
        <div className="divide-y divide-white/[0.04]">
          {[
            { time: "2026-06-30 17:30", msg: "Live Luma sync blocked by staging/mock-safe integration posture", sev: "warning" },
            { time: "2026-06-29 14:12", msg: "Duplicate RSVP preview detected for event #luma-487 — blocked", sev: "warning" },
            { time: "2026-06-28 08:02", msg: "Attendance import preview pending approved staging readback", sev: "warning" },
          ].map((err) => (
            <div key={err.time} className="flex items-center gap-3 px-5 py-3">
              <Badge status={err.sev} />
              <span className="text-[11px] text-slate-600 font-mono flex-shrink-0">{err.time}</span>
              <span className="text-[13px] text-slate-300">{err.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button disabled title="Use /admin/integrations/luma for the audited Luma test connection" className="px-3 py-1.5 bg-sky-500/12 text-sky-400 border border-sky-500/20 rounded text-[12px] hover:bg-sky-500/20 transition-colors">Test Connection</button>
        <button disabled title="Mock event sync is blocked in this static admin shell" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">Sync Mock Event</button>
        <button disabled title="Use /admin/integration-outbox for outbox readback" className="px-3 py-1.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[12px] hover:bg-white/[0.07] transition-colors">View Outbox</button>
      </div>
    </div>
  );
}

// ─── Points ───────────────────────────────────────────────────────────────────────
// ─── Points data aligned with SOP Builder ─────────────────────────────────────

const GLOBAL_ROLE_DEFAULTS = [
  { role: "General Member",        points: 30, enabled: true,  capPerStep: 1, smileSync: true },
  { role: "Action Committee Member", points: 35, enabled: true, capPerStep: 1, smileSync: true },
  { role: "Action Committee Chair", points: 40, enabled: true, capPerStep: 1, smileSync: true },
  { role: "E-board",               points: 50, enabled: true,  capPerStep: 2, smileSync: true },
  { role: "Coach",                 points: 0,  enabled: false, capPerStep: 0, smileSync: false },
  { role: "Sales Admin",           points: 0,  enabled: false, capPerStep: 0, smileSync: false },
  { role: "General Staff",         points: 0,  enabled: false, capPerStep: 0, smileSync: false },
  { role: "DS Admin",              points: 0,  enabled: false, capPerStep: 0, smileSync: false },
  { role: "Super Admin",           points: 0,  enabled: false, capPerStep: 0, smileSync: false },
];

const SOP_STEP_POINTS = [
  {
    campaign: "Rush Month / Recruitment", color: "text-sky-400", borderColor: "border-sky-500/20",
    steps: [
      { step: "Intro GBM — Member Attendance", phase: "Launch", kpi: "Attendance Rate", ownerRole: "Action Committee Chair", pointsOn: true, approvalReq: false, gm: 30, acm: 35, acc: 40, eb: 50, chapterPts: 25, capUser: 1, override: false },
      { step: "Recruit 5 Friends to Intro GBM", phase: "Recruitment", kpi: "Recruitment Rate", ownerRole: "General Member", pointsOn: true, approvalReq: false, gm: 30, acm: 35, acc: 40, eb: 50, chapterPts: 25, capUser: 1, override: false },
      { step: "Complete Onboarding Checklist", phase: "Onboarding", kpi: "Onboarding Completion", ownerRole: "General Member", pointsOn: true, approvalReq: false, gm: 30, acm: 35, acc: 40, eb: 50, chapterPts: 25, capUser: 1, override: false },
      { step: "Define Campaign Goals & KPIs", phase: "Planning", kpi: "Chapter Health", ownerRole: "E-board", pointsOn: false, approvalReq: true, gm: 0, acm: 0, acc: 0, eb: 0, chapterPts: 0, capUser: 0, override: false },
      { step: "E-board Mid-Campaign Review", phase: "Review", kpi: "Campaign Health", ownerRole: "E-board", pointsOn: false, approvalReq: true, gm: 0, acm: 0, acc: 0, eb: 0, chapterPts: 0, capUser: 0, override: false },
    ]
  },
  {
    campaign: "Chapter Engagement", color: "text-emerald-400", borderColor: "border-emerald-500/20",
    steps: [
      { step: "Monthly GBM Attendance", phase: "Engagement", kpi: "Attendance Rate", ownerRole: "Action Committee Chair", pointsOn: true, approvalReq: false, gm: 25, acm: 30, acc: 35, eb: 45, chapterPts: 20, capUser: 1, override: true },
      { step: "Action Committee Task Completion", phase: "Execution", kpi: "Assignment Completion", ownerRole: "Action Committee Member", pointsOn: true, approvalReq: false, gm: 20, acm: 30, acc: 35, eb: 40, chapterPts: 15, capUser: 1, override: true },
      { step: "Peer Recruitment Check-in", phase: "Recruitment", kpi: "Recruitment Rate", ownerRole: "General Member", pointsOn: true, approvalReq: false, gm: 30, acm: 35, acc: 40, eb: 50, chapterPts: 25, capUser: 1, override: false },
    ]
  },
  {
    campaign: "Moving Mountains", color: "text-violet-400", borderColor: "border-violet-500/20",
    steps: [
      { step: "Bridge Video Submission", phase: "Content", kpi: "Evidence Submitted", ownerRole: "General Member", pointsOn: true, approvalReq: true, gm: 40, acm: 45, acc: 50, eb: 60, chapterPts: 30, capUser: 1, override: true },
      { step: "Community Event Participation", phase: "Impact", kpi: "Attendance Rate", ownerRole: "General Member", pointsOn: true, approvalReq: false, gm: 30, acm: 35, acc: 40, eb: 50, chapterPts: 25, capUser: 2, override: false },
      { step: "Post-Event Debrief", phase: "Review", kpi: "Campaign Health", ownerRole: "E-board", pointsOn: false, approvalReq: true, gm: 0, acm: 0, acc: 0, eb: 0, chapterPts: 0, capUser: 0, override: false },
    ]
  },
];

const CHAPTER_LEADERBOARD = [
  { name: "UCLA MEDLIFE", region: "West Coast", pts: 5890, members: 68, trend: "up" },
  { name: "Howard University", region: "DC-Metro", pts: 3240, members: 42, trend: "up" },
  { name: "Morehouse College", region: "Southeast", pts: 1450, members: 28, trend: "stable" },
  { name: "Emory University", region: "Southeast", pts: 840, members: 31, trend: "down" },
  { name: "Spelman College", region: "Southeast", pts: 560, members: 24, trend: "stable" },
  { name: "Michigan State", region: "Midwest", pts: 290, members: 39, trend: "down" },
];

const LEDGER_ROWS = [
  { user: "Aaliyah Johnson", role: "Chapter Leader", chapter: "Howard", campaign: "Rush Month", step: "Intro GBM — Member Attendance", pts: 30, chapterPts: 25, time: "2026-07-01 09:14", status: "success", smileSynced: true },
  { user: "Marcus Rivera", role: "Staff", chapter: "UCLA", campaign: "Chapter Engagement", step: "Monthly GBM Attendance", pts: 0, chapterPts: 0, time: "2026-06-30 14:22", status: "success", smileSynced: false },
  { user: "Devon Carter", role: "Student", chapter: "Morehouse", campaign: "Rush Month", step: "Intro GBM — Member Attendance", pts: 30, chapterPts: 25, time: "2026-06-30 14:20", status: "success", smileSynced: true },
  { user: "Devon Carter", role: "Student", chapter: "Morehouse", campaign: "Rush Month", step: "Intro GBM — Member Attendance", pts: 0, chapterPts: 0, time: "2026-06-30 14:20", status: "warning", smileSynced: false },
  { user: "Priya Nair", role: "Coach", chapter: "Emory", campaign: "Chapter Engagement", step: "Action Committee Task Completion", pts: 0, chapterPts: 0, time: "2026-06-29 09:38", status: "error", smileSynced: false },
  { user: "Fatima Hassan", role: "Chapter Leader", chapter: "Michigan State", campaign: "Rush Month", step: "Complete Onboarding Checklist", pts: 30, chapterPts: 25, time: "2026-06-28 16:14", status: "success", smileSynced: false },
];

// ─── Toggle helper ─────────────────────────────────────────────────────────────

function AdminToggle({
  checked,
  onChange,
  disabled = false,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-emerald-500" : "bg-slate-700"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      style={{ width: 32, height: 18 }}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${checked ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Points Page ───────────────────────────────────────────────────────────────

function PointsPage() {
  const [tab, setTab] = useState<"overview" | "roles" | "steps" | "caps" | "ledger">("overview");
  const [campaignIdx, setCampaignIdx] = useState(0);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [leaderboard, setLeaderboard] = useState(true);
  const [approvalForPoints, setApprovalForPoints] = useState(false);
  const [internalOnly, setInternalOnly] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [dupePrevention, setDupePrevention] = useState(true);
  const [chapterPoints, setChapterPoints] = useState(true);
  const [smileSync, setSmileSync] = useState(false);
  const [roles, setRoles] = useState(GLOBAL_ROLE_DEFAULTS.map(r => ({ ...r })));
  const [ledgerFilter, setLedgerFilter] = useState("all");

  const updateRole = (idx: number, field: string, value: number | boolean) => {
    setRoles(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const selectedCampaign = SOP_STEP_POINTS[campaignIdx];
  const totalPts = 18340;
  const activeCampaign = SOP_STEP_POINTS;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "roles",    label: "Role Defaults" },
    { id: "steps",    label: "Campaign Steps" },
    { id: "caps",     label: "Caps & Rules" },
    { id: "ledger",   label: "Ledger" },
  ] as const;

  const filteredLedger = LEDGER_ROWS.filter(r => ledgerFilter === "all" || r.status === ledgerFilter);
  const blockedPointsControlTitle = "Points policy edits are blocked in this preview until the audited workflow is approved";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.05] bg-[#0d1117]/60 px-6 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-sky-400 text-sky-400" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 py-2.5">
          <span className="text-[11px] text-slate-600">Points System</span>
          <AdminToggle checked={globalEnabled} onChange={setGlobalEnabled} disabled title={blockedPointsControlTitle} />
          <Badge status={globalEnabled ? "enabled" : "disabled"} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-300/80 leading-relaxed">
                Points policy editing is blocked in this preview. Review the defaults and ledger here, then use the audited workflow after approval for any real points-rule changes.
              </p>
            </div>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Points Awarded", value: totalPts.toLocaleString(), color: "text-emerald-400", sub: "Across all chapters" },
                { label: "Active Earners", value: "847", color: "text-sky-400", sub: "Members earning this cycle" },
                { label: "Failed Awards", value: "3", color: "text-red-400", sub: "Requires investigation" },
                { label: "Duplicates Blocked", value: "12", color: "text-amber-400", sub: "Prevention working" },
                { label: "Smile.io Synced", value: "0", color: "text-slate-500", sub: "Integration not enabled" },
                { label: "Steps with Points", value: String(activeCampaign.flatMap(c => c.steps).filter(s => s.pointsOn).length), color: "text-white", sub: "Across all campaigns" },
                { label: "Pending Approvals", value: "4", color: "text-amber-400", sub: "Awaiting coach sign-off" },
                { label: "Avg Points / Member", value: "21.7", color: "text-white", sub: "This campaign cycle" },
              ].map(s => (
                <div key={s.label} className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
                  <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-1.5">{s.label}</div>
                  <div className={`text-[22px] font-bold font-mono leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-700 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Points pipeline */}
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">Points Pipeline</div>
              <div className="flex items-center gap-2">
                {[
                  { label: "SOP Step Trigger", note: "Action completed", color: "bg-sky-500/15 border-sky-500/25 text-sky-300" },
                  { label: "→", plain: true },
                  { label: "myMEDLIFE", note: "Source of truth", color: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" },
                  { label: "→", plain: true },
                  { label: "n8n Outbox", note: "Event pipeline", color: "bg-violet-500/15 border-violet-500/25 text-violet-300" },
                  { label: "→", plain: true },
                  { label: "Smile.io", note: "Loyalty wallet", color: smileSync ? "bg-[#FF6B35]/15 border-[#FF6B35]/25 text-[#FF6B35]" : "bg-slate-800/40 border-white/[0.05] text-slate-600" },
                  { label: "→", plain: true },
                  { label: "HubSpot", note: "CRM lifecycle", color: "bg-orange-500/15 border-orange-500/25 text-orange-300" },
                ].map((node, i) => (
                  node.plain ? (
                    <span key={i} className="text-slate-700 text-[16px]">{node.label}</span>
                  ) : (
                    <div key={i} className={`flex-1 border rounded-lg px-3 py-2.5 text-center ${node.color}`}>
                      <div className="text-[11px] font-semibold">{node.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{node.note}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Chapter leaderboard */}
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
              <SectionHeader title="Chapter Leaderboard" count={CHAPTER_LEADERBOARD.length} />
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["#", "Chapter", "Region", "Members", "Total Points", "Avg / Member", "Trend"].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {CHAPTER_LEADERBOARD.map((ch, i) => (
                    <tr key={ch.name} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-600 text-[11px]">{i + 1}</td>
                      <td className="px-5 py-3 font-semibold text-slate-200">{ch.name}</td>
                      <td className="px-5 py-3 text-slate-500">{ch.region}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{ch.members}</td>
                      <td className="px-5 py-3 font-mono font-bold text-emerald-400">{ch.pts.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{(ch.pts / ch.members).toFixed(0)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[13px] ${ch.trend === "up" ? "text-emerald-400" : ch.trend === "down" ? "text-red-400" : "text-slate-600"}`}>
                          {ch.trend === "up" ? "↑" : ch.trend === "down" ? "↓" : "→"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Role Defaults ─────────────────────────────────────────────────── */}
        {tab === "roles" && (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-sky-500/8 border border-sky-500/15 rounded-lg px-4 py-3">
              <AlertCircle size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-sky-300/80 leading-relaxed">
                These are <strong>global defaults</strong>. When a new SOP step is created with Points Enabled, it inherits these values. Individual step overrides configured in the SOP Builder take precedence. Changes here do <em>not</em> retroactively update existing SOP steps.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Role points table */}
              <div className="col-span-2 bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-300">Default Points by Role</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600">Points Enabled Globally</span>
                    <AdminToggle checked={globalEnabled} onChange={setGlobalEnabled} disabled title={blockedPointsControlTitle} />
                  </div>
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-[#0d1117]/30">
                      <th className="text-left px-5 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Role</th>
                      <th className="text-center px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Earns Points</th>
                      <th className="text-right px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Default Value</th>
                      <th className="text-center px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Cap / Step</th>
                      <th className="text-center px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Smile.io Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {roles.map((r, idx) => (
                      <tr key={r.role} className={`hover:bg-white/[0.01] transition-colors ${!r.enabled ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3">
                          <span className={`font-semibold ${r.enabled ? "text-slate-200" : "text-slate-600"}`}>{r.role}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <AdminToggle
                              checked={r.enabled && globalEnabled}
                              onChange={v => updateRole(idx, "enabled", v)}
                              disabled
                              title={blockedPointsControlTitle}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.enabled ? (
                            <input
                              type="number"
                              value={r.points}
                              onChange={e => updateRole(idx, "points", Number(e.target.value))}
                              disabled
                              className="w-20 text-right bg-[#0d1117] border border-white/[0.08] rounded px-2 py-1 text-[12px] text-slate-200 font-mono focus:outline-none focus:border-sky-500/40 disabled:opacity-30"
                              title={blockedPointsControlTitle}
                            />
                          ) : (
                            <span className="text-[12px] text-slate-700 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.enabled ? (
                            <input
                              type="number"
                              value={r.capPerStep}
                              onChange={e => updateRole(idx, "capPerStep", Number(e.target.value))}
                              disabled
                              className="w-16 text-center bg-[#0d1117] border border-white/[0.08] rounded px-2 py-1 text-[12px] text-slate-200 font-mono focus:outline-none focus:border-sky-500/40"
                              title={blockedPointsControlTitle}
                            />
                          ) : (
                            <span className="text-[12px] text-slate-700 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <AdminToggle
                              checked={r.smileSync && smileSync}
                              onChange={v => updateRole(idx, "smileSync", v)}
                              disabled
                              title={blockedPointsControlTitle}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-white/[0.04] flex justify-end">
                  <button disabled title="Global point defaults require the workflow-admin save path" className="px-3 py-1.5 bg-sky-500/12 text-sky-400 border border-sky-500/20 rounded text-[12px] font-semibold hover:bg-sky-500/20 transition-colors">
                    Save Global Defaults
                  </button>
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-4">
                <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4 space-y-3.5">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Global Settings</div>
                  {[
                    { label: "Chapter Points Enabled", state: chapterPoints, set: setChapterPoints },
                    { label: "Smile.io Sync Active", state: smileSync, set: setSmileSync },
                    { label: "Duplicate Prevention", state: dupePrevention, set: setDupePrevention },
                    { label: "Leaderboard Visible", state: leaderboard, set: setLeaderboard },
                    { label: "Approval Required for Points", state: approvalForPoints, set: setApprovalForPoints },
                    { label: "Internal-Only Tracking", state: internalOnly, set: setInternalOnly },
                    { label: "Allow Manual Override", state: manualOverride, set: setManualOverride },
                  ].map(({ label, state, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-400">{label}</span>
                      <AdminToggle checked={state} onChange={set} disabled title={blockedPointsControlTitle} />
                    </div>
                  ))}
                </div>

                {chapterPoints && (
                  <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4 space-y-3">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Chapter Point Value</div>
                    <div className="text-[10px] text-slate-600 leading-relaxed">
                      Points added to the chapter&apos;s total when any member completes a step.
                    </div>
                    <input
                      type="number"
                      defaultValue={25}
                      disabled
                      title={blockedPointsControlTitle}
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded px-3 py-2 text-[13px] text-slate-200 font-mono focus:outline-none focus:border-sky-500/40"
                    />
                  </div>
                )}

                <div className="bg-amber-500/8 border border-amber-500/15 rounded-lg p-3 text-[12px] text-amber-300/80 leading-relaxed">
                  Changes to global defaults only apply to new SOP steps. Open the SOP Builder to update existing step values.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Campaign Steps ────────────────────────────────────────────────── */}
        {tab === "steps" && (
          <div className="p-6 space-y-4">
            {/* Campaign selector */}
            <div className="flex items-center gap-2">
              {SOP_STEP_POINTS.map((c, i) => (
                <button
                  key={c.campaign}
                  onClick={() => setCampaignIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
                    campaignIdx === i
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : "bg-[#161b22] text-slate-500 border-white/[0.06] hover:text-slate-300"
                  }`}
                >
                  {c.campaign}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2.5 bg-[#161b22] border border-white/[0.06] rounded-lg px-4 py-3">
              <AlertCircle size={12} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Steps marked <span className="text-amber-400 font-mono">override</span> have custom point values set in the SOP Builder that differ from global defaults. To edit them, open the SOP Builder → select the campaign → go to Points & KPI tab.
              </p>
            </div>

            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
              <div className={`px-5 py-3 border-b border-white/[0.05] flex items-center gap-2`}>
                <span className={`text-[12px] font-semibold ${selectedCampaign.color}`}>{selectedCampaign.campaign}</span>
                <span className="text-[11px] text-slate-600">· {selectedCampaign.steps.length} steps</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-[#0d1117]/30">
                      {["Step", "Phase", "Owner", "KPI", "Pts On", "Gen Mbr", "AC Mbr", "AC Chair", "E-board", "Chapter", "Cap", "Approval", ""].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {selectedCampaign.steps.map((s, i) => (
                      <tr key={i} className={`hover:bg-white/[0.015] transition-colors ${!s.pointsOn ? "opacity-50" : ""}`}>
                        <td className="px-3 py-3 max-w-[200px]">
                          <div className="text-slate-200 font-medium truncate">{s.step}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{s.phase}</td>
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-[11px]">{s.ownerRole}</td>
                        <td className="px-3 py-3">
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/15 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">{s.kpi}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {s.pointsOn
                            ? <CheckCircle2 size={13} className="text-emerald-400 mx-auto" />
                            : <X size={13} className="text-slate-700 mx-auto" />}
                        </td>
                        {[s.gm, s.acm, s.acc, s.eb, s.chapterPts].map((v, vi) => (
                          <td key={vi} className="px-3 py-3 text-center font-mono">
                            <span className={v > 0 ? "text-emerald-400 font-semibold" : "text-slate-700"}>
                              {v > 0 ? `+${v}` : "—"}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center font-mono text-slate-400">{s.capUser > 0 ? `×${s.capUser}` : "—"}</td>
                        <td className="px-3 py-3 text-center">
                          {s.approvalReq
                            ? <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-1.5 py-0.5 rounded font-mono">req</span>
                            : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-3 py-3">
                          {s.override && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">override</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Caps & Rules ──────────────────────────────────────────────────── */}
        {tab === "caps" && (
          <div className="p-6 space-y-5 max-w-3xl">
            {/* Caps */}
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
              <SectionHeader title="Global Point Caps" />
              <div className="p-5 grid grid-cols-2 gap-4">
                {[
                  { label: "Cap per User per Step", desc: "Max times a single user earns points on one step", defaultVal: 1 },
                  { label: "Cap per User per Campaign", desc: "Max total points a user can earn in one campaign", defaultVal: 0, placeholder: "No cap" },
                  { label: "Cap per Chapter per Step", desc: "Max times a chapter earns chapter-level points on one step", defaultVal: 0, placeholder: "No cap" },
                  { label: "Cap per Chapter per Campaign", desc: "Total chapter point cap for a single campaign", defaultVal: 0, placeholder: "No cap" },
                ].map(({ label, desc, defaultVal, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="text-[12px] text-slate-300 font-medium">{label}</div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">{desc}</div>
                    <input
                      type="number"
                      defaultValue={defaultVal || undefined}
                      placeholder={placeholder ?? String(defaultVal)}
                      disabled
                      title={blockedPointsControlTitle}
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded px-3 py-2 text-[13px] text-slate-200 font-mono focus:outline-none focus:border-sky-500/40 placeholder-slate-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Behavior rules — aligned with SOP Builder */}
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
              <SectionHeader title="Behavior Rules" />
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Leaderboard Visible to Members", desc: "Members can see the chapter and individual leaderboard in their app feed.", state: leaderboard, set: setLeaderboard },
                  { label: "Approval Required for Points", desc: "Coach must approve the step completion before points are awarded.", state: approvalForPoints, set: setApprovalForPoints },
                  { label: "Internal-Only Tracking", desc: "Points are tracked in the system but not shown to members.", state: internalOnly, set: setInternalOnly },
                  { label: "Allow Manual Override", desc: "DS Admins and Super Admins can manually award or remove points from the ledger.", state: manualOverride, set: setManualOverride },
                  { label: "Duplicate Prevention", desc: "Block duplicate awards when the same user triggers the same step event twice.", state: dupePrevention, set: setDupePrevention },
                  { label: "Smile.io Sync Enabled", desc: "Push point events to the Smile.io loyalty platform after they are awarded.", state: smileSync, set: setSmileSync },
                  { label: "Chapter Points Enabled", desc: "When any member earns points, a separate award is added to the chapter's total.", state: chapterPoints, set: setChapterPoints },
                ].map(({ label, desc, state, set }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div>
                      <div className="text-[13px] text-slate-300 font-medium">{label}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{desc}</div>
                    </div>
                    <AdminToggle checked={state} onChange={set} disabled title={blockedPointsControlTitle} />
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation */}
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
              <SectionHeader title="Overdue & Escalation" />
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Award SLA", value: "Instant on step completion (or coach approval)" },
                  { label: "Failed award retry", value: "3 attempts, then manual review required" },
                  { label: "Escalation path", value: "Coach → DS Admin → Super Admin (24h each)" },
                  { label: "Audit log", value: "All awards, failures, and overrides are logged with actor + timestamp" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between px-5 py-3.5 gap-4">
                    <span className="text-[12px] text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-[12px] text-slate-300 text-right leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Ledger ────────────────────────────────────────────────────────── */}
        {tab === "ledger" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#161b22] border border-white/[0.06] rounded-lg p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "success", label: "Success" },
                  { key: "warning", label: "Blocked" },
                  { key: "error", label: "Failed" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setLedgerFilter(f.key)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      ledgerFilter === f.key ? "bg-sky-500/15 text-sky-300" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-600 font-mono ml-auto">{filteredLedger.length} entries</span>
            </div>

            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-[#0d1117]/30">
                    {["User", "Role", "Chapter", "Campaign", "Step", "Mbr Pts", "Ch Pts", "Smile.io", "Timestamp", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLedger.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-slate-200 font-medium">{row.user}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{row.role}</td>
                      <td className="px-4 py-3 text-slate-400">{row.chapter}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{row.campaign}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate text-[11px]">{row.step}</td>
                      <td className={`px-4 py-3 font-mono font-bold ${row.pts > 0 ? "text-emerald-400" : "text-slate-700"}`}>
                        {row.pts > 0 ? `+${row.pts}` : "—"}
                      </td>
                      <td className={`px-4 py-3 font-mono ${row.chapterPts > 0 ? "text-sky-400" : "text-slate-700"}`}>
                        {row.chapterPts > 0 ? `+${row.chapterPts}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.smileSynced
                          ? <CheckCircle2 size={12} className="text-[#FF6B35] mx-auto" />
                          : <span className="text-slate-700 text-[11px]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600 font-mono whitespace-nowrap">{row.time}</td>
                      <td className="px-4 py-3">
                        <Badge
                          status={row.status}
                          label={row.status === "warning" ? "duplicate" : row.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────────
function SmileioCard() {
  const [enabled, setEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "points" | "tiers" | "webhooks">("overview");

  const MOCK_KEY = "secret-ref:smileio:staging:v1";

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(enabled ? "success" : "error");
    }, 1400);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const POINT_RULES = [
    { action: "Event attendance (Luma check-in)", smilePoints: 50, mymedlifePoints: 50, synced: true },
    { action: "Evidence submitted and approved", smilePoints: 30, mymedlifePoints: 30, synced: true },
    { action: "Campaign step completed", smilePoints: 20, mymedlifePoints: 20, synced: false },
    { action: "New member recruited", smilePoints: 75, mymedlifePoints: 75, synced: false },
    { action: "Bridge video submitted", smilePoints: 40, mymedlifePoints: 40, synced: false },
    { action: "Campaign fully completed", smilePoints: 100, mymedlifePoints: 100, synced: false },
  ];

  const TIERS = [
    { name: "Bronze", range: "0 – 499 pts", color: "text-amber-700", bg: "bg-amber-900/20 border-amber-700/20", medlifeLabel: "General Member", perks: "Access to events and feed" },
    { name: "Silver", range: "500 – 1,499 pts", color: "text-slate-300", bg: "bg-slate-700/20 border-slate-600/20", medlifeLabel: "Active Member", perks: "Priority RSVP, chapter leaderboard" },
    { name: "Gold", range: "1,500 – 3,999 pts", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-600/20", medlifeLabel: "Chapter Leader Track", perks: "SLT eligibility, featured on chapter feed" },
    { name: "Platinum", range: "4,000+ pts", color: "text-sky-300", bg: "bg-sky-900/20 border-sky-600/20", medlifeLabel: "SLT / E-board", perks: "Travel priority, national recognition" },
  ];

  const WEBHOOKS = [
    { event: "points.awarded", endpoint: "https://smile.io/webhooks/medlife/points", status: "inactive" as const, lastFired: "Never" },
    { event: "tier.changed", endpoint: "https://smile.io/webhooks/medlife/tiers", status: "inactive" as const, lastFired: "Never" },
    { event: "reward.redeemed", endpoint: "https://api.mymedlife.org/webhooks/smile/reward", status: "inactive" as const, lastFired: "Never" },
  ];

  const TABS = [
    { id: "overview", label: "Connection" },
    { id: "points", label: "Points Sync" },
    { id: "tiers", label: "Tier Mapping" },
    { id: "webhooks", label: "Webhooks" },
  ] as const;

  return (
    <div className={`bg-[#161b22] border rounded-xl overflow-hidden col-span-2 ${enabled ? "border-emerald-500/20" : "border-white/[0.06]"}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[#FF6B35]/15 border border-[#FF6B35]/25 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-black text-[#FF6B35]">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-200">Smile.io</span>
              <span className="text-[10px] bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/20 px-2 py-0.5 rounded font-mono">Loyalty Platform</span>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">Planned points, tier, and reward mapping for the myMEDLIFE loyalty loop</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthDot status={enabled ? "healthy" : "unknown"} />
          <Badge status={enabled ? "enabled" : "disabled"} />
          <button
            onClick={() => { setEnabled(!enabled); setTestResult(null); }}
            disabled
            title="Smile.io provider enablement is blocked until DS approval is complete"
            className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition-colors ${
              enabled
                ? "bg-red-500/8 text-red-400 border-red-500/15 hover:bg-red-500/15"
                : "bg-emerald-500/8 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/15"
            }`}
          >
            {enabled ? "Disable" : "Enable Integration"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.05] bg-[#0d1117]/40 px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#FF6B35] text-[#FF6B35]"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">

        {/* ── Connection tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">API Credentials</div>

              {/* API Key */}
              <div>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1.5">Secret Key</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[11px] text-slate-300 overflow-hidden">
                    {keyRevealed ? MOCK_KEY : `secret-ref:smileio:staging:masked`}
                  </div>
                  <button
                    onClick={() => setKeyRevealed(!keyRevealed)}
                    disabled
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors border border-white/[0.06] rounded bg-[#0d1117]/40"
                    title="Smile.io secret reveal is blocked in this preview"
                  >
                    {keyRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors border border-white/[0.06] rounded bg-[#0d1117]/40"
                    title="Smile.io secret copy is blocked in this preview"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Store details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Store ID", value: "medlife-global" },
                  { label: "Environment", value: "staging" },
                  { label: "API Version", value: "v1" },
                  { label: "Auth Method", value: "Bearer Token" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#0d1117]/50 border border-white/[0.04] rounded p-2.5">
                    <div className="text-[9px] text-slate-700 font-mono uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-[12px] text-slate-300 font-mono">{value}</div>
                  </div>
                ))}
              </div>

              {/* Test connection */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleTest}
                  disabled
                  title="Smile.io connection tests are blocked until DS approval is complete"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[12px] font-medium hover:bg-sky-500/18 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={testing ? "animate-spin" : ""} />
                  {testing ? "Testing…" : "Test Connection"}
                </button>
                {testResult === "success" && (
                  <span className="text-[12px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Connected — 220ms
                  </span>
                )}
                {testResult === "error" && (
                  <span className="text-[12px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={13} /> Connection failed — enable integration first
                  </span>
                )}
              </div>
            </div>

            {/* Right: sync status */}
            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">Sync Status</div>
              <div className="bg-[#0d1117]/50 border border-white/[0.04] rounded-lg divide-y divide-white/[0.04]">
                {[
                  { label: "Last Successful Sync", value: enabled ? "Never" : "—" },
                  { label: "Points Synced (lifetime)", value: "0" },
                  { label: "Members Synced", value: "0" },
                  { label: "Pending Events in Queue", value: "0" },
                  { label: "Errors (7 days)", value: "0" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[12px] text-slate-500">{label}</span>
                    <span className="text-[12px] text-slate-300 font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {!enabled && (
                <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded p-3">
                  <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-300/80 leading-relaxed">
                    Smile.io sync stays visible for DS review, but point awards, tier sync, and reward writes remain blocked in this preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Points Sync tab ─────────────────────────────────────────── */}
        {activeTab === "points" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] text-slate-300 font-medium">Points Sync Rules</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Review-only mapping of myMEDLIFE actions to a future Smile.io rewards policy.</p>
              </div>
              <button disabled title="Smile.io rule sync is blocked until integration approval is complete" className="px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors flex items-center gap-1.5">
                <RefreshCw size={11} />
                Sync All Rules
              </button>
            </div>

            <div className="bg-[#0d1117]/40 border border-white/[0.05] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="text-left px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">myMEDLIFE Action</th>
                    <th className="text-right px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">myMEDLIFE Pts</th>
                    <th className="text-right px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Smile.io Pts</th>
                    <th className="text-center px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">Sync Active</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {POINT_RULES.map((rule, i) => (
                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-slate-300">{rule.action}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400 font-semibold">+{rule.mymedlifePoints}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#FF6B35] font-semibold">+{rule.smilePoints}</td>
                      <td className="px-4 py-3 text-center">
                        {rule.synced ? (
                          <CheckCircle2 size={13} className="text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button disabled title="Point-rule editing requires the workflow-admin save path" className="text-[11px] text-sky-500 hover:text-sky-300 transition-colors">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/15 rounded p-3">
              <AlertCircle size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-sky-300/80 leading-relaxed">
                Points flow one-way: myMEDLIFE → Smile.io. The source of truth for points is myMEDLIFE. Smile.io displays them in the student loyalty wallet and triggers rewards.
              </p>
            </div>
          </div>
        )}

        {/* ── Tier Mapping tab ─────────────────────────────────────────── */}
        {activeTab === "tiers" && (
          <div className="space-y-4">
            <div className="mb-2">
              <p className="text-[13px] text-slate-300 font-medium">Tier Mapping</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Smile.io loyalty tiers mapped to myMEDLIFE membership levels. Tier upgrades trigger in-app notifications and unlocked perks.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIERS.map((tier) => (
                <div key={tier.name} className={`border rounded-lg p-4 space-y-3 ${tier.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[15px] font-black ${tier.color}`}>{tier.name}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{tier.range}</span>
                    </div>
                    <button disabled title="Tier editing requires the workflow-admin save path" className="text-[11px] text-sky-500 hover:text-sky-300 transition-colors">Edit</button>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">myMEDLIFE Label</span>
                      <div className="text-[12px] text-slate-300 mt-0.5 font-medium">{tier.medlifeLabel}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Perks Unlocked</span>
                      <div className="text-[12px] text-slate-400 mt-0.5">{tier.perks}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">Tier Change Behavior</div>
              <div className="space-y-2.5">
                {[
                  { label: "Downgrade policy", value: "Never downgrade — points are cumulative" },
                  { label: "Upgrade trigger", value: "Immediate on point award if threshold crossed" },
                  { label: "Notification", value: "In-app + push notification to member" },
                  { label: "HubSpot sync", value: "Lifecycle stage updated on tier change" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-[12px] text-slate-500">{label}</span>
                    <span className="text-[12px] text-slate-300 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Webhooks tab ─────────────────────────────────────────────── */}
        {activeTab === "webhooks" && (
          <div className="space-y-4">
            <div className="mb-2">
              <p className="text-[13px] text-slate-300 font-medium">Webhook Endpoints</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Smile.io fires these webhooks to myMEDLIFE when loyalty events occur. All require HMAC verification.</p>
            </div>

            <div className="space-y-3">
              {WEBHOOKS.map((wh) => (
                <div key={wh.event} className="bg-[#0d1117]/50 border border-white/[0.05] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-mono text-[#FF6B35]">{wh.event}</span>
                    <Badge status={wh.status} />
                  </div>
                  <div className="bg-[#0d1117]/70 border border-white/[0.04] rounded px-3 py-2 font-mono text-[11px] text-slate-400 mb-3">
                    {wh.endpoint}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Last fired: {wh.lastFired}</span>
                    <div className="flex gap-2">
                      <button disabled title="Webhook tests are blocked until integration approval is complete" className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded text-[11px] hover:bg-sky-500/18 transition-colors">Test</button>
                      <button disabled title="Webhook URL edits require the secure integration workflow" className="px-2.5 py-1 bg-white/[0.04] text-slate-400 border border-white/[0.08] rounded text-[11px] hover:bg-white/[0.07] transition-colors">Edit URL</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 bg-[#161b22] border border-white/[0.06] rounded p-3">
              <Shield size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 leading-relaxed">
                All incoming webhooks from Smile.io are verified using HMAC-SHA256. The webhook secret is stored in the API Keys section and rotated separately. Never expose the secret in client-side code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Meta Business API Card ────────────────────────────────────────────────────

function MetaCard() {
  const [enabled, setEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"connection" | "pages" | "instagram" | "analytics">("connection");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [tokenRevealed, setTokenRevealed] = useState(false);

  const TABS = [
    { id: "connection" as const, label: "Connection" },
    { id: "pages"      as const, label: "Facebook Pages" },
    { id: "instagram"  as const, label: "Instagram" },
    { id: "analytics"  as const, label: "Analytics" },
  ];

  const META_BLUE = "#1877F2";

  const CHAPTER_PAGES = [
    { chapter: "UC Berkeley",          page: "MEDLIFE UC Berkeley",    followers: 1240, status: "pending" as const },
    { chapter: "University of Florida",page: "MEDLIFE UF",             followers: 2880, status: "pending" as const },
    { chapter: "Stanford University",  page: "MEDLIFE Stanford",       followers: 3410, status: "pending" as const },
    { chapter: "UNAM Mexico City",     page: "MEDLIFE UNAM",           followers: 1890, status: "pending" as const },
    { chapter: "USP São Paulo",        page: "MEDLIFE USP",            followers: 2150, status: "pending" as const },
    { chapter: "University of Nairobi",page: "MEDLIFE Nairobi Chapter",followers: 960,  status: "pending" as const },
  ];

  const IG_ACCOUNTS = [
    { chapter: "UC Berkeley",          handle: "@medlife_ucberkeley",  followers: 3280, verified: true,  status: "pending" as const },
    { chapter: "Stanford University",  handle: "@medlife_stanford",    followers: 4120, verified: true,  status: "pending" as const },
    { chapter: "University of Florida",handle: "@medlife_uf",          followers: 2640, verified: false, status: "pending" as const },
    { chapter: "UNAM Mexico City",     handle: "@medlife_unam",        followers: 2910, verified: false, status: "pending" as const },
    { chapter: "USP São Paulo",        handle: "@medlife_usp_oficial", followers: 1780, verified: false, status: "pending" as const },
  ];

  const handleTest = () => {
    setTesting(true); setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult(enabled ? "success" : "error"); }, 1400);
  };

  return (
    <div className={`bg-[#161b22] border rounded-xl overflow-hidden col-span-2 ${enabled ? "border-[#1877F2]/30" : "border-white/[0.06]"}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
               style={{ backgroundColor: `${META_BLUE}20`, borderColor: `${META_BLUE}30` }}>
            <span className="text-[14px] font-black" style={{ color: META_BLUE }}>f</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-200">Meta Business API</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono border"
                    style={{ backgroundColor: `${META_BLUE}15`, color: META_BLUE, borderColor: `${META_BLUE}25` }}>
                Facebook + Instagram
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">Post content, sync UGC, and pull engagement analytics for chapter social accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthDot status={enabled ? "healthy" : "unknown"} />
          <Badge status={enabled ? "enabled" : "disabled"} />
          <button onClick={() => { setEnabled(!enabled); setTestResult(null); }} disabled title="Meta provider enablement is blocked until DS approval is complete"
            className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition-colors ${
              enabled ? "bg-red-500/8 text-red-400 border-red-500/15 hover:bg-red-500/15"
                      : "bg-emerald-500/8 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/15"
            }`}>
            {enabled ? "Disable" : "Enable Integration"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.05] bg-[#0d1117]/40 px-5">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "border-b-[#1877F2] text-[#1877F2]" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Connection tab */}
        {activeTab === "connection" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">App Credentials</div>
              {[
                { label: "App ID", value: "1234567890123456", masked: false },
                { label: "Business ID", value: "987654321098765", masked: false },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">{label}</div>
                  <div className="bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[11px] text-slate-300">{value}</div>
                </div>
              ))}
              <div>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">System User Token</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[11px] text-slate-300 overflow-hidden">
                    {tokenRevealed ? "EAABwzLixnjYBO3ZBXk9pXm..." : `EAABwzLix${"•".repeat(20)}k4f2`}
                  </div>
                  <button onClick={() => setTokenRevealed(!tokenRevealed)} disabled title="Meta system token reveal is blocked in this preview"
                    className="p-2 text-slate-500 hover:text-slate-200 border border-white/[0.06] rounded bg-[#0d1117]/40">
                    {tokenRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Shield size={10} className="text-slate-700" />
                  <span className="text-[10px] text-slate-700">Token expires 2027-01-01 · Never expires for system users</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleTest} disabled title="Meta connection tests are blocked until DS approval is complete"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[12px] font-medium hover:bg-sky-500/18 transition-colors disabled:opacity-50">
                  <RefreshCw size={12} className={testing ? "animate-spin" : ""} />
                  {testing ? "Testing…" : "Test Connection"}
                </button>
                {testResult === "success" && <span className="text-[12px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Connected · 180ms</span>}
                {testResult === "error"   && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle size={13} /> Enable integration first</span>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">Permissions & Scopes</div>
              <div className="space-y-2">
                {[
                  { scope: "pages_manage_posts",    desc: "Publish to chapter Facebook Pages",       granted: false },
                  { scope: "pages_read_engagement", desc: "Read page analytics and engagement",      granted: false },
                  { scope: "instagram_basic",        desc: "Read Instagram account info",            granted: false },
                  { scope: "instagram_content_publish", desc: "Publish to Instagram Business",       granted: false },
                  { scope: "instagram_manage_insights", desc: "Pull Instagram analytics",            granted: false },
                  { scope: "ads_read",               desc: "Read ad campaign performance",           granted: false },
                ].map(({ scope, desc, granted }) => (
                  <div key={scope} className="flex items-center gap-2.5">
                    <div className={`size-1.5 rounded-full flex-shrink-0 ${granted ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono text-slate-400">{scope}</div>
                      <div className="text-[10px] text-slate-600">{desc}</div>
                    </div>
                    <span className={`text-[10px] font-mono ${granted ? "text-emerald-400" : "text-slate-600"}`}>
                      {granted ? "granted" : "pending"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/15 rounded p-3 mt-2">
                <AlertCircle size={12} className="text-sky-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-sky-300/80 leading-relaxed">
                  Meta App Review and OAuth scope setup stay visible for DS review, but scope requests and provider activation remain blocked in this preview.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Facebook Pages tab */}
        {activeTab === "pages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] text-slate-300 font-medium">Connected Facebook Pages</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Each chapter links one Facebook Page. Posts are published on behalf of the
                  chapter&apos;s page admins.
                </p>
              </div>
              <button disabled title="Facebook page connection is blocked until Meta integration approval is complete" className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors">
                <Plus size={12} /> Connect Page
              </button>
            </div>
            <div className="bg-[#0d1117]/40 border border-white/[0.05] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {["Chapter", "Facebook Page", "Followers", "Auto-Post", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {CHAPTER_PAGES.map((p, i) => (
                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-medium">{p.chapter}</td>
                      <td className="px-4 py-3 text-slate-400">{p.page}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{p.followers.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-slate-700">
                            <span className="inline-block size-3 translate-x-0.5 transform rounded-full bg-white" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status="inactive" label="not connected" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">Auto-Post Rules</div>
              <div className="space-y-2.5">
                {[
                  { label: "Trigger",           value: "Staff approves a feed post in Feed Studio" },
                  { label: "Content mapping",   value: "Caption, image/video, and CTA button → Facebook post" },
                  { label: "Post timing",       value: "Immediate or scheduled (mirrors Feed Studio schedule)" },
                  { label: "Page attribution",  value: "Post appears as chapter's Facebook Page, not MEDLIFE global" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-[12px] text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-[12px] text-slate-300 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instagram tab */}
        {activeTab === "instagram" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] text-slate-300 font-medium">Instagram Business Accounts</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Must be linked to a Facebook Page. Enables post publishing and UGC sync (tagged posts, stories).</p>
              </div>
              <button disabled title="Instagram account connection is blocked until Meta integration approval is complete" className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors">
                <Plus size={12} /> Connect Account
              </button>
            </div>
            <div className="bg-[#0d1117]/40 border border-white/[0.05] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {["Chapter", "Instagram Handle", "Followers", "Verified", "UGC Sync", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {IG_ACCOUNTS.map((acc, i) => (
                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-medium">{acc.chapter}</td>
                      <td className="px-4 py-3 font-mono text-[#E1306C]">{acc.handle}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{acc.followers.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {acc.verified ? <CheckCircle2 size={13} className="text-sky-400 mx-auto" /> : <span className="text-slate-700 text-[11px]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-slate-700">
                          <span className="inline-block size-3 translate-x-0.5 transform rounded-full bg-white" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status="inactive" label="not connected" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#0d1117]/40 border border-white/[0.05] rounded-lg p-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">UGC Sync — Tagged Posts</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                If Meta activation is approved later, tagged posts such as <span className="font-mono text-slate-300">#MEDLIFE</span> or <span className="font-mono text-slate-300">@medlife_global</span> would flow into the <span className="text-sky-400">Proof / UGC Review Queue</span> for staff review and consent checks before any sharing step.
              </p>
            </div>
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-300 font-medium mb-1">Cross-Chapter Social Analytics</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-4">Once connected, Meta Insights data will appear here — broken down by chapter, post type, and campaign. All metrics below are illustrative.</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Reach", value: "—", sub: "across all pages" },
                { label: "Avg Engagement Rate", value: "—", sub: "likes + comments / reach" },
                { label: "Top Post Reach", value: "—", sub: "best performing post" },
                { label: "Stories Views", value: "—", sub: "last 30 days" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1117]/50 border border-white/[0.04] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1.5">{s.label}</div>
                  <div className="text-[22px] font-bold font-mono text-slate-700">{s.value}</div>
                  <div className="text-[10px] text-slate-700 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/15 rounded p-3">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-300/80 leading-relaxed">
                Analytics require Meta integration to be enabled and at least one Facebook Page or Instagram account to be connected and authorized.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hootsuite Card ────────────────────────────────────────────────────────────

function HootsuiteCard() {
  const [enabled, setEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"connection" | "streams" | "schedule" | "reports">("connection");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [secretRevealed, setSecretRevealed] = useState(false);

  const HOOTSUITE_RED = "#E0201C";

  const TABS = [
    { id: "connection" as const, label: "Connection" },
    { id: "streams"    as const, label: "Streams" },
    { id: "schedule"   as const, label: "Scheduling" },
    { id: "reports"    as const, label: "Reports" },
  ];

  const STREAMS = [
    { chapter: "UC Berkeley",           networks: ["Facebook","Instagram","Twitter/X"], lastPost: "—", autoApprove: false },
    { chapter: "Stanford University",    networks: ["Facebook","Instagram"],            lastPost: "—", autoApprove: false },
    { chapter: "University of Florida", networks: ["Facebook","Instagram","TikTok"],   lastPost: "—", autoApprove: false },
    { chapter: "UNAM Mexico City",       networks: ["Facebook","Instagram"],            lastPost: "—", autoApprove: false },
    { chapter: "USP São Paulo",          networks: ["Facebook","Instagram"],            lastPost: "—", autoApprove: false },
  ];

  const handleTest = () => {
    setTesting(true); setTestResult(null);
    setTimeout(() => { setTesting(false); setTestResult(enabled ? "success" : "error"); }, 1400);
  };

  return (
    <div className={`bg-[#161b22] border rounded-xl overflow-hidden col-span-2 ${enabled ? "border-[#E0201C]/30" : "border-white/[0.06]"}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
               style={{ backgroundColor: `${HOOTSUITE_RED}20`, borderColor: `${HOOTSUITE_RED}30` }}>
            <span className="text-[11px] font-black" style={{ color: HOOTSUITE_RED }}>HS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-200">Hootsuite</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono border"
                    style={{ backgroundColor: `${HOOTSUITE_RED}15`, color: HOOTSUITE_RED, borderColor: `${HOOTSUITE_RED}25` }}>
                Social Media Management
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">Schedule posts, manage chapter social streams, and view cross-platform analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthDot status={enabled ? "healthy" : "unknown"} />
          <Badge status={enabled ? "enabled" : "disabled"} />
          <button onClick={() => { setEnabled(!enabled); setTestResult(null); }} disabled title="Hootsuite provider enablement is blocked until DS approval is complete"
            className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition-colors ${
              enabled ? "bg-red-500/8 text-red-400 border-red-500/15 hover:bg-red-500/15"
                      : "bg-emerald-500/8 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/15"
            }`}>
            {enabled ? "Disable" : "Enable Integration"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.05] bg-[#0d1117]/40 px-5">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "text-[#E0201C]" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
            style={activeTab === tab.id ? { borderBottomColor: HOOTSUITE_RED } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Connection tab */}
        {activeTab === "connection" && (
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">OAuth Credentials</div>
              <div>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">Client ID</div>
                <div className="bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[11px] text-slate-300">hs_client_9Xk2Mn4Pq7Rt1</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">Client Secret</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[11px] text-slate-300 overflow-hidden">
                    {secretRevealed ? "hs_sec_4Tz8Kp1mQx9Nv3Wr..." : `hs_sec_4Tz${"•".repeat(20)}r9x`}
                  </div>
                  <button onClick={() => setSecretRevealed(!secretRevealed)} disabled title="Hootsuite client-secret reveal is blocked in this preview"
                    className="p-2 text-slate-500 hover:text-slate-200 border border-white/[0.06] rounded bg-[#0d1117]/40">
                    {secretRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">OAuth Status</div>
                <div className="flex items-center gap-2">
                  <Badge status="inactive" label="not authorized" />
                  <button disabled title="OAuth authorization is blocked until hosted secret ownership is approved" className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium">Authorize via OAuth →</button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleTest} disabled title="Hootsuite connection tests are blocked until DS approval is complete"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[12px] font-medium hover:bg-sky-500/18 transition-colors disabled:opacity-50">
                  <RefreshCw size={12} className={testing ? "animate-spin" : ""} />
                  {testing ? "Testing…" : "Test Connection"}
                </button>
                {testResult === "success" && <span className="text-[12px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={13} /> Connected · 240ms</span>}
                {testResult === "error"   && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertCircle size={13} /> Enable integration first</span>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">Plan & Limits</div>
              <div className="bg-[#0d1117]/50 border border-white/[0.04] rounded-lg divide-y divide-white/[0.04]">
                {[
                  { label: "Hootsuite Plan",       value: "Business (pending)" },
                  { label: "Social Profiles",      value: "Up to 35 per plan" },
                  { label: "Team Members",          value: "Unlimited" },
                  { label: "Scheduled Posts",       value: "Unlimited" },
                  { label: "Analytics Retention",   value: "12 months" },
                  { label: "API Rate Limit",        value: "500 req / hour" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-3 py-2.5">
                    <span className="text-[12px] text-slate-500">{label}</span>
                    <span className="text-[12px] text-slate-300 font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Streams tab */}
        {activeTab === "streams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] text-slate-300 font-medium">Chapter Social Streams</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Each chapter&apos;s connected social profiles are managed as a Hootsuite stream.
                  Staff can compose, approve, and schedule across all at once.
                </p>
              </div>
              <button disabled title="Hootsuite stream creation is blocked until integration approval is complete" className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors">
                <Plus size={12} /> Add Stream
              </button>
            </div>
            <div className="bg-[#0d1117]/40 border border-white/[0.05] rounded-lg overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {["Chapter", "Networks", "Last Post", "Auto-Approve", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {STREAMS.map((s, i) => (
                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-medium">{s.chapter}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.networks.map(n => (
                            <span key={n} className="text-[10px] bg-white/[0.04] text-slate-500 border border-white/[0.06] px-1.5 py-0.5 rounded font-mono">{n}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.lastPost}</td>
                      <td className="px-4 py-3">
                        <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-slate-700">
                          <span className="inline-block size-3 translate-x-0.5 transform rounded-full bg-white" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status="inactive" label="not connected" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/15 rounded p-3">
              <AlertCircle size={12} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-sky-300/80 leading-relaxed">
                If Hootsuite activation is approved later, Feed Studio posts would queue here for the targeted chapter streams after consent and approval checks. Publishing remains blocked in this preview.
              </p>
            </div>
          </div>
        )}

        {/* Scheduling tab */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-300 font-medium mb-1">Publishing & Scheduling Rules</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4 space-y-3.5">
                <h3 className="text-[12px] font-semibold text-slate-300">Approval Workflow</h3>
                {[
                  { label: "Compose source",     value: "myMEDLIFE Feed Studio" },
                  { label: "Approval required",  value: "DS Admin or Super Admin" },
                  { label: "Auto-publish",       value: "Disabled by default" },
                  { label: "Schedule lead time", value: "Min. 1 hour before publish" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider">{label}</div>
                    <div className="text-[12px] text-slate-300 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4 space-y-3.5">
                <h3 className="text-[12px] font-semibold text-slate-300">Optimal Post Times</h3>
                {[
                  { region: "North America",  time: "Tue–Thu · 11am–1pm EST" },
                  { region: "Latin America",  time: "Mon–Wed · 12pm–3pm local" },
                  { region: "Africa",         time: "Mon/Wed/Fri · 10am–12pm local" },
                ].map(({ region, time }) => (
                  <div key={region} className="flex justify-between">
                    <span className="text-[12px] text-slate-500">{region}</span>
                    <span className="text-[11px] text-slate-300 font-mono">{time}</span>
                  </div>
                ))}
                <div className="text-[10px] text-slate-700 pt-1">Based on Hootsuite AutoSchedule recommendations</div>
              </div>
            </div>
            <div className="bg-[#0d1117]/50 border border-white/[0.04] rounded-lg p-4 space-y-2.5">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-2">Content Flow: Feed Studio → Hootsuite → Social</div>
              {[
                { step:"1", label:"Staff composes post in Feed Studio",     source:"myMEDLIFE" },
                { step:"2", label:"Audience selected (chapters / coach / saved list)", source:"myMEDLIFE" },
                { step:"3", label:"Post would queue in Hootsuite for approval",  source:"Hootsuite" },
                { step:"4", label:"DS Admin or Super Admin approves",       source:"myMEDLIFE" },
                { step:"5", label:"Hootsuite would publish to selected chapter streams", source:"Hootsuite" },
              ].map(({ step, label, source }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{step}</div>
                  <span className="text-[12px] text-slate-400 flex-1">{label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${source === "Hootsuite" ? "bg-[#E0201C]/10 text-[#E0201C]" : "bg-sky-500/10 text-sky-400"} border ${source === "Hootsuite" ? "border-[#E0201C]/20" : "border-sky-500/20"}`}>{source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <p className="text-[13px] text-slate-300 font-medium mb-1">Cross-Platform Social Reports</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mb-4">Hootsuite Analytics will surface here once connected — aggregated across all chapter streams and networks. All metrics below are illustrative.</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Impressions",  value: "—", sub: "all networks" },
                { label: "Total Engagements",  value: "—", sub: "likes, comments, shares" },
                { label: "Link Clicks",        value: "—", sub: "to myMEDLIFE events" },
                { label: "Top Chapter",        value: "—", sub: "by engagement rate" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1117]/50 border border-white/[0.04] rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1.5">{s.label}</div>
                  <div className="text-[22px] font-bold font-mono text-slate-700">{s.value}</div>
                  <div className="text-[10px] text-slate-700 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#161b22] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">Report Types Available</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Chapter social performance",
                  "Post-by-post breakdown",
                  "Network comparison (FB vs IG vs TikTok)",
                  "Top-performing content",
                  "Follower growth over time",
                  "Best time to post (per chapter)",
                ].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-slate-700 flex-shrink-0" />
                    <span className="text-[12px] text-slate-500">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntegrationsPage() {
  const FEATURED_IDS = ["smileio", "meta", "hootsuite"];
  const coreIntegrations = INTEGRATIONS_DATA.filter((i) => !FEATURED_IDS.includes(i.id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-300/80 leading-relaxed">
          These provider controls stay visible for DS review, but this integrations surface is preview-only. Connection tests, enablement, syncs, exports, and external writes remain blocked until the audited workflow is approved.
        </p>
      </div>

      {/* Smile.io featured */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Loyalty Platform</span>
          <span className="text-[10px] bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/20 px-1.5 py-0.5 rounded font-mono">Featured</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SmileioCard />
        </div>
      </div>

      {/* Social Media — Meta + Hootsuite */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Social Media</span>
          <span className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono">2 integrations</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetaCard />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <HootsuiteCard />
        </div>
      </div>

      {/* Core integrations */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block mb-3">Core Integrations</span>
        <div className="grid grid-cols-2 gap-4">
          {coreIntegrations.map((int) => (
            <div
              key={int.id}
              className={`bg-[#161b22] border rounded-lg p-4 space-y-3 ${int.errors > 5 ? "border-amber-500/20" : "border-white/[0.06]"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HealthDot status={int.health} />
                  <span className="text-[14px] font-bold text-slate-200">{int.name}</span>
                </div>
                <Badge status={int.enabled ? "enabled" : "disabled"} />
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed">{int.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Environment", value: int.environment },
                  { label: "Health", value: int.health },
                  { label: "Last Test", value: int.lastTest },
                  { label: "Last Sync", value: int.lastSync },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[9px] text-slate-700 font-mono uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{value}</div>
                  </div>
                ))}
              </div>
              {int.errors > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={11} className={int.errors > 5 ? "text-amber-400" : "text-slate-600"} />
                  <span className={`text-[11px] ${int.errors > 5 ? "text-amber-400" : "text-slate-600"}`}>
                    {int.errors} error{int.errors !== 1 ? "s" : ""} in last 7 days
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
                <button disabled title="Integration tests are blocked until provider credentials are approved" className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors">Test</button>
                {int.enabled ? (
                  <button disabled title="Provider logs are available only from the audited integration log surface" className="px-2.5 py-1 bg-white/[0.04] text-slate-400 border border-white/[0.08] rounded text-[11px] hover:bg-white/[0.07] transition-colors">View Logs</button>
                ) : (
                  <button disabled title="Provider enabling is blocked until DS approval is complete" className="px-2.5 py-1 bg-emerald-500/8 text-emerald-400 border border-emerald-500/15 rounded text-[11px] font-medium hover:bg-emerald-500/15 transition-colors">Enable</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────────
function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = AUDIT_LOGS.filter((log) => {
    const q = search.toLowerCase();
    const matchQ = log.actor.toLowerCase().includes(q) || log.target.toLowerCase().includes(q) || log.action.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || log.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-300/80 leading-relaxed">
          This audit log is preview-only. Review seeded admin and system readback here, then use the audited evidence surfaces for live production proof or incident review.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actor, target, action..."
            className="bg-[#161b22] border border-white/[0.08] rounded pl-8 pr-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors w-72"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#161b22] border border-white/[0.08] rounded px-3 py-2 text-[13px] text-slate-400 focus:outline-none"
        >
          <option value="all">All Events</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <span className="ml-auto text-[11px] text-slate-600 font-mono">{filtered.length} entries</span>
      </div>

      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Timestamp", "Actor", "Action", "Target", "Change", "Reason", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 text-[11px] text-slate-600 font-mono whitespace-nowrap">{log.timestamp}</td>
                <td className="px-4 py-3">
                  <div className="text-slate-200 font-semibold">{log.actor}</div>
                  <div className="text-[10px] text-slate-700 font-mono">{log.role}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{log.action}</td>
                <td className="px-4 py-3 text-slate-300">{log.target}</td>
                <td className="px-4 py-3">
                  {log.oldValue !== "—" ? (
                    <div className="text-[11px] font-mono">
                      <span className="text-slate-600">{log.oldValue}</span>
                      <span className="text-slate-700 mx-1">→</span>
                      <span className="text-slate-300">{log.newValue}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-700 font-mono">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500 max-w-[160px] truncate">{log.reason}</td>
                <td className="px-4 py-3"><Badge status={log.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── System Health ────────────────────────────────────────────────────────────────
function SystemHealthPage() {
  const services = [
    { name: "App / Frontend", status: "healthy" as HealthStatus, uptime: "99.98%", latency: "42ms", note: "All regions nominal" },
    { name: "Database", status: "healthy" as HealthStatus, uptime: "99.99%", latency: "8ms", note: "Primary/replica healthy" },
    { name: "Feature Flag Service", status: "healthy" as HealthStatus, uptime: "100%", latency: "3ms", note: "All flags resolving" },
    { name: "Event Service", status: "healthy" as HealthStatus, uptime: "99.95%", latency: "18ms", note: "Event processing active" },
    { name: "Points Service", status: "healthy" as HealthStatus, uptime: "99.97%", latency: "12ms", note: "Awarding pipeline nominal" },
    { name: "Luma Integration", status: "unknown" as HealthStatus, uptime: "n/a", latency: "n/a", note: "Readback only; no live API call from this shell" },
    { name: "Outbox / n8n", status: "unknown" as HealthStatus, uptime: "n/a", latency: "n/a", note: "Execution disabled; no outbound sends" },
    { name: "BigQuery Connector", status: "unknown" as HealthStatus, uptime: "n/a", latency: "n/a", note: "Warehouse exports disabled" },
  ];

  const overall: HealthStatus = services.some((s) => s.status === "down") ? "down" : services.some((s) => s.status === "degraded") ? "degraded" : "healthy";
  const overallColors = { healthy: "bg-emerald-500/8 border-emerald-500/15 text-emerald-400", degraded: "bg-amber-500/8 border-amber-500/15 text-amber-400", down: "bg-red-500/8 border-red-500/15 text-red-400", unknown: "bg-slate-500/8 border-slate-500/15 text-slate-400" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-300/80 leading-relaxed">
          This system-health panel is preview-only. Use it to review seeded posture and blocked integrations, not as a live production monitoring surface.
        </p>
      </div>

      <div className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${overallColors[overall]}`}>
        <HealthDot status={overall} />
        <div>
          <div className="text-[13px] font-bold">
            {overall === "healthy" ? "All Systems Operational" : overall === "degraded" ? "Partial Degradation Detected" : "System Outage"}
          </div>
          <div className="text-[11px] opacity-60 mt-0.5">
            {services.filter((s) => s.status === "healthy").length} of {services.length} services healthy
          </div>
        </div>
        <button disabled title="System-health refresh is blocked in this static shell" className="ml-auto flex items-center gap-1.5 text-[12px] opacity-60 hover:opacity-100 transition-opacity">
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {services.map((svc) => (
          <div
            key={svc.name}
            className={`bg-[#161b22] border rounded-lg p-4 ${svc.status === "degraded" ? "border-amber-500/15" : svc.status === "down" ? "border-red-500/20" : "border-white/[0.06]"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HealthDot status={svc.status} />
                <span className="text-[13px] font-semibold text-slate-200">{svc.name}</span>
              </div>
              <Badge status={svc.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { label: "Uptime", value: svc.uptime, highlight: false },
                { label: "Latency", value: svc.latency, highlight: parseInt(svc.latency.replace(/[^0-9]/g, "")) > 500 },
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <div className="text-[9px] text-slate-700 font-mono uppercase tracking-wider mb-0.5">{label}</div>
                  <div className={`text-[13px] font-mono font-semibold ${highlight ? "text-amber-400" : "text-slate-200"}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-600">{svc.note}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
        <SectionHeader title="Recent System Errors" />
        <div className="divide-y divide-white/[0.04]">
          {[
            { time: "2026-07-01 08:42", service: "BigQuery Connector", msg: "Warehouse write skipped — connector disabled in staging/mock-safe mode", sev: "warning" },
            { time: "2026-07-01 08:15", service: "Luma Integration", msg: "Live Luma API call skipped — use audited staging setup for readback", sev: "warning" },
            { time: "2026-06-30 17:30", service: "Outbox / n8n", msg: "Outbound automation execution blocked", sev: "warning" },
          ].map((err, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <Badge status={err.sev} />
              <span className="text-[11px] text-slate-600 font-mono flex-shrink-0 mt-0.5 whitespace-nowrap">{err.time}</span>
              <div>
                <div className="text-[11px] text-sky-500/70 font-mono mb-0.5">{err.service}</div>
                <div className="text-[13px] text-slate-300">{err.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────────
function SettingsPage() {
  return (
    <div className="p-6 space-y-5 max-w-xl">
      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg p-4">
        <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-amber-400 mb-1">Preview Configuration Only</div>
          <p className="text-[12px] text-amber-300/70 leading-relaxed">
            These settings stay visible for DS review, but this surface does not change live production configuration. Use the audited admin workflow after approval for real environment or alert changes.
          </p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
        <SectionHeader title="Admin Access Controls" />
        {[
          { label: "Session timeout", value: "4 hours (policy target)" },
          { label: "MFA for production toggles", value: "Required in audited workflow" },
          { label: "Audit log retention", value: "90 days" },
          { label: "Admin email alerts", value: "Configured (preview only)" },
          { label: "Environment", value: "Staging / mock-safe" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0">
            <span className="text-[13px] text-slate-300">{s.label}</span>
            <span className="text-[13px] text-slate-400 font-mono">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg p-4">
        <Shield size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-amber-400 mb-1">Restricted Environment</div>
          <p className="text-[12px] text-amber-300/70 leading-relaxed">
            This control panel is restricted to DS Admin and Super Admin roles only. All actions are logged, audited, and cannot be undone without leaving a trail. Contact your security team for access changes.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Password Gate Modal ────────────────────────────────────────────────────────
const MOCK_PASSWORD = "admin123";

type PendingAction =
  | { type: "reveal"; id: string }
  | { type: "copy"; id: string; key: string }
  | { type: "rotate"; target: typeof API_KEYS_DATA[0] }
  | { type: "revoke"; target: typeof API_KEYS_DATA[0] };

function PasswordGate({
  open,
  onClose,
  onSuccess,
  action,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MOCK_PASSWORD) {
      setPassword("");
      setError(false);
      setShowPw(false);
      onSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(false);
    setShowPw(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px]" onClick={handleClose} />
      <div className="relative w-full max-w-[380px] bg-[#161b22] border border-white/[0.1] rounded-lg shadow-2xl">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-9 rounded-full bg-sky-500/15 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Shield size={15} className="text-sky-400" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-white">Verify Identity</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{action}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-600 font-mono uppercase tracking-wider block mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#0d1117] border rounded px-3 py-2.5 text-[13px] text-slate-200 placeholder-slate-600 focus:outline-none transition-colors pr-10 ${
                    error ? "border-red-500/50 focus:border-red-500/70" : "border-white/[0.08] focus:border-sky-500/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle size={11} className="text-red-400" />
                  <span className="text-[11px] text-red-400">Incorrect password. Try again.</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-600 bg-[#0d1117]/50 border border-white/[0.04] rounded px-3 py-2">
              This action is logged in the audit trail with your identity and timestamp.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!password}
                className="flex-1 py-2.5 bg-sky-500 text-white rounded text-[13px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[13px] hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────────
function ApiKeysPage() {
  const [keys, setKeys] = useState(API_KEYS_DATA);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<typeof API_KEYS_DATA[0] | null>(null);
  const [rotateTarget, setRotateTarget] = useState<typeof API_KEYS_DATA[0] | null>(null);
  const [rotateConfirmed, setRotateConfirmed] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const mask = (key: string) => {
    const prefix = key.slice(0, 8);
    return `${prefix}${"•".repeat(20)}${key.slice(-4)}`;
  };

  // All sensitive actions go through the password gate first
  const gate = (action: PendingAction) => setPending(action);

  const handleGateSuccess = () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    if (p.type === "reveal") {
      setRevealed((prev) => ({ ...prev, [p.id]: true }));
    } else if (p.type === "copy") {
      navigator.clipboard.writeText(p.key).catch(() => {});
      setCopied(p.id);
      setTimeout(() => setCopied(null), 2000);
    } else if (p.type === "rotate") {
      setRotateTarget(p.target);
      setRotateConfirmed(false);
    } else if (p.type === "revoke") {
      setRevokeTarget(p.target);
    }
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    setKeys((prev) => prev.map((k) => k.id === revokeTarget.id ? { ...k, status: "inactive" } : k));
    setRevokeTarget(null);
  };

  const handleRotate = () => {
    if (!rotateTarget || !rotateConfirmed) return;
    setKeys((prev) => prev.map((k) =>
      k.id === rotateTarget.id
        ? { ...k, lastRotated: "2026-07-01", status: "active" }
        : k
    ));
    setRotateTarget(null);
    setRotateConfirmed(false);
  };

  const activeKeys = keys.filter((k) => k.status === "active");
  const inactiveKeys = keys.filter((k) => k.status === "inactive");

  const KeyCard = ({ k }: { k: typeof API_KEYS_DATA[0] }) => {
    const isRevealed = revealed[k.id];
    const isCopied = copied === k.id;
    const isExpiringSoon = k.expiresAt !== "Never" && new Date(k.expiresAt) < new Date("2026-10-01");

    return (
      <div className={`bg-[#161b22] border rounded-lg ${k.status === "inactive" ? "border-white/[0.04] opacity-60" : "border-white/[0.06]"}`}>
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound size={14} className={k.status === "active" ? "text-sky-400" : "text-slate-600"} />
            <div>
              <div className="text-[13px] font-semibold text-slate-200">{k.label}</div>
              <div className="text-[11px] text-slate-600 font-mono">{k.provider} · {k.environment}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpiringSoon && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">
                <AlertTriangle size={11} className="text-amber-400" />
                <span className="text-[10px] text-amber-400 font-mono">Expires {k.expiresAt}</span>
              </div>
            )}
            <Badge status={k.status} />
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Masked key row */}
          <div>
            <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1.5">Key Value</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0d1117]/70 border border-white/[0.06] rounded px-3 py-2 font-mono text-[12px] text-slate-300 overflow-hidden">
                {isRevealed ? k.key : mask(k.key)}
              </div>
              <button
                onClick={() => {
                  if (isRevealed) {
                    setRevealed((prev) => ({ ...prev, [k.id]: false }));
                  } else {
                    gate({ type: "reveal", id: k.id });
                  }
                }}
                disabled
                className="p-2 text-slate-500 hover:text-slate-200 transition-colors border border-white/[0.06] rounded bg-[#0d1117]/40"
                title="Key reveal is blocked in this preview"
              >
                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => gate({ type: "copy", id: k.id, key: k.key })}
                disabled
                className="p-2 text-slate-500 hover:text-slate-200 transition-colors border border-white/[0.06] rounded bg-[#0d1117]/40"
                title="Key copy is blocked in this preview"
              >
                {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <Shield size={10} className="text-slate-700" />
              <span className="text-[10px] text-slate-700">Key material stays masked in this preview until the audited secrets workflow is approved.</span>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Last Rotated", value: k.lastRotated },
              { label: "Expires", value: k.expiresAt },
              { label: "Created by", value: k.createdBy },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-0.5">{label}</div>
                <div className="text-[12px] text-slate-400 font-mono">{value}</div>
              </div>
            ))}
          </div>

          {/* Scopes */}
          <div>
            <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1.5">Scopes</div>
            <div className="flex flex-wrap gap-1">
              {k.scopes.map((s) => (
                <span key={s} className="text-[10px] bg-white/[0.03] text-slate-500 border border-white/[0.05] px-1.5 py-0.5 rounded font-mono">{s}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
            {k.status === "active" && (
              <>
                <button
                  onClick={() => gate({ type: "rotate", target: k })}
                  disabled
                  title="Key rotation is blocked in this preview"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors"
                >
                  <RotateCcw size={11} />
                  Rotate
                </button>
                <button
                  onClick={() => gate({ type: "revoke", target: k })}
                  disabled
                  title="Key revocation is blocked in this preview"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/8 text-red-400 border border-red-500/15 rounded text-[11px] font-medium hover:bg-red-500/15 transition-colors"
                >
                  <Trash2 size={11} />
                  Revoke
                </button>
              </>
            )}
            {k.status === "inactive" && (
              <span className="text-[11px] text-slate-600 py-1.5">Key revoked or inactive — contact Super Admin to reissue</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Warning banner */}
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-lg px-4 py-3">
          <Shield size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-300/80">
            API keys stay masked in this preview. Reveal, copy, rotate, and revoke controls remain visible for workflow review, but the audited secrets workflow is still blocked here.
          </p>
        </div>

        {/* Active keys */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Active Keys</span>
            <span className="text-[10px] text-slate-600 font-mono">({activeKeys.length})</span>
          </div>
          {activeKeys.map((k) => <KeyCard key={k.id} k={k} />)}
        </div>

        {/* Inactive keys */}
        {inactiveKeys.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">Inactive / Revoked</span>
              <span className="text-[10px] text-slate-700 font-mono">({inactiveKeys.length})</span>
            </div>
            {inactiveKeys.map((k) => <KeyCard key={k.id} k={k} />)}
          </div>
        )}
      </div>

      {/* Password Gate */}
      <PasswordGate
        open={!!pending}
        onClose={() => setPending(null)}
        onSuccess={handleGateSuccess}
        action={
          pending?.type === "reveal" ? "Reveal API key value" :
          pending?.type === "copy" ? "Copy API key to clipboard" :
          pending?.type === "rotate" ? `Rotate key: ${pending.target.label}` :
          pending?.type === "revoke" ? `Revoke key: ${pending.target.label}` :
          "Sensitive action"
        }
      />

      {/* Rotate Modal */}
      <Modal open={!!rotateTarget} onClose={() => setRotateTarget(null)} title="Rotate API Key">
        {rotateTarget && (
          <div className="space-y-4">
            <div className="bg-[#0d1117]/70 border border-white/[0.06] rounded p-3">
              <div className="text-[14px] font-semibold text-white mb-1">{rotateTarget.label}</div>
              <div className="text-[11px] text-slate-500 font-mono">{rotateTarget.provider} · {rotateTarget.environment}</div>
            </div>

            <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/15 rounded p-3">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] font-bold text-red-400 mb-0.5">This will invalidate the current key</div>
                <div className="text-[12px] text-red-300/70">Any services using the old key will lose access immediately. Update all integrations before rotating.</div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rotateConfirmed}
                onChange={(e) => setRotateConfirmed(e.target.checked)}
                className="size-3.5"
              />
              <span className="text-[12px] text-slate-400">I have confirmed all services have been updated</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleRotate}
                disabled={!rotateConfirmed}
                className="flex-1 py-2 bg-sky-500 text-white rounded text-[13px] font-semibold disabled:opacity-25 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
              >
                Rotate Key
              </button>
              <button
                onClick={() => setRotateTarget(null)}
                className="px-4 py-2 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[13px] hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revoke Modal */}
      <Modal open={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Revoke API Key">
        {revokeTarget && (
          <div className="space-y-4">
            <div className="bg-[#0d1117]/70 border border-white/[0.06] rounded p-3">
              <div className="text-[14px] font-semibold text-white mb-1">{revokeTarget.label}</div>
              <div className="text-[11px] text-slate-500 font-mono">{revokeTarget.provider} · {revokeTarget.environment}</div>
            </div>

            <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/15 rounded p-3">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] font-bold text-red-400 mb-0.5">This action cannot be undone</div>
                <div className="text-[12px] text-red-300/70">Revoking this key will immediately disconnect the {revokeTarget.provider} integration. A new key must be issued to reconnect.</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRevoke}
                className="flex-1 py-2 bg-red-500 text-white rounded text-[13px] font-semibold hover:bg-red-400 transition-colors"
              >
                Revoke Key
              </button>
              <button
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded text-[13px] hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── MCP Connections ──────────────────────────────────────────────────────────────
const CURRENT_USER_ROLE = "Super Admin"; // mock — in real app from auth context

const MCP_PROVIDERS_INIT = [
  {
    id: "claude",
    name: "Claude (Anthropic)",
    model: "claude-sonnet-4-6",
    description: "Anthropic Claude via MCP for read-only data queries, audit summarization, and analytics assistance.",
    status: "connected" as "connected" | "disconnected" | "error",
    environment: "internal",
    endpoint: "https://api.anthropic.com/v1/mcp",
    readAccess: true,
    writeAccess: false,
    lastTested: "2026-07-01 08:45",
    latency: "310ms",
    errors: 0,
  },
  {
    id: "chatgpt",
    name: "ChatGPT (OpenAI)",
    model: "gpt-4o",
    description: "OpenAI GPT-4o via MCP for structured data queries and natural language reporting.",
    status: "connected" as "connected" | "disconnected" | "error",
    environment: "staging",
    endpoint: "https://api.openai.com/v1/mcp",
    readAccess: true,
    writeAccess: false,
    lastTested: "2026-06-30 17:00",
    latency: "480ms",
    errors: 1,
  },
  {
    id: "codex",
    name: "Codex (OpenAI)",
    model: "codex-mini-latest",
    description: "OpenAI Codex via MCP for code generation assistance and SOP automation drafting.",
    status: "disconnected" as "connected" | "disconnected" | "error",
    environment: "internal",
    endpoint: "https://api.openai.com/v1/mcp/codex",
    readAccess: false,
    writeAccess: false,
    lastTested: "2026-06-01 10:00",
    latency: "—",
    errors: 0,
  },
];

const ROLE_PERMISSIONS = [
  { role: "Super Admin", read: true, write: true, note: "Full access — can enable write per connection" },
  { role: "DS Admin", read: true, write: false, note: "Read-only by policy" },
  { role: "Staff", read: true, write: false, note: "Read-only by policy" },
  { role: "Coach", read: true, write: false, note: "Read-only by policy" },
  { role: "Chapter Leader", read: false, write: false, note: "No MCP access" },
  { role: "Student", read: false, write: false, note: "No MCP access" },
];

function McpPage() {
  const [providers, setProviders] = useState(MCP_PROVIDERS_INIT);
  const [pending, setPending] = useState<{ id: string; field: "writeAccess" | "readAccess" | "connect" } | null>(null);
  const isSuperAdmin = CURRENT_USER_ROLE === "Super Admin";

  const handleGateSuccess = () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    if (p.field === "connect") {
      setProviders((prev) =>
        prev.map((pr) => pr.id === p.id ? { ...pr, status: "connected", readAccess: true, lastTested: "2026-07-01 09:15" } : pr)
      );
    } else {
      setProviders((prev) =>
        prev.map((pr) => pr.id === p.id ? { ...pr, [p.field]: !pr[p.field as keyof typeof pr] } : pr)
      );
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">

        {/* Write access policy banner */}
        <div className="flex items-start gap-3 bg-[#161b22] border border-white/[0.06] rounded-lg px-4 py-3">
          <Shield size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[12px] font-semibold text-slate-200 mb-0.5">MCP Access Policy</div>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              All authenticated users with MCP access are granted <span className="text-sky-400 font-medium">read-only</span> by default.
              Write access through any MCP connection is restricted to <span className="text-amber-400 font-medium">Super Admins only</span> and must be explicitly enabled per connection. All MCP actions are logged.
            </p>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="space-y-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Configured Providers</div>

          {providers.map((pr) => {
            const isConnected = pr.status === "connected";
            const statusColor = isConnected ? "border-white/[0.06]" : pr.status === "error" ? "border-red-500/20" : "border-white/[0.04]";

            return (
              <div key={pr.id} className={`bg-[#161b22] border rounded-lg ${statusColor}`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      pr.id === "claude" ? "bg-[#cc785c]/15 border border-[#cc785c]/20" :
                      pr.id === "chatgpt" ? "bg-emerald-500/15 border border-emerald-500/20" :
                      "bg-slate-700/30 border border-white/[0.06]"
                    }`}>
                      <Cpu size={13} className={
                        pr.id === "claude" ? "text-[#cc785c]" :
                        pr.id === "chatgpt" ? "text-emerald-400" :
                        "text-slate-500"
                      } />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-200">{pr.name}</div>
                      <div className="text-[11px] text-slate-600 font-mono">{pr.model} · {pr.environment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pr.errors > 0 && (
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">
                        <AlertTriangle size={10} className="text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-mono">{pr.errors} error</span>
                      </div>
                    )}
                    <Badge
                      status={isConnected ? "active" : pr.status === "error" ? "error" : "inactive"}
                      label={pr.status}
                    />
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  <p className="text-[12px] text-slate-500 leading-relaxed">{pr.description}</p>

                  {/* Endpoint */}
                  <div>
                    <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-1">Endpoint</div>
                    <div className="bg-[#0d1117]/70 border border-white/[0.05] rounded px-3 py-2 font-mono text-[11px] text-slate-400">{pr.endpoint}</div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Last Tested", value: pr.lastTested },
                      { label: "Latency", value: pr.latency },
                      { label: "Errors (7d)", value: String(pr.errors) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-[10px] text-slate-700 font-mono uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-[12px] text-slate-400 font-mono">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Access controls */}
                  <div className="bg-[#0d1117]/50 border border-white/[0.05] rounded-lg p-3 space-y-3">
                    <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Access Controls</div>

                    {/* Read access row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] text-slate-300 font-medium">Read Access</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">All DS/Admin roles · queries and summarization</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-mono">DS Admin + above</span>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pr.readAccess ? "bg-emerald-500" : "bg-slate-700"}`}>
                          <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${pr.readAccess ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                      </div>
                    </div>

                    {/* Write access row — Super Admin gate */}
                    <div className={`flex items-center justify-between pt-2.5 border-t border-white/[0.04] ${!isSuperAdmin ? "opacity-50" : ""}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-[12px] text-slate-300 font-medium">Write Access</div>
                          <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Super Admin only</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">Mutations, record creation, data writes via MCP</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isSuperAdmin ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Shield size={11} />
                            Restricted
                          </div>
                        ) : (
                          <button
                            onClick={() => setPending({ id: pr.id, field: "writeAccess" })}
                            disabled
                            title="MCP write access is blocked in this preview"
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-not-allowed ${pr.writeAccess ? "bg-amber-500" : "bg-slate-700"}`}
                          >
                            <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${pr.writeAccess ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {pr.writeAccess && (
                      <div className="flex items-center gap-2 bg-amber-500/8 border border-amber-500/15 rounded px-3 py-2">
                        <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] text-amber-300/80">Write access is active. MCP can modify records. Monitor audit logs closely.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
                    {isConnected ? (
                      <>
                        <button disabled title="MCP connection tests require audited provider credentials" className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[11px] font-medium hover:bg-sky-500/18 transition-colors">
                          <RefreshCw size={11} />
                          Test Connection
                        </button>
                        <button disabled title="MCP logs are available only from the audited integration log surface" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] text-slate-400 border border-white/[0.08] rounded text-[11px] hover:bg-white/[0.07] transition-colors">
                          <FileText size={11} />
                          View Logs
                        </button>
                        <button disabled title="MCP disconnect is blocked until DS approval is complete" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/8 text-red-400 border border-red-500/15 rounded text-[11px] font-medium hover:bg-red-500/15 transition-colors ml-auto">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setPending({ id: pr.id, field: "connect" })}
                        disabled
                        title="MCP provider connections stay visible for policy review, but connection changes are blocked in this preview"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-medium hover:bg-emerald-500/18 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role permission matrix */}
        <div className="bg-[#161b22] border border-white/[0.06] rounded-lg">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Role Permission Matrix</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Who can access MCP connections and at what level</div>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Role", "Read Access", "Write Access", "Policy"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] text-slate-600 font-mono uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {ROLE_PERMISSIONS.map((row) => (
                <tr key={row.role} className={`${row.role === CURRENT_USER_ROLE ? "bg-sky-500/5" : ""} hover:bg-white/[0.01] transition-colors`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-slate-300 font-medium">{row.role}</span>
                      {row.role === CURRENT_USER_ROLE && (
                        <span className="text-[9px] bg-sky-500/15 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-mono">you</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {row.read ? (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span className="text-[12px]">Allowed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <X size={13} />
                        <span className="text-[12px]">No access</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {row.write ? (
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <CheckCircle2 size={13} />
                        <span className="text-[12px]">Enabled per connection</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <X size={13} />
                        <span className="text-[12px]">Read only</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Password gate for write toggle and connect */}
      <PasswordGate
        open={!!pending}
        onClose={() => setPending(null)}
        onSuccess={handleGateSuccess}
        action={
          pending?.field === "writeAccess"
            ? `Toggle write access — ${providers.find((p) => p.id === pending.id)?.name}`
            : pending?.field === "connect"
            ? `Connect MCP provider — ${providers.find((p) => p.id === pending.id)?.name}`
            : "Sensitive MCP action"
        }
      />
    </>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────────
const PAGES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Launch Mode Active" },
  users: { title: "Users", subtitle: "Manage access, roles, and module visibility" },
  chapters: { title: "Chapters", subtitle: "Chapter-level module status and event data" },
  modules: { title: "Modules & Feature Flags", subtitle: "Enable or disable major product modules" },
  luma: { title: "Luma Events", subtitle: "Provider status, sync, and error monitoring" },
  points: { title: "Points", subtitle: "Point rules, ledger status, and award history" },
  integrations: { title: "Integrations", subtitle: "External system connection status" },
  audit: { title: "Audit Logs", subtitle: "All admin and system changes" },
  health: { title: "System Health", subtitle: "Service uptime and error monitoring" },
  apikeys: { title: "API Keys", subtitle: "Manage, rotate, and revoke integration credentials" },
  mcp: { title: "MCP Connections", subtitle: "Claude, ChatGPT, and Codex model context protocol access" },
  settings: { title: "Settings", subtitle: "Admin configuration and access controls" },
};

export function FigmaAdminPanel({
  initialActive = "overview",
  onBack,
}: {
  initialActive?: string;
  onBack?: () => void;
}) {
  const [active, setActive] = useState(initialActive);
  const page = PAGES[active] ?? PAGES.overview;

  const renderPage = () => {
    switch (active) {
      case "overview": return <OverviewPage />;
      case "users": return <UsersPage />;
      case "chapters": return <ChaptersPage />;
      case "modules": return <ModulesPage />;
      case "luma": return <LumaPage />;
      case "points": return <PointsPage />;
      case "integrations": return <IntegrationsPage />;
      case "audit": return <AuditLogsPage />;
      case "health": return <SystemHealthPage />;
      case "apikeys": return <ApiKeysPage />;
      case "mcp": return <McpPage />;
      case "settings": return <SettingsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d1117] overflow-hidden" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <Sidebar active={active} onNav={setActive} onBack={onBack} />
      <div className="ml-[220px] flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header title={page.title} subtitle={page.subtitle} />
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-[#0d1117]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
