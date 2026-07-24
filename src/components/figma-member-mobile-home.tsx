"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import Link from "next/link";
import React, { useState } from "react";
import { ChromeDesktopPaintShell } from "@/components/chrome-desktop-paint-shell";
import { MemberBottomNav, type MemberBottomNavTab } from "@/components/member-bottom-nav";
import {
  getMemberStoryReactionCountLabel, getMemberStoryReactionSurfaceCopy,
  MemberStoryReactionForm,
  MemberStoryReactionResultBanner,
} from "@/components/member-story-reaction-controls";
import { getMemberStoryMediaSurfaceCopy } from "@/components/member-story-media-state";
import { MemberStoryVideo } from "@/components/member-story-video";
import { getVisibleMemberLeaderboardRows } from "@/services/member-mobile-identity-context";
import type {
  MemberMobileCampaignContext,
  MemberMobileEventContext,
  MemberMobileEventType,
} from "@/services/member-mobile-event-context";
import type { LaunchLaneMemberPointsReadback } from "@/services/launch-lane-points-readback";
import {
  getMemberBadgeRows,
  getMemberCampaignPointRows,
  getMemberRecentApprovedActionRows,
} from "@/services/member-points-screen";
import type { MemberStory } from "@/services/member-stories-read-model";
import type { MemberStoryReactionReadbackStatus } from "@/services/member-story-reactions";
import {
  Home, BarChart2, CalendarDays, Trophy, User, Users,
  ChevronRight, ChevronLeft, CheckCircle2, Clock, Circle,
  AlertTriangle, Upload, Link2, FileText, Camera,
  Star, Shield, Bell, ThumbsUp,
  MessageSquare, TrendingUp, Check, X,
  ArrowRight, Plus, Flag, Activity, MapPin,
  Target, Zap, Eye,
  Share2, QrCode, Download, UserCheck, Copy,
  Heart, ExternalLink, Play, Bookmark, Sparkles, ArrowLeft, Backpack
} from "lucide-react";

type Screen =
  | "home" | "campaign" | "action" | "evidence" | "confirm"
  | "points" | "events" | "event-detail" | "rsvp-confirm" | "checkin"
  | "stories" | "leader" | "assign" | "review"
  | "coach" | "admin";

export type MemberMobileLaunchScreen = Extract<
  Screen,
  "home" | "events" | "points" | "stories" | "admin"
>;

type MemberSltPrepEntry = {
  href: string;
  tripLabel: string;
  cityLabel: string;
  countdownLabel: string;
  readinessLabel: string;
  nextStepLabel: string;
};

export type MemberMobileIdentityContext = {
  displayName: string;
  firstName: string;
  chapterName: string;
  campusName: string;
  pointsTotal: number;
  pointsWeeklyLabel: string;
  pointsRankLabel: string;
  completedActions: number;
  pointsLedgerPosture?: "mock_read_only" | "app_owned_readback";
  campaignPointRows?: Array<{
    campaign: string;
    points: number;
    available: number | null;
  }>;
  recentPointActions?: Array<{
    action: string;
    detail: string;
    pointsLabel: string;
  }>;
  leaderboardRows: Array<{
    rank: number;
    name: string;
    role?: string;
    pts: number;
    me?: boolean;
  }>;
};

const DEFAULT_MEMBER_IDENTITY_CONTEXT: MemberMobileIdentityContext = {
  displayName: "TEST Sofia Alvarez",
  firstName: "TEST Sofia",
  chapterName: "TEST UCLA MEDLIFE",
  campusName: "TEST UCLA",
  pointsTotal: 145,
  pointsWeeklyLabel: "+75",
  pointsRankLabel: "#3",
  completedActions: 3,
  pointsLedgerPosture: "mock_read_only",
  leaderboardRows: [
    { rank: 1, name: "TEST Aisha N.", role: "President", pts: 220 },
    { rank: 2, name: "TEST Marcus T.", role: "VP Outreach", pts: 185 },
    { rank: 3, name: "TEST Sofia Alvarez", role: "General Member", pts: 145, me: true },
    { rank: 4, name: "TEST James L.", role: "General Member", pts: 130 },
    { rank: 5, name: "TEST Priya K.", role: "Committee Chair", pts: 110 },
  ],
};

type UserDesignation =
  | "General Member"
  | "E-Board"
  | "Staff"
  | "DS"
  | "Sales"
  | "Super Admin";

const MEMBER_EVENT_DETAIL_HREFS: Record<number, string> = {
  1: "/app/events/chapter-event-ucla-kickoff?source=events",
  2: "/app/events/chapter-event-lakeside-welcome?source=events",
  3: "/app/events/chapter-event-boston-info-night?source=events",
  4: "/app/events/chapter-event-ucsd-service-social?source=events",
  5: "/app/events/chapter-event-mcgill-coffee-chat?source=events",
};

function getMemberEventDetailHref(
  eventId: number | string,
  source: MemberLoopSource = "events",
  campaign: string | null = null,
  profileSource: "points" | null = null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  const detailHref = typeof eventId === "string"
    ? `/app/events/${encodeURIComponent(eventId)}`
    : MEMBER_EVENT_DETAIL_HREFS[eventId] ?? "/app/events";
  const url = new URL(`https://mymedlife.local${detailHref}`);

  if (source !== "events") {
    url.searchParams.set("source", source);
  }

  if (source === "profile" && profileSource === "points") {
    url.searchParams.set("profileSource", "points");
  }

  if (source === "stories" && storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (source === "stories" && storyId) {
    url.searchParams.set("story", storyId);
  }

  if (campaign && campaign !== "All") {
    url.searchParams.set("campaign", campaign);
  }

  return `${url.pathname}${url.search}`;
}

function getMemberEventRsvpHref(
  eventId: number | string,
  source: MemberLoopSource = "events",
  campaign: string | null = null,
  profileSource: "points" | null = null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  const detailHref = getMemberEventDetailHref(eventId, source, campaign, profileSource, storyFilter, storyId);
  return detailHref.includes("?") ? `${detailHref}&step=rsvp` : `${detailHref}?step=rsvp`;
}

function getMemberEventHomeRsvpHref(eventId: number | string) {
  return getMemberEventRsvpHref(eventId, "home");
}

function getMemberEventHomeDetailHref(eventId: number | string) {
  return getMemberEventDetailHref(eventId, "home");
}

function isMemberEventDetailHref(href: string) {
  return href.startsWith("/app/events/");
}

type MemberLoopSource = "events" | "home" | "profile" | "points" | "stories";

// ─── Primitives ────────────────────────────────────────────────────────────

function cn(...c: (string | undefined | false | null)[]) {
  return c.filter(Boolean).join(" ");
}

function Pill({
  label,
  variant = "gray",
}: {
  label: string;
  variant?: "gray" | "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const v = {
    gray: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-700",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${v}`}>
      {label}
    </span>
  );
}

function PointsPill({ pts }: { pts: number }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
      <Star size={10} className="fill-amber-400 text-amber-400" />
      {pts} pts
    </span>
  );
}

// ─── QR Code mock SVG ────────────────────────────────────────────────────────
function QRCodeSVG({ size = 160 }: { size?: number }) {
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,1,0,1,1,0,1,1,0,0,1,0,1,1,1,0,1,0,1,1,0],
    [0,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,1,0,0,1,1],
    [1,0,1,1,0,0,1,0,0,1,1,0,1,1,1,0,0,1,1,0,0],
    [0,1,0,0,1,0,0,1,1,0,0,1,0,0,0,1,0,1,0,1,0],
    [1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,0,0,1,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,1,1,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,1,0,0,1,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,0,0,0,1,0,0,1],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,1,1,0],
  ];
  const cell = size / 21;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map((v, c) =>
          v ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1B4B8E" /> : null
        )
      )}
    </svg>
  );
}

function Bar({ pct, color = "bg-primary" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}
function Card({ children, className = "", onClick, padding = true }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-border",
        padding && "p-4",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform"
      , className)}
    >
      {children}
    </div>
  );
}

function PrimaryBtn({
  label,
  onClick,
  icon,
  full,
  yellow,
}: {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  full?: boolean;
  yellow?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-sm",
        yellow ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:opacity-90",
        full && "w-full", !onClick && "opacity-70 cursor-not-allowed"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SecondaryBtn({
  label,
  onClick,
  full,
}: {
  label: string;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={cn(
        "flex items-center justify-center gap-2 border border-primary text-primary px-5 py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all hover:bg-primary/5",
        full && "w-full", !onClick && "opacity-70 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </p>
  );
}

function AlertBanner({
  message,
  type = "warning",
}: {
  message: string;
  type?: "warning" | "danger" | "info";
}) {
  const cfg = {
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />,
      text: "text-amber-800",
    },
    danger: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />,
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Flag size={14} className="text-blue-600 flex-shrink-0" />,
      text: "text-blue-800",
    },
  }[type];
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium", cfg.bg, cfg.text)}>
      {cfg.icon}
      <span>{message}</span>
    </div>
  );
}

function TopBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button type="button" onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-muted text-foreground">
            <ChevronLeft size={22} />
          </button>
        )}
        {title && <h2 className="font-bold text-base text-foreground truncate">{title}</h2>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

// ─── SCREEN 1 · Student Home ─────────────────────────────────────────────────

function StudentHome({
  navigate,
  sltPrepEntry,
  memberContext,
  memberEvents,
  memberCampaign,
}: {
  navigate: (s: Screen) => void;
  sltPrepEntry?: MemberSltPrepEntry | null;
  memberContext: MemberMobileIdentityContext;
  memberEvents?: MemberMobileEventContext[];
  memberCampaign?: MemberMobileCampaignContext | null;
}) {
  const allDesignations: UserDesignation[] = ["General Member", "E-Board", "Staff", "DS", "Sales", "Super Admin"];
  const selfLeaderboardRows = getVisibleMemberLeaderboardRows(memberContext, 4);
  const homeEvents = memberEvents ?? [
    { id: "1", routeId: "chapter-event-ucla-kickoff", title: "TEST Intro GBM", date: "Thu Nov 15 · 6:00 PM", loc: "Ackerman 2100", pts: 20, status: "RSVP Open" as const, campaign: "Rush Month", eventType: "GBM" as const, featured: true, luma: true, rsvps: 23 },
    { id: "2", routeId: "chapter-event-lakeside-welcome", title: "TEST Tabling at Bruin Walk", date: "Tue Nov 13 · 11:00 AM", loc: "Bruin Walk Table 7", pts: 15, status: "RSVP Open" as const, campaign: "Rush Month", eventType: "Local Volunteering" as const, featured: false, luma: false, rsvps: null },
  ];
  const upcomingHomeEvents = homeEvents.filter((event) => event.status !== "Completed");
  const priorityEvent = upcomingHomeEvents[0] ?? null;
  const campaignEvents = memberCampaign
    ? homeEvents.filter((event) => event.campaign === memberCampaign.name)
    : [];
  const openCampaignEvents = campaignEvents.filter((event) => event.status !== "Completed");

  return (
    <div className="pb-24 font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Blue header */}
      <div className="bg-primary px-5 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{memberContext.chapterName}</p>
            <h1 className="text-white text-2xl font-extrabold mt-1">Hi, {memberContext.firstName} 👋</h1>
            <p className="text-blue-200 text-sm mt-1">You are making a difference.</p>
          </div>
          <button type="button" disabled title="Notifications are blocked in this preview" className="relative p-2.5 rounded-xl bg-white/10 mt-1">
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>

        {/* Priority banner */}
        <div className="mt-5 bg-white/10 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-yellow-300" />
            <p className="text-yellow-200 text-xs font-bold uppercase tracking-wide">This Week's Priority</p>
          </div>
          <p className="text-white font-bold text-[15px] leading-snug">
            {priorityEvent ? `Show up for ${priorityEvent.title}` : "No upcoming chapter event is scheduled"}
          </p>
          <p className="text-blue-200 text-xs mt-1">
            {priorityEvent ? `${priorityEvent.campaign} · ${priorityEvent.date}` : "Check back after a chapter leader publishes an event."}
          </p>
          <Link
            href={priorityEvent ? getMemberEventHomeDetailHref(priorityEvent.routeId) : "/app/events?source=home"}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-all active:scale-[0.97]"
          >
            Start next action <ArrowRight size={14} />
          </Link>
        </div>

        {/* Points card — sits directly below priority in the blue zone */}
        <Link
          href="/app/points?source=home"
          className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 transition-transform hover:bg-white/15 active:scale-[0.98]"
        >
          <div>
            <p className="text-blue-200 text-xs font-semibold">
              {memberCampaign ? `My Points · ${memberCampaign.name}` : "My Points"}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-white text-3xl font-extrabold">{memberContext.pointsTotal}</span>
              <span className="text-blue-200 text-sm font-medium">pts earned</span>
            </div>
            <p className="text-blue-200 text-xs mt-0.5">{memberContext.pointsWeeklyLabel} this week · Chapter rank {memberContext.pointsRankLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Trophy size={32} className="text-accent" />
            <span className="text-blue-100 text-[11px] font-semibold">Leaderboard →</span>
          </div>
        </Link>

        {/* Stories promo — green, right under points */}
        <Link
          href="/app/stories"
          className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-[#2D5016]/80 to-[#3D7A5A]/80 px-4 py-3.5 transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-xs font-bold uppercase tracking-wide">From the Field</p>
              <p className="text-white text-base font-extrabold mt-0.5">MEDLIFE Stories</p>
              <p className="text-green-100 text-xs mt-0.5 leading-snug max-w-[200px]">
                Field notes, student voices, and moments from the mission.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Heart size={26} className="text-white/70 fill-white/20" />
              <p className="text-green-100 text-[11px] font-semibold">{stories.length} stories →</p>
            </div>
          </div>
        </Link>

        {sltPrepEntry ? (
          <Link
            href={sltPrepEntry.href}
            className="mt-3 block rounded-2xl border border-white/15 bg-white/10 px-4 py-4 transition-transform hover:bg-white/15 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-amber-200 text-xs font-bold uppercase tracking-wide">SLT Prep</p>
                <p className="mt-0.5 text-white text-base font-extrabold">{sltPrepEntry.tripLabel}</p>
                <p className="mt-1 text-blue-100 text-xs leading-snug">{sltPrepEntry.cityLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                    {sltPrepEntry.countdownLabel}
                  </span>
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold text-amber-100">
                    {sltPrepEntry.readinessLabel}
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-white/72">
                  {sltPrepEntry.nextStepLabel} →
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
                <Backpack size={18} />
              </div>
            </div>
          </Link>
        ) : null}
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Upcoming Events — first block */}
        <div>
          <SLabel>Upcoming Events</SLabel>
          <div className="space-y-2">
            {upcomingHomeEvents.slice(0, 2).map((e) => (
              <Card key={e.id} padding={false}>
                <div className="flex items-center gap-3 p-4">
                  <Link href={getMemberEventHomeDetailHref(e.routeId)} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin size={9} className="flex-shrink-0" />{e.loc}
                      </p>
                    </div>
                  </Link>
                  {e.status === "RSVP Open" ? (
                    <Link
                      href={getMemberEventHomeRsvpHref(e.routeId)}
                      onClick={(event) => event.stopPropagation()}
                      className="flex-shrink-0 rounded-xl border border-primary/50 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                    >
                      RSVP
                    </Link>
                  ) : (
                    <Link href={getMemberEventHomeDetailHref(e.routeId)}><Pill label={e.status} variant="gray" /></Link>
                  )}
                </div>
              </Card>
            ))}
            {upcomingHomeEvents.length === 0 ? (
              <Card><p className="text-sm text-muted-foreground">No upcoming events are published for this chapter.</p></Card>
            ) : null}
          </div>
        </div>

        {/* Active campaign */}
        <div>
          <SLabel>Active Campaign</SLabel>
          <button type="button" onClick={() => navigate("campaign")} className="block w-full text-left">
            <Card padding={false}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill label={memberCampaign ? "Production readback" : "TEST preview"} variant="green" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">{memberCampaign?.name ?? "TEST Rush Month preview"}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {memberCampaign?.objective ?? "Recruit new members, build your chapter."}
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground ml-3 mt-1 flex-shrink-0" />
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-secondary/30 rounded-b-2xl">
              <span className="text-xs text-muted-foreground">{campaignEvents.length} chapter events</span>
              <span className="text-xs font-semibold text-primary">{openCampaignEvents.length} open</span>
            </div>
            </Card>
          </button>
        </div>

        {/* Take Action: My Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Take Action: My Tasks</SLabel>
            <button type="button" onClick={() => navigate("campaign")} className="text-primary text-xs font-semibold">Campaign details</button>
          </div>
          <Card>
            <p className="text-sm font-bold text-foreground">Production assignment readback is not connected.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No fixture task, due date, status, or point value is substituted on the signed-in member home.
            </p>
            <button
              type="button"
              onClick={() => navigate("action")}
              className="mt-3 text-xs font-semibold text-primary"
            >
              Open TEST action preview
            </button>
          </Card>
        </div>

        {/* Leaderboard preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Chapter Leaderboard</SLabel>
            <Link href="/app/points?source=home" className="text-primary text-xs font-semibold">Full board</Link>
          </div>
          <Card>
            {selfLeaderboardRows.map((m) => (
              <div key={m.rank} className={cn("flex items-center gap-3 py-3 border-b border-border last:border-0", m.me && "bg-primary/5 -mx-4 px-4 rounded-xl")}>
                <span className="w-6 text-center text-sm">{m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : m.rank}</span>
                <span className={cn("flex-1 text-sm", m.me ? "font-extrabold text-primary" : "font-medium")}>
                  {m.me ? `You (${m.name})` : m.name}
                </span>
                <span className="text-sm font-bold text-foreground font-[DM_Mono,monospace]">{m.pts} pts</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Coach updates */}
        <Card className="bg-secondary/60 border-secondary">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold">HQ</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Coach updates</p>
              <p className="mt-1 text-sm text-foreground leading-relaxed">
                Production coach-message readback is not connected. No fixture coach, date, or message is substituted.
              </p>
              <Link href="/profile?source=home" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Open profile and chapter scope <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </Card>

        {/* Permission-gated views */}
        <div className="space-y-3">
          <div>
            <SLabel>Assigned Permissions</SLabel>
            <div className="flex gap-1.5 flex-wrap">
              {allDesignations.map((r) => (
                <span
                  key={r}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    r === "General Member"
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-card text-muted-foreground border-border opacity-60"
                  )}
                >
                  {r}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Preview only. Roles are assigned by authorized administrators and cannot be changed from the member app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 · Campaign — Rush Month ────────────────────────────────────────

function CampaignPage({
  navigate,
  memberContext,
  memberEvents = [],
  memberCampaign,
}: Readonly<{
  navigate: (s: Screen) => void;
  memberContext: MemberMobileIdentityContext;
  memberEvents?: MemberMobileEventContext[];
  memberCampaign?: MemberMobileCampaignContext | null;
}>) {
  const [whyOpen, setWhyOpen] = useState(false);
  const hasDurableCampaign = Boolean(memberCampaign);
  const campaignName = memberCampaign?.name ?? "TEST Rush Month preview";
  const campaignObjective = memberCampaign?.objective ?? "Recruit new members and help them feel welcomed into MEDLIFE.";
  const campaignEvents = memberEvents.filter((event) => event.campaign === memberCampaign?.name);
  const openEventCount = campaignEvents.filter((event) => event.status !== "Completed").length;

  return (
    <div className="pb-24">
      <TopBar title="" onBack={() => navigate("home")} />

      <div className="bg-primary px-5 pt-5 pb-7">
        <Pill label={hasDurableCampaign ? "Production readback" : "TEST preview"} variant="blue" />
        <h1 className="text-white text-2xl font-extrabold mt-2">{campaignName}</h1>
        <p className="text-blue-200 text-sm mt-1.5 leading-relaxed">
          {campaignObjective}
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-blue-100">
          {memberContext.chapterName}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">
        <Card className="border-primary/30 bg-secondary/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Flag size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Campaign scope</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{memberContext.chapterName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Campaign phase, dates, and progress totals are not available in the durable member readback yet.
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden" padding={false}>
          <button type="button"
            onClick={() => setWhyOpen(!whyOpen)}
            className="flex items-center justify-between w-full p-4"
          >
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="text-sm font-bold text-foreground">Why this campaign matters</span>
            </div>
            <ChevronRight
              size={16}
              className={cn("text-muted-foreground transition-transform", whyOpen && "rotate-90")}
            />
          </button>
          {whyOpen && (
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
              {campaignObjective}
            </div>
          )}
        </Card>

        <div>
          <SLabel>Campaign Readback</SLabel>
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Chapter events</p>
                <p className="mt-1 text-xl font-extrabold text-foreground">{campaignEvents.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open events</p>
                <p className="mt-1 text-xl font-extrabold text-foreground">{openEventCount}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
              Lead, follow-up, membership, and assignment KPIs are hidden until actor-scoped durable readback is connected.
            </p>
          </Card>
        </div>

        <div>
          <SLabel>Chapter Events</SLabel>
          <div className="space-y-2">
            {campaignEvents.map((event) => (
              <Link key={event.routeId} href={getMemberEventDetailHref(event.routeId, "events", campaignName)}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{event.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.date}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{event.loc}</p>
                    </div>
                    <Pill label={event.status} variant={event.status === "RSVP Open" ? "green" : "gray"} />
                  </div>
                </Card>
              </Link>
            ))}
            {campaignEvents.length === 0 ? (
              <Card>
                <p className="text-sm font-bold text-foreground">No actor-scoped events are linked to this campaign.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">No fixture event or RSVP count is substituted.</p>
              </Card>
            ) : null}
          </div>
        </div>

        <div>
          <SLabel>Member Actions</SLabel>
          <Card>
            <p className="text-sm font-bold text-foreground">Production assignment readback is not connected.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The TEST action and evidence screens remain available for design review, but they do not represent assigned work or saved evidence.
            </p>
          </Card>
        </div>

        <div className="space-y-2.5 pt-2">
          <Link
            href={`/app/events?campaign=${encodeURIComponent(campaignName)}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-extrabold text-white"
          >
            View campaign events <ArrowRight size={16} />
          </Link>
          <SecondaryBtn label="Open TEST action preview" onClick={() => navigate("action")} full />
          <SecondaryBtn label="Open TEST evidence preview" onClick={() => navigate("evidence")} full />
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 3 · Action Detail ─────────────────────────────────────────────────

function ActionDetail({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="pb-48">
      <TopBar title="Action Detail" onBack={() => navigate("campaign")} />

      <div className="px-4 pt-5 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill label="Rush Month" variant="blue" />
            <Pill label="Not started" variant="gray" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground leading-snug">
            Invite 3 TEST friends to the TEST Intro GBM
          </h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              Due Nov 15
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              Assigned by TEST Marcus T.
            </span>
          </div>
        </div>

        {/* Points */}
        <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-2xl border border-accent/30">
          <Trophy size={20} className="text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">30 points if approved</p>
            <p className="text-xs text-muted-foreground">Applies to: Rush Month · Lead Capture KPI</p>
          </div>
        </div>

        {/* Why this matters */}
        <Card className="bg-secondary/60 border-secondary">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Why This Matters</p>
          <p className="text-sm text-foreground leading-relaxed">
            Personal invites convert at 3x higher than flyers. You reaching out to 3 friends directly
            can change whether they join a movement that improves healthcare access globally.
          </p>
        </Card>

        {/* Steps */}
        <div>
          <SLabel>Step-by-Step Instructions</SLabel>
          <div className="space-y-3">
            {[
              { n: 1, text: "Think of 3 friends who care about global health, medicine, or community service." },
              { n: 2, text: "Send them a personal message — DM, text, or in person. Share the Luma link." },
              { n: 3, text: "Screenshot or note their RSVP confirmation to submit as evidence." },
            ].map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5">
                  {s.n}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence required */}
        <div>
          <SLabel>Evidence Required</SLabel>
          <Card>
            <div className="space-y-3">
              {[
                { icon: <Camera size={15} className="text-primary" />, label: "Screenshot", desc: "Screenshot of RSVP confirmation or messages sent" },
                { icon: <FileText size={15} className="text-primary" />, label: "Short update", desc: "Who did you invite? Did they RSVP?" },
              ].map((e) => (
                <div key={e.label} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {e.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Help text */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-xl">
          <MessageSquare size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Not sure what to do?{" "}
            <span className="text-primary font-semibold underline cursor-pointer">Ask your chapter leader</span>
          </p>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card px-4 py-4" style={{ bottom: "calc(61px + env(safe-area-inset-bottom))" }}>
        <PrimaryBtn label="Submit evidence" onClick={() => navigate("evidence")} full icon={<Upload size={16} />} />
      </div>
    </div>
  );
}

// ─── SCREEN 4 · Evidence Submission ──────────────────────────────────────────

function EvidenceSubmission({ navigate }: { navigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<"screenshot" | "link" | "text">("screenshot");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="pb-48">
      <TopBar title="Submit Evidence" onBack={() => navigate("action")} />

      <div className="px-4 pt-5 space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Preview only</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Evidence submission is blocked until the durable review workflow is approved. Inputs on this screen are not saved.
          </p>
        </div>

        {/* Assignment summary */}
        <Card className="bg-secondary/50 border-secondary">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Submitting for</p>
          <p className="text-sm font-bold text-foreground">Invite 3 TEST friends to the TEST Intro GBM</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Rush Month</span>
            <span>·</span>
            <span>30 pts if approved</span>
            <span>·</span>
            <span>Due Nov 15</span>
          </div>
        </Card>

        {/* Evidence type tabs */}
        <div>
          <SLabel>Evidence Type</SLabel>
          <div className="flex gap-2 mb-4">
            {(["screenshot", "link", "text"] as const).map((t) => (
              <button type="button"
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                  tab === t
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {t === "screenshot" ? "Screenshot" : t === "link" ? "Link" : "Text"}
              </button>
            ))}
          </div>

          {tab === "screenshot" && (
            <button type="button" disabled title="File uploads are blocked in this preview until storage approval is complete" className="w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 py-10 hover:border-primary/40 hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Camera size={22} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Tap to upload screenshot</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG up to 10MB</p>
              </div>
              <span className="text-xs font-semibold text-primary border border-primary/40 px-3 py-1.5 rounded-xl">
                Choose file
              </span>
            </button>
          )}

          {tab === "link" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Paste a link (Luma RSVP, Google Form, etc.)
              </label>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-3">
                <Link2 size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="url"
                  placeholder="https://"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
            </div>
          )}

          {tab === "text" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Describe what you did
              </label>
              <textarea
                rows={5}
                placeholder="I invited TEST Sofia, TEST Marcus, and TEST Priya. Two of them RSVPd on Luma and one said they would come..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{text.length} / 500</p>
            </div>
          )}
        </div>

        {/* Consent */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Privacy Reminder</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Only upload photos or screenshots you have permission to share. Do not include personal
            information of others without their consent.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreed(!agreed)}
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                agreed ? "bg-primary border-primary" : "border-amber-400 bg-white"
              )}
            >
              {agreed && <Check size={12} className="text-white" />}
            </div>
            <p className="text-sm text-amber-800 font-medium leading-snug">
              This evidence is accurate and appropriate to share with chapter leaders and coaches.
            </p>
          </label>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card px-4 py-4" style={{ bottom: "calc(61px + env(safe-area-inset-bottom))" }}>
        <PrimaryBtn
          label="Preview only - submission blocked"
          full
          icon={<ArrowRight size={16} />}
        />
        <p className="text-xs text-center text-muted-foreground mt-2">
          No evidence, notification, review task, or points change will be created.
        </p>
      </div>
    </div>
  );
}

// ─── SCREEN 4b · Confirmation ─────────────────────────────────────────────────

function Confirmation({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground">Evidence Submitted!</h1>
      <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-xs">
        TEST Marcus T. will review your submission within 24–48 hours. You will earn 30 points once approved.
      </p>

      <div className="w-full mt-8 space-y-3">
        <Card className="bg-secondary/60 border-secondary text-left">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">What happens next</p>
          <div className="space-y-2.5 mt-2">
            {[
              "Leader reviews your evidence",
              "You get notified of approval",
              "30 points added to your total",
              "KPI: Lead Capture updated",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card onClick={() => navigate("action")} className="bg-accent/10 border-accent/30 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-accent-foreground uppercase tracking-wide">Your next action</p>
              <p className="text-sm font-bold text-foreground mt-0.5">Share Rush Week flyer on Instagram</p>
              <p className="text-xs text-muted-foreground mt-0.5">Due Nov 14 · 20 pts</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </Card>
      </div>

      <div className="w-full mt-6 space-y-2">
        <PrimaryBtn label="Back to Home" onClick={() => navigate("home")} full />
        <SecondaryBtn label="View all my actions" onClick={() => navigate("campaign")} full />
      </div>
    </div>
  );
}

// ─── SCREEN 5 · Leadership Dashboard ─────────────────────────────────────────

function LeadershipDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  const stats = [
    { label: "Members Active", value: "22", sub: "of 34 total", ok: true },
    { label: "Tasks Assigned", value: "87", sub: "this week", ok: true },
    { label: "Tasks Overdue", value: "11", sub: "need attention", ok: false },
    { label: "Evidence Pending", value: "7", sub: "awaiting review", ok: false },
  ];

  const members = [
    { name: "Sofia R.", role: "General Member", done: 1, total: 3, status: "Active" as const },
    { name: "Marcus T.", role: "VP Outreach", done: 4, total: 5, status: "Active" as const },
    { name: "Priya K.", role: "Committee Chair", done: 1, total: 4, status: "At risk" as const },
    { name: "James L.", role: "General Member", done: 0, total: 2, status: "At risk" as const },
    { name: "Aisha N.", role: "President", done: 6, total: 6, status: "Active" as const },
  ];

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8">
        <button type="button" onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
          <ChevronLeft size={16} />
          Student view
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">UCLA MEDLIFE</p>
            <h1 className="text-white text-2xl font-extrabold mt-1">Leader Hub</h1>
          </div>
          <button type="button" disabled title="Notifications are blocked in this preview" className="relative p-2.5 bg-white/10 rounded-xl">
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              <p className={cn("text-2xl font-extrabold mt-1", s.ok ? "text-foreground" : "text-red-600")}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Campaign progress */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-foreground">Rush Month Progress</p>
            <Pill label="Week 1 of 4" variant="blue" />
          </div>
          <div className="space-y-3">
            {[
              { label: "Leads Captured", pct: 59, val: "47/80" },
              { label: "Intro GBM RSVPs", pct: 46, val: "23/50" },
              { label: "Follow-ups Done", pct: 38, val: "18/47" },
              { label: "New Members", pct: 36, val: "9/25" },
            ].map((k) => (
              <div key={k.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{k.label}</span>
                  <span className="font-bold text-foreground font-[DM_Mono,monospace]">{k.val}</span>
                </div>
                <Bar pct={k.pct} color={k.pct >= 60 ? "bg-emerald-500" : k.pct >= 40 ? "bg-primary" : "bg-amber-400"} />
              </div>
            ))}
          </div>
        </Card>

        {/* Risk alerts */}
        <div>
          <SLabel>Risk Alerts</SLabel>
          <div className="space-y-2">
            <AlertBanner message="Low follow-up completion — only 38% done" type="warning" />
            <AlertBanner message="No Luma event linked to Rush Month yet" type="danger" />
            <AlertBanner message="Only 3 members active this week (Priya, James, Kevin)" type="warning" />
          </div>
        </div>

        {/* Member status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Member Status</SLabel>
            <button type="button" disabled title="Full member list is available in the leader workspace" className="text-primary text-xs font-semibold">All members</button>
          </div>
          <Card padding={false}>
            {members.map((m, i) => (
              <div
                key={m.name}
                className={cn("flex items-center gap-3 px-4 py-3.5", i < members.length - 1 && "border-b border-border")}
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <Pill
                      label={m.status}
                      variant={m.status === "Active" ? "green" : "yellow"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-foreground font-[DM_Mono,monospace]">
                    {m.done}/{m.total}
                  </p>
                  <p className="text-[10px] text-muted-foreground">actions</p>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Evidence queue preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Evidence Queue</SLabel>
            <button type="button" onClick={() => navigate("review")} className="text-primary text-xs font-semibold">
              Review all 7 →
            </button>
          </div>
          <div className="space-y-2">
            {[
              { student: "Sofia R.", action: "Invite 3 friends to Intro GBM", time: "3h ago", pts: 30 },
              { student: "James L.", action: "Share Rush flyer on Instagram", time: "5h ago", pts: 20 },
            ].map((e) => (
              <Card key={e.student} onClick={() => navigate("review")} padding={false}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                    {e.student[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{e.student}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.action}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Pill label="Pending" variant="yellow" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.time}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-2 pb-4">
          <PrimaryBtn label="Assign action" onClick={() => navigate("assign")} icon={<Plus size={15} />} />
          <SecondaryBtn label="Review evidence" onClick={() => navigate("review")} />
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 6 · Assign Action ─────────────────────────────────────────────────

function AssignAction({ navigate }: { navigate: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState("Rush Month");
  const [template, setTemplate] = useState("");
  const [assignTo, setAssignTo] = useState("General Members");
  const [dueDate, setDueDate] = useState("2024-11-15");
  const [points, setPoints] = useState("20");

  const templates = [
    "Invite 3 friends to chapter event",
    "Share chapter flyer on social media",
    "Add leads to the chapter spreadsheet",
    "Attend tabling shift",
    "Send follow-up messages to leads",
  ];

  return (
    <div className="pb-10">
      <TopBar
        title="Assign Action"
        onBack={() => (step > 1 ? setStep(step - 1) : navigate("leader"))}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                s < step ? "bg-emerald-500 text-white" :
                s === step ? "bg-primary text-white" :
                "bg-muted text-muted-foreground"
              )}
            >
              {s < step ? <Check size={13} /> : s}
            </div>
            <span className={cn("text-xs flex-1", s === step ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {s === 1 ? "Choose action" : s === 2 ? "Assign & schedule" : "Review"}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-5">
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Campaign</label>
              <div className="space-y-2">
                {["Rush Month", "Spring Showcase", "Community Health Fair"].map((c) => (
                  <button type="button"
                    key={c}
                    onClick={() => setCampaign(c)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-colors",
                      campaign === c ? "bg-primary/5 border-primary text-primary" : "bg-card border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {c}
                    {campaign === c && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Action Template</label>
              <div className="space-y-2">
                {templates.map((t) => (
                  <button type="button"
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left",
                      template === t ? "bg-primary/5 border-primary text-primary" : "bg-card border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{t}</span>
                    {template === t && <Check size={14} className="flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
            <PrimaryBtn
              label="Next: Assign & Schedule"
              onClick={() => setStep(2)}
              full
              icon={<ArrowRight size={15} />}
            />
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Assign To</label>
              <div className="space-y-2">
                {["General Members", "Action Committee Chairs", "E-Board", "Individual member"].map((r) => (
                  <button type="button"
                    key={r}
                    onClick={() => setAssignTo(r)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-colors",
                      assignTo === r ? "bg-primary/5 border-primary text-primary" : "bg-card border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {r}
                    {assignTo === r && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Evidence Required</label>
              <div className="space-y-2">
                {["Screenshot", "Link", "Short text update", "Screenshot + text"].map((e) => (
                  <button type="button"
                    key={e}
                    disabled
                    title="Evidence requirement editing is blocked in this preview"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <PrimaryBtn
              label="Preview assignment"
              onClick={() => setStep(3)}
              full
              icon={<Eye size={15} />}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Card className="bg-secondary/50 border-secondary">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Assignment Preview</p>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Action", value: template || "Share Rush Week flyer on Instagram" },
                  { label: "Campaign", value: campaign },
                  { label: "Assigned to", value: assignTo },
                  { label: "Due date", value: dueDate },
                  { label: "Points", value: `${points} pts if approved` },
                  { label: "Evidence", value: "Screenshot required" },
                  { label: "KPI impact", value: "Lead Capture · Visibility" },
                ].map((r) => (
                  <div key={r.label} className="flex items-start justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-semibold text-foreground text-right ml-4 max-w-[55%]">{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <AlertBanner
              message="Preview only - no member notifications, reminders, feed updates, or live assignments will send from this screen."
              type="info"
            />
            <div className="space-y-2">
              <PrimaryBtn
                label="Close assignment preview"
                onClick={() => navigate("leader")}
                full
                icon={<Check size={15} />}
              />
              <SecondaryBtn label="Edit assignment" onClick={() => setStep(2)} full />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 7 · Review Evidence ───────────────────────────────────────────────

function ReviewEvidence({ navigate }: { navigate: (s: Screen) => void }) {
  const [comments, setComments] = useState<Record<number, string>>({});
  const [reviewed, setReviewed] = useState<Record<number, "approved" | "changes">>({});

  const queue = [
    { id: 1, student: "Sofia R.", action: "Invite 3 friends to Intro GBM", type: "Screenshot", time: "3h ago", pts: 30 },
    { id: 2, student: "James L.", action: "Share Rush flyer on Instagram", type: "Link", time: "5h ago", pts: 20 },
    { id: 3, student: "Priya K.", action: "Add 5 leads to the spreadsheet", type: "Screenshot", time: "1d ago", pts: 25 },
    { id: 4, student: "Kevin M.", action: "Attend tabling shift", type: "Text update", time: "2d ago", pts: 15 },
  ];

  return (
    <div className="pb-10">
      <TopBar
        title="Review Evidence"
        onBack={() => navigate("leader")}
        right={<Pill label={`${queue.length} pending`} variant="yellow" />}
      />

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-4">
        {queue.map((item) => (
          <Card key={item.id} padding={false} className={cn(reviewed[item.id] === "approved" && "opacity-60")}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                    {item.student[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.student}</p>
                    <p className="text-xs text-muted-foreground">Submitted {item.time}</p>
                  </div>
                </div>
                {reviewed[item.id] ? (
                  <Pill
                    label={reviewed[item.id] === "approved" ? "Approved" : "Changes requested"}
                    variant={reviewed[item.id] === "approved" ? "green" : "yellow"}
                  />
                ) : (
                  <Pill label="Pending" variant="yellow" />
                )}
              </div>

              {/* Action */}
              <div className="bg-muted/50 rounded-xl p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-0.5">Action</p>
                <p className="text-sm font-semibold text-foreground">{item.action}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>Rush Month</span>
                  <span>·</span>
                  <span>{item.type}</span>
                  <span>·</span>
                  <span className="font-semibold text-primary">{item.pts} pts</span>
                </div>
              </div>

              {/* Evidence preview */}
              {item.type === "Screenshot" ? (
                <div className="w-full h-28 bg-muted rounded-xl flex items-center justify-center mb-3">
                  <div className="text-center">
                    <Camera size={20} className="text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">Screenshot attached</p>
                    <button type="button" disabled title="Full evidence preview is blocked in this review shell" className="text-xs text-primary font-semibold mt-1">View full</button>
                  </div>
                </div>
              ) : item.type === "Link" ? (
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 mb-3">
                  <Link2 size={14} className="text-primary flex-shrink-0" />
                  <p className="text-sm text-primary font-medium truncate">https://lu.ma/intro-gbm-rsvp</p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl px-3 py-2.5 mb-3">
                  <p className="text-sm text-foreground">
                    "I attended the 11am–1pm shift and helped table at Bruin Walk. We got about 12 leads."
                  </p>
                </div>
              )}

              {/* Comment */}
              <textarea
                rows={2}
                placeholder="Add a comment (optional)..."
                value={comments[item.id] || ""}
                onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary mb-3"
              />

              {/* Actions */}
              {!reviewed[item.id] && (
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setReviewed((r) => ({ ...r, [item.id]: "approved" }))}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                  >
                    <ThumbsUp size={14} />
                    Approve +{item.pts}
                  </button>
                  <button type="button"
                    onClick={() => setReviewed((r) => ({ ...r, [item.id]: "changes" }))}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-amber-400 text-amber-700 py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all bg-amber-50"
                  >
                    <MessageSquare size={14} />
                    Request changes
                  </button>
                </div>
              )}
              {reviewed[item.id] && (
                <div className={cn("flex items-center gap-2 py-2 text-sm font-semibold", reviewed[item.id] === "approved" ? "text-emerald-600" : "text-amber-700")}>
                  {reviewed[item.id] === "approved" ? <CheckCircle2 size={15} /> : <MessageSquare size={15} />}
                  {reviewed[item.id] === "approved" ? `Approved — ${item.pts} pts awarded` : "Changes requested"}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── SCREEN 8 · Coach Dashboard ───────────────────────────────────────────────

function CoachDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  const chapters = [
    { name: "UCLA MEDLIFE", health: 82, members: 34, active: 28, overdue: 3, evidence: 7, status: "Healthy" as const, decision: "Advance" },
    { name: "USC MEDLIFE", health: 61, members: 29, active: 17, overdue: 8, evidence: 12, status: "At risk" as const, decision: "Hold" },
    { name: "UCI MEDLIFE", health: 74, members: 22, active: 18, overdue: 4, evidence: 5, status: "Healthy" as const, decision: "Advance" },
    { name: "UCSD MEDLIFE", health: 45, members: 31, active: 12, overdue: 15, evidence: 18, status: "At risk" as const, decision: "Intervene" },
  ];

  const decisionColor = (d: string) =>
    d === "Advance" ? "text-emerald-600" : d === "Hold" ? "text-amber-600" : "text-red-600";

  const decisionBg = (d: string) =>
    d === "Advance" ? "bg-emerald-50 border-emerald-200" : d === "Hold" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8">
        <button type="button" onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
          <ChevronLeft size={16} />
          Student view
        </button>
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">MEDLIFE National</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Coach Dashboard</h1>
        <p className="text-blue-200 text-sm mt-1">Hi, Coach David Kim · 4 chapters assigned</p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: "Avg Health", value: "66%", ok: true },
            { label: "Total Overdue", value: "30", ok: false },
            { label: "Evidence Queue", value: "42", ok: false },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className={cn("text-xl font-extrabold", s.ok ? "text-white" : "text-red-300")}>{s.value}</p>
              <p className="text-blue-200 text-[10px] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        {/* Weekly summary */}
        <Card className="bg-secondary/60 border-secondary">
          <div className="flex items-start gap-3">
            <Activity size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">AI Weekly Summary · Nov 11</p>
              <p className="text-sm text-foreground leading-relaxed">
                3 of 4 chapters are in Week 1 of Rush Month. UCLA is the strongest performer (82% health).
                UCSD needs immediate intervention — 15 overdue actions and low member engagement.
                USC has solid leads but no Luma event linked. Recommend prioritizing UCSD coach note this week.
              </p>
            </div>
          </div>
        </Card>

        {/* Chapter cards */}
        <div>
          <SLabel>Chapter Portfolio</SLabel>
          <div className="space-y-3">
            {chapters.map((ch) => (
              <Card key={ch.name} padding={false} className={cn(ch.decision === "Intervene" && "border-red-200")}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{ch.name}</h3>
                        <Pill
                          label={ch.status}
                          variant={ch.status === "Healthy" ? "green" : "yellow"}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ch.members} members · Rush Month: Week 1</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-extrabold", ch.health >= 70 ? "text-emerald-600" : ch.health >= 55 ? "text-amber-500" : "text-red-600")}>
                        {ch.health}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">health score</p>
                    </div>
                  </div>

                  <Bar
                    pct={ch.health}
                    color={ch.health >= 70 ? "bg-emerald-500" : ch.health >= 55 ? "bg-amber-400" : "bg-red-500"}
                  />

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    {[
                      { label: "Active", value: ch.active },
                      { label: "Overdue", value: ch.overdue },
                      { label: "Evidence", value: ch.evidence },
                    ].map((s) => (
                      <div key={s.label} className="bg-muted/50 rounded-xl py-2">
                        <p className={cn("text-base font-extrabold", s.label === "Overdue" && ch.overdue > 5 ? "text-red-600" : "text-foreground")}>
                          {s.value}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className={cn("flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl border", decisionBg(ch.decision), decisionColor(ch.decision))}>
                      {ch.decision === "Advance" ? <TrendingUp size={13} /> : ch.decision === "Hold" ? <AlertTriangle size={13} /> : <Flag size={13} />}
                      {ch.decision}
                    </div>
                    <button type="button"
                      onClick={() => navigate("leader")}
                      className="text-primary text-xs font-semibold flex items-center gap-1"
                    >
                      Open chapter <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Risk alerts */}
        <div>
          <SLabel>Coaching Priorities</SLabel>
          <div className="space-y-2">
            <AlertBanner message="UCSD: 15 overdue actions — intervene immediately" type="danger" />
            <AlertBanner message="USC: Luma event not linked to Rush Month" type="warning" />
            <AlertBanner message="UCLA: Strong — consider advancing to Phase 2" type="info" />
          </div>
        </div>

        <div className="space-y-2 pb-4">
          <PrimaryBtn label="Write coach note" onClick={() => navigate("leader")} full icon={<MessageSquare size={15} />} />
          <SecondaryBtn label="Review risk reports" full />
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 9 · Admin ─────────────────────────────────────────────────────────

function AdminDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  const [showIntegrationNotice, setShowIntegrationNotice] = useState(false);
  const integrations = [
    { name: "Supabase / Postgres", status: "Review only", detail: "Auth and route posture only; no production rows are read here.", ok: true },
    { name: "HubSpot CRM", status: "Blocked", detail: "No CRM sync, contact mutation, or task creation from this preview.", ok: false },
    { name: "Luma Events", status: "Blocked", detail: "No event writes, reminders, attendance sync, or RSVP writeback from this preview.", ok: false },
    { name: "n8n Automation", status: "Blocked", detail: "No workflow execution, replay, retry, or provider send from this preview.", ok: false },
    { name: "Power BI", status: "Review only", detail: "Reporting preview only; no warehouse export from this screen.", ok: true },
    { name: "AI Summary Layer", status: "Review only", detail: "Static preview copy only; no recommendation job runs here.", ok: true },
  ];

  return (
    <div className="pb-10">
      <div className="bg-primary px-6 pt-12 pb-8">
        <button type="button" onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
          <ChevronLeft size={16} />
          Student view
        </button>
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">Platform Admin</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Admin Console</h1>
        <p className="text-blue-200 text-sm mt-1">Integration posture: preview-only; external writes blocked</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-6">
        {/* Platform health */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Chapters", value: "24", sub: "4 assigned to you" },
            { label: "Active Users", value: "312", sub: "this week" },
            { label: "Campaigns Running", value: "6", sub: "across all chapters" },
            { label: "Automation Jobs", value: "18", sub: "1 paused" },
          ].map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Integration status */}
        <div>
          <SLabel>Integration Status</SLabel>
          <Card padding={false}>
            {integrations.map((int, i) => (
              <div
                key={int.name}
                className={cn("flex items-center gap-3 px-4 py-3.5", i < integrations.length - 1 && "border-b border-border")}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", int.ok ? "bg-emerald-500" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.detail}</p>
                </div>
                <Pill label={int.status} variant={int.ok ? "green" : "yellow"} />
              </div>
            ))}
          </Card>
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { title: "User & Role Management", desc: "Manage members, leaders, coaches, and admins across all chapters.", icon: <Users size={18} className="text-primary" /> },
            { title: "Chapter Management", desc: "Create, archive, and configure chapters. Assign coaches.", icon: <Shield size={18} className="text-primary" /> },
            { title: "Campaign Templates", desc: "Build and publish campaign templates for chapters to adopt.", icon: <Target size={18} className="text-primary" /> },
            { title: "Audit Logs", desc: "Full audit trail of approvals, assignments, and evidence reviews.", icon: <FileText size={18} className="text-primary" /> },
          ].map((section) => (
            <Card key={section.title} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{section.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{section.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
            </Card>
          ))}
        </div>

        {/* Automation outbox */}
        <div>
          <SLabel>Automation Outbox Preview (n8n disabled)</SLabel>
          <Card padding={false}>
            {[
              { action: "HubSpot lifecycle update blocked", trigger: "Preview only - no contact mutation", time: "not sent", ok: false },
              { action: "Luma attendance sync blocked", trigger: "Preview only - no RSVP or attendance writeback", time: "not sent", ok: false },
              { action: "Overdue action reminder blocked", trigger: "Preview only - no email, SMS, push, or n8n workflow", time: "not sent", ok: false },
            ].map((job, i) => (
              <div
                key={job.action}
                className={cn("flex items-center gap-3 px-4 py-3.5", i < 2 && "border-b border-border")}
              >
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", job.ok ? "bg-emerald-400" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{job.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.trigger}</p>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">{job.time}</p>
              </div>
            ))}
          </Card>
        </div>

        <PrimaryBtn label="View integration events" full icon={<Activity size={15} />} onClick={() => setShowIntegrationNotice(true)} />
        {showIntegrationNotice && (
          <Card className="border-amber-200 bg-amber-50 text-left">
            <p className="text-sm font-bold text-amber-900">Secure admin route required</p>
            <p className="text-xs text-amber-800 mt-1">
              Integration event details stay in `/admin/integration-outbox` for DS/Admin review. This mobile preview does not expose provider logs or trigger writes.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 10 · Points + Leaderboard ────────────────────────────────────────

function PointsLeaderboard({
  source,
  returnEventId,
  returnCampaign = null,
  storyFilter = null,
  storyId = null,
  memberContext,
  pointsReadback = null,
}: {
  source: MemberLoopSource;
  returnEventId?: string | null;
  returnCampaign?: string | null;
  storyFilter?: string | null;
  storyId?: string | null;
  memberContext: MemberMobileIdentityContext;
  pointsReadback?: LaunchLaneMemberPointsReadback | null;
}) {
  const hasLiveEventLoopPoints = Boolean(
    pointsReadback && pointsReadback.memberPointsAwarded > 0,
  );
  const usesAppOwnedPoints =
    memberContext.pointsLedgerPosture === "app_owned_readback";
  const leaderboardRows = getVisibleMemberLeaderboardRows(memberContext, 6);
  const campaignPointRows = getMemberCampaignPointRows(memberContext);
  const badges = getMemberBadgeRows(memberContext);
  const recentApprovedActions = getMemberRecentApprovedActionRows(
    memberContext,
    pointsReadback,
  );
  const previewReadback: Record<MemberLoopSource, { title: string; detail: string }> = usesAppOwnedPoints ? {
    events: { title: "Opened from the event loop", detail: "RSVP, attendance, and points are read from the app-owned myMEDLIFE ledger. Rewards and external provider writes remain separate." },
    home: { title: "Opened from home", detail: "This route preserves the home-to-events-to-points path and reads current app-owned points for the signed-in member." },
    profile: { title: "Opened from your profile", detail: "This profile-to-points handoff reads the signed-in member's current app-owned points and chapter rank." },
    points: { title: "App-owned points readback", detail: "Totals, recent awards, and chapter rank come from persisted myMEDLIFE points records. No reward claim or provider write runs here." },
    stories: { title: "Opened from Stories", detail: "This route preserves story context while showing current app-owned points and chapter recognition." },
  } : {
    events: { title: "Opened from the TEST event loop", detail: "This route-backed readback keeps the RSVP, attendance, and points loop visible. Leaderboard movement, rewards, and ledger writes stay preview-only until those writes are approved." },
    home: { title: "Opened from the TEST home walkthrough", detail: "This route-backed readback keeps the home-to-events-to-points student flow visible. Recognition stays preview-only and does not claim a live award, reward, or provider update." },
    profile: { title: "Opened from your TEST profile", detail: "This profile-to-points handoff stays route-backed and read-only. Recognition stays visible here while profile can hand you back into the next chapter event." },
    points: { title: "Preview-only recognition readback", detail: "This route shows TEST leaderboard and approved-action readback only. No live points awards, reward claims, or share sends run from this screen." },
    stories: { title: "Opened from the TEST stories feed", detail: "This route-backed readback keeps the stories-to-events-to-points loop visible. Recognition stays preview-only, and the mobile member shell keeps the same story context instead of dropping you into a generic fallback." },
  };
  const continuityMap: Record<MemberLoopSource, readonly [string, string, string]> = usesAppOwnedPoints ? {
    events: ["Points are awarded from approved app-owned event and attendance records. Duplicate awards remain blocked.", returnEventId ? `/app/events/${returnEventId}?source=points` : "/app/events?source=points", returnEventId ? "Back to event detail" : "Back to events"],
    home: ["Your current total and chapter rank come from app-owned points records.", returnEventId ? `/app/events/${returnEventId}?source=home` : "/app/events?source=home", returnEventId ? "Back to event detail" : "Find the next event"],
    profile: ["Your profile and points views use the same signed-in app-owned identity and ledger.", returnEventId ? `/app/events/${returnEventId}?source=profile` : screenlessProfileHref("points", returnCampaign), returnEventId ? "Back to event detail" : "Back to your profile"],
    stories: ["Story context is preserved while points remain backed by the myMEDLIFE ledger.", storyId ? `/app/stories?filter=${encodeURIComponent(resolveStoryFilter(storyFilter))}&story=${encodeURIComponent(storyId)}` : storyFilter ? `/app/stories?filter=${encodeURIComponent(storyFilter)}` : "/app/stories", "Back to Stories"],
    points: ["Points come from approved myMEDLIFE activity. Rewards and external provider writes remain disabled until separately approved.", "/app/events?source=points", "See how to earn more points"],
  } : {
    events: [
      "TEST points stay preview-only here, and this route keeps the event RSVP, check-in, and leaderboard handoff visible without claiming a live award sync.",
      returnEventId ? `/app/events/${returnEventId}?source=points` : "/app/events?source=points",
      returnEventId ? "Back to the TEST event detail" : "Back to the TEST event loop",
    ],
    home: [
      "TEST points stay preview-only here, but this route keeps the home-to-events walkthrough intact for the student shell.",
      returnEventId ? `/app/events/${returnEventId}?source=home` : "/app/events?source=home",
      returnEventId ? "Back to the TEST event detail" : "Continue from home into events",
    ],
    profile: [
      "TEST points stay preview-only here, and this route keeps the profile-to-recognition walkthrough read-only instead of pretending profile writes are live.",
      returnEventId
        ? `/app/events/${returnEventId}?source=profile`
        : screenlessProfileHref("points", returnCampaign),
      returnEventId ? "Back to the TEST event detail" : "Back to your TEST profile",
    ],
    stories: [
      "TEST points stay preview-only here, and this route keeps the stories-to-events handoff visible instead of dropping the member feed context on the floor.",
      storyId
        ? `/app/stories?filter=${encodeURIComponent(resolveStoryFilter(storyFilter))}&story=${encodeURIComponent(storyId)}`
        : storyFilter ? `/app/stories?filter=${encodeURIComponent(storyFilter)}` : "/app/stories",
      "Back to Stories",
    ],
    points: ["TEST points in this member shell are a read-only preview of the event, RSVP, attendance, and action loop. They do not write to a live leaderboard, rewards system, or provider integration.", "/app/events?source=points", "See how to earn more points"],
  };
  const preview = previewReadback[source];
  const continuity = continuityMap[source];
  const returnEvent = getMemberLoopEventByRouteId(returnEventId ?? null);
  const returnLoopSource: MemberLoopSource =
    source === "events" ? "points" : source;
  const returnEventDetailHref =
    returnEvent && returnEvent.routeId
      ? getMemberEventDetailHref(returnEvent.id, returnLoopSource, returnCampaign, null, storyFilter, storyId)
      : continuity[1];
  const returnEventRsvpHref =
    returnEvent
      ? getMemberEventStepHref(returnEvent.id, returnLoopSource, "rsvp", returnCampaign, null, storyFilter, storyId)
      : null;
  const returnEventCheckInHref =
    returnEvent
      ? getMemberEventStepHref(returnEvent.id, returnLoopSource, "checkin", returnCampaign, null, storyFilter, storyId)
      : null;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-8">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">{memberContext.chapterName}</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Points & Recognition</h1>
        <p className="text-blue-200 text-sm mt-1">
          {hasLiveEventLoopPoints
            ? usesAppOwnedPoints
              ? "App-owned event-loop points for your signed-in account."
              : "Live TEST event-loop points from internal myMEDLIFE readback."
            : usesAppOwnedPoints
              ? "Current points from the app-owned myMEDLIFE ledger."
              : "Preview-only TEST points come from route-backed member actions."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Total Points", value: `${memberContext.pointsTotal}` },
                { label: "This Week", value: memberContext.pointsWeeklyLabel },
                { label: "Chapter Rank", value: memberContext.pointsRankLabel },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-blue-200 text-[10px] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        <Card className="bg-secondary/50 border-secondary">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{preview.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {preview.detail}
              </p>
            </div>
          </div>
        </Card>

        {hasLiveEventLoopPoints && pointsReadback ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700">
              {usesAppOwnedPoints ? "App-owned points readback" : "Live TEST points readback"}
            </p>
            <h2 className="mt-2 text-base font-extrabold text-foreground">
              {pointsReadback.eventTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {pointsReadback.memberPointsAwarded} points are recorded for your
              {usesAppOwnedPoints ? "signed-in member" : "signed-in TEST member"} on this event. Attendance count is{" "}
              {pointsReadback.attendanceCount}, and duplicate check-ins stay
              blocked from awarding more points.
            </p>
          </Card>
        ) : null}

        {returnEvent ? (
          <Card className="border-[#bfdbfe] bg-[#eff6ff]">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
              {usesAppOwnedPoints ? "Exact event readback" : "Exact TEST event readback"}
            </p>
            <h2 className="mt-2 text-base font-extrabold text-foreground">
              {returnEvent.title} brought you here
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasLiveEventLoopPoints && pointsReadback
                ? usesAppOwnedPoints
                  ? "This event now has app-owned RSVP, attendance, and points readback for the signed-in member. Rewards and external provider writes still stay off."
                  : "This TEST event now has internal RSVP, attendance, and points readback for the signed-in member. Rewards and external provider writes still stay off."
                : "This preview keeps the member loop compact: event detail, RSVP posture, check-in posture, and points readback all stay route-backed without pretending a live reward or attendance write happened."}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link
                href={returnEventDetailHref}
                className="rounded-2xl border border-[#bfdbfe] bg-white px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
              >
                {usesAppOwnedPoints ? "Back to event detail" : "Back to TEST event detail"}
              </Link>
              <Link
                href={returnEventRsvpHref ?? continuity[1]}
                className="rounded-2xl border border-[#bfdbfe] bg-white px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
              >
                {usesAppOwnedPoints ? "Open RSVP" : "Preview RSVP posture"}
              </Link>
              <Link
                href={returnEventCheckInHref ?? continuity[1]}
                className="rounded-2xl border border-[#bfdbfe] bg-white px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-slate-50"
              >
                {usesAppOwnedPoints ? "Open check-in" : "Preview check-in posture"}
              </Link>
            </div>
          </Card>
        ) : null}

        {/* Points by campaign */}
        <div>
          <SLabel>Points by Campaign</SLabel>
          <Card>
            <div className="space-y-3">
              {campaignPointRows.length > 0 ? campaignPointRows.map((c) => (
                <div key={c.campaign}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{c.campaign}</span>
                    <span className="font-bold text-foreground font-[DM_Mono,monospace]">
                      {c.max === null ? `${c.pts} pts` : `${c.pts} / ${c.max} pts`}
                    </span>
                  </div>
                  {c.max === null ? null : (
                    <Bar pct={Math.round((c.pts / c.max) * 100)} color={c.color} />
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">
                  No app-owned campaign points have been recorded for this member yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Badges */}
        <div>
          <SLabel>Badges Earned</SLabel>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {badges.map((b) => (
              <Card key={b.name} className={cn(!b.earned && "opacity-40")}>
                <div className="flex items-start gap-2.5">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", b.earned ? "bg-accent" : "bg-muted")}>
                    <Star size={14} className={b.earned ? "text-accent-foreground" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{b.desc}</p>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm font-semibold text-foreground">
                No app-owned badges are configured.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The app will not infer badges from point totals until a real badge rule and award record exist.
              </p>
            </Card>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <SLabel>
            {usesAppOwnedPoints ? "Chapter Leaderboard" : "Chapter Leaderboard — TEST Rush Month"}
          </SLabel>
          <Card>
            {leaderboardRows.map((m) => (
              <div
                key={m.rank}
                className={cn(
                  "flex items-center gap-3 py-3 border-b border-border last:border-0",
                  m.me && "bg-primary/5 -mx-4 px-4 rounded-xl"
                )}
              >
                <span className="w-7 text-center text-sm font-bold">
                  {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : m.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", m.me ? "font-extrabold text-primary" : "font-semibold text-foreground")}>
                    {m.me ? `You (${m.name})` : m.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <span className="text-sm font-bold font-[DM_Mono,monospace] text-foreground">{m.pts} pts</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Recent approved actions */}
        <div>
          <SLabel>
            {usesAppOwnedPoints ? "Recent Points Activity" : "Recent Approved Actions"}
          </SLabel>
          <div className="space-y-2">
            {recentApprovedActions.length > 0 ? recentApprovedActions.map((a) => (
              <Card key={a.action} padding={false}>
                <div className="flex items-center gap-3 p-4">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{a.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 font-[DM_Mono,monospace] flex-shrink-0">
                    +{a.pts}
                  </span>
                </div>
              </Card>
            )) : (
              <Card>
                <p className="text-sm font-semibold text-foreground">
                  {usesAppOwnedPoints ? "No recorded point activity yet" : "No approved TEST actions yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {usesAppOwnedPoints
                    ? "No app-owned point award is recorded for this signed-in member yet."
                    : "RSVP and check-in previews stay visible, but no completed action, attendance, or points award is counted for this signed-in member yet."}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* How to earn */}
        <Card className="bg-secondary/50 border-secondary">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">How points work</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {continuity[0]}
              </p>
              <Link
                href={returnEvent ? returnEventDetailHref : continuity[1]}
                className="inline-flex text-primary text-xs font-bold mt-2"
              >
                {continuity[2]} →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── SCREEN · Events ──────────────────────────────────────────────────────────
// ─── SCREEN · Events Feed ────────────────────────────────────────────────────
// ── Event + Campaign data ────────────────────────────────────────────────────

type CampaignTag = "Rush Month" | "Spring Showcase" | "Safe Homes Fundraiser" | "Community Health Fair";

function buildEventsHref({
  source,
  campaign,
  profileSource,
  storyFilter,
}: {
  source: MemberLoopSource;
  campaign?: string | "All";
  profileSource?: "points" | null;
  storyFilter?: string | null;
}) {
  const params = new URLSearchParams();

  if (source !== "events") {
    params.set("source", source);
  }

  if (source === "profile" && profileSource === "points") {
    params.set("profileSource", "points");
  }

  if (source === "stories" && storyFilter) {
    params.set("storyFilter", storyFilter);
  }

  if (campaign && campaign !== "All") {
    params.set("campaign", campaign);
  }

  const query = params.toString();

  return query ? `/app/events?${query}` : "/app/events";
}

type EventType = MemberMobileEventType;

interface EventTypeConfig {
  color: string;   // border + icon accent
  bg: string;      // pill background
  text: string;    // pill text
  label: string;   // short display label
}

const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  "GBM":                  { color: "#1B4B8E", bg: "#EEF3FA", text: "#1B4B8E", label: "GBM"               },
  "Fundraising":          { color: "#EA580C", bg: "#FFF7ED", text: "#C2410C", label: "Fundraising"        },
  "Local Volunteering":   { color: "#16A34A", bg: "#F0FDF4", text: "#15803D", label: "Volunteering"       },
  "Growing the Movement": { color: "#2563EB", bg: "#EFF6FF", text: "#1D4ED8", label: "Growing the Movement"},
  "Meet People / Social": { color: "#DB2777", bg: "#FDF2F8", text: "#BE185D", label: "Social"             },
  "MED Talk":             { color: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9", label: "MED Talk"           },
  "Pre-MED":              { color: "#0D9488", bg: "#F0FDFA", text: "#0F766E", label: "Pre-MED"            },
  "Pre-Dental":           { color: "#0891B2", bg: "#ECFEFF", text: "#0E7490", label: "Pre-Dental"         },
  "Smiles Movement":      { color: "#0284C7", bg: "#F0F9FF", text: "#0369A1", label: "Smiles Movement"    },
  "Safe Homes":           { color: "#3D7A5A", bg: "#EFFAF4", text: "#3D7A5A", label: "Safe Homes"         },
  "Engaged Education":    { color: "#4F46E5", bg: "#EEF2FF", text: "#4338CA", label: "Engaged Ed"         },
  "SLT Prep":             { color: "#D97706", bg: "#FFFBEB", text: "#B45309", label: "SLT Prep"           },
  "SLT Reflection":       { color: "#CA8A04", bg: "#FEFCE8", text: "#A16207", label: "SLT Reflection"     },
  "Eboard Transition":    { color: "#475569", bg: "#F8FAFC", text: "#334155", label: "Eboard Transition"  },
  "Moving Mountains":     { color: "#78716C", bg: "#FAFAF9", text: "#57534E", label: "Moving Mountains"   },
  "Rush Month":           { color: "#1B4B8E", bg: "#EEF3FA", text: "#1B4B8E", label: "Rush Month"         },
  "Mentorship Meeting":   { color: "#9333EA", bg: "#FAF5FF", text: "#7E22CE", label: "Mentorship"         },
  "Tutoring":             { color: "#65A30D", bg: "#F7FEE7", text: "#4D7C0F", label: "Tutoring"           },
  "Skills Session":       { color: "#059669", bg: "#ECFDF5", text: "#047857", label: "Skills Session"     },
};

function EventTypePill({ type }: { type: EventType }) {
  const cfg = EVENT_TYPE_CONFIG[type];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.text, borderColor: `${cfg.color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

interface ChapterEvent {
  id: number | string;
  routeId?: string;
  title: string;
  date: string;
  loc: string;
  pts: number;
  status: "RSVP Open" | "Upcoming" | "Completed";
  campaign: string;
  eventType: EventType;
  featured?: boolean;
  luma?: boolean;
  organizer?: string;
  rsvps?: number | null;
}

const CAMPAIGNS: { name: CampaignTag; phase: string; color: string; accent: string; description: string; progress: number }[] = [
  {
    name: "Rush Month",
    phase: "Week 1 of 4 · Visibility + Lead Capture",
    color: "from-primary to-blue-600",
    accent: "bg-primary/10 text-primary border-primary/20",
    description: "Recruit new members and help them feel welcomed into MEDLIFE.",
    progress: 67,
  },
  {
    name: "Spring Showcase",
    phase: "Coming up · Jan 2025",
    color: "from-emerald-600 to-teal-500",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Showcase chapter impact and recruit for spring semester.",
    progress: 0,
  },
  {
    name: "Safe Homes Fundraiser",
    phase: "Ongoing",
    color: "from-[#3D7A5A] to-emerald-600",
    accent: "bg-[#3D7A5A]/10 text-[#3D7A5A] border-[#3D7A5A]/20",
    description: "TEST Raise funds for smokeless stoves and water filters in TEST Peru.",
    progress: 42,
  },
  {
    name: "Community Health Fair",
    phase: "Planning · Feb 2025",
    color: "from-purple-600 to-violet-500",
    accent: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Free screenings and health education for our local community.",
    progress: 15,
  },
];

const ALL_EVENTS: ChapterEvent[] = [
  { id: 1,  routeId: "chapter-event-ucla-kickoff",      title: "TEST Intro GBM",                   date: "Thu Nov 15 · 6:00 PM", loc: "Ackerman Union 2100",       pts: 20, status: "RSVP Open",  campaign: "Rush Month",            eventType: "GBM",                  featured: true, luma: true, organizer: "TEST Marcus T.", rsvps: 23 },
  { id: 2,  routeId: "chapter-event-lakeside-welcome",  title: "TEST Tabling at Bruin Walk",        date: "Tue Nov 13 · 11 AM",   loc: "Bruin Walk Table 7",        pts: 15, status: "RSVP Open",  campaign: "Rush Month",            eventType: "Local Volunteering"    },
  { id: 3,  routeId: "chapter-event-boston-info-night", title: "TEST Rush Week Social",             date: "Sat Nov 18 · 7:00 PM", loc: "Student Activities Center", pts: 10, status: "Upcoming",   campaign: "Rush Month",            eventType: "Meet People / Social"  },
  { id: 4,  routeId: "chapter-event-ucsd-service-social", title: "TEST Rush Month Recap GBM",      date: "Mon Nov 25 · 6:30 PM", loc: "Boelter 4413",              pts: 15, status: "Upcoming",   campaign: "Rush Month",            eventType: "GBM"                   },
  { id: 5,  routeId: "chapter-event-mcgill-coffee-chat", title: "TEST Spring Showcase Kickoff",    date: "Fri Jan 10 · 5:00 PM", loc: "Covel Commons",             pts: 20, status: "Upcoming",   campaign: "Spring Showcase",       eventType: "Growing the Movement"  },
  { id: 6,  title: "TEST Showcase Planning Meeting",    date: "Tue Jan 14 · 6:00 PM", loc: "Powell 320",                pts: 10, status: "Upcoming",   campaign: "Spring Showcase",       eventType: "Growing the Movement"  },
  { id: 7,  title: "TEST Fundraising Bake Sale",        date: "Wed Nov 20 · 11 AM",   loc: "Bruin Plaza",               pts: 20, status: "Upcoming",   campaign: "Safe Homes Fundraiser", eventType: "Fundraising"           },
  { id: 8,  title: "TEST Donor Info Night",             date: "Thu Nov 21 · 7:00 PM", loc: "Ackerman 2100",             pts: 15, status: "Upcoming",   campaign: "Safe Homes Fundraiser", eventType: "Fundraising"           },
  { id: 9,  title: "TEST Health Fair Planning Session", date: "Wed Dec 4 · 5:30 PM",  loc: "Engineering VI 289",        pts: 10, status: "Upcoming",   campaign: "Community Health Fair", eventType: "Engaged Education"     },
  { id: 10, title: "TEST First Aid Training",           date: "Sat Nov 30 · 10 AM",   loc: "Bunche Hall 1209A",         pts: 30, status: "RSVP Open",  campaign: "General",               eventType: "Skills Session"        },
  { id: 11, title: "TEST Member Orientation",           date: "Wed Nov 22 · 5:30 PM", loc: "Engineering VI 289",        pts: 25, status: "Upcoming",   campaign: "General",               eventType: "Growing the Movement"  },
];

function getMemberLoopEventByRouteId(routeId: string | null) {
  if (!routeId) {
    return null;
  }

  return ALL_EVENTS.find((event) => event.routeId === routeId) ?? null;
}

function getMemberEventStepHref(
  eventId: number | string,
  source: MemberLoopSource,
  step: "rsvp" | "checkin",
  campaign: string | null = null,
  profileSource: "points" | null = null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  const detailHref = getMemberEventDetailHref(eventId, source, campaign, profileSource, storyFilter, storyId);
  return detailHref.includes("?") ? `${detailHref}&step=${step}` : `${detailHref}?step=${step}`;
}
function EventsScreen({
  navigate,
  source,
  initialCampaign,
  profileSource = null,
  storyFilter = null,
  memberContext,
  memberEvents,
  memberCampaign,
}: {
  navigate: (s: Screen) => void;
  source: MemberLoopSource;
  initialCampaign?: string | null;
  profileSource?: "points" | null;
  storyFilter?: string | null;
  memberContext: MemberMobileIdentityContext;
  memberEvents?: MemberMobileEventContext[];
  memberCampaign?: MemberMobileCampaignContext | null;
}) {
  const availableEvents: ChapterEvent[] = memberEvents ?? ALL_EVENTS;
  const availableCampaigns = memberEvents
    ? Array.from(new Set(memberEvents.map((event) => event.campaign)))
    : CAMPAIGNS.map((campaign) => campaign.name);
  const activeCampaign = !initialCampaign || initialCampaign === "All" || !availableCampaigns.includes(initialCampaign)
    ? "All"
    : initialCampaign;
  const rsvpdIds: Array<number | string> = memberEvents ? [] : [2];
  const visibleEvents = activeCampaign === "All" ? availableEvents : availableEvents.filter((e) => e.campaign === activeCampaign);
  const featuredEvent = visibleEvents.find((e) => e.featured);
  const listEvents = visibleEvents.filter((e) => !e.featured);
  const activeCampaignData = activeCampaign !== "All"
    ? CAMPAIGNS.find((c) => c.name === activeCampaign) ??
      (activeCampaign === "Luma calendar history"
        ? {
            name: activeCampaign,
            phase: "Imported provider history · read-only",
            color: "from-slate-700 to-slate-600",
            accent: "bg-slate-100 text-slate-700 border-slate-200",
            description:
              "Completed chapter events imported from Luma. RSVP and check-in are closed, and provider writes remain disabled.",
            progress: 100,
          }
        : {
            name: activeCampaign,
            phase: "Active chapter campaign",
            color: "from-primary to-blue-600",
            accent: "bg-primary/10 text-primary border-primary/20",
            description: memberCampaign?.objective ?? "Chapter campaign details are not available yet.",
            progress: 0,
          })
    : null;
  const detailLoopSource: MemberLoopSource = source;
  const pointsReturnHref = getEventsBottomNavPointsHref(
    source,
    activeCampaign,
    profileSource,
    storyFilter,
  );
  const profileReturnHref =
    buildEventsProfileReturnHref(profileSource, activeCampaign) ??
    getEventsBottomNavProfileHref(source, activeCampaign, profileSource, storyFilter) ??
    "/profile";
  const eventsReturnCard =
    source === "home"
      ? { eyebrow: "Opened from the TEST home walkthrough", title: "Keep home, events, and points in one member loop.", body: "Home sent you into this TEST event list so you can open the next chapter moment, preview RSVP or attendance, and return to points without leaving the student shell.", href: "/app", cta: "Back to Home" }
      : source === "profile" && profileSource === "points"
      ? { eyebrow: "Opened from Points & Recognition via your TEST profile", title: "Keep profile, points, and events in one member loop.", body: "Your TEST profile carried exact points context into this event list. Open the next chapter moment, preview RSVP or attendance, then step back through the same profile-to-points loop without leaving the student shell.", href: profileReturnHref, cta: "Back to Profile" }
      : source === "profile"
      ? { eyebrow: "Opened from your TEST profile", title: "Keep profile, events, and points in one member loop.", body: "Your TEST profile sent you here so the next chapter moment stays route-backed. Open an event, preview RSVP or attendance, then step back into points when you are ready.", href: profileReturnHref, cta: "Back to Profile" }
      : source === "stories"
        ? { eyebrow: "Opened from the TEST stories feed", title: "Keep stories, events, and points in one member loop.", body: "Your TEST stories feed sent you into this event list so you can stay inside the same mobile shell, preview the next chapter moment, and step back without losing the feed context.", href: storyFilter ? `/app/stories?filter=${encodeURIComponent(storyFilter)}` : "/app/stories", cta: "Back to Stories" }
      : source === "points"
        ? { eyebrow: "Opened from Points & Recognition", title: "Move from TEST points readback into the next event.", body: "The member loop should not stop at the leaderboard. Use this route-backed return path to find the next event, preview RSVP or check-in, and come back to points when the chapter moment is done.", href: pointsReturnHref ?? "/app/points?source=events", cta: "Back to Points" }
        : null;

  return (
    <div className="pb-28">
      <div className="bg-primary px-5 pt-12 pb-5">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">{memberContext.chapterName}</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Events</h1>
        <p className="text-blue-200 text-sm mt-0.5">Show up. Check in. Earn points.</p>
      </div>
      <div className="bg-primary px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <Link
            href={buildEventsHref({ source, campaign: "All", profileSource, storyFilter })}
            aria-label="Show all TEST event campaigns"
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCampaign === "All"
                ? "bg-white text-primary border-white"
                : "bg-white/15 text-white border-white/30 hover:bg-white/25"
            )}
          >
            All Events
          </Link>
          {availableCampaigns.map((campaignName) => (
            <Link
              key={campaignName}
              href={buildEventsHref({ source, campaign: campaignName, profileSource, storyFilter })}
              aria-label={`Filter TEST events by ${campaignName}`}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                activeCampaign === campaignName
                  ? "bg-white text-primary border-white"
                  : "bg-white/15 text-white border-white/30 hover:bg-white/25"
              )}
            >
              {campaignName}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {eventsReturnCard ? (
          <Card>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">{eventsReturnCard.eyebrow}</p>
            <h2 className="mt-2 text-base font-extrabold text-foreground">{eventsReturnCard.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{eventsReturnCard.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={eventsReturnCard.href} className="inline-flex items-center justify-center rounded-xl bg-secondary px-3.5 py-2 text-sm font-bold text-primary transition-colors hover:bg-muted">{eventsReturnCard.cta}</Link>
            </div>
          </Card>
        ) : null}
        {activeCampaignData && (
          <div className={`bg-gradient-to-r ${activeCampaignData.color} rounded-2xl p-4`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-white/70 text-xs font-semibold">{activeCampaignData.phase}</p>
                <h2 className="text-white text-lg font-extrabold mt-0.5">{activeCampaignData.name}</h2>
                <p className="text-white/80 text-xs mt-1 leading-relaxed max-w-[220px]">{activeCampaignData.description}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-white text-2xl font-extrabold">{activeCampaignData.progress}%</p>
                <p className="text-white/60 text-[10px]">complete</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${activeCampaignData.progress}%` }} />
            </div>
            <p className="text-white/60 text-xs mt-2">{visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} in this campaign</p>
          </div>
        )}
        {visibleEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
              <CalendarDays size={22} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No events in this campaign yet.</p>
          </div>
        )}

        {/* Featured event */}
        {featuredEvent && (
          <Card padding={false} className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-500 px-4 py-2.5 flex items-center gap-2">
              <Zap size={13} className="text-amber-300 fill-amber-300 flex-shrink-0" />
              <span className="text-white text-xs font-bold uppercase tracking-wide">Featured</span>
              <EventTypePill type={featuredEvent.eventType} />
              {featuredEvent.luma && (
                <span className="ml-auto bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Luma</span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-extrabold text-foreground text-base leading-tight flex-1 min-w-0">{featuredEvent.title}</h2>
                <Pill
                  label={featuredEvent.status}
                  variant={featuredEvent.status === "RSVP Open" ? "green" : "gray"}
                />
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2"><CalendarDays size={14} className="text-primary flex-shrink-0" /><span>{featuredEvent.date}</span></div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-primary flex-shrink-0" /><span>{featuredEvent.loc}</span></div>
                {featuredEvent.organizer && (
                  <div className="flex items-center gap-2"><Users size={14} className="text-primary flex-shrink-0" />
                    <span>Organized by <span className="font-semibold text-foreground">{featuredEvent.organizer}</span></span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                <PointsPill pts={featuredEvent.pts} />
                <span className="text-xs text-muted-foreground">Check in to earn</span>
                {featuredEvent.rsvps && <span className="text-xs text-muted-foreground ml-auto">{featuredEvent.rsvps} RSVPs</span>}
              </div>
              <div className="flex gap-2">
                {featuredEvent.status === "RSVP Open" ? (
                  <Link
                    href={getMemberEventRsvpHref(featuredEvent.routeId ?? featuredEvent.id, detailLoopSource, activeCampaign, profileSource, storyFilter)}
                    className="flex flex-1 items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    RSVP
                  </Link>
                ) : null}
                <Link
                  href={getMemberEventDetailHref(featuredEvent.routeId ?? featuredEvent.id, detailLoopSource, activeCampaign, profileSource, storyFilter)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-bold text-primary transition-colors hover:bg-muted"
                >
                  View Details
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Event list */}
        {listEvents.length > 0 && (
          <div>
            <SLabel>{activeCampaign === "All" ? "All Events" : `${activeCampaign} Events`}</SLabel>
            <div className="space-y-2.5">
              {listEvents.map((ev) => {
                const isRsvpd = rsvpdIds.includes(ev.id);
                const typeCfg = EVENT_TYPE_CONFIG[ev.eventType];
                const eventRouteId = ev.routeId ?? ev.id;
                const detailHref = getMemberEventDetailHref(
                  eventRouteId,
                  detailLoopSource,
                  activeCampaign,
                  profileSource,
                  storyFilter,
                );
                const rsvpHref = getMemberEventRsvpHref(
                  eventRouteId,
                  detailLoopSource,
                  activeCampaign,
                  profileSource,
                  storyFilter,
                );
                const hasDetailRoute = isMemberEventDetailHref(detailHref);
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "bg-card rounded-2xl border border-border overflow-hidden transition-transform",
                      hasDetailRoute ? "cursor-pointer active:scale-[0.99] hover:border-primary/20" : "cursor-default",
                    )}
                    style={{ borderLeft: `4px solid ${typeCfg.color}` }}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Color-matched icon */}
                      {hasDetailRoute ? (
                        <Link
                          href={detailHref}
                          className="flex min-w-0 flex-1 items-start gap-3"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: typeCfg.bg }}
                          >
                            <CalendarDays size={18} style={{ color: typeCfg.color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <EventTypePill type={ev.eventType} />
                            <p className="text-sm font-bold text-foreground leading-snug mt-1">{ev.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.date}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <MapPin size={9} className="flex-shrink-0" />{ev.loc}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: typeCfg.bg }}
                          >
                            <CalendarDays size={18} style={{ color: typeCfg.color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <EventTypePill type={ev.eventType} />
                            <p className="text-sm font-bold text-foreground leading-snug mt-1">{ev.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.date}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <MapPin size={9} className="flex-shrink-0" />{ev.loc}
                            </p>
                            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                              Detail stays in this TEST campaign list preview for now.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <PointsPill pts={ev.pts} />
                        {isRsvpd ? (
                          <Pill label="RSVP'd" variant="green" />
                        ) : ev.status === "RSVP Open" && hasDetailRoute ? (
                          <Link
                            href={rsvpHref}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border hover:opacity-80"
                            style={{ color: typeCfg.text, borderColor: `${typeCfg.color}50`, background: typeCfg.bg }}
                          >
                            RSVP
                          </Link>
                        ) : ev.status === "RSVP Open" ? (
                          <Pill label="List preview" variant="gray" />
                        ) : (
                          <Pill label={ev.status} variant="gray" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN · Event Detail ────────────────────────────────────────────────────

function EventDetailScreen({
  navigate,
  memberContext,
}: Readonly<{
  navigate: (s: Screen) => void;
  memberContext: MemberMobileIdentityContext;
}>) {
  const [rsvpd, setRsvpd] = useState(false);

  return (
    <div className="pb-24">

      {/* ── Blue header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-blue-700 px-5 pt-12 pb-8">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-6">
          <button type="button"
            onClick={() => navigate("events")}
            className="bg-white/15 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/25 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-white text-sm font-bold uppercase tracking-widest">Event RSVP</p>
          <button type="button" disabled title="Event sharing is blocked in this preview until Luma sharing is approved" className="bg-white/15 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/25 transition-colors">
            <Share2 size={16} />
          </button>
        </div>

        {/* Event identity */}
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-white/20 rounded-2xl p-3.5 flex-shrink-0">
            <CalendarDays size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Pill label="RSVP Open" variant="green" />
              <Pill label="TEST Rush Month" variant="blue" />
            </div>
            <h1 className="text-white text-2xl font-extrabold leading-snug">TEST Intro GBM</h1>
            <p className="text-blue-200 text-sm mt-1">{memberContext.chapterName} · Thu Nov 15 · 6:00 PM</p>
          </div>
        </div>

        {/* ── Primary RSVP action — most prominent element ── */}
        {rsvpd ? (
          <div className="bg-emerald-400/20 border border-emerald-300/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-base">{"You're RSVP'd!"}</p>
              <p className="text-emerald-200 text-sm mt-0.5">{"Check in at the door to earn your 20 points."}</p>
            </div>
          </div>
        ) : (
          <button type="button"
            onClick={() => { setRsvpd(true); navigate("rsvp-confirm"); }}
            className="w-full bg-accent text-accent-foreground py-4 rounded-2xl text-lg font-extrabold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            RSVP to Event
          </button>
        )}

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "RSVPs", value: "23" },
            { label: "Points", value: "20" },
            { label: "Duration", value: "2 hrs" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl px-2 py-2.5 text-center">
              <p className="text-white font-extrabold text-lg leading-none">{s.value}</p>
              <p className="text-blue-200 text-[10px] font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable detail cards ───────────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-4">

        {/* Who's going + quick actions — right under the header */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground">Who's going</span>
            <span className="text-primary font-extrabold text-sm">23 RSVPs</span>
          </div>
          <div className="flex -space-x-2 mb-4">
            {["MR","JT","AL","SC","DK","PW"].map((init, idx) => (
              <div
                key={init}
                className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0
                  ${["bg-teal-500","bg-blue-500","bg-violet-500","bg-emerald-500","bg-orange-400","bg-pink-500"][idx]}`}
              >
                {init}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
              +17
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-border">
            <button type="button" disabled title="Calendar export is blocked in this preview" className="flex-1 bg-muted text-foreground text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-secondary transition-colors">
              <CalendarDays size={15} className="text-primary" /> Add to Calendar
            </button>
            <button type="button" disabled title="Event sharing is blocked in this preview until Luma sharing is approved" className="flex-1 bg-muted text-foreground text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-secondary transition-colors">
              <Share2 size={15} className="text-primary" /> Share
            </button>
          </div>
        </Card>

        {/* Event details */}
        <Card>
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Event Details</p>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} className="text-primary flex-shrink-0" />
              <span>Thursday, November 15 · 6:00 PM – 8:00 PM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-primary flex-shrink-0" />
              <span>TEST Ackerman Union 2100 · {memberContext.campusName} Campus</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={15} className="text-primary flex-shrink-0" />
              <span>Organized by <span className="text-primary font-semibold">TEST Marcus T.</span></span>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">About this event</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our TEST Intro GBM is the main event for TEST Rush Month — the first time potential new TEST members
            experience what {memberContext.chapterName} is all about. Come learn about our mission, meet current TEST members,
            and find out how to get involved in global health equity work.
          </p>
        </Card>

        {/* Points */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-amber-500 fill-amber-400" />
            <p className="font-bold text-foreground text-sm">Points Available</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-amber-100 text-center">
              <p className="text-amber-700 text-xs font-semibold mb-0.5">Attendance</p>
              <p className="text-foreground text-2xl font-extrabold">20</p>
              <p className="text-muted-foreground text-xs">check-in required</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-100 text-center">
              <p className="text-amber-700 text-xs font-semibold mb-0.5">Bring a Guest</p>
              <p className="text-foreground text-2xl font-extrabold">+10</p>
              <p className="text-muted-foreground text-xs">per new member</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── SCREEN · RSVP Confirmation ──────────────────────────────────────────────

function RsvpConfirmScreen({
  navigate,
  memberContext,
}: Readonly<{
  navigate: (s: Screen) => void;
  memberContext: MemberMobileIdentityContext;
}>) {
  return (
    <div className="pb-10 min-h-screen flex flex-col">
      <TopBar title="" onBack={() => navigate("event-detail")} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">{"You're RSVP'd!"}</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs leading-relaxed">
          {"We'll see you there. Don't forget to check in when you arrive to earn your points."}
        </p>

        {/* Event summary */}
        <Card className="w-full text-left mb-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Event Summary</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-primary" />
              <span>{memberContext.chapterName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-primary" />
              <span>Thu Nov 15 · 6:00 PM – 8:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <span>TEST Ackerman Union 2100 · {memberContext.campusName}</span>
            </div>
          </div>
        </Card>

        {/* Points reminder */}
        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} className="text-amber-500 fill-amber-400" />
            <span className="font-bold text-foreground text-sm">Attend and check in to earn</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 ml-7">20 points</p>
          <p className="text-xs text-amber-700 ml-7 mt-1">Scan the event QR code when you arrive</p>
        </div>

        {/* QR hint */}
        <div className="w-full bg-secondary/60 rounded-2xl p-3 mb-8 flex items-start gap-2">
          <QrCode size={18} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary font-medium text-left">
            Scan the event QR code at check-in to confirm attendance and earn points.
          </p>
        </div>

        <div className="w-full space-y-2.5">
          <PrimaryBtn label="Go to Check-In" onClick={() => navigate("checkin")} full icon={<QrCode size={16} />} />
          <SecondaryBtn label="Back to Events" onClick={() => navigate("events")} full />
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN · Check-In ───────────────────────────────────────────────────────

function CheckInScreen({
  navigate,
  memberContext,
}: Readonly<{
  navigate: (s: Screen) => void;
  memberContext: MemberMobileIdentityContext;
}>) {
  const [checked, setChecked] = useState(false);
  const selfLeaderboardRows = getVisibleMemberLeaderboardRows(memberContext, 3);

  return (
    <div className="pb-10 min-h-screen flex flex-col">
      <TopBar title="Check In" onBack={() => navigate("rsvp-confirm")} />
      <div className="flex-1 flex flex-col px-4 py-6">
        {!checked ? (
          <>
            {/* Event header */}
            <Card className="bg-secondary/50 border-secondary mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Pill label="RSVP'd" variant="green" />
              </div>
              <h2 className="font-extrabold text-foreground text-lg">TEST Intro GBM — TEST Rush Month</h2>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                <Clock size={13} />
                Thu Nov 15 · 6:00 PM – 8:00 PM
              </p>
            </Card>

            {/* QR area */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5 flex items-center gap-1.5">
                <QrCode size={13} /> Scan this QR code at the event
              </div>
              <div className="p-4 bg-card rounded-2xl shadow-sm border border-border mb-5">
                <QRCodeSVG size={188} />
              </div>
              <p className="text-muted-foreground text-sm mb-1.5">
                Or tap the button below to confirm check-in
              </p>
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm mb-6">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                Earn 20 points after check-in
              </div>
            </div>

            <button type="button"
              onClick={() => { setChecked(true); }}
              className="w-full bg-primary text-white py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <UserCheck size={20} /> Confirm Check-In
            </button>
          </>
        ) : (
          /* Success state */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-1">Checked in!</h1>
            <p className="text-4xl font-extrabold text-amber-500 mb-1 mt-2">+20 points</p>
            <p className="text-muted-foreground text-sm mb-8">Thanks for coming out, {memberContext.firstName}!</p>

            {/* Mini leaderboard */}
            <Card className="w-full bg-secondary/50 border-secondary text-left mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Chapter Leaderboard</p>
              {selfLeaderboardRows.map((m, i) => (
                <div key={m.name} className={cn("flex items-center gap-3 py-2 border-b border-border last:border-0", m.me && "font-bold text-primary")}>
                  <span className="text-sm w-5 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className="flex-1 text-sm">{m.me ? `${m.name} (you)` : m.name}</span>
                  <PointsPill pts={m.pts} />
                </div>
              ))}
            </Card>

            <div className="w-full space-y-2.5">
              <PrimaryBtn label="View All My Points" onClick={() => navigate("points")} full icon={<Trophy size={15} />} />
              <SecondaryBtn label="Back to Events" onClick={() => navigate("events")} full />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STORIES ──────────────────────────────────────────────────────────────────

type StorySource = "instagram" | "linkedin" | "youtube" | "loom" | "facebook" | "field";
type StoryType = "Field Story" | "Student Story" | "Chapter Highlight" | "Trip Moment" | "Event Highlight" | "Fundraising" | "Patient Voice";
type StoryFilter = "For You" | "Events" | "SLT" | "Fundraising" | "Leadership";

interface Story {
  id: string; title: string; caption: string; source: StorySource; type: StoryType;
  chapter: string; country: string; tag?: string; image: string | null; likes: number;
  mediaUrl?: string | null;
  liked?: boolean;
  views: number; date: string; featured: boolean; trending?: boolean;
  isVideo?: boolean; embedUrl?: string; duration?: string; quote?: string; body?: string; filters: StoryFilter[];
  eventRouteId?: string;
  persisted?: boolean;
  reactionStatus?: MemberStoryReactionReadbackStatus; mediaStatus?: MemberStory["mediaStatus"];
}

function stripTestPrefix(value: string) {
  return value.replace(/^TEST\s+/i, "").trim();
}

const stories: Story[] = [
  {
    id: "1", title: "TEST Students in Lima joined a Mobile Clinic this weekend",
    caption: "TEST Twenty-three MEDLIFE volunteers set up in San Juan de Lurigancho, seeing over 180 patients in a single day. This is why we show up.",
    source: "field", type: "Field Story", chapter: "TEST Nationwide", country: "TEST Peru", tag: "Featured",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=600&fit=crop&auto=format",
    likes: 214, views: 1847, date: "Jun 28, 2025", featured: true, trending: true,
    quote: '"TEST We didn\'t just hand out medicine — we listened." — TEST Ana, TEST Penn State MEDLIFE',
    body: "TEST On a humid Saturday morning in San Juan de Lurigancho, students from twelve different universities arrived before dawn. By 7am, the Mobile Clinic was fully operational. Nurses triaged patients while volunteers translated, escorted, and connected families to the services they needed. This clinic marks the 400th service event MEDLIFE has run in Lima alone.",
    filters: ["For You", "Leadership"],
  },
  {
    id: "2", title: "TEST UConn MEDLIFE chapter packed the room at their intro event",
    caption: "TEST Over 90 students showed up to learn about MEDLIFE's mission. The chapter is already planning their first fundraiser for September.",
    source: "instagram", type: "Chapter Highlight", chapter: "TEST UConn", country: "TEST USA",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=530&fit=crop&auto=format",
    likes: 88, views: 612, date: "Jun 25, 2025", featured: false, trending: false,
    filters: ["For You", "Events", "Leadership"],
  },
  {
    id: "3", title: "TEST Trip reflection: two weeks in Ecuador changed everything",
    caption: "TEST Cassandra from TEST Florida State shares what she learned in the cloud forests of Chimborazo Province — from patient care to community organizing.",
    source: "linkedin", type: "Student Story", chapter: "TEST Florida State", country: "TEST Ecuador",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=530&fit=crop&auto=format",
    likes: 143, views: 934, date: "Jun 22, 2025", featured: false, trending: true,
    quote: '"TEST I came to help. I left understanding what help actually means."',
    body: "TEST Cassandra spent fourteen days in Riobamba with a MEDLIFE team running environmental health assessments. She wrote about the moment she realized that medicine without infrastructure is incomplete — and why she's now leading a TEST Safe Homes fundraising campaign back at TEST FSU.",
    filters: ["For You", "Leadership"],
  },
  {
    id: "4", title: "TEST Safe Homes project update: 12 stoves, 4 weeks, one community",
    caption: "TEST The Cajamarca team completed Phase 2 of the smokeless stove installation project. Respiratory illness rates in this community are already declining.",
    source: "field", type: "Field Story", chapter: "TEST Program Staff", country: "TEST Peru", tag: "From the Field",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=530&fit=crop&auto=format",
    likes: 176, views: 1103, date: "Jun 19, 2025", featured: true,
    quote: '"TEST The family invited us in for lunch after we finished. That meal meant more than any metric."',
    body: "TEST Twelve smokeless stoves installed. Four weeks of community organizing. One neighborhood transformed. The Cajamarca Safe Homes team worked alongside local masons to build and install improved cookstoves that reduce indoor smoke exposure — a leading driver of childhood respiratory disease in highland Peru. Phase 3 begins in August.",
    filters: ["For You", "Fundraising"],
  },
  {
    id: "5", title: "TEST Why I joined MEDLIFE — a student interview",
    caption: "TEST Marcus from TEST Rutgers talks about growing up without healthcare access and why that shaped his decision to volunteer internationally.",
    source: "loom", type: "Student Story", chapter: "TEST Rutgers", country: "TEST USA",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=530&fit=crop&auto=format",
    likes: 97, views: 489, date: "Jun 17, 2025", featured: false, isVideo: true, duration: "6:34",
    embedUrl: "https://www.loom.com/embed/dQw4w9WgXcQ",
    filters: ["For You", "Leadership"],
  },
  {
    id: "6", title: "TEST Community health fair draws 300+ in Managua",
    caption: "TEST The Nicaragua team partnered with a local health center to run dental screenings, vision checks, and preventive health education for an entire Saturday.",
    source: "facebook", type: "Event Highlight", chapter: "TEST Miami MEDLIFE", country: "TEST Nicaragua",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=530&fit=crop&auto=format",
    likes: 61, views: 378, date: "Jun 14, 2025", featured: false,
    filters: ["For You", "Events"],
  },
  {
    id: "7", title: "TEST Fundraising milestone: $42,000 raised for Safe Homes 2025",
    caption: "TEST Seventeen chapters rallied to hit this goal before summer. Every dollar funds construction materials and community labor for stove and water filter projects.",
    source: "instagram", type: "Fundraising", chapter: "TEST National Campaign", country: "MEDLIFE", tag: "Trending",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=530&fit=crop&auto=format",
    likes: 203, views: 1542, date: "Jun 10, 2025", featured: false, trending: true,
    filters: ["For You", "Fundraising"],
  },
  {
    id: "8", title: "TEST A grandmother's story: forty years without access to a doctor",
    caption: "TEST Doña Carmen, 72, describes what it meant to finally receive a full health evaluation — and the student who sat with her through the wait.",
    source: "field", type: "Patient Voice", chapter: "TEST Program Staff", country: "TEST Guatemala", tag: "Patient Voice",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=530&fit=crop&auto=format",
    likes: 318, views: 2104, date: "Jun 6, 2025", featured: true,
    quote: '"TEST The young woman held my hand the whole time. I wasn\'t afraid anymore."',
    body: "TEST Doña Carmen walked two hours from her village to attend the MEDLIFE Mobile Clinic in Quetzaltenango. She had never seen a physician. A MEDLIFE student volunteer, TEST Priya from TEST Johns Hopkins, stayed with her through every step — translating from Spanish to Mam, explaining each test, and making sure she understood her diagnosis and next steps.",
    filters: ["For You", "Leadership"],
  },
  {
    id: "9", title: "TEST Yale chapter hosts pre-trip training weekend",
    caption: "TEST Forty-two students went through clinical skills workshops, cultural competency training, and logistics prep ahead of their July trip to Peru.",
    source: "youtube", type: "Chapter Highlight", chapter: "TEST Yale", country: "TEST USA",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=530&fit=crop&auto=format",
    likes: 54, views: 301, date: "Jun 2, 2025", featured: false, isVideo: true, duration: "4:12",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    filters: ["For You", "Events", "SLT", "Leadership"],
  },
];

const STORY_EVENT_CONTINUITY: Partial<Record<string, { eventId: number; campaign: CampaignTag }>> = {
  "2": { eventId: 1, campaign: "Rush Month" },
};

const sourceConfig: Record<StorySource, { label: string; color: string; bg: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#fff", bg: "linear-gradient(135deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)", icon: "IG" },
  linkedin:  { label: "LinkedIn",  color: "#fff", bg: "#0A66C2", icon: "in" },
  youtube:   { label: "YouTube",   color: "#fff", bg: "#FF0000", icon: "▶" },
  loom:      { label: "Loom",      color: "#fff", bg: "#625DF5", icon: "◉" },
  facebook:  { label: "Facebook",  color: "#fff", bg: "#1877F2", icon: "f"  },
  field:     { label: "Field Note",color: "#fff", bg: "#3D7A5A", icon: "✦" },
};

const STORY_FILTERS: StoryFilter[] = ["For You", "Events", "SLT", "Fundraising", "Leadership"];

// Mobile category circles — each gets a color + emoji for fast visual scanning
const STORY_CATEGORIES: { filter: StoryFilter; emoji: string; short: string; color: string; bg: string }[] = [
  { filter: "For You",        emoji: "✦",  short: "For You",  color: "#1B4B8E", bg: "#DBEAFE" },
  { filter: "Events",         emoji: "📅",  short: "Events",   color: "#DB2777", bg: "#FCE7F3" },
  { filter: "SLT",            emoji: "🧭",  short: "SLT",      color: "#D97706", bg: "#FEF3C7" },
  { filter: "Fundraising",    emoji: "🎯",  short: "Funds",    color: "#EA580C", bg: "#FFEDD5" },
  { filter: "Leadership",     emoji: "⭐",  short: "Leads",    color: "#7C3AED", bg: "#EDE9FE" },
];

function resolveStoryFilter(value?: string | null): StoryFilter {
  return STORY_FILTERS.find((filter) => filter === value) ?? "For You";
}

function getStoryById(value: string | null | undefined, availableStories: Story[] = stories) {
  if (!value) return null;
  return availableStories.find((story) => story.id === value) ?? null;
}

function getStoryByIdForFilter(
  value: string | null | undefined,
  filter: StoryFilter,
  availableStories: Story[] = stories,
) {
  const story = getStoryById(value, availableStories);

  if (!story || !story.filters.includes(filter)) {
    return null;
  }

  return story;
}

function buildStoriesHref({
  filter,
  storyId,
}: {
  filter: StoryFilter;
  storyId?: string | null;
}) {
  const params = new URLSearchParams();
  params.set("filter", filter);

  if (storyId) {
    params.set("story", storyId);
  }

  return `/app/stories?${params.toString()}`;
}

function getStoryPreviewHandle(chapter: string) {
  const normalized = stripTestPrefix(chapter).toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `TEST @${normalized || "medlife"}`;
}

function getStoryPreviewAvatarLabel(chapter: string) {
  return stripTestPrefix(chapter).charAt(0).toUpperCase() || "M";
}

function getStoryLoopEvent(storyId: string) {
  const continuity = STORY_EVENT_CONTINUITY[storyId];

  if (!continuity) {
    return null;
  }

  const event = ALL_EVENTS.find((candidate) => candidate.id === continuity.eventId);

  if (!event || !event.routeId) {
    return null;
  }

  return {
    event,
    campaign: continuity.campaign,
  };
}

function SourceBadge({ source }: { source: StorySource }) {
  const cfg = sourceConfig[source];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tracking-wide"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Mono', monospace" }}>
      <span className="opacity-90">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function StoryImage({ story, className }: { story: Story; className: string }) {
  if (story.image) {
    return <img src={story.image} alt={story.title} className={className} />;
  }

  const mediaCopy = getMemberStoryMediaSurfaceCopy(story.mediaStatus);

  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#e9eff8] px-8 text-center text-[#1b4b8e] ${className}`}
      role="img"
      aria-label={`${story.title}. ${mediaCopy.detail}`}
    >
      <Camera size={34} aria-hidden="true" />
      <p className="mt-3 text-sm font-bold">{mediaCopy.title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[#4c668b]">{mediaCopy.detail}</p>
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const variants: Record<string, string> = {
    "Featured":       "bg-primary/10 text-primary border border-primary/20",
    "Trending":       "bg-accent/10 text-accent-foreground border border-accent/30",
    "From the Field": "bg-[#3D7A5A]/10 text-[#3D7A5A] border border-[#3D7A5A]/20",
    "Patient Voice":  "bg-purple-100 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[tag] ?? "bg-muted text-muted-foreground border border-border"}`}
      style={{ fontFamily: "'DM Mono', monospace" }}>
      {tag === "Featured" && <Star size={10} />}
      {tag === "Trending" && <TrendingUp size={10} />}
      {tag}
    </span>
  );
}

function HeartBtn({ count, storyId, liked, onToggle }: { count: number; storyId: string; liked: boolean; onToggle: (id: string) => void }) {
  void storyId;
  void liked;
  void onToggle;

  return (
    <button
      type="button"
      disabled
      title="Preview-only reaction. Likes are not saved, synced, or counted as production proof."
      className="flex cursor-not-allowed items-center gap-1.5 text-sm text-muted-foreground opacity-75"
    >
      <span className="relative transition-transform duration-200">
        <Heart size={16} className="fill-transparent" />
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>
        {count.toLocaleString()} preview likes
      </span>
    </button>
  );
}

// ── Mobile-only immersive story card ─────────────────────────────────────────
// Full-bleed image, title overlaid on gradient, dark chrome below.
// Completely different from the desktop StoryCard.

function MobileStoryCard({ story, liked, onToggleLike, onClick }: {
  story: Story;
  liked: boolean;
  onToggleLike: (id: string) => void;
  onClick: (s: Story) => void;
}) {
  void liked;
  void onToggleLike;

  return (
    <div
      onClick={() => onClick(story)}
      className="w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Full-bleed image with overlaid text — 4:5 portrait ratio */}
      <div className="relative w-full" style={{ aspectRatio: "4/5" }}>
        <StoryImage story={story} className="h-full w-full object-cover" />

        {/* Gradient: light at top, heavy at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Top row: source badge left, tag right */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          <SourceBadge source={story.source} />
          <div className="flex flex-col items-end gap-1.5">
            {story.tag && <TagBadge tag={story.tag} />}
            {story.featured && !story.tag && <TagBadge tag="Featured" />}
            {story.trending && <TagBadge tag="Trending" />}
          </div>
        </div>

        {/* Video play button */}
        {story.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center">
              <Play size={26} className="text-white ml-1.5" />
            </div>
            {story.duration && (
              <span
                className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-0.5 rounded"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {story.duration}
              </span>
            )}
          </div>
        )}

        {/* Title only — overlaid on gradient at the bottom of the image */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16">
          <h2
            className="text-white text-2xl font-bold leading-snug"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {story.title}
          </h2>
        </div>
      </div>

      {/* Slim engagement strip — no caption or description text */}
      <div className="bg-[#111827] px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          disabled
          title="Preview-only reaction. Likes are not saved, synced, or counted as production proof."
          className="flex cursor-not-allowed items-center gap-2 text-sm text-white/50 opacity-75"
        >
          <span className="relative transition-transform duration-200">
            <Heart
              size={18}
              className="fill-transparent"
            />
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>
            {story.likes}
          </span>
        </button>

        <div className="flex items-center gap-3 text-white/40 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
          <span>{story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}k` : story.views} views</span>
          <span className="opacity-40">·</span>
          <span>{story.date}</span>
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ story }: { story: Story }) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
        <StoryImage story={story} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/30" />
        <button type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 group"
        >
          <div
            className="rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white transition-all duration-200"
            style={{ width: 64, height: 64 }}
          >
            <Play size={26} className="text-primary ml-1.5" />
          </div>
          {story.duration && (
            <span className="text-white text-xs bg-black/50 px-2 py-0.5 rounded"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.duration}
            </span>
          )}
        </button>
        <div className="absolute top-3 left-3">
          <SourceBadge source={story.source} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
      {story.mediaUrl ? (
        <MemberStoryVideo src={story.mediaUrl} title={story.title} />
      ) : story.embedUrl ? (
        <iframe
          src={`${story.embedUrl}?autoplay=1`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={story.title}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
          Video unavailable
        </div>
      )}
    </div>
  );
}

// ── StoryCard ─────────────────────────────────────────────────────────────────
// Mobile:  full-width vertical stack, large readable type
// Desktop: editorial grid with featured 2-col hero

function StoryCard({ story, liked, onToggleLike, onClick, featured }: {
  story: Story; liked: boolean; onToggleLike: (id: string) => void; onClick: (s: Story) => void; featured?: boolean;
}) {
  if (featured) {
    return (
      <div onClick={() => onClick(story)}
        className="group relative overflow-hidden rounded-2xl cursor-pointer bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl">

        {/* ── Mobile: stacked (image top, text below) ── */}
        <div className="md:hidden">
          <div className="relative overflow-hidden bg-muted aspect-[16/9]">
            <StoryImage story={story} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {story.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play size={22} className="text-primary ml-1" />
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {story.featured && <TagBadge tag="Featured" />}
              {story.trending && <TagBadge tag="Trending" />}
            </div>
            {/* Title overlaid on image for impact */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white/80 text-xs font-semibold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                {story.type} · {story.country}
              </p>
              <h2 className="text-white text-xl font-bold leading-snug"
                style={{ fontFamily: "'Playfair Display', serif" }}>{story.title}</h2>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2"><SourceBadge source={story.source} /></div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-4">
                <HeartBtn count={story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
                <span className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {story.views.toLocaleString()} preview views
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{story.date}</span>
            </div>
          </div>
        </div>

        {/* ── Desktop: 2-col side-by-side ── */}
        <div className="hidden md:grid md:grid-cols-2 min-h-[340px]">
          <div className="relative overflow-hidden bg-muted" style={{ minHeight: "280px" }}>
            <StoryImage story={story} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
            {story.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-card/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Play size={22} className="text-primary ml-1" />
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {story.featured && <TagBadge tag="Featured" />}
              {story.trending && <TagBadge tag="Trending" />}
            </div>
          </div>
          <div className="flex flex-col justify-between p-7 md:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <SourceBadge source={story.source} />
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{story.type}</span>
              </div>
              <h2 className="text-2xl leading-snug font-semibold text-foreground group-hover:text-primary transition-colors duration-200"
                style={{ fontFamily: "'Playfair Display', serif" }}>{story.title}</h2>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HeartBtn count={story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{story.views.toLocaleString()} preview views</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={11} /><span>{story.country}</span>
                <span className="opacity-40">·</span><span>{story.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular card ─────────────────────────────────────────────────────────────
  return (
    <div onClick={() => onClick(story)}
      className="group relative overflow-hidden rounded-xl cursor-pointer bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col">

      {/* Image */}
      <div className="relative overflow-hidden bg-muted aspect-[16/9] flex-shrink-0">
        <StoryImage story={story} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {story.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-card/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
              <Play size={18} className="text-primary ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3"><SourceBadge source={story.source} /></div>
        {story.tag && <div className="absolute top-3 right-3"><TagBadge tag={story.tag} /></div>}
        {story.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded" style={{ fontFamily: "'DM Mono', monospace" }}>{story.duration}</span>
          </div>
        )}
      </div>

      {/* Text — larger on mobile, compact on desktop */}
      <div className="flex flex-col flex-1 p-4 md:p-4 gap-2 md:gap-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
          <span>{story.type}</span><span className="opacity-30">·</span><span>{story.chapter}</span>
        </div>

        {/* Mobile: text-lg, Desktop: text-base */}
        <h3 className="text-lg md:text-base leading-snug font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>{story.title}</h3>

        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <div className="flex items-center gap-3">
            <HeartBtn count={story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
            {/* View count: larger text on mobile */}
            <span className="text-sm md:text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}k` : story.views} preview views
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm md:text-xs text-muted-foreground">
            <MapPin size={11} /><span>{story.country}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryModal({
  story,
  reactionsEnabled,
  reactionReadbackStatus,
  closeHref,
  activeFilter,
}: {
  story: Story;
  reactionsEnabled: boolean; reactionReadbackStatus: MemberStoryReactionReadbackStatus;
  closeHref: string;
  activeFilter: StoryFilter;
}) {
  const cfg = sourceConfig[story.source];
  const reactionCopy = getMemberStoryReactionSurfaceCopy(reactionsEnabled, reactionReadbackStatus);
  const loopEventsHref = buildEventsHref({
    source: "stories",
    storyFilter: activeFilter,
  });
  const showLoopContinuity = activeFilter === "Events";
  const previewLoopEvent = showLoopContinuity ? getStoryLoopEvent(story.id) : null;
  const loopEventRouteId = story.eventRouteId ?? previewLoopEvent?.event.routeId ?? null;
  const loopEventCampaign = previewLoopEvent?.campaign ?? null;
  const loopEventDetailHref = loopEventRouteId
    ? buildPersistedStoryEventHref(loopEventRouteId, activeFilter, story.id, loopEventCampaign)
    : null;
  const loopEventPointsHref = loopEventRouteId
    ? (() => {
        const url = new URL("https://mymedlife.local/app/points?source=stories");
        url.searchParams.set("event", loopEventRouteId);
        url.searchParams.set("storyFilter", activeFilter);
        if (loopEventCampaign) url.searchParams.set("campaign", loopEventCampaign);
        url.searchParams.set("story", String(story.id));
        return `${url.pathname}${url.search}`;
      })()
    : null;
  const loopEventProfileHref = loopEventRouteId
    ? (() => {
        const url = new URL("https://mymedlife.local/profile?source=stories");
        url.searchParams.set("event", loopEventRouteId);
        url.searchParams.set("storyFilter", activeFilter);
        if (loopEventCampaign) url.searchParams.set("campaign", loopEventCampaign);
        url.searchParams.set("story", String(story.id));
        return `${url.pathname}${url.search}`;
      })()
    : null;
  const loopPointsHref: string = loopEventRouteId
    ? loopEventPointsHref ?? "/app/points?source=stories"
    : getEventsBottomNavPointsHref("stories", null, null, activeFilter) ?? "/app/points?source=stories";
  const loopProfileHref: string = loopEventRouteId
    ? loopEventProfileHref ?? getStoriesBottomNavProfileHref(activeFilter)
    : getStoriesBottomNavProfileHref(activeFilter);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card sm:items-center sm:justify-center sm:p-6 sm:bg-foreground/40 sm:backdrop-blur-sm">
      <Link href={closeHref} aria-label="Close story reader" className="absolute inset-0 hidden sm:block" />
      <div className="relative w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:shadow-2xl bg-card overflow-hidden flex flex-col z-10">
        {story.isVideo ? (
          <div className="flex-shrink-0 relative">
            <VideoPlayer story={story} />
            <Link href={closeHref} aria-label="Back to stories feed" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white z-10">
              <ArrowLeft size={18} />
            </Link>
          </div>
        ) : (
          <div className="relative flex-shrink-0 bg-muted aspect-[16/9]">
            <StoryImage story={story} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <Link href={closeHref} aria-label="Back to stories feed" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Link href={closeHref} aria-label="Close story reader" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hidden sm:flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <X size={16} />
            </Link>
            <div className="absolute bottom-3 left-4 flex items-center gap-2 flex-wrap">
              <SourceBadge source={story.source} />
              {story.tag && <TagBadge tag={story.tag} />}
              {story.featured && !story.tag && <TagBadge tag="Featured" />}
            </div>
            {story.duration && <span className="absolute bottom-3 right-4 bg-black/70 text-white text-xs px-2 py-0.5 rounded" style={{ fontFamily: "'DM Mono', monospace" }}>{story.duration}</span>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="px-5 pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap" style={{ fontFamily: "'DM Mono', monospace" }}>
              <span>{cfg.label}</span>
              <span className="opacity-30">·</span>
              <span>{story.type}</span>
              <span className="opacity-30">·</span>
              <MapPin size={10} />
              <span>{story.country}</span>
              <span className="opacity-30">·</span>
              <span>{story.chapter}</span>
              <span className="opacity-30">·</span>
              <span>{story.date}</span>
            </div>
            <h2 className="text-[1.7rem] font-bold leading-snug text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {story.title}
            </h2>
            <p className="text-[17px] text-foreground/80 leading-relaxed">{story.caption}</p>
            {story.quote && (
              <blockquote className="border-l-4 border-primary pl-4 py-1 text-lg italic text-foreground/75 leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
                {story.quote}
              </blockquote>
            )}
            {story.body && <p className="text-base text-foreground/75 leading-[1.8]">{story.body}</p>}
            {showLoopContinuity && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Stay in the TEST member loop
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                  This TEST story opened from the member events lane. Keep the same mobile shell context as you move into events,
                  points, and profile readback.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={loopEventDetailHref ?? loopEventsHref}
                    className="inline-flex items-center rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white"
                  >
                    {loopEventDetailHref ? "Open TEST event detail" : "Open TEST events"}
                  </Link>
                  <Link
                    href={loopPointsHref}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary"
                  >
                    Open TEST points
                  </Link>
                  <Link
                    href={loopProfileHref}
                    className="inline-flex items-center rounded-full border border-border px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    Open TEST profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 px-5 py-4 border-t border-border flex items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-3">
            {story.persisted && reactionsEnabled && story.reactionStatus === "ready" ? (
              <MemberStoryReactionForm storyId={story.id} liked={story.liked ?? false} reactionCount={story.likes} filter={activeFilter} openStory showCount />
            ) : (
              <button
                type="button"
                disabled
                title={story.persisted
                  ? "Reactions are disabled by the current write gate."
                  : "Preview-only reaction. Likes are not saved, synced, or counted as production proof."}
                className="inline-flex cursor-not-allowed items-center gap-2 opacity-75"
              >
                <Heart size={20} className="text-black" />
                <span className="text-sm font-semibold text-foreground">
                  {getMemberStoryReactionCountLabel(story)}
                </span>
              </button>
            )}
            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.persisted
                ? "View tracking not enabled"
                : `${story.views.toLocaleString()} preview views`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled title={story.persisted ? "Story saving is not enabled yet" : "Story saving is blocked in this preview"} className="flex cursor-not-allowed items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground opacity-75">
              <Bookmark size={15} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button type="button" disabled title={story.persisted ? "No approved external source link is available" : "External source links are blocked in this preview until feed-sharing approval is complete"} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white opacity-75 cursor-not-allowed" style={{ background: cfg.bg }}>
              <ExternalLink size={14} /> {cfg.label}
            </button>
          </div>
        </div>
        <div className="border-t border-border bg-card px-5 pb-4">
          <p className="pt-3 text-center text-[11px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            {story.persisted ? reactionCopy.readerNote : "Preview only - reactions, save preview, and source previews stay blocked in this reader."}
          </p>
        </div>
      </div>
    </div>
  );
}

function buildPersistedStoryEventHref(
  eventRouteId: string,
  filter: StoryFilter,
  storyId: string,
  campaign: string | null,
) {
  const url = new URL(`https://mymedlife.local/app/events/${eventRouteId}`);
  url.searchParams.set("source", "stories");
  url.searchParams.set("storyFilter", filter);
  if (campaign) url.searchParams.set("campaign", campaign);
  url.searchParams.set("story", storyId);
  return `${url.pathname}${url.search}`;
}

function StoriesScreen({
  initialFilter,
  initialStoryId,
  initialReactionResult,
  memberStories,
  reactionsEnabled,
  reactionReadbackStatus,
}: {
  initialFilter?: string | null;
  initialStoryId?: string | null;
  initialReactionResult?: string | null;
  memberStories?: MemberStory[];
  reactionsEnabled: boolean; reactionReadbackStatus: MemberStoryReactionReadbackStatus;
}) {
  const availableStories: Story[] = memberStories ?? stories;
  const isPersistedFeed = memberStories !== undefined;
  const activeFilter = resolveStoryFilter(initialFilter);
  const selectedStory = getStoryByIdForFilter(initialStoryId, activeFilter, availableStories);
  const reactionCopy = getMemberStoryReactionSurfaceCopy(reactionsEnabled, reactionReadbackStatus);

  const filtered = availableStories.filter((s) => s.filters.includes(activeFilter));
  const closeHref = buildStoriesHref({ filter: activeFilter });

  return (
    <>
      <div className="bg-white min-h-full pb-24" aria-label="MEDLIFE Stories">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 pt-12 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/app" aria-label="Back to student home" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-black transition active:scale-[0.97]">
                <ArrowLeft size={16} />
              </Link>
              <div className="min-w-0 leading-none">
                <h1 className="truncate text-xl font-bold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Stories
                </h1>
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  {isPersistedFeed ? reactionCopy.subtitle : "MEDLIFE Stories · preview-only student feed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-400 text-xs">
                {isPersistedFeed ? reactionCopy.status : "Preview"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {STORY_CATEGORIES.map((category) => {
              const isActive = activeFilter === category.filter;
              return (
                <Link href={buildStoriesHref({ filter: category.filter })} key={category.filter} aria-label={`Apply story filter: ${category.filter}`} title={`Apply story filter: ${category.filter}`} aria-current={isActive ? "true" : undefined} aria-pressed={isActive} className={cn(
                  "flex-shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                  isActive ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-500"
                )}>
                  <span
                    className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                    style={{ background: isActive ? "rgba(255,255,255,0.18)" : category.bg }}
                    aria-hidden="true"
                  >
                    {category.emoji}
                  </span>
                  {category.short}
                </Link>
              );
            })}
          </div>
        </div>

        <MemberStoryReactionResultBanner result={initialReactionResult} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Heart size={28} className="text-gray-300" />
            <p className="text-gray-400 text-sm">No stories here yet.</p>
          </div>
        ) : (
          <div>
            {filtered.map((story) => {
              const handle = getStoryPreviewHandle(story.chapter);
              const storyHref = buildStoriesHref({ filter: activeFilter, storyId: story.id });

              return (
                <div key={story.id} className="border-b border-gray-200">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: sourceConfig[story.source].bg.startsWith("linear") ? "#e6683c" : sourceConfig[story.source].bg }}
                      >
                        {getStoryPreviewAvatarLabel(story.chapter)}
                      </div>
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold text-black">{handle}</p>
                        <p className="text-[11px] text-gray-400">{sourceConfig[story.source].label}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Story options are blocked in this preview."
                      className="text-black px-1 py-1 text-lg font-bold leading-none tracking-tighter cursor-not-allowed opacity-60"
                    >
                      ···
                    </button>
                  </div>

                  <Link
                    href={storyHref}
                    className="relative block w-full bg-gray-100 cursor-pointer"
                    style={{ aspectRatio: "1/1" }}
                  >
                    <StoryImage story={story} className="h-full w-full object-cover" />
                    {story.isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/40 border-[3px] border-white flex items-center justify-center">
                          <Play size={28} className="text-white ml-1.5 fill-white" />
                        </div>
                      </div>
                    )}
                  </Link>

                  <div className="px-3 pt-2">
                    <div className="flex items-center">
                      <div className="flex items-center gap-4 flex-1">
                        {story.persisted && reactionsEnabled && story.reactionStatus === "ready" ? (
                          <MemberStoryReactionForm storyId={story.id} liked={story.liked ?? false} reactionCount={story.likes} filter={activeFilter} />
                        ) : (
                          <button
                            type="button"
                            disabled
                            title={story.persisted
                              ? "Reactions are disabled by the current write gate."
                              : "Preview-only reaction. Likes are not saved, synced, or counted as production proof."}
                            className="cursor-not-allowed opacity-70"
                          >
                            <Heart size={26} className="text-black" />
                          </button>
                        )}
                        <Link
                          href={storyHref}
                          title="Open this story in the route-backed preview reader."
                        >
                          <MessageSquare size={24} className="text-black" />
                        </Link>
                        <button
                          type="button"
                          disabled
                          title={story.persisted
                            ? "Sharing is not enabled for approved stories yet."
                            : "Sharing is blocked in this preview until publishing approval is complete."}
                          className="cursor-not-allowed opacity-60"
                        >
                          <Share2 size={23} className="text-black" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled
                        title={story.persisted
                          ? "Saving is not enabled for approved stories yet."
                          : "Saving stories is blocked in this preview."}
                        className="cursor-not-allowed opacity-60"
                      >
                        <Bookmark size={23} className="text-black" />
                      </button>
                    </div>

                    <p className="text-[13px] font-semibold text-black mt-1.5 mb-1">
                      {getMemberStoryReactionCountLabel(story)}
                    </p>

                    <p className="text-[13px] text-black leading-snug">
                      <span className="font-semibold">{handle} </span>
                      {story.title}
                    </p>

                    <Link
                      href={storyHref}
                      className="text-[13px] text-gray-400 mt-0.5 block"
                    >
                      Read more
                    </Link>

                    <p
                      className="mt-1 text-[11px] text-gray-400"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {story.persisted ? reactionCopy.feedNote : "Preview only - comments open the reader; shares and saves stay blocked."}
                    </p>

                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1 pb-3">
                      {story.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal — shared between both versions */}
      {selectedStory && (
        <StoryModal
          story={selectedStory}
          reactionsEnabled={reactionsEnabled}
          reactionReadbackStatus={reactionReadbackStatus}
          closeHref={closeHref}
          activeFilter={activeFilter}
        />
      )}
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const STUDENT_SCREENS: Screen[] = ["home", "campaign", "action", "evidence", "confirm", "points", "events", "event-detail", "rsvp-confirm", "checkin", "stories"];

export function FigmaMemberMobileHome({
  initialScreen = "home",
  sltPrepEntry = null,
  initialStoriesFilter = null,
  initialStoryId = null,
  initialStoryReactionResult = null,
  memberStoryReactionsEnabled = false,
  memberStoryReactionReadbackStatus = "unavailable",
  initialEventsCampaign = null,
  pointsSource = "points",
  pointsReturnEventId = null,
  pointsReturnCampaign = null,
  pointsStoryFilter = null,
  pointsStoryId = null,
  pointsReadback = null,
  eventsSource = "events",
  eventsProfileSource = null,
  eventsStoryFilter = null,
  memberContext = DEFAULT_MEMBER_IDENTITY_CONTEXT,
  memberEvents,
  memberCampaign = null,
  memberStories,
  repaintKey,
}: {
  initialScreen?: MemberMobileLaunchScreen;
  sltPrepEntry?: MemberSltPrepEntry | null;
  initialStoriesFilter?: string | null;
  initialStoryId?: string | null;
  initialStoryReactionResult?: string | null;
  memberStoryReactionsEnabled?: boolean; memberStoryReactionReadbackStatus?: MemberStoryReactionReadbackStatus;
  initialEventsCampaign?: string | null;
  pointsSource?: MemberLoopSource;
  pointsReturnEventId?: string | null;
  pointsReturnCampaign?: string | null;
  pointsStoryFilter?: string | null;
  pointsStoryId?: string | null;
  pointsReadback?: LaunchLaneMemberPointsReadback | null;
  eventsSource?: MemberLoopSource;
  eventsProfileSource?: "points" | null;
  eventsStoryFilter?: string | null;
  memberContext?: MemberMobileIdentityContext;
  memberEvents?: MemberMobileEventContext[];
  memberCampaign?: MemberMobileCampaignContext | null;
  memberStories?: MemberStory[];
  repaintKey?: string;
}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);

  function navigate(s: Screen) {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }
  const isStudentScreen = STUDENT_SCREENS.includes(screen);
  const activeBottomTab: MemberBottomNavTab =
    screen === "stories"
      ? "stories"
      : screen === "points"
        ? "points"
        : ["events", "event-detail", "rsvp-confirm", "checkin"].includes(screen)
          ? "events"
          : "home";
  const profileHref = screen === "home"
    ? "/profile?source=home"
    : screen === "stories"
      ? getStoriesReaderProfileHref(initialStoriesFilter, initialStoryId)
      : screen === "points"
        ? getPointsBottomNavProfileHref(
            pointsSource,
            pointsReturnEventId,
            pointsReturnCampaign,
            pointsStoryFilter,
            pointsStoryId,
          )
        : "/profile";
  const bottomNavHrefOverrides = getMemberBottomNavHrefOverrides({
    screen,
    eventsCampaign: initialEventsCampaign,
    pointsSource,
    pointsReturnEventId,
    pointsReturnCampaign,
    pointsStoryFilter,
    pointsStoryId,
    eventsSource,
    eventsProfileSource,
    eventsStoryFilter,
  });
  const content = () => {
    switch (screen) {
      case "home":
        return (
          <StudentHome
            navigate={navigate}
            sltPrepEntry={sltPrepEntry}
            memberContext={memberContext}
            memberEvents={memberEvents}
            memberCampaign={memberCampaign}
          />
        );
      case "campaign":
        return (
          <CampaignPage
            navigate={navigate}
            memberContext={memberContext}
            memberEvents={memberEvents}
            memberCampaign={memberCampaign}
          />
        );
      case "action": return <ActionDetail navigate={navigate} />;
      case "evidence": return <EvidenceSubmission navigate={navigate} />;
      case "confirm": return <Confirmation navigate={navigate} />;
      case "points":
        return (
          <PointsLeaderboard
            source={pointsSource}
            returnEventId={pointsReturnEventId}
            returnCampaign={pointsReturnCampaign}
            storyFilter={pointsStoryFilter}
            storyId={pointsStoryId}
            pointsReadback={pointsReadback}
            memberContext={memberContext}
          />
        );
      case "events":
        return (
          <EventsScreen
            navigate={navigate}
            source={eventsSource}
            initialCampaign={initialEventsCampaign}
            profileSource={eventsProfileSource}
            storyFilter={eventsStoryFilter}
            memberContext={memberContext}
            memberEvents={memberEvents}
            memberCampaign={memberCampaign}
          />
        );
      case "event-detail": return <EventDetailScreen navigate={navigate} memberContext={memberContext} />;
      case "rsvp-confirm": return <RsvpConfirmScreen navigate={navigate} memberContext={memberContext} />;
      case "checkin": return <CheckInScreen navigate={navigate} memberContext={memberContext} />;
      case "stories":
        return (
          <StoriesScreen
            initialFilter={initialStoriesFilter}
            initialStoryId={initialStoryId}
            initialReactionResult={initialStoryReactionResult}
            memberStories={memberStories}
            reactionsEnabled={memberStoryReactionsEnabled}
            reactionReadbackStatus={memberStoryReactionReadbackStatus}
          />
        );
      case "leader": return <LeadershipDashboard navigate={navigate} />;
      case "assign": return <AssignAction navigate={navigate} />;
      case "review": return <ReviewEvidence navigate={navigate} />;
      case "coach": return <CoachDashboard navigate={navigate} />;
      case "admin": return <AdminDashboard navigate={navigate} />;
      default:
        return (
          <StudentHome
            navigate={navigate}
            sltPrepEntry={sltPrepEntry}
            memberContext={memberContext}
          />
        );
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-start justify-center bg-[#D6E0F0] py-0 font-[Plus_Jakarta_Sans,sans-serif] md:py-8"
    >
      {isStudentScreen ? (
        /* Phone frame for mobile screens */
        <ChromeDesktopPaintShell repaintKey={repaintKey} className="relative flex min-h-screen w-full max-w-[430px] min-h-0 flex-col overflow-hidden bg-background [backface-visibility:hidden] [transform:translateZ(0)] md:h-[812px] md:min-h-0 md:rounded-[44px] md:border-4 md:border-white/40 md:shadow-2xl">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            {content()}
          </div>
          {!["confirm", "event-detail", "rsvp-confirm", "checkin"].includes(screen) && (
            <MemberBottomNav
              activeTab={activeBottomTab}
              profileHref={profileHref}
              hrefOverrides={bottomNavHrefOverrides}
            />
          )}
        </ChromeDesktopPaintShell>
      ) : (
        /* Full width for dashboards */
        <ChromeDesktopPaintShell repaintKey={repaintKey} className="w-full min-h-screen overflow-hidden bg-background [backface-visibility:hidden] [transform:translateZ(0)] md:max-w-5xl md:rounded-2xl md:shadow-xl">
          {content()}
        </ChromeDesktopPaintShell>
      )}

      {/* Global scrollbar hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>
    </div>
  );
}

function getMemberBottomNavHrefOverrides({
  screen,
  eventsCampaign,
  pointsSource,
  pointsReturnEventId,
  pointsReturnCampaign,
  pointsStoryFilter,
  pointsStoryId,
  eventsSource,
  eventsProfileSource,
  eventsStoryFilter,
}: {
  screen: Screen;
  eventsCampaign: string | null;
  pointsSource: MemberLoopSource;
  pointsReturnEventId: string | null;
  pointsReturnCampaign: string | null;
  pointsStoryFilter: string | null;
  pointsStoryId: string | null;
  eventsSource: MemberLoopSource;
  eventsProfileSource: "points" | null;
  eventsStoryFilter: string | null;
}): Partial<Record<MemberBottomNavTab, string>> | undefined {
  const overrides: Partial<Record<MemberBottomNavTab, string>> = {};

  if (screen === "points") {
    overrides.events = getPointsBottomNavEventsHref(
      pointsSource,
      pointsReturnEventId,
      pointsReturnCampaign,
      pointsStoryFilter,
      pointsStoryId,
    );
  }

  if (screen === "events") {
    const pointsHref = getEventsBottomNavPointsHref(
      eventsSource,
      eventsCampaign,
      eventsProfileSource,
      eventsStoryFilter,
      pointsStoryId,
    );

    if (pointsHref) {
      overrides.points = pointsHref;
    }

    const profileHref = getEventsBottomNavProfileHref(
      eventsSource,
      eventsCampaign,
      eventsProfileSource,
      eventsStoryFilter,
    );

    if (profileHref) {
      overrides.profile = profileHref;
    }
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function getPointsBottomNavEventsHref(
  source: MemberLoopSource,
  returnEventId: string | null,
  returnCampaign: string | null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  const campaignSuffix =
    returnCampaign && returnCampaign !== "All"
      ? `&campaign=${encodeURIComponent(returnCampaign)}`
      : "";

  if (source === "events") {
    return returnEventId
      ? `/app/events/${returnEventId}?source=points${campaignSuffix}`
      : `/app/events?source=points${campaignSuffix}`;
  }

  if (source === "home") {
    return returnEventId
      ? `/app/events/${returnEventId}?source=home${campaignSuffix}`
      : `/app/events?source=home${campaignSuffix}`;
  }

  if (source === "profile") {
    return returnEventId
      ? `/app/events/${returnEventId}?source=profile&profileSource=points${campaignSuffix}`
      : `/app/events?source=profile${campaignSuffix}`;
  }

  if (source === "stories") {
    const url = new URL(
      `https://mymedlife.local${
        returnEventId ? `/app/events/${returnEventId}?source=stories` : "/app/events?source=stories"
      }`,
    );

    if (returnCampaign && returnCampaign !== "All") {
      url.searchParams.set("campaign", returnCampaign);
    }

    if (storyFilter) {
      url.searchParams.set("storyFilter", storyFilter);
    }

    if (storyId) {
      url.searchParams.set("story", storyId);
    }

    return `${url.pathname}${url.search}`;
  }

  return campaignSuffix ? `/app/events?source=points${campaignSuffix}` : "/app/events";
}

function getPointsBottomNavProfileHref(
  source: MemberLoopSource,
  returnEventId: string | null,
  returnCampaign: string | null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  if (source === "stories") {
    return getStoriesBottomNavProfileHref(storyFilter, returnCampaign, storyId);
  }

  const campaignSuffix =
    returnCampaign && returnCampaign !== "All"
      ? `&campaign=${encodeURIComponent(returnCampaign)}`
      : "";

  if (returnEventId) {
    return `/profile?source=points&event=${returnEventId}${campaignSuffix}`;
  }

  return screenlessProfileHref(source, returnCampaign);
}

function getStoriesBottomNavProfileHref(
  storyFilter: string | null,
  campaign: string | null = null,
  storyId: string | null = null,
) {
  const url = new URL("https://mymedlife.local/profile?source=stories");

  if (storyFilter) {
    url.searchParams.set("storyFilter", storyFilter);
  }

  if (campaign && campaign !== "All") {
    url.searchParams.set("campaign", campaign);
  }

  if (storyId) {
    url.searchParams.set("story", storyId);
  }

  return `${url.pathname}${url.search}`;
}

function getStoriesReaderProfileHref(storyFilter: string | null, storyId: string | null) {
  const resolvedFilter = resolveStoryFilter(storyFilter);
  const story = getStoryByIdForFilter(storyId, resolvedFilter);
  if (!story) return getStoriesBottomNavProfileHref(storyFilter);
  const loopEvent = getStoryLoopEvent(story.id);
  if (!loopEvent) return getStoriesBottomNavProfileHref(storyFilter);
  const url = new URL("https://mymedlife.local/profile?source=stories");
  url.searchParams.set("event", loopEvent.event.routeId ?? "");
  url.searchParams.set("storyFilter", resolvedFilter);
  url.searchParams.set("campaign", loopEvent.campaign);
  url.searchParams.set("story", String(story.id));
  return `${url.pathname}${url.search}`;
}

function screenlessProfileHref(
  source: MemberLoopSource,
  campaign: string | null = null,
) {
  const url = new URL(
    `https://mymedlife.local${source === "home" ? "/profile?source=home" : "/profile?source=points"}`,
  );

  if (campaign && campaign !== "All") {
    url.searchParams.set("campaign", campaign);
  }

  return `${url.pathname}${url.search}`;
}

function buildEventsProfileReturnHref(
  profileSource: "points" | null,
  campaign: string | null,
) {
  if (profileSource === "points") {
    return screenlessProfileHref("points", campaign);
  }

  if (campaign && campaign !== "All") {
    const url = new URL("https://mymedlife.local/profile");
    url.searchParams.set("campaign", campaign);
    return `${url.pathname}${url.search}`;
  }

  return null;
}

function getEventsBottomNavPointsHref(
  source: MemberLoopSource,
  campaign: string | null,
  profileSource: "points" | null = null,
  storyFilter: string | null = null,
  storyId: string | null = null,
) {
  const campaignSuffix =
    campaign && campaign !== "All"
      ? `&campaign=${encodeURIComponent(campaign)}`
      : "";
  if (source === "points") {
    return `/app/points?source=events${campaignSuffix}`;
  }

  if (source === "home") {
    return `/app/points?source=home${campaignSuffix}`;
  }

  if (source === "profile") {
    return `/app/points?source=${profileSource === "points" ? "points" : "profile"}${campaignSuffix}`;
  }

  if (source === "stories") {
    const url = new URL("https://mymedlife.local/app/points?source=stories");

    if (campaign && campaign !== "All") {
      url.searchParams.set("campaign", campaign);
    }

    if (storyFilter) {
      url.searchParams.set("storyFilter", storyFilter);
    }

    if (storyId) {
      url.searchParams.set("story", storyId);
    }

    return `${url.pathname}${url.search}`;
  }

  return undefined;
}

function getEventsBottomNavProfileHref(
  source: MemberLoopSource,
  campaign: string | null,
  profileSource: "points" | null,
  storyFilter: string | null = null,
) {
  const campaignSuffix =
    campaign && campaign !== "All"
      ? `&campaign=${encodeURIComponent(campaign)}`
      : "";

  if (source === "home") {
    return `/profile?source=home${campaignSuffix}`;
  }
  if (source === "points") {
    return `/profile?source=points${campaignSuffix}`;
  }

  if (source === "stories") {
    return getStoriesBottomNavProfileHref(storyFilter, campaign);
  }

  if (source === "profile" && campaignSuffix) {
    if (profileSource === "points") {
      return `/profile?source=points${campaignSuffix}`;
    }

    return `/profile?campaign=${encodeURIComponent(campaign ?? "")}`;
  }

  if (source === "profile" && profileSource === "points") {
    return "/profile?source=points";
  }

  return undefined;
}
