"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */

import Link from "next/link";
import React, { useState } from "react";
import {
  Home, BarChart2, CalendarDays, Trophy, User, Users,
  ChevronRight, ChevronLeft, CheckCircle2, Clock, Circle,
  AlertTriangle, Upload, Link2, FileText, Camera,
  Star, Shield, Bell, Award, ThumbsUp,
  MessageSquare, TrendingUp, Check, X,
  ArrowRight, Plus, Flag, Activity, MapPin,
  Target, Zap, Eye, Settings,
  Share2, QrCode, Download, UserCheck, Copy,
  Heart, ExternalLink, Play, Bookmark, Sparkles, ArrowLeft
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

type Role = "student" | "leader" | "coach" | "admin";

type UserDesignation =
  | "General Member"
  | "E-Board"
  | "Staff"
  | "DS"
  | "Sales"
  | "Super Admin";

// Which designations can access each privileged view
const VIEW_ACCESS: Record<"leader" | "coach" | "admin", UserDesignation[]> = {
  leader: ["E-Board"],
  coach:  ["Staff", "DS", "Sales", "Super Admin"],
  admin:  ["DS", "Super Admin"],
};

const VIEW_LABELS: Record<"leader" | "coach" | "admin", string> = {
  leader: "Leader Hub",
  coach:  "Coach View",
  admin:  "Admin",
};

const MEMBER_EVENT_DETAIL_HREFS: Record<number, string> = {
  1: "/app/events/chapter-event-ucla-kickoff?source=events",
  2: "/app/events/chapter-event-lakeside-welcome?source=events",
  3: "/app/events/chapter-event-boston-info-night?source=events",
  4: "/app/events/chapter-event-ucsd-service-social?source=events",
  5: "/app/events/chapter-event-mcgill-coffee-chat?source=events",
};

function getMemberEventDetailHref(eventId: number) {
  return MEMBER_EVENT_DETAIL_HREFS[eventId] ?? "/app/events";
}

function getMemberEventRsvpHref(eventId: number) {
  const detailHref = getMemberEventDetailHref(eventId);
  return detailHref.includes("?") ? `${detailHref}&step=rsvp` : `${detailHref}?step=rsvp`;
}

function getMemberEventHomeRsvpHref(eventId: number) {
  return getMemberEventRsvpHref(eventId).replace("source=events", "source=home");
}

function getMemberEventHomeDetailHref(eventId: number) {
  return getMemberEventDetailHref(eventId).replace("source=events", "source=home");
}

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
    <button onClick={onClick} disabled={!onClick}
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
    <button onClick={onClick} disabled={!onClick}
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

// ─── Bottom Nav ─────────────────────────────────────────────────────────────

function BottomNav({ active, navigate }: { active: Screen; navigate: (s: Screen) => void }) {
  const items: { id: Screen | "profile"; label: string; Icon: typeof Home }[] = [
    { id: "home",    label: "Home",    Icon: Home },
    { id: "stories", label: "Stories", Icon: Sparkles },
    { id: "events",  label: "Events",  Icon: CalendarDays },
    { id: "points",  label: "Points",  Icon: Trophy },
    { id: "profile", label: "Profile", Icon: User },
  ];
  const EVENT_SCREENS: Screen[] = ["events", "event-detail", "rsvp-confirm", "checkin"];
  const STORY_SCREENS: Screen[] = ["stories"];
  return (
    <nav
      aria-label="Member bottom navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50 flex pb-safe"
    >
      {items.map(({ id, label, Icon }, idx) => {
        const isActive = label === "Events"
          ? EVENT_SCREENS.includes(active)
          : label === "Stories"
          ? STORY_SCREENS.includes(active)
          : active === id && label !== "Profile";
        const strokeWidth = isActive ? 2.5 : 1.8;
        const routeHref = id === "events"
          ? "/app/events"
          : id === "stories"
          ? "/app/stories"
          : id === "points"
          ? "/app/points"
          : id === "profile"
          ? "/profile"
          : id === "home"
          ? "/app"
          : null;
        const className = cn(
          "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        );

        if (routeHref) {
          return (
            <Link key={idx} href={routeHref} className={className}>
              <Icon size={20} strokeWidth={strokeWidth} />
              <span>{label}</span>
            </Link>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => navigate(id as Screen)}
            className={className}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            {label}
          </button>
        );
      })}
    </nav>
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
          <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-muted text-foreground">
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
  setRole,
}: {
  navigate: (s: Screen) => void;
  setRole: (r: Role) => void;
}) {
  const allDesignations: UserDesignation[] = ["General Member", "E-Board", "Staff", "DS", "Sales", "Super Admin"];
  const [designation, setDesignation] = useState<UserDesignation>("General Member");
  const permitted = (["leader", "coach", "admin"] as const).filter(
    (v) => VIEW_ACCESS[v].includes(designation)
  );

  return (
    <div className="pb-24 font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Blue header */}
      <div className="bg-primary px-5 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">UCLA MEDLIFE</p>
            <h1 className="text-white text-2xl font-extrabold mt-1">Hi, Sofia 👋</h1>
            <p className="text-blue-200 text-sm mt-1">You are making a difference.</p>
          </div>
          <button disabled title="Notifications are blocked in this preview" className="relative p-2.5 rounded-xl bg-white/10 mt-1">
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
            Invite 3 friends to the Intro GBM
          </p>
          <p className="text-blue-200 text-xs mt-1">Rush Month · Due Nov 15 · 30 pts</p>
          <Link
            href={getMemberEventHomeDetailHref(1)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-all active:scale-[0.97]"
          >
            Start next action <ArrowRight size={14} />
          </Link>
        </div>

        {/* Points card — sits directly below priority in the blue zone */}
        <Link
          href="/app/points"
          className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 transition-transform hover:bg-white/15 active:scale-[0.98]"
        >
          <div>
            <p className="text-blue-200 text-xs font-semibold">My Points · Rush Month</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-white text-3xl font-extrabold">145</span>
              <span className="text-blue-200 text-sm font-medium">pts earned</span>
            </div>
            <p className="text-blue-200 text-xs mt-0.5">+75 this week · Chapter rank #3</p>
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
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Upcoming Events — first block */}
        <div>
          <SLabel>Upcoming Events</SLabel>
          <div className="space-y-2">
            {[
              { id: 1, name: "Intro GBM", date: "Thu Nov 15 · 6:00 PM", loc: "Ackerman 2100", rsvp: false },
              { id: 2, name: "Tabling at Bruin Walk", date: "Tue Nov 13 · 11:00 AM", loc: "Bruin Walk Table 7", rsvp: true },
            ].map((e, i) => (
              <Card key={e.id} padding={false}>
                <div className="flex items-center gap-3 p-4">
                  <Link href={getMemberEventHomeDetailHref(e.id)} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin size={9} className="flex-shrink-0" />{e.loc}
                      </p>
                    </div>
                  </Link>
                  {e.rsvp ? (
                    <Link href={getMemberEventHomeDetailHref(e.id)}><Pill label="RSVP'd" variant="green" /></Link>
                  ) : (
                    <Link
                      href={getMemberEventHomeRsvpHref(e.id)}
                      onClick={(event) => event.stopPropagation()}
                      className="flex-shrink-0 rounded-xl border border-primary/50 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                    >
                      RSVP
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active campaign */}
        <div>
          <SLabel>Active Campaign</SLabel>
          <Link href="/app/events" className="block">
            <Card padding={false}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill label="Active" variant="green" />
                    <Pill label="Week 1 of 4" variant="blue" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">Rush Month</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Recruit new members, build your chapter.</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Your progress</span>
                      <span className="font-semibold">1 / 3 actions done</span>
                    </div>
                    <Bar pct={33} />
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground ml-3 mt-1 flex-shrink-0" />
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-secondary/30 rounded-b-2xl">
              <span className="text-xs text-muted-foreground">Chapter: 67% complete</span>
              <span className="text-xs font-semibold text-primary">22 / 34 members active</span>
            </div>
            </Card>
          </Link>
        </div>

        {/* Take Action: My Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Take Action: My Tasks</SLabel>
            <button onClick={() => navigate("action")} className="text-primary text-xs font-semibold">See all</button>
          </div>
          <div className="space-y-2">
            {[
              { title: "Invite 3 friends to the Intro GBM", due: "Nov 15", pts: 30, status: "Not started", variant: "gray" as const },
              { title: "Share Rush Week flyer on Instagram", due: "Nov 14", pts: 20, status: "In progress", variant: "blue" as const },
              { title: "Add 5 leads to the spreadsheet", due: "Nov 16", pts: 25, status: "Submitted", variant: "yellow" as const },
            ].map((a, i) => (
              <Card key={i} onClick={() => navigate("action")} padding={false}>
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0">
                    {a.status === "Submitted" ? (
                      <Clock size={22} className="text-amber-500" />
                    ) : a.status === "In progress" ? (
                      <div className="w-[22px] h-[22px] rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                      </div>
                    ) : (
                      <Circle size={22} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {a.due} · <span className="font-semibold text-primary">{a.pts} pts</span>
                    </p>
                  </div>
                  <Pill label={a.status} variant={a.variant} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SLabel>Chapter Leaderboard</SLabel>
            <Link href="/app/points" className="text-primary text-xs font-semibold">Full board</Link>
          </div>
          <Card>
            {[
              { rank: 1, name: "Aisha N.", pts: 220, me: false },
              { rank: 2, name: "Marcus T.", pts: 185, me: false },
              { rank: 3, name: "Sofia R.", pts: 145, me: true },
              { rank: 4, name: "James L.", pts: 130, me: false },
            ].map((m) => (
              <div key={m.rank} className={cn("flex items-center gap-3 py-3 border-b border-border last:border-0", m.me && "bg-primary/5 -mx-4 px-4 rounded-xl")}>
                <span className="w-6 text-center text-sm">{m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : m.rank}</span>
                <span className={cn("flex-1 text-sm", m.me ? "font-extrabold text-primary" : "font-medium")}>
                  {m.me ? "You (Sofia R.)" : m.name}
                </span>
                <span className="text-sm font-bold text-foreground font-[DM_Mono,monospace]">{m.pts} pts</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Coach message */}
        <Card className="bg-secondary/60 border-secondary">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold">DK</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-foreground">Coach David Kim</p>
                <span className="text-xs text-muted-foreground">· Nov 12</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                "Great energy this week, UCLA! Focus on Intro GBM follow-ups — this is where we convert interest into members. Keep it up."
              </p>
            </div>
          </div>
        </Card>

        {/* Permission-gated views */}
        <div className="space-y-3">
          <div>
            <SLabel>Assigned Permissions</SLabel>
            <div className="flex gap-1.5 flex-wrap">
              {allDesignations.map((r) => (
                <button
                  key={r}
                  onClick={() => setDesignation(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    designation === r
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {permitted.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Views</p>
              <div className={cn("grid gap-2", permitted.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                {permitted.map((v) => (
                  <button
                    key={v}
                    onClick={() => { setRole(v); navigate(v); }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
                  >
                    {v === "leader" ? <Users size={16} className="text-primary" /> : v === "coach" ? <Award size={16} className="text-primary" /> : <Settings size={16} className="text-primary" />}
                    {VIEW_LABELS[v]}
                    <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2 · Campaign — Rush Month ────────────────────────────────────────

function CampaignPage({ navigate }: { navigate: (s: Screen) => void }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const kpis = [
    { label: "Leads Captured", value: 47, total: 80, pct: 59 },
    { label: "Intro GBM RSVPs", value: 23, total: 50, pct: 46 },
    { label: "Follow-ups Done", value: 18, total: 47, pct: 38 },
    { label: "New Members", value: 9, total: 25, pct: 36 },
  ];
  const goodLooks = [
    "Every member has at least 1 assigned action",
    "Intro GBM event is live on Luma with RSVP link",
    "Chapter tabled at least 2x this week",
    "Follow-up messages sent within 24h of first touch",
    "KPIs reviewed in weekly E-Board meeting",
  ];
  return (
    <div className="pb-24">
      <TopBar title="" onBack={() => navigate("home")} />

      {/* Campaign header */}
      <div className="bg-primary px-5 pt-5 pb-7">
        <Pill label="Active · Week 1 of 4" variant="blue" />
        <h1 className="text-white text-2xl font-extrabold mt-2">Rush Month</h1>
        <p className="text-blue-200 text-sm mt-1.5 leading-relaxed">
          Recruit new members and help them feel welcomed into MEDLIFE.
        </p>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-blue-200">
            <span>Chapter progress</span>
            <span className="font-bold text-white">67%</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "67%" }} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Phase indicator */}
        <Card className="border-primary/30 bg-secondary/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Flag size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Current Phase</p>
              <p className="text-sm font-bold text-foreground mt-0.5">Week 1: Visibility + Lead Capture</p>
              <p className="text-xs text-muted-foreground mt-0.5">Nov 11 – Nov 17</p>
            </div>
          </div>
        </Card>

        {/* Why it matters */}
        <Card className="overflow-hidden" padding={false}>
          <button
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
              Rush Month is how chapters grow. Every member recruited becomes a potential leader,
              volunteer, and advocate for global health equity. Strong chapters start with strong rush execution.
            </div>
          )}
        </Card>

        {/* KPIs */}
        <div>
          <SLabel>Campaign KPIs</SLabel>
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k) => (
              <Card key={k.label}>
                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-extrabold text-foreground">{k.value}</span>
                  <span className="text-xs text-muted-foreground">/ {k.total}</span>
                </div>
                <div className="mt-2 space-y-1">
                  <Bar pct={k.pct} color={k.pct >= 60 ? "bg-emerald-500" : k.pct >= 40 ? "bg-primary" : "bg-amber-400"} />
                  <p className="text-[10px] text-muted-foreground font-semibold">{k.pct}% of goal</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions by role */}
        <div>
          <SLabel>Assigned Actions by Role</SLabel>
          <div className="space-y-2">
            {[
              { role: "General Members", count: 3, done: 1, example: "Invite friends · Share flyer · Add leads" },
              { role: "Action Committee Chairs", count: 5, done: 3, example: "Coordinate tabling · Track leads · Brief members" },
              { role: "E-Board", count: 6, done: 4, example: "Review KPIs · Manage Luma · Assign tasks" },
              { role: "President / VP", count: 4, done: 4, example: "Coach check-in · Approve evidence · Drive decisions" },
            ].map((r) => (
              <Card key={r.role} onClick={() => navigate("action")} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground">{r.role}</p>
                    <span className="text-xs text-muted-foreground font-semibold font-[DM_Mono,monospace]">
                      {r.done}/{r.count} done
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{r.example}</p>
                  <Bar pct={Math.round((r.done / r.count) * 100)} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* What good looks like */}
        <div>
          <SLabel>What Good Looks Like</SLabel>
          <Card>
            <div className="space-y-3">
              {goodLooks.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Luma event */}
        <Card className="border-primary/20 bg-secondary/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Intro GBM</p>
                <Pill label="Luma" variant="purple" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Thu Nov 15 · 6:00 PM · Ackerman 2100</p>
              <p className="text-xs text-primary font-semibold mt-1">23 RSVPs so far</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground mt-0.5" />
          </div>
        </Card>

        {/* CTAs */}
        <div className="space-y-2.5 pt-2">
          <PrimaryBtn label="View my actions" onClick={() => navigate("action")} full icon={<ArrowRight size={16} />} />
          <SecondaryBtn label="Submit evidence" onClick={() => navigate("evidence")} full />
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 3 · Action Detail ─────────────────────────────────────────────────

function ActionDetail({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="pb-32">
      <TopBar title="Action Detail" onBack={() => navigate("campaign")} />

      <div className="px-4 pt-5 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill label="Rush Month" variant="blue" />
            <Pill label="Not started" variant="gray" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground leading-snug">
            Invite 3 friends to the Intro GBM
          </h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              Due Nov 15
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              Assigned by Marcus T.
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-4 z-40">
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
    <div className="pb-32">
      <TopBar title="Submit Evidence" onBack={() => navigate("action")} />

      <div className="px-4 pt-5 space-y-5">
        {/* Assignment summary */}
        <Card className="bg-secondary/50 border-secondary">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Submitting for</p>
          <p className="text-sm font-bold text-foreground">Invite 3 friends to the Intro GBM</p>
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
              <button
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
            <button disabled title="File uploads are blocked in this preview until storage approval is complete" className="w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 py-10 hover:border-primary/40 hover:bg-muted/50 transition-colors">
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
                placeholder="I invited Sofia, Marcus, and Priya. Two of them RSVPd on Luma and one said they would come..."
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-4 z-40">
        <PrimaryBtn
          label="Submit for review"
          onClick={() => navigate("confirm")}
          full
          icon={<ArrowRight size={16} />}
        />
        <p className="text-xs text-center text-muted-foreground mt-2">
          Your leader will review and approve within 24–48 hours.
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
        Marcus T. will review your submission within 24–48 hours. You will earn 30 points once approved.
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
        <button onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
          <ChevronLeft size={16} />
          Student view
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">UCLA MEDLIFE</p>
            <h1 className="text-white text-2xl font-extrabold mt-1">Leader Hub</h1>
          </div>
          <button disabled title="Notifications are blocked in this preview" className="relative p-2.5 bg-white/10 rounded-xl">
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
            <button disabled title="Full member list is available in the leader workspace" className="text-primary text-xs font-semibold">All members</button>
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
            <button onClick={() => navigate("review")} className="text-primary text-xs font-semibold">
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
                  <button
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
                  <button
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
                  <button
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
                  <button
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
                    <button disabled title="Full evidence preview is blocked in this review shell" className="text-xs text-primary font-semibold mt-1">View full</button>
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
                  <button
                    onClick={() => setReviewed((r) => ({ ...r, [item.id]: "approved" }))}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                  >
                    <ThumbsUp size={14} />
                    Approve +{item.pts}
                  </button>
                  <button
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
        <button onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
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
                    <button
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
        <button onClick={() => navigate("home")} className="flex items-center gap-1 text-blue-200 text-sm mb-4">
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

function PointsLeaderboard({ navigate }: { navigate: (s: Screen) => void }) {
  const badges = [
    { name: "Rush Starter", desc: "Complete first Rush Month action", earned: true },
    { name: "Connector", desc: "Invite 10+ members to a chapter event", earned: true },
    { name: "Evidence Pro", desc: "3 approvals in a single week", earned: false },
    { name: "Chapter MVP", desc: "Top 3 on leaderboard for 2 weeks", earned: false },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-8">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">UCLA MEDLIFE</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Points & Recognition</h1>
        <p className="text-blue-200 text-sm mt-1">Points come from meaningful action.</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Total Points", value: "145" },
            { label: "This Week", value: "+75" },
            { label: "Chapter Rank", value: "#3" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-blue-200 text-[10px] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Points by campaign */}
        <div>
          <SLabel>Points by Campaign</SLabel>
          <Card>
            <div className="space-y-3">
              {[
                { campaign: "Rush Month", pts: 75, max: 150, color: "bg-primary" },
                { campaign: "Spring Showcase (prev.)", pts: 45, max: 100, color: "bg-emerald-500" },
                { campaign: "Community Health Fair", pts: 25, max: 80, color: "bg-amber-400" },
              ].map((c) => (
                <div key={c.campaign}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{c.campaign}</span>
                    <span className="font-bold text-foreground font-[DM_Mono,monospace]">{c.pts} / {c.max} pts</span>
                  </div>
                  <Bar pct={Math.round((c.pts / c.max) * 100)} color={c.color} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Badges */}
        <div>
          <SLabel>Badges Earned</SLabel>
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
        </div>

        {/* Leaderboard */}
        <div>
          <SLabel>Chapter Leaderboard — Rush Month</SLabel>
          <Card>
            {[
              { rank: 1, name: "Aisha N.", role: "President", pts: 220 },
              { rank: 2, name: "Marcus T.", role: "VP Outreach", pts: 185 },
              { rank: 3, name: "Sofia R.", role: "General Member", pts: 145, me: true },
              { rank: 4, name: "James L.", role: "General Member", pts: 130 },
              { rank: 5, name: "Priya K.", role: "Committee Chair", pts: 110 },
              { rank: 6, name: "Kevin M.", role: "General Member", pts: 95 },
            ].map((m) => (
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
                    {m.me ? "You (Sofia R.)" : m.name}
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
          <SLabel>Recent Approved Actions</SLabel>
          <div className="space-y-2">
            {[
              { action: "Share Rush Week flyer on Instagram", pts: 20, time: "Approved 2h ago" },
              { action: "Attend Bruin Walk tabling shift", pts: 15, time: "Approved yesterday" },
              { action: "Add 5 leads to the chapter spreadsheet", pts: 25, time: "Approved 3d ago" },
            ].map((a) => (
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
            ))}
          </div>
        </div>

        {/* How to earn */}
        <Card className="bg-secondary/50 border-secondary">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">How points work</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Points are earned by completing and submitting evidence for assigned chapter actions.
                They reflect real engagement — not just showing up, but contributing meaningfully to the mission.
              </p>
              <Link
                href="/app/events?source=points"
                className="inline-flex text-primary text-xs font-bold mt-2"
              >
                See how to earn more points →
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

type EventType =
  | "GBM" | "Fundraising" | "Local Volunteering" | "Growing the Movement"
  | "Meet People / Social" | "MED Talk" | "Pre-MED" | "Pre-Dental"
  | "Smiles Movement" | "Safe Homes" | "Engaged Education" | "SLT Prep"
  | "SLT Reflection" | "Eboard Transition" | "Moving Mountains" | "Rush Month"
  | "Mentorship Meeting" | "Tutoring" | "Skills Session";

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
  id: number;
  title: string;
  date: string;
  loc: string;
  pts: number;
  status: "RSVP Open" | "Upcoming" | "Completed";
  campaign: CampaignTag | "General";
  eventType: EventType;
  featured?: boolean;
  luma?: boolean;
  organizer?: string;
  rsvps?: number;
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
    description: "Raise funds for smokeless stoves and water filters in Peru.",
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
  { id: 1,  title: "Intro GBM",                   date: "Thu Nov 15 · 6:00 PM", loc: "Ackerman Union 2100",       pts: 20, status: "RSVP Open",  campaign: "Rush Month",          eventType: "GBM",                  featured: true, luma: true, organizer: "Marcus T.", rsvps: 23 },
  { id: 2,  title: "Tabling at Bruin Walk",        date: "Tue Nov 13 · 11 AM",   loc: "Bruin Walk Table 7",        pts: 15, status: "RSVP Open",  campaign: "Rush Month",          eventType: "Local Volunteering"    },
  { id: 3,  title: "Rush Week Social",             date: "Sat Nov 18 · 7:00 PM", loc: "Student Activities Center", pts: 10, status: "Upcoming",   campaign: "Rush Month",          eventType: "Meet People / Social"  },
  { id: 4,  title: "Rush Month Recap GBM",         date: "Mon Nov 25 · 6:30 PM", loc: "Boelter 4413",              pts: 15, status: "Upcoming",   campaign: "Rush Month",          eventType: "GBM"                   },
  { id: 5,  title: "Spring Showcase Kickoff",      date: "Fri Jan 10 · 5:00 PM", loc: "Covel Commons",             pts: 20, status: "Upcoming",   campaign: "Spring Showcase",     eventType: "Growing the Movement"  },
  { id: 6,  title: "Showcase Planning Meeting",    date: "Tue Jan 14 · 6:00 PM", loc: "Powell 320",                pts: 10, status: "Upcoming",   campaign: "Spring Showcase",     eventType: "Growing the Movement"  },
  { id: 7,  title: "Fundraising Bake Sale",        date: "Wed Nov 20 · 11 AM",   loc: "Bruin Plaza",               pts: 20, status: "Upcoming",   campaign: "Safe Homes Fundraiser", eventType: "Fundraising"         },
  { id: 8,  title: "Donor Info Night",             date: "Thu Nov 21 · 7:00 PM", loc: "Ackerman 2100",             pts: 15, status: "Upcoming",   campaign: "Safe Homes Fundraiser", eventType: "Fundraising"         },
  { id: 9,  title: "Health Fair Planning Session", date: "Wed Dec 4 · 5:30 PM",  loc: "Engineering VI 289",        pts: 10, status: "Upcoming",   campaign: "Community Health Fair", eventType: "Engaged Education"   },
  { id: 10, title: "First Aid Training",           date: "Sat Nov 30 · 10 AM",   loc: "Bunche Hall 1209A",         pts: 30, status: "RSVP Open",  campaign: "General",             eventType: "Skills Session"        },
  { id: 11, title: "Member Orientation",           date: "Wed Nov 22 · 5:30 PM", loc: "Engineering VI 289",        pts: 25, status: "Upcoming",   campaign: "General",             eventType: "Growing the Movement"  },
];

function EventsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeCampaign, setActiveCampaign] = useState<CampaignTag | "All">("All");
  const rsvpdIds = [2];

  const visibleEvents = activeCampaign === "All"
    ? ALL_EVENTS
    : ALL_EVENTS.filter((e) => e.campaign === activeCampaign);

  const featuredEvent = visibleEvents.find((e) => e.featured);
  const listEvents = visibleEvents.filter((e) => !e.featured);

  const activeCampaignData = activeCampaign !== "All"
    ? CAMPAIGNS.find((c) => c.name === activeCampaign)
    : null;

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">UCLA MEDLIFE</p>
        <h1 className="text-white text-2xl font-extrabold mt-1">Events</h1>
        <p className="text-blue-200 text-sm mt-0.5">Show up. Check in. Earn points.</p>
      </div>

      {/* Campaign filter chips */}
      <div className="bg-primary px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCampaign("All")}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all",
              activeCampaign === "All"
                ? "bg-white text-primary border-white"
                : "bg-white/15 text-white border-white/30 hover:bg-white/25"
            )}
          >
            All Events
          </button>
          {CAMPAIGNS.map((c) => (
            <button
              key={c.name}
              onClick={() => setActiveCampaign(c.name)}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                activeCampaign === c.name
                  ? "bg-white text-primary border-white"
                  : "bg-white/15 text-white border-white/30 hover:bg-white/25"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Campaign context card — shown when a campaign is selected */}
        {activeCampaignData && (
          <div className={`bg-gradient-to-r ${activeCampaignData.color} rounded-2xl p-4`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-white/70 text-xs font-semibold">{activeCampaignData.phase}</p>
                <h2 className="text-white text-lg font-extrabold mt-0.5">{activeCampaignData.name}</h2>
                <p className="text-white/80 text-xs mt-1 leading-relaxed max-w-[220px]">
                  {activeCampaignData.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-white text-2xl font-extrabold">{activeCampaignData.progress}%</p>
                <p className="text-white/60 text-[10px]">complete</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${activeCampaignData.progress}%` }} />
            </div>
            <p className="text-white/60 text-xs mt-2">
              {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} in this campaign
            </p>
          </div>
        )}

        {/* Empty state */}
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
                <Pill label="RSVP Open" variant="green" />
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
                <Link
                  href={getMemberEventRsvpHref(featuredEvent.id)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  RSVP
                </Link>
                <Link
                  href={getMemberEventDetailHref(featuredEvent.id)}
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
                return (
                  <div
                    key={ev.id}
                    className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer active:scale-[0.99] transition-transform hover:border-primary/20"
                    style={{ borderLeft: `4px solid ${typeCfg.color}` }}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Color-matched icon */}
                      <Link href={getMemberEventDetailHref(ev.id)} className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: typeCfg.bg }}
                        >
                          <CalendarDays size={18} style={{ color: typeCfg.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Type pill on its own line — instantly scannable */}
                          <EventTypePill type={ev.eventType} />
                          <p className="text-sm font-bold text-foreground leading-snug mt-1">{ev.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.date}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                            <MapPin size={9} className="flex-shrink-0" />{ev.loc}
                          </p>
                        </div>
                      </Link>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <PointsPill pts={ev.pts} />
                        {isRsvpd ? (
                          <Pill label="RSVP'd" variant="green" />
                        ) : ev.status === "RSVP Open" ? (
                          <Link
                            href={getMemberEventRsvpHref(ev.id)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border hover:opacity-80"
                            style={{ color: typeCfg.text, borderColor: `${typeCfg.color}50`, background: typeCfg.bg }}
                          >
                            RSVP
                          </Link>
                        ) : (
                          <Pill label="Upcoming" variant="gray" />
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

function EventDetailScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [rsvpd, setRsvpd] = useState(false);

  return (
    <div className="pb-24">

      {/* ── Blue header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary to-blue-700 px-5 pt-12 pb-8">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("events")}
            className="bg-white/15 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/25 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="text-white text-sm font-bold uppercase tracking-widest">Event RSVP</p>
          <button disabled title="Event sharing is blocked in this preview until Luma sharing is approved" className="bg-white/15 backdrop-blur-sm text-white rounded-full p-2.5 hover:bg-white/25 transition-colors">
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
              <Pill label="Rush Month" variant="blue" />
            </div>
            <h1 className="text-white text-2xl font-extrabold leading-snug">Intro GBM</h1>
            <p className="text-blue-200 text-sm mt-1">UCLA MEDLIFE · Thu Nov 15 · 6:00 PM</p>
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
          <button
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
            <button disabled title="Calendar export is blocked in this preview" className="flex-1 bg-muted text-foreground text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-secondary transition-colors">
              <CalendarDays size={15} className="text-primary" /> Add to Calendar
            </button>
            <button disabled title="Event sharing is blocked in this preview until Luma sharing is approved" className="flex-1 bg-muted text-foreground text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-secondary transition-colors">
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
              <span>Ackerman Union 2100 · UCLA Campus</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={15} className="text-primary flex-shrink-0" />
              <span>Organized by <span className="text-primary font-semibold">Marcus T.</span></span>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card>
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">About this event</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our Intro GBM is the main event for Rush Month — the first time potential new members
            experience what UCLA MEDLIFE is all about. Come learn about our mission, meet current members,
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

function RsvpConfirmScreen({ navigate }: { navigate: (s: Screen) => void }) {
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
              <CalendarDays size={14} className="text-primary" />
              <span>Thu Nov 15 · 6:00 PM – 8:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <span>Ackerman Union 2100 · UCLA</span>
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

function CheckInScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [checked, setChecked] = useState(false);

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
              <h2 className="font-extrabold text-foreground text-lg">Intro GBM — Rush Month</h2>
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

            <button
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
            <p className="text-muted-foreground text-sm mb-8">Thanks for coming out, Sofia!</p>

            {/* Mini leaderboard */}
            <Card className="w-full bg-secondary/50 border-secondary text-left mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Chapter Leaderboard</p>
              {[
                { name: "Aisha N.", pts: 220 },
                { name: "Marcus T.", pts: 185 },
                { name: "Sofia R. (you)", pts: 165, me: true },
              ].map((m, i) => (
                <div key={m.name} className={cn("flex items-center gap-3 py-2 border-b border-border last:border-0", m.me && "font-bold text-primary")}>
                  <span className="text-sm w-5 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className="flex-1 text-sm">{m.name}</span>
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
type StoryFilter = "For You" | "My Chapter" | "Field Stories" | "Student Stories" | "Trip Moments" | "Events" | "Featured";

interface Story {
  id: number; title: string; caption: string; source: StorySource; type: StoryType;
  chapter: string; country: string; tag?: string; image: string; likes: number;
  views: number; date: string; featured: boolean; trending?: boolean;
  isVideo?: boolean; embedUrl?: string; duration?: string; quote?: string; body?: string; filters: StoryFilter[];
}

const stories: Story[] = [
  {
    id: 1, title: "Students in Lima joined a Mobile Clinic this weekend",
    caption: "Twenty-three MEDLIFE volunteers set up in San Juan de Lurigancho, seeing over 180 patients in a single day. This is why we show up.",
    source: "field", type: "Field Story", chapter: "Nationwide", country: "Peru", tag: "Featured",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=600&fit=crop&auto=format",
    likes: 214, views: 1847, date: "Jun 28, 2025", featured: true, trending: true,
    quote: '"We didn\'t just hand out medicine — we listened." — Ana, Penn State MEDLIFE',
    body: "On a humid Saturday morning in San Juan de Lurigancho, students from twelve different universities arrived before dawn. By 7am, the Mobile Clinic was fully operational. Nurses triaged patients while volunteers translated, escorted, and connected families to the services they needed. This clinic marks the 400th service event MEDLIFE has run in Lima alone.",
    filters: ["For You", "Field Stories", "Featured"],
  },
  {
    id: 2, title: "UConn MEDLIFE chapter packed the room at their intro event",
    caption: "Over 90 students showed up to learn about MEDLIFE's mission. The chapter is already planning their first fundraiser for September.",
    source: "instagram", type: "Chapter Highlight", chapter: "UConn", country: "USA",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=530&fit=crop&auto=format",
    likes: 88, views: 612, date: "Jun 25, 2025", featured: false, trending: false,
    filters: ["For You", "My Chapter", "Events"],
  },
  {
    id: 3, title: "Trip reflection: two weeks in Ecuador changed everything",
    caption: "Cassandra from Florida State shares what she learned in the cloud forests of Chimborazo Province — from patient care to community organizing.",
    source: "linkedin", type: "Student Story", chapter: "Florida State", country: "Ecuador",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=530&fit=crop&auto=format",
    likes: 143, views: 934, date: "Jun 22, 2025", featured: false, trending: true,
    quote: '"I came to help. I left understanding what help actually means."',
    body: "Cassandra spent fourteen days in Riobamba with a MEDLIFE team running environmental health assessments. She wrote about the moment she realized that medicine without infrastructure is incomplete — and why she's now leading a Safe Homes fundraising campaign back at FSU.",
    filters: ["For You", "Student Stories", "Trip Moments"],
  },
  {
    id: 4, title: "Safe Homes project update: 12 stoves, 4 weeks, one community",
    caption: "The Cajamarca team completed Phase 2 of the smokeless stove installation project. Respiratory illness rates in this community are already declining.",
    source: "field", type: "Field Story", chapter: "Program Staff", country: "Peru", tag: "From the Field",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=530&fit=crop&auto=format",
    likes: 176, views: 1103, date: "Jun 19, 2025", featured: true,
    quote: '"The family invited us in for lunch after we finished. That meal meant more than any metric."',
    body: "Twelve smokeless stoves installed. Four weeks of community organizing. One neighborhood transformed. The Cajamarca Safe Homes team worked alongside local masons to build and install improved cookstoves that reduce indoor smoke exposure — a leading driver of childhood respiratory disease in highland Peru. Phase 3 begins in August.",
    filters: ["Field Stories", "Featured"],
  },
  {
    id: 5, title: "Why I joined MEDLIFE — a student interview",
    caption: "Marcus from Rutgers talks about growing up without healthcare access and why that shaped his decision to volunteer internationally.",
    source: "loom", type: "Student Story", chapter: "Rutgers", country: "USA",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=530&fit=crop&auto=format",
    likes: 97, views: 489, date: "Jun 17, 2025", featured: false, isVideo: true, duration: "6:34",
    embedUrl: "https://www.loom.com/embed/dQw4w9WgXcQ",
    filters: ["Student Stories", "For You"],
  },
  {
    id: 6, title: "Community health fair draws 300+ in Managua",
    caption: "The Nicaragua team partnered with a local health center to run dental screenings, vision checks, and preventive health education for an entire Saturday.",
    source: "facebook", type: "Event Highlight", chapter: "Miami MEDLIFE", country: "Nicaragua",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=530&fit=crop&auto=format",
    likes: 61, views: 378, date: "Jun 14, 2025", featured: false,
    filters: ["Events", "Field Stories"],
  },
  {
    id: 7, title: "Fundraising milestone: $42,000 raised for Safe Homes 2025",
    caption: "Seventeen chapters rallied to hit this goal before summer. Every dollar funds construction materials and community labor for stove and water filter projects.",
    source: "instagram", type: "Fundraising", chapter: "National Campaign", country: "MEDLIFE", tag: "Trending",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=530&fit=crop&auto=format",
    likes: 203, views: 1542, date: "Jun 10, 2025", featured: false, trending: true,
    filters: ["For You", "Featured"],
  },
  {
    id: 8, title: "A grandmother's story: forty years without access to a doctor",
    caption: "Doña Carmen, 72, describes what it meant to finally receive a full health evaluation — and the student who sat with her through the wait.",
    source: "field", type: "Patient Voice", chapter: "Program Staff", country: "Guatemala", tag: "Patient Voice",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=530&fit=crop&auto=format",
    likes: 318, views: 2104, date: "Jun 6, 2025", featured: true,
    quote: '"The young woman held my hand the whole time. I wasn\'t afraid anymore."',
    body: "Doña Carmen walked two hours from her village to attend the MEDLIFE Mobile Clinic in Quetzaltenango. She had never seen a physician. A MEDLIFE student volunteer, Priya from Johns Hopkins, stayed with her through every step — translating from Spanish to Mam, explaining each test, and making sure she understood her diagnosis and next steps.",
    filters: ["Field Stories", "Featured", "For You"],
  },
  {
    id: 9, title: "Yale chapter hosts pre-trip training weekend",
    caption: "Forty-two students went through clinical skills workshops, cultural competency training, and logistics prep ahead of their July trip to Peru.",
    source: "youtube", type: "Chapter Highlight", chapter: "Yale", country: "USA",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=530&fit=crop&auto=format",
    likes: 54, views: 301, date: "Jun 2, 2025", featured: false, isVideo: true, duration: "4:12",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    filters: ["Events", "My Chapter", "Trip Moments"],
  },
];

const sourceConfig: Record<StorySource, { label: string; color: string; bg: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#fff", bg: "linear-gradient(135deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)", icon: "IG" },
  linkedin:  { label: "LinkedIn",  color: "#fff", bg: "#0A66C2", icon: "in" },
  youtube:   { label: "YouTube",   color: "#fff", bg: "#FF0000", icon: "▶" },
  loom:      { label: "Loom",      color: "#fff", bg: "#625DF5", icon: "◉" },
  facebook:  { label: "Facebook",  color: "#fff", bg: "#1877F2", icon: "f"  },
  field:     { label: "Field Note",color: "#fff", bg: "#3D7A5A", icon: "✦" },
};

const STORY_FILTERS: StoryFilter[] = ["For You", "My Chapter", "Field Stories", "Student Stories", "Trip Moments", "Events", "Featured"];

// Mobile category circles — each gets a color + emoji for fast visual scanning
const STORY_CATEGORIES: { filter: StoryFilter; emoji: string; short: string; color: string; bg: string }[] = [
  { filter: "For You",        emoji: "✦",  short: "For You",  color: "#1B4B8E", bg: "#DBEAFE" },
  { filter: "My Chapter",     emoji: "🏛",  short: "Chapter",  color: "#16A34A", bg: "#DCFCE7" },
  { filter: "Field Stories",  emoji: "🌍",  short: "Field",    color: "#3D7A5A", bg: "#D1FAE5" },
  { filter: "Student Stories",emoji: "🎓",  short: "Students", color: "#7C3AED", bg: "#EDE9FE" },
  { filter: "Trip Moments",   emoji: "✈️",  short: "Trips",    color: "#EA580C", bg: "#FFEDD5" },
  { filter: "Events",         emoji: "📅",  short: "Events",   color: "#DB2777", bg: "#FCE7F3" },
  { filter: "Featured",       emoji: "⭐",  short: "Featured", color: "#D97706", bg: "#FEF3C7" },
];

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

function HeartBtn({ count, storyId, liked, onToggle }: { count: number; storyId: number; liked: boolean; onToggle: (id: number) => void }) {
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
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>{count}</span>
    </button>
  );
}

// ── Mobile-only immersive story card ─────────────────────────────────────────
// Full-bleed image, title overlaid on gradient, dark chrome below.
// Completely different from the desktop StoryCard.

function MobileStoryCard({ story, liked, onToggleLike, onClick }: {
  story: Story;
  liked: boolean;
  onToggleLike: (id: number) => void;
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
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover"
        />

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
        <img src={story.image} alt={story.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/30" />
        <button
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
      {story.embedUrl ? (
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
  story: Story; liked: boolean; onToggleLike: (id: number) => void; onClick: (s: Story) => void; featured?: boolean;
}) {
  if (featured) {
    return (
      <div onClick={() => onClick(story)}
        className="group relative overflow-hidden rounded-2xl cursor-pointer bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl">

        {/* ── Mobile: stacked (image top, text below) ── */}
        <div className="md:hidden">
          <div className="relative overflow-hidden bg-muted aspect-[16/9]">
            <img src={story.image} alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                  {story.views.toLocaleString()} views
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{story.date}</span>
            </div>
          </div>
        </div>

        {/* ── Desktop: 2-col side-by-side ── */}
        <div className="hidden md:grid md:grid-cols-2 min-h-[340px]">
          <div className="relative overflow-hidden bg-muted" style={{ minHeight: "280px" }}>
            <img src={story.image} alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{story.views.toLocaleString()} views</span>
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
        <img src={story.image} alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
              {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}k` : story.views} views
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

function StoryModal({ story, liked, onToggleLike, onClose }: {
  story: Story; liked: boolean; onToggleLike: (id: number) => void; onClose: () => void;
}) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); };
  }, [onClose]);
  const cfg = sourceConfig[story.source];
  return (
    /* ── Mobile: true full-screen story reader ── */
    <div className="fixed inset-0 z-50 flex flex-col bg-card sm:items-center sm:justify-center sm:p-6 sm:bg-foreground/40 sm:backdrop-blur-sm">

      {/* Desktop backdrop tap-to-close */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />

      {/* Reader container */}
      <div className="relative w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:shadow-2xl bg-card overflow-hidden flex flex-col z-10">

        {/* ── Photo / video — fills ~45% on mobile ── */}
        {story.isVideo ? (
          <div className="flex-shrink-0 relative">
            <VideoPlayer story={story} />
            <button onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white z-10">
              <ArrowLeft size={18} />
            </button>
          </div>
        ) : (
          <div className="relative flex-shrink-0 bg-muted" style={{ aspectRatio: "16/9" }}>
            <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <button onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hidden sm:flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <X size={16} />
            </button>

            {/* Source + tag badges bottom-left of image */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2 flex-wrap">
              <SourceBadge source={story.source} />
              {story.tag && <TagBadge tag={story.tag} />}
              {story.featured && !story.tag && <TagBadge tag="Featured" />}
            </div>
            {story.duration && (
              <span className="absolute bottom-3 right-4 bg-black/70 text-white text-xs px-2 py-0.5 rounded"
                style={{ fontFamily: "'DM Mono', monospace" }}>{story.duration}</span>
            )}
          </div>
        )}

        {/* ── Scrollable story content ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="px-5 pt-5 pb-4 space-y-4">

            {/* Metadata pill row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              <span>{story.type}</span>
              <span className="opacity-30">·</span>
              <MapPin size={10} />
              <span>{story.country}</span>
              <span className="opacity-30">·</span>
              <span>{story.chapter}</span>
              <span className="opacity-30">·</span>
              <span>{story.date}</span>
            </div>

            {/* Title — large and readable */}
            <h2 className="text-2xl font-bold leading-snug text-foreground"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {story.title}
            </h2>

            {/* Caption */}
            <p className="text-[17px] text-foreground/80 leading-relaxed">
              {story.caption}
            </p>

            {/* Pull quote */}
            {story.quote && (
              <blockquote className="border-l-4 border-primary pl-4 py-1 text-lg italic text-foreground/75 leading-relaxed"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {story.quote}
              </blockquote>
            )}

            {/* Body */}
            {story.body && (
              <p className="text-base text-foreground/75 leading-[1.8]">{story.body}</p>
            )}
          </div>
        </div>

        {/* ── Fixed bottom action bar ── */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border flex items-center justify-between gap-3 bg-card">
          <div className="flex items-center gap-3">
            <HeartBtn
              count={story.likes}
              storyId={story.id}
              liked={liked}
              onToggle={onToggleLike}
            />
            <span className="text-xs text-muted-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.views.toLocaleString()} views
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled title="Story saving is blocked in this preview" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bookmark size={15} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button type="button" disabled title="External source links are blocked in this preview until feed-sharing approval is complete"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white opacity-75 cursor-not-allowed"
              style={{ background: cfg.bg }}>
              <ExternalLink size={14} /> {cfg.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoriesScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState<StoryFilter>("For You");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const toggleLike = (id: number) => {
    void id;
  };

  const filtered = stories.filter((s) => s.filters.includes(activeFilter));

  return (
    <>
      <div className="bg-white min-h-full pb-24" aria-label="MEDLIFE Stories">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 pt-12 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="leading-none">
              <h1
                className="text-xl font-bold text-black"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                MEDLIFE Stories
              </h1>
              <p className="mt-1 text-[11px] font-medium text-gray-400">
                Preview-only student feed
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-gray-400 text-xs">Preview</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {STORY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all",
                  activeFilter === f
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-500 border-gray-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Heart size={28} className="text-gray-300" />
            <p className="text-gray-400 text-sm">No stories here yet.</p>
          </div>
        ) : (
          <div>
            {filtered.map((story) => {
              const handle = story.chapter.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

              return (
                <div key={story.id} className="border-b border-gray-200">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ background: sourceConfig[story.source].bg.startsWith("linear") ? "#e6683c" : sourceConfig[story.source].bg }}
                      >
                        {story.chapter[0]}
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

                  <div
                    className="relative w-full bg-gray-100 cursor-pointer"
                    style={{ aspectRatio: "1/1" }}
                    onClick={() => setSelectedStory(story)}
                  >
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                    {story.isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/40 border-[3px] border-white flex items-center justify-center">
                          <Play size={28} className="text-white ml-1.5 fill-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-3 pt-2">
                    <div className="flex items-center">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          type="button"
                          disabled
                          title="Preview-only reaction. Likes are not saved, synced, or counted as production proof."
                          className="cursor-not-allowed opacity-70"
                        >
                          <Heart size={26} className="text-black" />
                        </button>
                        <button
                          type="button"
                          title="Open this story in the local review modal."
                          onClick={() => setSelectedStory(story)}
                        >
                          <MessageSquare size={24} className="text-black" />
                        </button>
                        <button
                          type="button"
                          disabled
                          title="Sharing is blocked in this preview until publishing approval is complete."
                          className="cursor-not-allowed opacity-60"
                        >
                          <Share2 size={23} className="text-black" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled
                        title="Saving stories is blocked in this preview."
                        className="cursor-not-allowed opacity-60"
                      >
                        <Bookmark size={23} className="text-black" />
                      </button>
                    </div>

                    <p className="text-[13px] font-semibold text-black mt-1.5 mb-1">
                      {story.likes.toLocaleString()} preview likes
                    </p>

                    <p className="text-[13px] text-black leading-snug">
                      <span className="font-semibold">{handle} </span>
                      {story.title}
                    </p>

                    <button
                      onClick={() => setSelectedStory(story)}
                      className="text-[13px] text-gray-400 mt-0.5 block"
                    >
                      Read more
                    </button>

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
          liked={false}
          onToggleLike={toggleLike}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const STUDENT_SCREENS: Screen[] = ["home", "campaign", "action", "evidence", "confirm", "points", "events", "event-detail", "rsvp-confirm", "checkin", "stories"];

export function FigmaMemberMobileHome({
  initialScreen = "home",
}: {
  initialScreen?: MemberMobileLaunchScreen;
}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [role, setRole] = useState<Role>("student");

  function navigate(s: Screen) {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }

  const isStudentScreen = STUDENT_SCREENS.includes(screen);

  const content = () => {
    switch (screen) {
      case "home": return <StudentHome navigate={navigate} setRole={setRole} />;
      case "campaign": return <CampaignPage navigate={navigate} />;
      case "action": return <ActionDetail navigate={navigate} />;
      case "evidence": return <EvidenceSubmission navigate={navigate} />;
      case "confirm": return <Confirmation navigate={navigate} />;
      case "points": return <PointsLeaderboard navigate={navigate} />;
      case "events": return <EventsScreen navigate={navigate} />;
      case "event-detail": return <EventDetailScreen navigate={navigate} />;
      case "rsvp-confirm": return <RsvpConfirmScreen navigate={navigate} />;
      case "checkin": return <CheckInScreen navigate={navigate} />;
      case "stories": return <StoriesScreen navigate={navigate} />;
      case "leader": return <LeadershipDashboard navigate={navigate} />;
      case "assign": return <AssignAction navigate={navigate} />;
      case "review": return <ReviewEvidence navigate={navigate} />;
      case "coach": return <CoachDashboard navigate={navigate} />;
      case "admin": return <AdminDashboard navigate={navigate} />;
      default: return <StudentHome navigate={navigate} setRole={setRole} />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#D6E0F0] flex items-start justify-center font-[Plus_Jakarta_Sans,sans-serif] py-0 md:py-8"
    >
      {isStudentScreen ? (
        /* Phone frame for mobile screens */
        <div className="relative w-full max-w-[430px] min-h-screen md:min-h-0 md:h-[812px] bg-background overflow-hidden md:rounded-[44px] md:shadow-2xl md:border-4 md:border-white/40 flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {content()}
          </div>
          {!["confirm", "event-detail", "rsvp-confirm", "checkin"].includes(screen) && (
            <BottomNav active={screen} navigate={navigate} />
          )}
        </div>
      ) : (
        /* Full width for dashboards */
        <div className="w-full min-h-screen bg-background md:rounded-2xl md:shadow-xl overflow-hidden md:max-w-5xl">
          {content()}
        </div>
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
