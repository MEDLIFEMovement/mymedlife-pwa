"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home, Trophy, Users, User, Layers, Calendar, Globe, Video,
  GitBranch, BarChart2, Bell, ChevronDown, ChevronUp,
  ChevronRight, AlertTriangle, CheckCircle, Clock, Star,
  ArrowRight, Plus, Search, Eye, Edit, TrendingUp, TrendingDown,
  Heart, Zap, BookOpen, Share2, Play, ThumbsUp, MessageSquare,
  Upload, Download, X, Activity, Target, Flag, Shield,
  Award, Flame, Sparkles, ExternalLink, MapPin, ArrowLeft, Bookmark, Building2, Settings
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { CreateEventForm } from "@/components/figma-leader-create-event-screen";
import { TrainingScreen } from "@/components/figma-leader-training-screen";
import { MedlifeStoriesScreen } from "@/components/figma-leader-stories-screen";
import {
  buildLeaderCommandCenterHrefForScreen,
  getLeaderCommandCenterViewForScreen,
  resolveLeaderCommandCenterScreen,
  type LeaderCommandCenterScreen,
} from "@/services/leader-command-center-routing";

// ─── Types ───────────────────────────────────────────────────────
type Screen = LeaderCommandCenterScreen;

// ─── Palette constants ────────────────────────────────────────────
const BLUE = "#1A56E8";
const YELLOW = "#F5A623";
const NAVY = "#07192E";

// ─── Data ────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 1, name: "Sofia Reyes",    initials: "SR", color: "#1A56E8", role: "President",            committee: "E-Board",           pts: 1240, ptsWk: 85,  ptsLast: 72,  evtCreated: 8,  evtAttended: 18, evtPct: 94, actions: 24, evidence: 19, bridge: 3, fundraising: 1200, slt: true,  volunteer: 12, engage: 94, lastActive: "Today",       values: "Values Aligned",        pipeline: "E-Board",          nextStep: "Mentor successors & submit bridge video" },
  { id: 2, name: "Marcus Chen",    initials: "MC", color: "#7C3AED", role: "VP of Events",         committee: "E-Board",           pts: 1085, ptsWk: 67,  ptsLast: 81,  evtCreated: 11, evtAttended: 16, evtPct: 84, actions: 19, evidence: 15, bridge: 2, fundraising:  850, slt: true,  volunteer:  8, engage: 78, lastActive: "Today",       values: "Values Aligned",        pipeline: "E-Board",          nextStep: "Submit bridge video for events transition" },
  { id: 3, name: "Amara Okonkwo",  initials: "AO", color: "#059669", role: "Fundraising Chair",    committee: "Fundraising",       pts:  920, ptsWk: 55,  ptsLast: 48,  evtCreated:  3, evtAttended: 14, evtPct: 73, actions: 18, evidence: 14, bridge: 1, fundraising: 2100, slt: false, volunteer:  5, engage: 65, lastActive: "Yesterday",   values: "Values Aligned",        pipeline: "Chair",            nextStep: "Strong E-Board candidate — nominate" },
  { id: 4, name: "Jordan Kim",     initials: "JK", color: "#0891B2", role: "Recruitment Chair",    committee: "Recruitment",       pts:  875, ptsWk: 62,  ptsLast: 55,  evtCreated:  5, evtAttended: 15, evtPct: 78, actions: 16, evidence: 12, bridge: 2, fundraising:  400, slt: true,  volunteer:  9, engage: 82, lastActive: "Today",       values: "Values Aligned",        pipeline: "Chair candidate",  nextStep: "Promote to Chair — ready now" },
  { id: 5, name: "Priya Sharma",   initials: "PS", color: "#DB2777", role: "Comms Chair",          committee: "Communications",    pts:  810, ptsWk: 48,  ptsLast: 52,  evtCreated:  2, evtAttended: 13, evtPct: 68, actions: 14, evidence: 11, bridge: 4, fundraising:  300, slt: false, volunteer:  4, engage: 91, lastActive: "Today",       values: "Values Aligned",        pipeline: "Chair",            nextStep: "Submit evidence for 3 open tasks" },
  { id: 6, name: "DeShawn Williams",initials:"DW", color: "#D97706", role: "SLT Promotions Chair", committee: "SLT Promotion",     pts:  745, ptsWk: 71,  ptsLast: 45,  evtCreated:  4, evtAttended: 12, evtPct: 63, actions: 15, evidence: 10, bridge: 1, fundraising:  200, slt: true,  volunteer:  6, engage: 70, lastActive: "2 days ago",  values: "Values Aligned",        pipeline: "Chair",            nextStep: "Host SLT info session this week" },
  { id: 7, name: "Elena Vasquez",  initials: "EV", color: "#16A34A", role: "Active Member",        committee: "Events",            pts:  680, ptsWk: 44,  ptsLast: 38,  evtCreated:  2, evtAttended: 11, evtPct: 57, actions: 12, evidence:  9, bridge: 0, fundraising:  150, slt: true,  volunteer:  7, engage: 60, lastActive: "Yesterday",   values: "Watch / needs coaching",pipeline: "Active contributor",nextStep: "Assign growth action before values interview" },
  { id: 8, name: "Theo Nakamura",  initials: "TN", color: "#6366F1", role: "Active Member",        committee: "Recruitment",       pts:  620, ptsWk: 38,  ptsLast: 41,  evtCreated:  1, evtAttended: 10, evtPct: 52, actions: 10, evidence:  8, bridge: 1, fundraising:  100, slt: false, volunteer:  5, engage: 55, lastActive: "3 days ago",  values: "Needs interview",       pipeline: "Active contributor",nextStep: "Schedule values interview" },
  { id: 9, name: "Nadia Osei",     initials: "NO", color: "#059669", role: "Active Member",        committee: "Service",           pts:  590, ptsWk: 42,  ptsLast: 35,  evtCreated:  1, evtAttended: 10, evtPct: 52, actions: 11, evidence:  9, bridge: 1, fundraising:  200, slt: true,  volunteer: 14, engage: 67, lastActive: "Yesterday",   values: "Values Aligned",        pipeline: "Chair candidate",  nextStep: "Interview for Service Committee Chair" },
  { id:10, name: "Ryan O'Brien",   initials: "RO", color: "#0891B2", role: "Active Member",        committee: "Member Engagement", pts:  540, ptsWk: 33,  ptsLast: 29,  evtCreated:  2, evtAttended:  9, evtPct: 47, actions:  9, evidence:  7, bridge: 0, fundraising:  125, slt: false, volunteer:  3, engage: 58, lastActive: "3 days ago",  values: "Watch / needs coaching",pipeline: "Active contributor",nextStep: "Assign growth action" },
  { id:11, name: "Aaliyah Brooks",  initials:"AB", color: "#7C3AED", role: "General Member",       committee: "Fundraising",       pts:  420, ptsWk: 25,  ptsLast: 18,  evtCreated:  0, evtAttended:  7, evtPct: 36, actions:  6, evidence:  4, bridge: 0, fundraising:   75, slt: false, volunteer:  2, engage: 40, lastActive: "1 week ago",  values: "Needs interview",       pipeline: "General member",   nextStep: "Complete first independent action" },
  { id:12, name: "Caleb Torres",   initials: "CT", color: "#64748B", role: "General Member",       committee: "None",              pts:  310, ptsWk: 12,  ptsLast: 22,  evtCreated:  0, evtAttended:  5, evtPct: 26, actions:  4, evidence:  2, bridge: 0, fundraising:   25, slt: false, volunteer:  1, engage: 22, lastActive: "2 weeks ago", values: "Not yet ready",         pipeline: "General member",   nextStep: "Re-engage — reach out directly" },
];

const COMMITTEES = [
  {
    id:1, name:"Recruitment & Membership Tracking", color:"#0891B2", chairs:["Jordan Kim"],
    members:12, openActs:3, doneActs:14, bridge:2, pts:1840, kpi:82,
    health:"Strong", rec:"Strong momentum — schedule next info session this week.",
    evtThisYear:14, evtLastMonth:3, evtLastWeek:1, evtNextWeek:1, evtNextMonth:3,
    upcoming:[
      { name:"Fall Info Night", date:"Jun 22", rsvp:40 },
      { name:"Tabling — Science Fair", date:"Jun 28", rsvp:0 },
      { name:"New Member Orientation", date:"Jul 5", rsvp:25 },
    ],
  },
  {
    id:2, name:"Fundraising", color:"#D97706", chairs:["Amara Okonkwo"],
    members:8, openActs:5, doneActs:9, bridge:1, pts:1220, kpi:61,
    health:"Needs Attention", rec:"Activate 3 dormant members. Set a weekly fundraising check-in.",
    evtThisYear:8, evtLastMonth:2, evtLastWeek:1, evtNextWeek:0, evtNextMonth:1,
    upcoming:[
      { name:"Bake Sale #2", date:"Jul 10", rsvp:18 },
    ],
  },
  {
    id:3, name:"Service Learning Prep & Awareness", color:"#7C3AED", chairs:["DeShawn Williams"],
    members:6, openActs:4, doneActs:8, bridge:1, pts:980, kpi:54,
    health:"Needs Attention", rec:"Host SLT info session. Share a testimonial video to the chapter feed.",
    evtThisYear:9, evtLastMonth:2, evtLastWeek:1, evtNextWeek:1, evtNextMonth:2,
    upcoming:[
      { name:"SLT Alumni Q&A Night", date:"Jun 24", rsvp:22 },
      { name:"MC22 Info Session", date:"Jul 12", rsvp:0 },
    ],
  },
  {
    id:4, name:"Marketing & Social Media", color:"#DB2777", chairs:["Priya Sharma"],
    members:9, openActs:1, doneActs:16, bridge:4, pts:1540, kpi:78,
    health:"Strong", rec:"Draft Moving Mountains social calendar. Align posts with event schedule.",
    evtThisYear:6, evtLastMonth:1, evtLastWeek:0, evtNextWeek:1, evtNextMonth:2,
    upcoming:[
      { name:"Content Planning Session", date:"Jun 25", rsvp:12 },
      { name:"Instagram Takeover", date:"Jul 9", rsvp:0 },
    ],
  },
  {
    id:5, name:"Team Bonding & Social Events", color:"#1A56E8", chairs:["Marcus Chen","Elena Vasquez"],
    members:14, openActs:2, doneActs:18, bridge:2, pts:2480, kpi:94,
    health:"Strong", rec:"Keep event cadence strong — ensure engagement and follow-up after each event.",
    evtThisYear:22, evtLastMonth:5, evtLastWeek:2, evtNextWeek:2, evtNextMonth:5,
    upcoming:[
      { name:"Chapter General Meeting", date:"Jun 22", rsvp:55 },
      { name:"End-of-Year Celebration", date:"Jun 28", rsvp:62 },
      { name:"Summer Kickoff", date:"Jul 8", rsvp:44 },
      { name:"Leadership Mixer", date:"Jul 15", rsvp:30 },
    ],
  },
  {
    id:6, name:"Safe Homes", color:"#059669", chairs:["Nadia Osei"],
    members:7, openActs:3, doneActs:6, bridge:1, pts:720, kpi:48,
    health:"Needs Attention", rec:"Confirm next Safe Homes awareness event. Assign evidence uploads to members.",
    evtThisYear:7, evtLastMonth:1, evtLastWeek:0, evtNextWeek:1, evtNextMonth:2,
    upcoming:[
      { name:"Safe Homes Awareness Night", date:"Jun 29", rsvp:20 },
      { name:"Community Safety Walk", date:"Jul 13", rsvp:15 },
    ],
  },
  {
    id:7, name:"Smiles Movement", color:"#F59E0B", chairs:[],
    members:5, openActs:4, doneActs:3, bridge:0, pts:380, kpi:28,
    health:"Inactive", rec:"Appoint a chair immediately. Plan first dental health awareness event.",
    evtThisYear:2, evtLastMonth:0, evtLastWeek:0, evtNextWeek:0, evtNextMonth:1,
    upcoming:[
      { name:"Dental Health Pop-Up", date:"Jul 18", rsvp:0 },
    ],
  },
  {
    id:8, name:"MED Talks & Skills Sessions", color:"#6366F1", chairs:["Ryan O'Brien"],
    members:8, openActs:2, doneActs:10, bridge:2, pts:890, kpi:58,
    health:"Strong", rec:"Schedule next MED Talk speaker. Promote the skills session to pre-med members.",
    evtThisYear:10, evtLastMonth:2, evtLastWeek:1, evtNextWeek:1, evtNextMonth:3,
    upcoming:[
      { name:"MED Talk: Global Health 101", date:"Jun 23", rsvp:34 },
      { name:"CPR & First Aid Skills Session", date:"Jul 7", rsvp:22 },
      { name:"Med School Panel", date:"Jul 21", rsvp:28 },
    ],
  },
];

interface NpsResult {
  sent: number;              // surveys sent
  responses: number;         // responses received
  promoters: number;         // 9–10
  passives: number;          // 7–8
  detractors: number;        // 0–6
  score: number;             // % promoters − % detractors
  totalMembers: number;      // total members/contacts reached through this event channel
  membersAttending: number;  // how many of those members actually attended
  topFeedback: string[];
  improveFeedback: string[];
}

const NPS_RESULTS: Record<number, NpsResult> = {
  1: {
    sent:39, responses:31, promoters:19, passives:8, detractors:4,
    score: Math.round((19/31 - 4/31) * 100), // ≈ 48
    totalMembers:62, membersAttending:39,
    topFeedback:[
      "Really energizing — I finally understand what Moving Mountains is.",
      "The speakers made me want to go on an SLT.",
      "Best chapter event of the semester so far.",
    ],
    improveFeedback:[
      "Could use more specific info on how to donate.",
      "Room was a bit loud — hard to hear at times.",
    ],
  },
  2: {
    sent:18, responses:14, promoters:9, passives:4, detractors:1,
    score: Math.round((9/14 - 1/14) * 100), // ≈ 57
    totalMembers:35, membersAttending:18,
    topFeedback:[
      "Hearing from alumni who went on SLTs was incredibly inspiring.",
      "I signed up for the waitlist right after.",
    ],
    improveFeedback:[
      "Would love more detail on the application timeline.",
    ],
  },
  3: {
    sent:14, responses:8, promoters:4, passives:3, detractors:1,
    score: Math.round((4/8 - 1/8) * 100), // ≈ 38
    totalMembers:24, membersAttending:14,
    topFeedback:[
      "Great energy at the table — team was approachable.",
    ],
    improveFeedback:[
      "Flyer didn't have a QR code to sign up.",
      "Needed a clearer pitch — I wasn't sure what MEDLIFE does at first.",
    ],
  },
};

function npsColor(score: number) {
  if (score >= 50) return { text:"text-green-700",  bg:"bg-green-100",  border:"border-green-200",  bar:"#16A34A" };
  if (score >= 20) return { text:"text-amber-700",  bg:"bg-amber-100",  border:"border-amber-200",  bar:"#D97706" };
  if (score >= 0)  return { text:"text-orange-700", bg:"bg-orange-100", border:"border-orange-200", bar:"#EA580C" };
  return               { text:"text-red-700",   bg:"bg-red-100",   border:"border-red-200",   bar:"#DC2626" };
}

const EVENTS = [
  { id:1, name:"Moving Mountains Kickoff",   date:"Jun 10", committee:"Events",        rsvp:48, attended:39,   status:"Past",     proof:true,  followUp:"Done",    creator:"Marcus Chen",    nps: true  },
  { id:2, name:"SLT Interest Meeting",        date:"Jun 12", committee:"SLT Promotion", rsvp:22, attended:18,   status:"Past",     proof:true,  followUp:"Pending", creator:"DeShawn Williams",nps: true  },
  { id:3, name:"Tabling: Quad Recruitment",   date:"Jun 15", committee:"Recruitment",   rsvp: 0, attended:14,   status:"Past",     proof:false, followUp:"Overdue", creator:"Jordan Kim",      nps: true  },
  { id:4, name:"Fundraising Bake Sale",       date:"Jun 17", committee:"Fundraising",   rsvp:30, attended:null, status:"Today",    proof:false, followUp:"Pending", creator:"Amara Okonkwo",   nps: false },
  { id:5, name:"Community Meal Service",      date:"Jun 19", committee:"Service",       rsvp:16, attended:null, status:"Upcoming", proof:false, followUp:"—",       creator:"Nadia Osei",      nps: false },
  { id:6, name:"Chapter General Meeting",     date:"Jun 22", committee:"Events",        rsvp:55, attended:null, status:"Upcoming", proof:false, followUp:"—",       creator:"Sofia Reyes",     nps: false },
  { id:7, name:"Bridge Video Workshop",       date:"Jun 25", committee:"Comms",         rsvp:18, attended:null, status:"Upcoming", proof:false, followUp:"—",       creator:"Priya Sharma",    nps: false },
];

const CHAPTERS = [
  { rank:1, name:"UCLA MEDLIFE",           country:"USA",    region:"West",        events:18, members:112, attendance:79, evidence:34, bridge:14, funds:12400, slt:31, health:96, nps:72, leadConversion:68, npsEvents:14, insight:"Weekly SLT testimonial posts doubled sign-up rate" },
  { rank:2, name:"McGill MEDLIFE",         country:"Canada", region:"Canada",      events:15, members: 94, attendance:81, evidence:28, bridge:11, funds: 9800, slt:38, health:93, nps:61, leadConversion:74, npsEvents:11, insight:"Chapter buddy system retains 40% more new members" },
  { rank:3, name:"Boston College MEDLIFE", country:"USA",    region:"New England", events:12, members: 84, attendance:67, evidence:22, bridge: 9, funds: 8400, slt:18, health:87, nps:48, leadConversion:63, npsEvents: 3, insight:"Leading Moving Mountains in New England — #3 overall" },
  { rank:4, name:"UT Austin MEDLIFE",      country:"USA",    region:"South",       events:14, members: 88, attendance:73, evidence:19, bridge: 7, funds: 7600, slt:22, health:84, nps:54, leadConversion:71, npsEvents:10, insight:"Event creation assigned as entry-level member action" },
  { rank:5, name:"UBC MEDLIFE",            country:"Canada", region:"Canada",      events:11, members: 76, attendance:74, evidence:21, bridge: 8, funds: 6900, slt:25, health:82, nps:67, leadConversion:58, npsEvents: 9, insight:"Highest evidence-per-action rate in North America" },
  { rank:6, name:"NYU MEDLIFE",            country:"USA",    region:"Mid-Atlantic", events:10, members: 68, attendance:71, evidence:17, bridge: 5, funds: 7100, slt:14, health:79, nps:39, leadConversion:55, npsEvents: 7, insight:"Fundraising up 40% month-over-month" },
  { rank:7, name:"Emory MEDLIFE",          country:"USA",    region:"South",       events: 9, members: 61, attendance:69, evidence:14, bridge: 6, funds: 5200, slt:12, health:74, nps:31, leadConversion:49, npsEvents: 6, insight:"Bridge video leader per chapter size in Southeast" },
];

const REGIONS = ["All Regions","New England","Mid-Atlantic","South","Midwest","West","Canada","Puerto Rico","UK","Latin America","Worldwide"];

const WEEKLY_PTS = [
  { w:"Apr W1",pts:620 },{ w:"Apr W2",pts:740 },{ w:"Apr W3",pts:680 },{ w:"Apr W4",pts:810 },
  { w:"May W1",pts:920 },{ w:"May W2",pts:870 },{ w:"May W3",pts:1050 },{ w:"May W4",pts:1120 },
  { w:"Jun W1",pts:1340 },{ w:"Jun W2",pts:1480 },
];

const BRIDGE_VIDEOS = [
  {
    id:1, title:"How to Run a Successful Info Night", author:"Sofia Reyes",
    cat:"Recruitment", views:284, likes:41, comments:12, shares:9, chaptersUsing:6,
    date:"May 15", featured:true,
    photo:"photo-1758270704763-22072a90d3b6",
    duration:"12 min",
    description:"Sofia walks through every step of running a chapter info night — from choosing the venue and setting up sign-in sheets, to delivering the MEDLIFE pitch and converting attendees into members. Includes a Q&A template and follow-up email script.",
    keyTakeaways:["Book the room 3 weeks in advance","Use a Google Form for sign-in — not a paper sheet","End with a clear next step: 'Join our GroupMe'","Follow up within 48 hours or conversion drops 60%"],
  },
  {
    id:2, title:"Moving Mountains Fundraising Playbook", author:"Amara Okonkwo",
    cat:"Fundraising", views:198, likes:34, comments:8, shares:7, chaptersUsing:4,
    date:"May 22", featured:true,
    photo:"photo-1559027615-cd4628902d4a",
    duration:"18 min",
    description:"Amara shares how BC MEDLIFE raised $8,400 in a single semester using peer fundraising, bake sales, and a live donor tracker. Covers goal-setting, team motivation, social media strategy, and the final push tactics that close campaigns strong.",
    keyTakeaways:["Set weekly milestones, not just a semester goal","Post a live tracker on Instagram Stories every Friday","Use chapter-vs-committee competitions to motivate","Personal ask emails outperform generic posts 3:1"],
  },
  {
    id:3, title:"How We Grew SLT Interest 3x in 6 Weeks", author:"DeShawn Williams",
    cat:"SLT Promotion", views:156, likes:27, comments:5, shares:4, chaptersUsing:3,
    date:"Jun 2", featured:false,
    photo:"photo-1758270705518-b61b40527e76",
    duration:"14 min",
    description:"DeShawn breaks down the exact campaign that tripled SLT sign-up interest at BC — weekly testimonial posts, a dedicated alumni Q&A night, and a follow-up sequence that converted 60% of interest into committed applications.",
    keyTakeaways:["Post one alumni testimonial every week","Host a 45-min SLT Q&A — attendance predicts sign-ups","Send a personal follow-up to every person who attended","Create a countdown to application deadline"],
  },
  {
    id:4, title:"Committee Leadership Transition Guide", author:"Marcus Chen",
    cat:"Leadership Transition", views:142, likes:22, comments:9, shares:6, chaptersUsing:5,
    date:"Jun 5", featured:false,
    photo:"photo-1758270705317-3ef6142d306f",
    duration:"21 min",
    description:"Marcus documents the full Events committee handoff process — the transition document template, shadow session structure, team introductions, and how to run a final handoff meeting so nothing falls through the cracks when leadership changes.",
    keyTakeaways:["Start transition 8 weeks before your last day","Create a written handoff doc — not just a verbal walkthrough","Run 3 shadow sessions before full handoff","Introduce successor to all key contacts personally"],
  },
  {
    id:5, title:"Social Media Posting Strategy for MEDLIFE", author:"Priya Sharma",
    cat:"Communications", views:119, likes:19, comments:4, shares:3, chaptersUsing:2,
    date:"Jun 8", featured:false,
    photo:"photo-1758270704840-0ac001215b55",
    duration:"9 min",
    description:"Priya shares the content calendar and posting rhythm that helped BC MEDLIFE grow chapter engagement by 40% in one semester. Covers Instagram, the chapter feed, and how to align social content with the Moving Mountains campaign timeline.",
    keyTakeaways:["Post 3x/week minimum during active campaigns","Mix event recaps, member spotlights, and impact stats","Use Reels for SLT stories — they outperform static posts","Schedule posts in advance — don't rely on in-the-moment posting"],
  },
];

const FEED_POSTS = [
  { id:1, type:"Bridge Video",  title:"How to Run a Successful Info Night",    author:"Sofia Reyes",    likes:41, comments:12, shares:9,  views:284, saves:18, actions:6,  rsvps:11, evidence:3, date:"Jun 10" },
  { id:2, type:"Best Practice", title:"Moving Mountains Campaign Guide",        author:"MEDLIFE Staff",  likes:38, comments: 9, shares:14, views:312, saves:24, actions:8,  rsvps: 7, evidence:2, date:"Jun 8" },
  { id:3, type:"Chapter Post",  title:"Our bake sale raised $840! Here's how", author:"Amara Okonkwo", likes:52, comments:18, shares:6,  views:184, saves: 5, actions:2,  rsvps: 0, evidence:1, date:"Jun 12" },
  { id:4, type:"Bridge Video",  title:"Fundraising Playbook 2025",             author:"Amara Okonkwo", likes:34, comments: 8, shares:7,  views:198, saves:14, actions:5,  rsvps: 4, evidence:4, date:"Jun 5" },
  { id:5, type:"Chapter Post",  title:"SLT info meeting recap — 18 signed up!",author:"DeShawn Williams",likes:29,comments: 7, shares:3,  views:142, saves: 6, actions:3,  rsvps: 9, evidence:1, date:"Jun 13" },
];

// ─── Shared components ────────────────────────────────────────────

/** Colored initials avatar */
function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

/** Radial SVG health gauge */
function RadialGauge({ score, size = 128 }: { score: number; size?: number }) {
  const r = size / 2 - 11;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={10} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x={size/2} y={size/2 - 3} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.24} fontWeight="800" fill="#0F172A" fontFamily="Inter, sans-serif">{score}</text>
      <text x={size/2} y={size/2 + size * 0.18} textAnchor="middle"
        fontSize={size * 0.11} fill="#94A3B8" fontFamily="Inter, sans-serif">/ 100</text>
    </svg>
  );
}

/** Status pill */
function Pill({ label, color = "slate" }: { label: string; color?: string }) {
  const map: Record<string, string> = {
    green:  "bg-green-100  text-green-800  border-green-200",
    yellow: "bg-amber-100  text-amber-800  border-amber-200",
    red:    "bg-red-100    text-red-700    border-red-200",
    blue:   "bg-blue-100   text-blue-800   border-blue-200",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    slate:  "bg-slate-100  text-slate-600  border-slate-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    cyan:   "bg-cyan-100   text-cyan-800   border-cyan-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] ?? map.slate}`}>
      {label}
    </span>
  );
}

function pipelinePill(s: string) {
  const map: Record<string,string> = {
    "E-Board":"blue", "Chair":"indigo", "Chair candidate":"cyan",
    "Active contributor":"green", "General member":"slate",
  };
  return <Pill label={s} color={map[s] ?? "slate"} />;
}
function valuesPill(v: string) {
  const map: Record<string,string> = {
    "Values Aligned":"green", "Watch / needs coaching":"yellow",
    "Needs interview":"orange", "Not yet ready":"red",
  };
  return <Pill label={v} color={map[v] ?? "slate"} />;
}
function healthPill(h: string) {
  const map: Record<string,string> = { "Strong":"green", "Needs Attention":"yellow", "Inactive":"red" };
  return <Pill label={h} color={map[h] ?? "slate"} />;
}

/** Primary / secondary / ghost button */
function Btn({ children, variant="primary", onClick, className="" }: {
  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"|"danger";
  onClick?: () => void; className?: string;
}) {
  const isBlocked = !onClick;
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap";
  const v = {
    primary:   "bg-[#1A56E8] text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost:     "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    danger:    "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100",
  }[variant];
  return <button className={`${base} ${v} ${isBlocked ? "opacity-70 cursor-not-allowed" : ""} ${className}`} onClick={onClick} disabled={isBlocked}>{children}</button>;
}

/** Metric stat card with accent top border */
function Kard({ label, value, sub, icon: Icon, accent="#1A56E8", trend }: {
  label: string; value: string|number; sub?: string; accent?: string;
  icon?: React.ComponentType<{size?:number; className?:string; style?: React.CSSProperties}>;
  trend?: "up"|"down";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 relative overflow-hidden min-w-0">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: accent }} />
      {Icon && <Icon size={15} style={{ color: accent }} />}
      <div className="text-2xl font-black text-slate-900 tabular-nums leading-none" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{value}</div>
      {sub && (
        <div className="flex items-center gap-1 text-[11px]">
          {trend === "up"   && <TrendingUp   size={10} className="text-green-500 shrink-0" />}
          {trend === "down" && <TrendingDown  size={10} className="text-amber-500 shrink-0" />}
          <span className="text-slate-400 truncate">{sub}</span>
        </div>
      )}
      <div className="text-xs font-bold tracking-wide leading-tight" style={{ color: accent }}>{label}</div>
    </div>
  );
}

/** Section heading */
function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-800">{children}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Mini horizontal fill bar */
function FillBar({ pct, color="#1A56E8" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct,100)}%`, background: color }} />
    </div>
  );
}

// ─── Screen 1: Chapter Home ───────────────────────────────────────
function HomeScreen({
  onCreateEvent,
  onOpenEvents,
  onOpenLeaderboard,
}: {
  onCreateEvent: () => void;
  onOpenEvents: () => void;
  onOpenLeaderboard: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Chapter masthead */}
      <div className="bg-[#07192E] rounded-2xl p-6 flex items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <RadialGauge score={87} size={120} />
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest">Chapter Dashboard · Jun 2025</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Boston College MEDLIFE</h1>
            <p className="text-sm text-blue-200 mb-3">Sofia Reyes, President · New England Region</p>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-200 rounded-full text-[11px] font-semibold border border-blue-500/30"><Flame size={10}/>Rush Month</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-200 rounded-full text-[11px] font-semibold border border-amber-500/30"><Target size={10}/>Moving Mountains</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-200 rounded-full text-[11px] font-semibold border border-purple-500/30"><Globe size={10}/>SLT Promotion</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 text-blue-100 rounded-full text-[11px] font-semibold border border-white/20"><Building2 size={10}/>College / University Chapter</span>
            </div>
          </div>
        </div>
        {/* E-Board + committee fill bars */}
        <div className="space-y-4 min-w-52 shrink-0">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">E-Board roles</span>
              <span className="text-white font-bold">6 / 7</span>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_,i) => (
                <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < 6 ? BLUE : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Committees active</span>
              <span className="text-white font-bold">5 / 7</span>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_,i) => (
                <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < 5 ? "#16A34A" : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          </div>
          <div className="pt-1">
            <div className="text-[10px] text-slate-400 mb-1 uppercase font-semibold tracking-wide">Health Score</div>
            <div className="text-xs text-blue-200">3rd in New England · top 15% globally</div>
          </div>
          <div className="flex gap-2 pt-1">
            <Btn variant="primary" onClick={onCreateEvent}><Plus size={11}/>Create Event</Btn>
            <Btn variant="secondary" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" onClick={onOpenEvents}><CheckCircle size={11}/>Review Attendance</Btn>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div>
        <SH>Chapter Metrics — June 2025</SH>
        <div className="grid grid-cols-6 gap-3 mt-3">
          <Kard label="QR Contacts"                   value="84"     sub="+6 from last month" trend="up"   accent={BLUE}    icon={Users} />
          <Kard label="Events Created"              value="12"     sub="This month"                      accent="#7C3AED" icon={Calendar} />
          <Kard label="Attendance Rate"             value="67%"    sub="−4% vs last month"  trend="down" accent={YELLOW}  icon={Activity} />
          <Kard label="Tasks Completed"             value="156"    sub="+24 this week"      trend="up"   accent="#16A34A" icon={CheckCircle} />
          <Kard label="Points This Week"            value="1,480"  sub="+11% vs last week"  trend="up"   accent={YELLOW}  icon={Star} />
          <Kard label="Moving Mountains Fundraising"value="$8,400" sub="70% of $12k goal"                accent="#16A34A" icon={Target} />
          <Kard label="SLT Participants"            value="18"     sub="Signed up this cycle"             accent="#7C3AED" icon={Globe} />
          <Kard label="Volunteer Activities"        value="284"    sub="Hours of local impact"             accent="#DC2626" icon={Heart} />
        </div>
      </div>

      {/* Risk alerts + quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <SH>Risk Alerts</SH>
            <Pill label="4 active" color="yellow" />
          </div>
          <div className="space-y-2">
            {[
              { msg:"Member Engagement committee has no chair — inactive for 3 weeks", hi:true },
              { msg:"Fundraising committee has low activity — only 9 tasks completed this month", hi:false },
              { msg:"No bridge videos submitted this month from 3 of 7 committees", hi:false },
              { msg:"Follow-up overdue after 'Tabling: Quad Recruitment' (Jun 15)", hi:false },
            ].map((a,i) => (
              <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${a.hi ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
                <AlertTriangle size={13} className={`${a.hi ? "text-red-500" : "text-amber-500"} mt-0.5 shrink-0`} />
                <span className="text-xs text-slate-700">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SH>This Week's Priority</SH>
          <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">Publish the next Luma event, drive RSVPs, confirm attendance, and keep the chapter leaderboard moving.</p>
          <SH sub="">Quick Actions</SH>
          <div className="mt-2 space-y-1.5">
            <Btn variant="secondary"  className="w-full justify-start" onClick={onCreateEvent}><Calendar size={11}/>Create Event</Btn>
            <Btn variant="secondary"  className="w-full justify-start" onClick={onOpenEvents}><CheckCircle size={11}/>Review RSVPs & Attendance</Btn>
            <Btn variant="secondary"  className="w-full justify-start" onClick={onOpenLeaderboard}><Trophy size={11}/>Check Chapter Leaderboard</Btn>
          </div>
        </div>
      </div>

      {/* Points trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <SH>Weekly Points Trend</SH>
          <span className="text-[11px] text-slate-400 font-mono">Apr – Jun 2025</span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-5 mb-3">
          {[
            { color:BLUE,      label:"Boston College" },
            { color:"#DC2626", label:"National Avg (~1,050 pts/wk)", dash:true },
            { color:"#7C3AED", label:"New England Avg (~890 pts/wk)", dash:true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.dash
                ? <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={item.color} strokeWidth="2" strokeDasharray="4 2"/></svg>
                : <div className="w-4 h-0.5 rounded-full" style={{ background: item.color }}/>}
              <span className="text-[10px] text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={WEEKLY_PTS}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={BLUE} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid key="home-grid" strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis key="home-x" dataKey="w" tick={{fontSize:10,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
            <YAxis key="home-y" tick={{fontSize:10,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8,border:"1px solid rgba(0,0,0,0.08)"}}/>
            <ReferenceLine key="nat-avg"  y={1050} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="5 3" label={{ value:"Nat'l", position:"right", fontSize:9, fill:"#DC2626" }}/>
            <ReferenceLine key="reg-avg"  y={890}  stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="5 3" label={{ value:"NE",   position:"right", fontSize:9, fill:"#7C3AED" }}/>
            <Area key="home-pts" type="monotone" dataKey="pts" name="Boston College" stroke={BLUE} strokeWidth={2.5} fill="url(#g1)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Screen 2: Leaderboard ────────────────────────────────────────
// NPS display helpers used in leaderboard
function NpsChip({ score }: { score: number }) {
  const c = npsColor(score);
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-black border tabular-nums ${c.bg} ${c.border} ${c.text}`}
      style={{ fontFamily:"'JetBrains Mono',monospace" }}>
      {score > 0 ? "+" : ""}{score}
    </span>
  );
}

function getChapterLeaderboardPoints(chapter: (typeof CHAPTERS)[number]) {
  return (
    chapter.events * 75 +
    chapter.attendance * 15 +
    chapter.evidence * 30 +
    chapter.bridge * 50 +
    chapter.slt * 25
  );
}

function LeaderboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [sortKey,    setSortKey]    = useState<"events"|"slt"|"funds">("events");
  const [filterRegion, setFilterRegion] = useState("All Regions");

  const cats = [
    { key:"events" as const, label:"Chapter Events Score", color:"#1A56E8", icon:Calendar },
    { key:"slt"    as const, label:"SLT Participants",     color:"#7C3AED", icon:Globe    },
    { key:"funds"  as const, label:"Moving Mountains",     color:"#16A34A", icon:Target   },
  ];

  const bc = CHAPTERS.find(c => c.name === "Boston College MEDLIFE")!;
  const bcRegion = bc.region; // "New England"

  // Filter by region if selected
  const visibleChapters = filterRegion === "All Regions"
    ? CHAPTERS
    : CHAPTERS.filter(c => c.region === filterRegion);

  const sorted = [...visibleChapters].sort((a,b) => (b as any)[sortKey] - (a as any)[sortKey]);
  const maxVal = Math.max(...visibleChapters.map(c => (c as any)[sortKey] ?? 0)) || 1;
  const medals = ["🥇","🥈","🥉"];
  const active = cats.find(c => c.key === sortKey)!;

  // National (all chapters) average
  const nationalAvg = Math.round(CHAPTERS.reduce((a,c) => a + (c as any)[sortKey], 0) / CHAPTERS.length);
  // Regional (BC's region) average
  const regionalChapters = CHAPTERS.filter(c => c.region === bcRegion);
  const regionalAvg = regionalChapters.length
    ? Math.round(regionalChapters.reduce((a,c) => a + (c as any)[sortKey], 0) / regionalChapters.length)
    : nationalAvg;

  const bcVal   = (bc as any)[sortKey] as number;
  const bcAbove = bcVal >= nationalAvg;

  const fmtVal = (v: number) =>
    sortKey === "funds" ? `$${v.toLocaleString()}` : String(v);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Chapter Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-1">Learn from top chapters. Find ideas to try. Rise together.</p>
        </div>
        {/* Region filter */}
        <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium"
          value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* 3 category tabs */}
      <div className="flex gap-3">
        {cats.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.key} onClick={() => setSortKey(c.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm cursor-pointer transition-all
                ${sortKey===c.key ? "text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
              style={sortKey===c.key ? { background: c.color, borderColor: c.color } : {}}>
              <Icon size={14}/>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Spotlight — national avg, regional avg, BC comparison */}
      <div className="grid grid-cols-4 gap-4">
        {/* National / Organizational average */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Organizational Average</div>
          <div className="text-3xl font-black tabular-nums" style={{ color: active.color, fontFamily:"'JetBrains Mono',monospace" }}>
            {fmtVal(nationalAvg)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{active.label} · {CHAPTERS.length} chapters</div>
        </div>

        {/* Regional average */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regional Average</div>
          <div className="text-3xl font-black tabular-nums" style={{ color:"#7C3AED", fontFamily:"'JetBrains Mono',monospace" }}>
            {fmtVal(regionalAvg)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{bcRegion} region · {regionalChapters.length} chapter{regionalChapters.length!==1?"s":""}</div>
        </div>

        {/* BC vs national */}
        <div className={`rounded-2xl border p-5 text-center ${bcAbove ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Boston College vs. National</div>
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: active.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {fmtVal(bcVal)}
            </span>
            <span className="text-slate-400 text-sm">vs</span>
            <span className="text-2xl font-black tabular-nums text-slate-400" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {fmtVal(nationalAvg)}
            </span>
          </div>
          <div className={`text-xs font-semibold ${bcAbove ? "text-green-700" : "text-amber-700"}`}>
            {bcAbove
              ? `${sortKey==="funds" ? `$${(bcVal-nationalAvg).toLocaleString()}` : bcVal-nationalAvg} above national average`
              : `${sortKey==="funds" ? `$${(nationalAvg-bcVal).toLocaleString()}` : nationalAvg-bcVal} below national average — room to grow`}
          </div>
        </div>

        {/* Top chapter callout */}
        {sorted[0] && (
          <div className="rounded-2xl border p-5 text-center" style={{ background: active.color + "0d", borderColor: active.color + "40" }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: active.color }}>
              {filterRegion === "All Regions" ? "National Leader" : `${filterRegion} Leader`}
            </div>
            <div className="text-sm font-black text-slate-900 mb-1">{sorted[0].name}</div>
            <div className="text-3xl font-black tabular-nums mb-1" style={{ color: active.color, fontFamily:"'JetBrains Mono',monospace" }}>
              {fmtVal((sorted[0] as any)[sortKey])}
            </div>
            <div className="text-[11px] text-slate-500 italic">"{sorted[0].insight}"</div>
          </div>
        )}
      </div>

      {/* Insight tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2">
        <Sparkles size={15} className="text-blue-500 mt-0.5 shrink-0"/>
        {sortKey==="events" && <span><strong>Ideas to try:</strong> UCLA assigns event creation as a first action for new members — every new recruit creates one. UT Austin tracks creator names on every event to build a leaderboard within the chapter.</span>}
        {sortKey==="slt"    && <span><strong>Ideas to try:</strong> McGill's 38-participant SLT record comes from weekly testimonial posts from alumni. UCLA hosts a dedicated SLT alumni Q&A each semester that consistently converts 60%+ of attendees.</span>}
        {sortKey==="funds"  && <span><strong>Ideas to try:</strong> UCLA's Moving Mountains campaign runs a live donation tracker on their chapter Instagram story. McGill uses a chapter-vs-chapter challenge to motivate donors in the final week.</span>}
      </div>

      {/* Ranked leaderboard table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <SH>Ranked Chapter Leaderboard</SH>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: active.color }}>
            Sorted by {active.label}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table aria-label="Ranked chapter leaderboard" className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Rank",
                  "Chapter",
                  "Region",
                  active.label,
                  "Attendance",
                  "Points Score",
                  "Health",
                  "Best Practice",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((chapter, index) => {
                const isUs = chapter.name === "Boston College MEDLIFE";
                const value = (chapter as any)[sortKey] as number;

                return (
                  <tr
                    key={chapter.name}
                    className={`border-b border-slate-100 last:border-0 ${isUs ? "bg-blue-50/60" : index % 2 ? "bg-slate-50/40" : "bg-white"}`}
                  >
                    <td className="px-3 py-3 font-black tabular-nums text-slate-700" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                      #{index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{chapter.name}</span>
                        {isUs && <Pill label="Your Chapter" color="blue"/>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Pill label={chapter.region} color="slate"/>
                    </td>
                    <td className="px-3 py-3 font-black tabular-nums" style={{ color: active.color, fontFamily:"'JetBrains Mono',monospace" }}>
                      {fmtVal(value)}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-700">{chapter.attendance}%</td>
                    <td className="px-3 py-3 font-black tabular-nums text-slate-800" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
                      {getChapterLeaderboardPoints(chapter).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{healthPill(chapter.health >= 85 ? "Strong" : chapter.health >= 75 ? "Needs Attention" : "Inactive")}</td>
                    <td className="px-3 py-3 text-slate-500 max-w-72">{chapter.insight}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chapter rows */}
      <div className="space-y-2.5">
        {sorted.map((ch, idx) => {
          const isUs = ch.name === "Boston College MEDLIFE";
          const val  = (ch as any)[sortKey] as number;
          const pct  = maxVal > 0 ? (val / maxVal) * 100 : 0;

          return (
            <div key={ch.rank} className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-sm
              ${isUs ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200"}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0 w-10 mt-0.5 gap-0.5">
                  <span className="text-[11px] font-black text-slate-500" style={{fontFamily:"'JetBrains Mono',monospace"}}>#{idx+1}</span>
                  {idx < 3 && <span className="text-base leading-none">{medals[idx]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{ch.name}</span>
                    {isUs && <Pill label="Your Chapter" color="blue"/>}
                    <Pill label={ch.region} color="slate"/>
                    <div className="ml-auto">
                      <Pill label={`Health ${ch.health}`} color={ch.health>=85?"green":ch.health>=75?"yellow":"orange"}/>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic mb-3">"{ch.insight}"</p>

                  {/* Active metric bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <FillBar pct={pct} color={isUs ? active.color : "#CBD5E1"}/>
                    <span className="text-sm font-black tabular-nums shrink-0"
                      style={{ color: isUs ? active.color : "#64748B", fontFamily:"'JetBrains Mono',monospace" }}>
                      {fmtVal(val)}
                    </span>
                  </div>

                  {/* The three metrics always shown side by side */}
                  <div className="flex gap-5 flex-wrap">
                    {cats.map(cat => {
                      const catVal = (ch as any)[cat.key] as number;
                      const isActive = cat.key === sortKey;
                      return (
                        <div key={cat.key}
                          className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border transition-all
                            ${isActive ? "border-transparent" : "bg-slate-50 border-slate-100"}`}
                          style={isActive ? { background: cat.color + "12", borderColor: cat.color + "30" } : {}}>
                          <div className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: isActive ? cat.color : "#94A3B8" }}>
                            {cat.label}
                          </div>
                          <div className="text-base font-black tabular-nums"
                            style={{ color: isActive ? cat.color : "#334155", fontFamily:"'JetBrains Mono',monospace" }}>
                            {fmtVal(catVal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Btn variant="ghost" onClick={() => onNavigate("bridge")}><BookOpen size={11}/>Top Bridge Videos</Btn>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Screen 4: Member Profile ─────────────────────────────────────
function ProfileScreen({ memberId, onBack }: { memberId:number; onBack:()=>void }) {
  const m = MEMBERS.find(x=>x.id===memberId) || MEMBERS[0];
  const wkData = [
    {w:"Apr W1",pts:Math.round(m.pts*0.06)},{w:"Apr W2",pts:Math.round(m.pts*0.08)},
    {w:"Apr W3",pts:Math.round(m.pts*0.07)},{w:"Apr W4",pts:Math.round(m.pts*0.09)},
    {w:"May W1",pts:Math.round(m.pts*0.10)},{w:"May W2",pts:Math.round(m.pts*0.09)},
    {w:"May W3",pts:Math.round(m.pts*0.11)},{w:"May W4",pts:Math.round(m.pts*0.12)},
    {w:"Jun W1",pts:m.ptsLast},{w:"Jun W2",pts:m.ptsWk},
  ];
  const rec = m.pipeline==="E-Board" ? { label:"Strong E-Board candidate", color:"#16A34A", bg:"#F0FDF4", border:"#BBF7D0" }
    : m.pipeline==="Chair" ? { label:"Ready for Chair role", color:"#1A56E8", bg:"#EFF6FF", border:"#BFDBFE" }
    : m.pipeline==="Chair candidate" ? { label:"Promote to Chair", color:"#0891B2", bg:"#ECFEFF", border:"#A5F3FC" }
    : m.values==="Values Aligned" ? { label:"Needs more task activity", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A" }
    : { label:"Needs values interview", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A" };

  // Chapter rank (top 20 only — we don't show rank to everyone)
  const chapterSorted = [...MEMBERS].sort((a,b) => b.pts - a.pts);
  const chapterRank   = chapterSorted.findIndex(x => x.id === m.id) + 1;
  const showRank      = chapterRank <= 20;

  const timeline = [
    { date:"Jun 12", event:"Attended SLT Interest Meeting" },
    { date:"Jun 10", event:"Created Moving Mountains Kickoff event" },
    { date:"Jun 8",  event:"Submitted evidence for 3 actions" },
    { date:"Jun 3",  event:"Completed fundraising action — $420 raised" },
    { date:"May 29", event:"Promoted to committee co-lead" },
    { date:"May 22", event:"Submitted bridge video: Info Night Guide" },
  ];

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
        <ChevronRight size={13} className="rotate-180"/>Back to Member Pipeline
      </button>

      <div>
        <h1 className="text-2xl font-black text-slate-900">Member Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review this member's points, events, actions, notes, and next leadership move.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column: profile + actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col items-center text-center gap-2 mb-4">
              <div className="relative">
                <Avatar name={m.name} color={m.color} size={56}/>
                {showRank && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#07192E] border-2 border-white flex items-center justify-center shadow-md">
                    <span className="text-[9px] font-black text-white" style={{fontFamily:"'JetBrains Mono',monospace"}}>#{chapterRank}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="font-black text-slate-900 text-base">{m.name}</div>
                {showRank && (
                  <div className="text-[11px] font-bold text-amber-600 mb-0.5">
                    #{chapterRank} in chapter {chapterRank===1?"🥇":chapterRank===2?"🥈":chapterRank===3?"🥉":""}
                  </div>
                )}
                <div className="text-xs text-slate-500">{m.role}</div>
                <div className="text-xs text-slate-400">{m.committee} Committee</div>
              </div>
              {/* Readiness badge */}
              <div className="w-full mt-2 px-3 py-2 rounded-lg border text-xs font-semibold text-center"
                style={{ color:rec.color, background:rec.bg, borderColor:rec.border }}>
                {rec.label}
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ["Last active",   m.lastActive],
                ["SLT interest",  m.slt ? "Yes — signed up" : "Not yet"],
                ["Volunteer hrs", `${m.volunteer} hrs`],
                ["Fundraising",   `$${m.fundraising.toLocaleString()}`],
                ["Engagement",    `${m.engage}%`],
              ].map(([k,v])=>(
                <div key={k as string} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-0">
                  <span className="text-slate-400 font-medium">{k}</span>
                  <span className="text-slate-800 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Leadership Actions</div>
            <Btn variant="primary"   className="w-full justify-start"><Star size={11}/>Promote to Officer</Btn>
            <Btn variant="secondary" className="w-full justify-start"><Zap size={11}/>Assign Leadership Action</Btn>
            <Btn variant="ghost"     className="w-full justify-start"><Flag size={11}/>Nominate for E-Board</Btn>
          </div>
        </div>

        {/* Right columns: metrics + chart + notes */}
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Kard label="Total Points"  value={m.pts.toLocaleString()}  sub={`+${m.ptsWk} this week`} trend="up" accent={YELLOW} icon={Star}/>
            <Kard label="Events Created" value={m.evtCreated}           sub="This semester"            accent={BLUE}      icon={Calendar}/>
            <Kard label="Tasks Done"     value={m.actions}               sub={`${m.evidence} submitted`}    accent="#16A34A" icon={CheckCircle}/>
            <Kard label="Bridge Videos" value={m.bridge}                sub="Submitted"                accent="#DB2777"   icon={Video}/>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SH>Points History — Weekly</SH>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={wkData}>
                <defs>
                  <linearGradient id="mG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={m.color} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={m.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid key="profile-grid" strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
                <XAxis key="profile-x" dataKey="w" tick={{fontSize:9,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
                <YAxis key="profile-y" tick={{fontSize:9,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Area key="profile-pts" type="monotone" dataKey="pts" name="Member Points" stroke={m.color} strokeWidth={2.5} fill="url(#mG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <SH>Activity Timeline</SH>
            <div className="mt-3 relative">
              <div className="absolute left-[6px] top-0 bottom-0 w-px bg-slate-100"/>
              {timeline.map((t,i)=>(
                <div key={i} className="pl-5 pb-3 relative last:pb-0">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-300"/>
                  <div className="text-[10px] text-slate-400 font-mono">{t.date}</div>
                  <div className="text-xs text-slate-700 font-medium leading-snug">{t.event}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <SH>Coach & Leader Notes</SH>
              <Btn variant="secondary"><Edit size={10}/>Add Note</Btn>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 font-mono mb-1">Jun 8, 2025 — Sofia Reyes (President)</div>
              <p className="text-xs text-slate-700 leading-relaxed">{m.name} is consistently one of the most dependable members of this chapter. Shows up, follows through, and brings others along. Values interview recommended before end of June. Strong candidate for a larger role next semester.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Committees ─────────────────────────────────────────
function CommitteesScreen({ onAssignAction, onPromote }: { onAssignAction: () => void; onPromote: () => void }) {
  const [expanded, setExpanded] = useState<number|null>(null);

  // Chapter-wide event totals for summary cards
  const totalEvtYear      = COMMITTEES.reduce((a,c) => a + c.evtThisYear,   0);
  const totalEvtNextWeek  = COMMITTEES.reduce((a,c) => a + c.evtNextWeek,   0);
  const totalEvtNextMonth = COMMITTEES.reduce((a,c) => a + c.evtNextMonth,  0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Event Committees</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor whether each committee is moving the chapter forward — not just existing.</p>
        </div>
        <Btn variant="primary"><Plus size={11}/>Add Committee</Btn>
      </div>

      {/* Summary cards — chapter-wide */}
      <div className="grid grid-cols-6 gap-3">
        <Kard label="Active Committees"      value="5 / 7"              accent="#16A34A"  icon={Layers}/>
        <Kard label="Total Open Tasks"        value="29"   sub="Across all committees" accent={YELLOW}   icon={Clock}/>
        <Kard label="Events This Year"       value={totalEvtYear}       accent={BLUE}     icon={Calendar}/>
        <Kard label="Events Last Month"      value={COMMITTEES.reduce((a,c)=>a+c.evtLastMonth,0)}   accent="#7C3AED"  icon={Calendar}/>
        <Kard label="Events Next 7 Days"     value={totalEvtNextWeek}   accent="#059669"  icon={Calendar}/>
        <Kard label="Events Next 30 Days"    value={totalEvtNextMonth}  accent="#0891B2"  icon={Calendar}/>
      </div>

      {/* Committee rows */}
      <div className="space-y-3">
        {COMMITTEES.map(c => (
          <div key={c.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm
            ${c.health==="Inactive"?"border-red-200":c.health==="Needs Attention"?"border-amber-200":"border-slate-200"}`}>

            {/* ── Collapsed row ── */}
            <button
              className="w-full text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpanded(expanded===c.id ? null : c.id)}>
              <div className="flex items-stretch">
                {/* Color side bar */}
                <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ background: c.color }}/>

                <div className="flex-1 px-5 py-4">
                  {/* Top row: name + health + chevron */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      {c.chairs.length === 0
                        ? <div className="text-xs text-red-500 font-semibold mt-0.5">⚠ No chair assigned</div>
                        : <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {c.chairs.map(ch => (
                              <div key={ch} className="flex items-center gap-1">
                                <Avatar name={ch} color={c.color} size={16}/>
                                <span className="text-[10px] text-slate-500">{ch}</span>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {healthPill(c.health)}
                      {expanded===c.id
                        ? <ChevronUp   size={15} className="text-slate-400"/>
                        : <ChevronDown size={15} className="text-slate-400"/>}
                    </div>
                  </div>

                  {/* Metric columns */}
                  <div className="grid grid-cols-9 gap-3 items-end">

                    {/* Members + actions */}
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{c.members}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Members</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{c.doneActs}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Tasks Done</div>
                      </div>
                    </div>

                    {/* Event timeline — 5 columns */}
                    <div className="col-span-5 grid grid-cols-5 gap-1.5">
                      {[
                        { label:"This Year",    value:c.evtThisYear,   period:"past",   tip:"Total events organized in 2025" },
                        { label:"Last Month",   value:c.evtLastMonth,  period:"past",   tip:"Events in the past 30 days" },
                        { label:"Last Week",    value:c.evtLastWeek,   period:"past",   tip:"Events in the past 7 days" },
                        { label:"Next Week",    value:c.evtNextWeek,   period:"future", tip:"Events scheduled in the next 7 days" },
                        { label:"Next Month",   value:c.evtNextMonth,  period:"future", tip:"Events scheduled in the next 30 days" },
                      ].map(ev => (
                        <div key={ev.label}
                          className={`rounded-lg p-2 text-center border transition-colors
                            ${ev.period==="future"
                              ? ev.value > 0
                                ? "bg-blue-50 border-blue-200"
                                : "bg-slate-50 border-slate-200"
                              : "bg-slate-50 border-slate-100"}`}
                          title={ev.tip}>
                          <div className={`text-base font-black tabular-nums leading-none
                            ${ev.period==="future" && ev.value > 0 ? "text-blue-700" : "text-slate-800"}`}
                            style={{fontFamily:"'JetBrains Mono',monospace"}}>
                            {ev.value}
                          </div>
                          <div className={`text-[9px] mt-0.5 font-semibold
                            ${ev.period==="future" && ev.value > 0 ? "text-blue-500" : "text-slate-400"}`}>
                            {ev.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* KPI bar */}
                    <div className="col-span-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">KPI</span>
                        <span className="font-bold" style={{ color: c.color }}>{c.kpi}%</span>
                      </div>
                      <FillBar pct={c.kpi} color={c.color}/>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* ── Expanded panel ── */}
            {expanded===c.id && (
              <div className="border-t border-slate-100 bg-slate-50/60">
                <div className="px-6 py-5 grid grid-cols-3 gap-6">

                  {/* Upcoming events list */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Upcoming Events ({c.upcoming.length})
                    </div>
                    {c.upcoming.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No events scheduled. Assign one now.</div>
                    ) : (
                      <div className="space-y-2">
                        {c.upcoming.map((ev, i) => (
                          <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-800 truncate">{ev.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{ev.date}</div>
                            </div>
                            {ev.rsvp > 0 && (
                              <span className="text-[10px] font-bold text-blue-600 ml-2 shrink-0">{ev.rsvp} RSVPs</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Event count detail + other stats */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event History</div>
                      <div className="space-y-1.5">
                        {[
                          ["This Year",  c.evtThisYear],
                          ["Last Month", c.evtLastMonth],
                          ["Last Week",  c.evtLastWeek],
                          ["Next Week",  c.evtNextWeek],
                          ["Next Month", c.evtNextMonth],
                        ].map(([l,v]) => (
                          <div key={l as string} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{l}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width:`${Math.min(((v as number)/Math.max(c.evtThisYear,1))*100, 100)}%`,
                                  background: c.color,
                                }}/>
                              </div>
                              <span className="font-black w-4 text-right tabular-nums text-slate-800" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Other Stats</div>
                      <div className="space-y-1.5 text-xs">
                        {[["Open Tasks",c.openActs],["Bridge Videos",c.bridge],["Points Earned",c.pts.toLocaleString()]].map(([k,v])=>(
                          <div key={k as string} className="flex justify-between">
                            <span className="text-slate-500">{k}</span>
                            <span className="font-bold text-slate-800">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation + CTAs */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Action</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.rec}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</div>
                      <div className="space-y-1.5">
                        <Btn variant="primary"    className="w-full justify-start"><Plus size={10}/>Add Chair</Btn>
                        <Btn variant="secondary"  className="w-full justify-start" onClick={onPromote}><Star size={10}/>Promote Member</Btn>
                        <Btn variant="secondary"  className="w-full justify-start" onClick={onAssignAction}><Zap size={10}/>Assign Task</Btn>
                        <Btn variant="secondary"  className="w-full justify-start"><Calendar size={10}/>Create Event</Btn>
                        <Btn variant="ghost"      className="w-full justify-start"><Eye size={10}/>Review Committee</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
        {label}{required && <span className="text-red-400">*</span>}</label>{children}
    </div>
  );
}

// ─── Screen 6: Events ─────────────────────────────────────────────
// (CreateEventForm is now in CreateEventScreen.tsx)

// ─── Events Screen ────────────────────────────────────────────────
// ─── NPS Survey Preview Modal ────────────────────────────────────
function NpsSurveyModal({ eventName, onClose }: { eventName: string; onClose: () => void }) {
  const [rating, setRating]     = useState<number|null>(null);
  const [feedback, setFeedback] = useState("");
  const [joining, setJoining]   = useState<string|null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isPromoter  = rating !== null && rating >= 9;
  const isDetractor = rating !== null && rating <= 6;

  if (submitted) return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-500"/>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-slate-900">Thank you!</div>
          <p className="text-sm text-slate-500 mt-1">Your feedback helps us make every MEDLIFE event better.</p>
        </div>
        <button onClick={onClose} className="mt-1 px-6 py-2 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700">Done</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell onClose={onClose}>
      {/* Survey header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-[#1A56E8] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-black">M</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Boston College MEDLIFE</span>
        </div>
        <h2 className="text-base font-black text-slate-900">Quick feedback on <span className="text-blue-600">{eventName}</span></h2>
        <p className="text-xs text-slate-400 mt-0.5">2 questions · takes 30 seconds</p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Q1: NPS */}
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            How likely are you to recommend MEDLIFE to a friend?
          </p>
          <p className="text-xs text-slate-400 mb-4">0 = Not at all likely · 10 = Extremely likely</p>

          {/* 0–10 buttons */}
          <div className="flex gap-1.5">
            {Array.from({length:11},(_,i)=>i).map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-black cursor-pointer transition-all border
                  ${rating === n
                    ? n >= 9 ? "bg-green-500  border-green-500  text-white"
                    : n >= 7 ? "bg-amber-400  border-amber-400  text-white"
                    :          "bg-red-500    border-red-500    text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                {n}
              </button>
            ))}
          </div>

          {/* Score labels */}
          <div className="flex justify-between mt-1.5 text-[9px] text-slate-400 font-medium">
            <span>🙁 Detractor</span>
            <span>😐 Passive</span>
            <span>😊 Promoter</span>
          </div>
        </div>

        {/* Q2: Conditional follow-up */}
        {rating !== null && (
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">
              {isPromoter
                ? "What did you love most about this event?"
                : isDetractor
                ? "What's one thing we could do better?"
                : "Any suggestions for next time?"}
            </p>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Optional — your words help us improve."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>
        )}

        {/* Q3: Interest in joining */}
        {rating !== null && (
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-2">Are you interested in joining MEDLIFE?</p>
            <div className="flex gap-2">
              {["Yes, sign me up!", "Already a member", "Not right now"].map(opt => (
                <button key={opt} onClick={() => setJoining(opt)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all
                    ${joining===opt ? "bg-[#1A56E8] text-white border-[#1A56E8]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Skip</button>
        <button
          disabled={rating === null}
          onClick={() => setSubmitted(true)}
          className="px-6 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          Submit Feedback →
        </button>
      </div>
    </ModalShell>
  );
}

// ─── NPS Results Panel ────────────────────────────────────────────
function NpsResultsPanel({ nps, attendees, totalMembers, rsvp }: { nps: NpsResult; attendees: number; totalMembers: number; rsvp?: number }) {
  const responseRate  = Math.round((nps.responses / nps.sent) * 100);
  const membersPct    = Math.round((nps.membersAttending / nps.totalMembers) * 100);
  const c             = npsColor(nps.score);

  return (
    <div className="space-y-4">
      {/* Three headline numbers */}
      <div className="grid grid-cols-3 gap-3">
        {/* NPS Score */}
        <div className={`rounded-xl border p-4 text-center ${c.bg} ${c.border}`}>
          <div className={`text-3xl font-black tabular-nums ${c.text}`} style={{fontFamily:"'JetBrains Mono',monospace"}}>
            {nps.score > 0 ? "+" : ""}{nps.score}
          </div>
          <div className={`text-xs font-bold mt-0.5 ${c.text}`}>NPS Score</div>
          <div className="text-[10px] text-slate-400 mt-1">{nps.responses} of {nps.sent} responded ({responseRate}%)</div>
        </div>
        {/* Attendees */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-3xl font-black tabular-nums text-slate-900" style={{fontFamily:"'JetBrains Mono',monospace"}}>{attendees}</div>
          <div className="text-xs font-bold text-slate-600 mt-0.5">Attendees</div>
          <div className="text-[10px] text-slate-400 mt-1">of {rsvp ?? "—"} RSVPs</div>
        </div>
        {/* Members Attending */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-3xl font-black tabular-nums text-slate-900" style={{fontFamily:"'JetBrains Mono',monospace"}}>{membersPct}%</div>
          <div className="text-xs font-bold text-slate-600 mt-0.5">Members Attending</div>
          <div className="text-[10px] text-slate-400 mt-1">{nps.membersAttending} of {nps.totalMembers} members converted</div>
        </div>
      </div>

      {/* Promoter / Passive / Detractor breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Response Breakdown</div>
        <div className="space-y-2">
          {[
            { label:"Promoters (9–10)",  count:nps.promoters,  color:"#16A34A", bg:"#DCFCE7" },
            { label:"Passives (7–8)",    count:nps.passives,   color:"#D97706", bg:"#FEF3C7" },
            { label:"Detractors (0–6)",  count:nps.detractors, color:"#DC2626", bg:"#FEE2E2" },
          ].map(row => {
            const pct = Math.round((row.count / nps.responses) * 100);
            return (
              <div key={row.label} className="flex items-center gap-3">
                <div className="text-xs text-slate-500 w-32 shrink-0">{row.label}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:row.color }}/>
                </div>
                <div className="text-xs font-black w-16 text-right tabular-nums" style={{color:row.color,fontFamily:"'JetBrains Mono',monospace"}}>
                  {row.count} <span className="font-normal text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verbatim feedback */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">💬 What they loved</div>
          <div className="space-y-2">
            {nps.topFeedback.map((f,i) => (
              <p key={i} className="text-xs text-slate-700 italic">"{f}"</p>
            ))}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">🔧 What to improve</div>
          <div className="space-y-2">
            {nps.improveFeedback.map((f,i) => (
              <p key={i} className="text-xs text-slate-700 italic">"{f}"</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsScreen({ externalCreate, onExternalCreateHandled }: { externalCreate?: boolean; onExternalCreateHandled?: () => void }) {
  const [showCreate,   setShowCreate]   = useState(false);
  const [surveyEvent,  setSurveyEvent]  = useState<{id:number; name:string}|null>(null);
  const [npsEventId,   setNpsEventId]   = useState<number|null>(null);

  useEffect(() => {
    if (externalCreate) {
      setShowCreate(true);
      onExternalCreateHandled?.();
    }
  }, [externalCreate]);

  const past      = EVENTS.filter(e => e.attended !== null);
  const chartData = past.map(e => ({
    name: e.name.slice(0,16)+"…",
    RSVP: e.rsvp,
    Attended: e.attended ?? 0,
  }));

  // Chapter-wide NPS avg
  const npsEvents    = EVENTS.filter(e => e.nps && NPS_RESULTS[e.id]);
  const avgNps       = npsEvents.length
    ? Math.round(npsEvents.reduce((a,e) => a + NPS_RESULTS[e.id].score, 0) / npsEvents.length)
    : null;
  const totalMembersConverted = npsEvents.reduce((a,e) => a + NPS_RESULTS[e.id].membersAttending, 0);
  const totalMembers          = npsEvents.reduce((a,e) => a + NPS_RESULTS[e.id].totalMembers, 0);

  if (showCreate) return <CreateEventForm onBack={() => setShowCreate(false)}/>;

  return (
    <div className="space-y-5">
      {/* NPS survey preview modal */}
      {surveyEvent && (
        <NpsSurveyModal eventName={surveyEvent.name} onClose={() => setSurveyEvent(null)}/>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Event Performance</h1>
          <p className="text-sm text-slate-500 mt-1">Track event execution, scores, follow-up, and chapter-wide attendance.</p>
        </div>
        <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={11}/>Create Event</Btn>
      </div>

      {/* Summary cards — now includes NPS */}
      <div className="grid grid-cols-6 gap-3">
        <Kard label="Events This Month"   value="12"                                                     accent={BLUE}    icon={Calendar}/>
        <Kard label="Avg Attendance Rate" value="67%"    sub="−4% vs last month" trend="down"            accent={YELLOW}  icon={Activity}/>
        <Kard label="RSVP Conversion"     value="79%"                                                    accent="#16A34A" icon={CheckCircle}/>
        <Kard label="Avg Event Score"
          value={avgNps !== null ? (avgNps > 0 ? `+${avgNps}` : `${avgNps}`) : "—"}
          sub={`${npsEvents.length} events surveyed`}
          accent={avgNps !== null && avgNps >= 50 ? "#16A34A" : avgNps !== null && avgNps >= 20 ? "#D97706" : "#DC2626"}
          icon={Star}/>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <SH>All Events — June 2025</SH>
          <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-500">
            <option>All Committees</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Event","Date","Committee","RSVP","Attended","Att. Rate","Status","Event Score","Creator"].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e,i) => {
                const nps = NPS_RESULTS[e.id];
                const c   = nps ? npsColor(nps.score) : null;
                return (
                  <tr key={e.id} className={`border-b border-slate-100 last:border-0 hover:bg-blue-50/20 ${i%2!==0?"bg-slate-50/40":""}`}>
                    <td className="px-3 py-3 font-semibold text-slate-800 max-w-44 truncate">{e.name}</td>
                    <td className="px-3 py-3 text-slate-500 font-mono whitespace-nowrap">{e.date}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{e.committee}</td>
                    <td className="px-3 py-3 text-center font-mono">{e.rsvp || "—"}</td>
                    <td className="px-3 py-3 text-center font-mono">{e.attended ?? "—"}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold">
                      {e.attended && e.rsvp ? `${Math.round(e.attended/e.rsvp*100)}%` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Pill label={e.status} color={e.status==="Past"?"slate":e.status==="Today"?"blue":"green"}/>
                    </td>
                    {/* Event Score cell */}
                    <td className="px-3 py-3">
                      {nps && c ? (
                        <button onClick={() => setNpsEventId(npsEventId===e.id ? null : e.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black border cursor-pointer hover:opacity-80 transition-opacity ${c.bg} ${c.border} ${c.text}`}>
                          {nps.score > 0 ? "+" : ""}{nps.score}
                          <ChevronDown size={9} className={npsEventId===e.id ? "rotate-180 transition-transform" : "transition-transform"}/>
                        </button>
                      ) : e.status === "Past" ? (
                        <button onClick={() => setSurveyEvent({ id:e.id, name:e.name })}
                          className="text-[10px] font-semibold text-blue-500 hover:underline cursor-pointer whitespace-nowrap">
                          Send survey
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{e.creator}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inline NPS results drawer */}
        {npsEventId !== null && (() => {
          const evt = EVENTS.find(e => e.id === npsEventId);
          const nps = NPS_RESULTS[npsEventId];
          if (!evt || !nps) return null;
          return (
            <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Event Score — {evt.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{evt.date} · {nps.responses} responses from {nps.sent} attendees surveyed</p>
                </div>
                <div className="flex gap-2">
                  <Btn variant="secondary" onClick={() => setSurveyEvent({ id:evt.id, name:evt.name })}>
                    <Eye size={10}/>Preview Survey
                  </Btn>
                  <Btn variant="ghost" onClick={() => setNpsEventId(null)}>
                    <X size={10}/>Close
                  </Btn>
                </div>
              </div>
              <NpsResultsPanel
                nps={nps}
                attendees={evt.attended ?? 0}
                totalMembers={nps.totalMembers}
                rsvp={evt.rsvp}
              />
            </div>
          );
        })()}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SH>RSVP vs. Actual Attendance</SH>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{top:8,right:8,left:-8,bottom:0}}>
              <CartesianGrid key="events-grid" strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
              <XAxis key="events-x" dataKey="name" tick={{fontSize:9,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
              <YAxis key="events-y" tick={{fontSize:10,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar key="events-rsvp"     dataKey="RSVP"     fill="#BFDBFE" radius={[4,4,0,0]}/>
              <Bar key="events-attended" dataKey="Attended" fill={BLUE}    radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <SH>Social Recruiting Data</SH>
            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Integration Pending</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Hootsuite / API integration pending. Placeholder data shown.</p>
          <div className="grid grid-cols-2 gap-2 opacity-50 pointer-events-none select-none">
            {[["Posts Published","24"],["Followers","1,240"],["Avg Engagement","4.8%"],["Clicks to Join","84"],["Members Generated","18"],["Best Post Reach","2,180"]].map(([l,v])=>(
              <div key={l} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-sm font-black text-slate-700 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
                <div className="text-[11px] text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 7: Impact ─────────────────────────────────────────────
// ─── Mobile Clinic + Field Story data ────────────────────────────
const MOBILE_CLINICS = [
  {
    id:"MC21", label:"MC21", location:"Cusco, Peru", year:2025, month:"Jan",
    color:"#1A56E8", flag:"🇵🇪",
    bcParticipants:6, totalPatients:187, medical:128, dental:42, pediatric:38, womens:22, projects:2,
    description:"Six Boston College students traveled to the highlands of Cusco to support a five-day mobile clinic serving remote Andean communities with limited healthcare access.",
    photo:"photo-1593460915132-fcb729cc4597",
  },
  {
    id:"MC20", label:"MC20", location:"Lima, Peru", year:2024, month:"Mar",
    color:"#7C3AED", flag:"🇵🇪",
    bcParticipants:7, totalPatients:142, medical:94, dental:34, pediatric:28, womens:18, projects:1,
    description:"Seven members served a peri-urban community on the outskirts of Lima, providing medical, dental, and women's health screenings alongside a stairway infrastructure project.",
    photo:"photo-1725153264822-ab95a6e81428",
  },
  {
    id:"MC19", label:"MC19", location:"Ayacucho, Peru", year:2023, month:"Aug",
    color:"#059669", flag:"🇵🇪",
    bcParticipants:4, totalPatients:91, medical:62, dental:22, pediatric:14, womens:8, projects:1,
    description:"Four chapter members helped serve rural communities in the Ayacucho region, contributing to medical care and a community infrastructure project funded by Moving Mountains.",
    photo:"photo-1648959855771-5b604a638bcd",
  },
];

type StoryType = "patient" | "project";
interface FieldStory {
  id:         number;
  mc:         string;           // e.g. "MC21"
  type:       StoryType;
  subject:    string;           // patient name/alias or project name
  age?:       string;
  location:   string;
  photo:      string;           // unsplash photo id
  headline:   string;
  excerpt:    string;
  full:       string;
  stats:      { label:string; value:string }[];
  sharedBy:   string;
  date:       string;
  tags:       string[];
}

const FIELD_STORIES: FieldStory[] = [
  {
    id:1, mc:"MC21", type:"patient", subject:"Rosa M.", age:"68",
    location:"Pisac, Cusco Region", photo:"photo-1760726394506-855463da8979",
    headline:"First dental visit in over a decade",
    excerpt:"Rosa walked three hours from her highland village to reach the MC21 clinic. She had never received dental care.",
    full:"Rosa walked three hours from her village in the mountains above Pisac to reach the MC21 mobile clinic in Cusco. At 68, she had never received professional dental care. With the help of volunteer dentists and a BC student translator, she received two extractions and a full cleaning. Her daughter, who accompanied her, wept with gratitude. Rosa left holding a toothbrush — her first — and a follow-up care card. This is the moment we work toward.",
    stats:[{label:"Clinic",value:"MC21"},{label:"Visit type",value:"Dental"},{label:"Travel to clinic",value:"3 hours"},{label:"First visit",value:"Yes"}],
    sharedBy:"Sofia Reyes", date:"Jan 18, 2025", tags:["Dental","Elder care","MC21"],
  },
  {
    id:2, mc:"MC21", type:"patient", subject:"Miguel A.", age:"7",
    location:"San Blas, Cusco", photo:"photo-1771648761386-beeb4b7d658c",
    headline:"Caught early — a pediatric case that couldn't wait",
    excerpt:"Miguel's mother brought him to MC21 with persistent coughing. The checkup revealed a respiratory issue that required immediate referral.",
    full:"Miguel's mother had been worried about her son's persistent cough for months. She couldn't afford a clinic visit in the city. At MC21, our volunteer physicians identified signs of a lower respiratory infection that needed prompt antibiotic treatment. A referral was arranged with a partner clinic in Cusco city. Miguel received his first-ever pediatric examination — and his mother left with medication, a follow-up plan, and the knowledge that her son would be okay. Stories like Miguel's are why early intervention matters.",
    stats:[{label:"Clinic",value:"MC21"},{label:"Visit type",value:"Pediatric"},{label:"Follow-up needed",value:"Yes"},{label:"Referred",value:"Cusco Regional Hospital"}],
    sharedBy:"Marcus Chen", date:"Jan 19, 2025", tags:["Pediatric","Referral","MC21"],
  },
  {
    id:3, mc:"MC21", type:"project", subject:"Stairway Safety Project — Pisac",
    location:"Pisac District, Cusco", photo:"photo-1669334872047-b9facb3f92d0",
    headline:"A stairway that makes a community safer every day",
    excerpt:"MC21 volunteers and community members built 40 meters of safety stairs on a steep hillside used daily by over 200 residents.",
    full:"The hillside settlement above Pisac had no safe path connecting its upper and lower sections. Residents — including children and elders — navigated a steep, eroding slope daily. MC21 volunteers worked alongside community members over three days to construct 40 meters of reinforced earthen stairways with handrails. The project was funded in part by Moving Mountains donations from chapters across the MEDLIFE network. An estimated 200 residents now use the stairs daily. The community named the path 'El Camino de Salud' — the path of health.",
    stats:[{label:"Clinic",value:"MC21"},{label:"Project type",value:"Infrastructure"},{label:"Stairs built",value:"40 meters"},{label:"Beneficiaries",value:"200+"},{label:"Funded by",value:"Moving Mountains"}],
    sharedBy:"DeShawn Williams", date:"Jan 20, 2025", tags:["Infrastructure","Community","MC21","Moving Mountains"],
  },
  {
    id:4, mc:"MC20", type:"patient", subject:"Carmen V.", age:"34",
    location:"Villa El Salvador, Lima", photo:"photo-1760726356114-92dfc3fbb8fb",
    headline:"A screening that changed everything",
    excerpt:"Carmen almost didn't come. A neighbor told her about the clinic. What she learned that day may have saved her life.",
    full:"Carmen almost skipped the clinic. She felt healthy and assumed it wasn't necessary. But a neighbor told her the line was short and the doctors were kind. The women's health screening our team provided detected a cervical abnormality that required follow-up biopsy. Carmen was referred to a public hospital in Lima and has since begun treatment. She later sent a message through a community health worker: 'If I hadn't come that day, I would not have known.' This is preventive care working exactly as it should.",
    stats:[{label:"Clinic",value:"MC20"},{label:"Visit type",value:"Women's Health"},{label:"Follow-up",value:"Biopsy referral"},{label:"Outcome",value:"Treatment initiated"}],
    sharedBy:"Priya Sharma", date:"Mar 12, 2024", tags:["Women's Health","Prevention","MC20"],
  },
  {
    id:5, mc:"MC20", type:"project", subject:"Community Health Education Mural",
    location:"Villa El Salvador, Lima", photo:"photo-1550290129-41b39a6fdfe8",
    headline:"Knowledge painted on a wall — lasting longer than one clinic day",
    excerpt:"Working with local artists and community leaders, MC20 volunteers created a health education mural that stays in the community long after the clinic ends.",
    full:"Mobile clinic days are powerful but temporary. The MC20 team partnered with local artists and the Villa El Salvador community council to design and paint a large health education mural on the wall of the community center. The mural covers hand hygiene, maternal nutrition, dental care, and when to seek medical attention. It was designed in collaboration with residents and is written in simple Spanish with illustrations. Over 1,200 people pass this mural daily. It is a reminder that MEDLIFE's work doesn't end when we leave.",
    stats:[{label:"Clinic",value:"MC20"},{label:"Project type",value:"Health Education"},{label:"Mural area",value:"12m × 4m"},{label:"Daily visibility",value:"1,200+ residents"}],
    sharedBy:"Amara Okonkwo", date:"Mar 14, 2024", tags:["Education","Community","MC20"],
  },
  {
    id:6, mc:"MC19", type:"patient", subject:"The Quispe Family",
    location:"Ayacucho Region", photo:"photo-1763809677372-3064c11c29f0",
    headline:"Three generations seen in a single afternoon",
    excerpt:"A grandmother, her daughter, and granddaughter all received care at MC19 — the only medical attention any of them had received in years.",
    full:"Abuela Quispe, 74, came with her daughter Lucía, 42, and granddaughter Valentina, 9. None of them had seen a doctor in over three years. At MC19, all three received medical examinations. Abuela had unmanaged hypertension that was identified and referred for follow-up. Lucía received a women's health screening. Valentina received a pediatric checkup and vaccinations. The family left with medication, referral letters, and smiles. Three generations. One afternoon. This is what accessible healthcare looks like.",
    stats:[{label:"Clinic",value:"MC19"},{label:"Patients",value:"3 (1 family)"},{label:"Visit types",value:"Medical, Pediatric, Women's"},{label:"Referred",value:"Yes — Abuela Quispe"}],
    sharedBy:"Nadia Osei", date:"Aug 9, 2023", tags:["Family","Multi-generational","MC19"],
  },
];

// ─── Impact Screen ────────────────────────────────────────────────
function ImpactScreen() {
  const [activeMC, setActiveMC]         = useState<string>("all");
  const [activeStoryType, setActiveStoryType] = useState<"all"|"patient"|"project">("all");
  const [openStoryId, setOpenStoryId]   = useState<number|null>(null);

  const visitData = [
    {name:"Medical",  val:312},{name:"Dental",  val:98},
    {name:"Pediatric",val:74},{name:"Women's Health",val:56},
  ];

  const filteredStories = FIELD_STORIES.filter(s => {
    const mcMatch   = activeMC === "all" || s.mc === activeMC;
    const typeMatch = activeStoryType === "all" || s.type === activeStoryType;
    return mcMatch && typeMatch;
  });

  const openStory = FIELD_STORIES.find(s => s.id === openStoryId);
  const openMC    = openStory ? MOBILE_CLINICS.find(c => c.id === openStory.mc) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Impact Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">This is why we do this. Real people. Real change.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary"><Share2 size={11}/>Share Impact Story</Btn>
          <Btn variant="primary"><Video size={11}/>Create Bridge Video</Btn>
        </div>
      </div>

      {/* Chapter impact summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { bg:"from-blue-600 to-blue-800",   emoji:"🍽️", n:"1,840", label:"meals served",   story:"Your chapter served 1,840 meals to 420 people in the Boston community this year." },
          { bg:"from-indigo-600 to-indigo-800",emoji:"🏥", n:"420",   label:"clinic patients", story:"18 chapter SLT travelers contributed to care for 420 patients across MC19, MC20, and MC21." },
          { bg:"from-amber-500 to-amber-700",  emoji:"💛", n:"#3",    label:"network rank",    story:"Your Moving Mountains campaign ranks #3 globally — helping fund real projects at each MC." },
        ].map((s,i) => (
          <div key={i} className={`bg-gradient-to-br ${s.bg} text-white rounded-2xl p-6`}>
            <div className="text-4xl mb-2">{s.emoji}</div>
            <div className="text-4xl font-black mb-0.5">{s.n}</div>
            <div className="text-sm font-semibold opacity-80 mb-3">{s.label}</div>
            <p className="text-xs leading-relaxed opacity-75 mb-4">{s.story}</p>
            <button disabled title="Impact sharing is blocked in this preview until feed-sharing approval is complete" className="text-[11px] font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Share →</button>
          </div>
        ))}
      </div>

      {/* Stats panels */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4"><Heart size={15} className="text-red-500"/><SH>Local Community Impact</SH></div>
          {[["People Supported","420"],["Local Volunteering Hours","284"],["Local Partners","4"]].map(([l,v])=>(
            <div key={l} className="flex justify-between items-center border-b border-slate-100 py-2 last:border-0">
              <span className="text-xs text-slate-500">{l}</span>
              <span className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4"><Globe size={15} className="text-blue-600"/><SH>MEDLIFE Global Impact</SH></div>
          {[["SLT Participants","18"],["SLT Patients & Community Members Served","420"],["Medical Visits","312"],["Dental Visits","98"],["Pediatric Visits","74"],["Women's Health","56"],["Projects — Families Benefitted","280"]].map(([l,v])=>(
            <div key={l} className="flex justify-between items-center border-b border-slate-100 py-1.5 last:border-0">
              <span className="text-xs text-slate-500">{l}</span>
              <span className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4"><Target size={15} className="text-green-600"/><SH>Moving Mountains</SH></div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Raised</span>
              <span className="font-black tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>$8,400 <span className="text-slate-400 font-normal">/ $12,000</span></span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{width:"70%"}}/>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">70% of goal</div>
          </div>
          {[["Donors","94"],["Campaign Rank","#3 in network"]].map(([l,v])=>(
            <div key={l} className="flex justify-between items-center border-b border-slate-100 py-2 last:border-0">
              <span className="text-xs text-slate-500">{l}</span>
              <span className="text-sm font-black text-slate-800">{v}</span>
            </div>
          ))}
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={visitData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <Bar key="impact-val" dataKey="val" name="Clinic Visits" fill={BLUE} radius={[4,4,0,0]}/>
                <XAxis key="impact-x" dataKey="name" tick={{fontSize:8,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{fontSize:10}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Share your experience ── */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Field Updates</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeMC !== "all"
                ? `Showing stories from ${activeMC} — ${MOBILE_CLINICS.find(c=>c.id===activeMC)?.location}`
                : "Patient stories and project stories from all mobile clinics"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Story type filter */}
            <div className="flex gap-1.5">
              {(["all","patient","project"] as const).map(t => (
                <button key={t} onClick={() => setActiveStoryType(t)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg cursor-pointer transition-all border capitalize
                    ${activeStoryType===t ? "bg-[#07192E] text-white border-[#07192E]" : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"}`}>
                  {t === "all" ? "All Stories" : t === "patient" ? "🧑 Patient Stories" : "🏗 Project Stories"}
                </button>
              ))}
            </div>
            {/* MC filter chips */}
            <div className="flex gap-1.5">
              {activeMC !== "all" && (
                <button onClick={() => setActiveMC("all")}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
                  <X size={10}/>Clear MC filter
                </button>
              )}
            </div>
            <Btn variant="primary"><Plus size={11}/>Submit Field Update</Btn>
          </div>
        </div>

        {/* Approval notice */}
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-300 rounded-xl">
          <Shield size={15} className="text-amber-600 mt-0.5 shrink-0"/>
          <div>
            <span className="text-xs font-bold text-amber-800">Staff approval required — </span>
            <span className="text-xs text-amber-700">all field updates, patient stories, and project stories are reviewed by the Staff Command Center before they appear here. Submissions that identify patients must follow MEDLIFE privacy guidelines. You'll be notified once your update is approved or returned.</span>
          </div>
        </div>

        {filteredStories.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Globe size={32} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">No stories match this filter. Try adjusting your selection.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {filteredStories.map(story => {
            const mc = MOBILE_CLINICS.find(c => c.id === story.mc)!;
            return (
              <button key={story.id} onClick={() => setOpenStoryId(story.id)}
                className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                {/* Photo */}
                <div className="relative h-44 bg-slate-200 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/${story.photo}?w=600&h=350&fit=crop&auto=format`}
                    alt={story.subject}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
                  {/* MC badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-white" style={{ background: mc.color }}>
                      {mc.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 text-white backdrop-blur-sm">
                      {mc.flag} {mc.location}
                    </span>
                  </div>
                  {/* Story type */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${story.type==="patient" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"}`}>
                      {story.type === "patient" ? "Patient Story" : "Project Story"}
                    </span>
                  </div>
                  {/* Subject name on photo */}
                  <div className="absolute bottom-3 left-3">
                    <div className="text-white font-black text-sm leading-tight">{story.subject}{story.age ? `, ${story.age}` : ""}</div>
                    <div className="text-white/70 text-[11px]">{story.location}</div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-black text-slate-900 leading-snug mb-1.5">{story.headline}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed overflow-hidden">{story.excerpt}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={story.sharedBy} color={mc.color} size={18}/>
                      <span className="text-[10px] text-slate-400">{story.sharedBy} · {story.date}</span>
                    </div>
                    <span className="text-[11px] text-blue-500 font-semibold group-hover:underline">Read →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Story Detail Drawer ── */}
      {openStory && openMC && (
        <div className="fixed inset-0 z-50 flex" style={{ background:"rgba(7,25,46,0.55)", backdropFilter:"blur(4px)" }}
          onClick={() => setOpenStoryId(null)}>
          <div className="ml-auto w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Hero photo */}
            <div className="relative h-64 bg-slate-200">
              <img
                src={`https://images.unsplash.com/${openStory.photo}?w=800&h=400&fit=crop&auto=format`}
                alt={openStory.subject}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10"/>
              {/* Top controls */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black text-white" style={{ background: openMC.color }}>{openMC.label}</span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm">{openMC.flag} {openMC.location}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${openStory.type==="patient"?"bg-blue-500":"bg-amber-500"} text-white`}>
                    {openStory.type === "patient" ? "Patient Story" : "Project Story"}
                  </span>
                </div>
                <button onClick={() => setOpenStoryId(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <X size={14} className="text-white"/>
                </button>
              </div>
              {/* Subject */}
              <div className="absolute bottom-4 left-6">
                <div className="text-white font-black text-2xl leading-tight">{openStory.subject}{openStory.age ? `, ${openStory.age}` : ""}</div>
                <div className="text-white/70 text-sm mt-0.5">{openStory.location}</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Headline */}
              <h2 className="text-xl font-black text-slate-900 leading-snug">{openStory.headline}</h2>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                {openStory.stats.map(s => (
                  <div key={s.label} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">{s.label}</span>
                    <span className="text-xs font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Full story text */}
              <p className="text-sm text-slate-700 leading-relaxed">{openStory.full}</p>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {openStory.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">#{t}</span>
                ))}
              </div>

              {/* MC context */}
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: openMC.color + "40", background: openMC.color + "08" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: openMC.color }}/>
                  <span className="text-xs font-black" style={{ color: openMC.color }}>{openMC.label} · {openMC.location} · {openMC.month} {openMC.year}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{openMC.description}</p>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>👥 {openMC.bcParticipants} BC participants</span>
                  <span>🏥 {openMC.totalPatients} patients served</span>
                  <span>🏗 {openMC.projects} project{openMC.projects !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Shared by */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <Avatar name={openStory.sharedBy} color={openMC.color} size={22}/>
                <span>Shared by <strong className="text-slate-600">{openStory.sharedBy}</strong> · {openStory.date}</span>
              </div>

              {/* Share actions */}
              <div className="flex gap-2 pt-1">
                <Btn variant="primary"   className="flex-1 justify-center"><Share2 size={11}/>Share to Chapter Feed</Btn>
                <Btn variant="secondary" className="flex-1 justify-center"><Video  size={11}/>Create Bridge Video</Btn>
                <Btn variant="secondary" className="flex-1 justify-center"><Upload size={11}/>Add to Presentation</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen 8: Bridge Videos ──────────────────────────────────────
function BridgeScreen() {
  const [cat, setcat]     = useState("All");
  const [openId, setOpenId] = useState<number|null>(null);
  const cats = ["All","Recruitment","Fundraising","SLT Promotion","Leadership Transition","Communications"];
  const shown = cat==="All" ? BRIDGE_VIDEOS : BRIDGE_VIDEOS.filter(v=>v.cat===cat);
  const openVideo = BRIDGE_VIDEOS.find(v=>v.id===openId);

  // Category colour map
  const catColor: Record<string,string> = {
    "Recruitment":"#0891B2","Fundraising":"#D97706","SLT Promotion":"#7C3AED",
    "Leadership Transition":"#1A56E8","Communications":"#DB2777",
  };

  return (
    <div className="space-y-6">
      {/* Slide-in detail drawer */}
      {openVideo && (
        <div className="fixed inset-0 z-50 flex" style={{background:"rgba(7,25,46,0.55)",backdropFilter:"blur(4px)"}}
          onClick={()=>setOpenId(null)}>
          <div className="ml-auto w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl"
            onClick={e=>e.stopPropagation()}>
            {/* Hero photo */}
            <div className="relative h-64 bg-slate-200">
              <img src={`https://images.unsplash.com/${openVideo.photo}?w=800&h=400&fit=crop&auto=format`}
                alt={openVideo.title} className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10"/>
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40">
                  <Play size={24} className="text-white ml-1"/>
                </div>
              </div>
              {/* Top controls */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black text-white"
                    style={{background: catColor[openVideo.cat] || BLUE}}>{openVideo.cat}</span>
                  {openVideo.featured && (
                    <span className="px-2.5 py-1 bg-amber-400 rounded-full text-[11px] font-black text-amber-900">⭐ Featured</span>
                  )}
                  <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white">{openVideo.duration}</span>
                </div>
                <button onClick={()=>setOpenId(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <X size={14} className="text-white"/>
                </button>
              </div>
              {/* Title + author */}
              <div className="absolute bottom-4 left-6 right-6">
                <div className="text-white font-black text-xl leading-snug mb-1">{openVideo.title}</div>
                <div className="text-white/70 text-sm">{openVideo.author} · Submitted {openVideo.date}</div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-5 gap-3 text-center">
                {[
                  {label:"Views",    value:openVideo.views,         icon:Eye},
                  {label:"Likes",    value:openVideo.likes,         icon:ThumbsUp},
                  {label:"Comments", value:openVideo.comments,      icon:MessageSquare},
                  {label:"Shares",   value:openVideo.shares,        icon:Share2},
                  {label:"Chapters using", value:openVideo.chaptersUsing, icon:Globe},
                ].map(s=>{
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-slate-50 rounded-xl py-3 border border-slate-200">
                      <Icon size={14} className="mx-auto text-slate-400 mb-1"/>
                      <div className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
                      <div className="text-[9px] text-slate-400">{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 leading-relaxed">{openVideo.description}</p>

              {/* Key takeaways */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Key Takeaways</div>
                <div className="space-y-2">
                  {openVideo.keyTakeaways.map((t,i)=>(
                    <div key={i} className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-[11px] font-black text-blue-400 shrink-0 mt-0.5" style={{fontFamily:"'JetBrains Mono',monospace"}}>0{i+1}</span>
                      <span className="text-sm text-blue-900">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Btn variant="primary"   className="flex-1 justify-center"><Play    size={11}/>Watch Video</Btn>
                <Btn variant="secondary" className="flex-1 justify-center"><Share2  size={11}/>Share to Feed</Btn>
                <Btn variant="secondary" className="flex-1 justify-center"><Star    size={11}/>Feature</Btn>
              </div>
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Shield size={13} className="text-amber-500 mt-0.5 shrink-0"/>
                <p className="text-[11px] text-amber-700">Sharing and featuring requires Staff Command Center approval. Use the submit button to send a new video for review.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bridge Video Hub</h1>
          <p className="text-sm text-slate-500 mt-1 italic">"MEDLIFE leaders build a bridge for the next generation."</p>
        </div>
        <Btn variant="primary"><Upload size={11}/>Submit for Approval</Btn>
      </div>

      {/* Approval notice */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-300 rounded-xl">
        <Shield size={15} className="text-amber-600 mt-0.5 shrink-0"/>
        <div>
          <span className="text-xs font-bold text-amber-800">Staff approval required — </span>
          <span className="text-xs text-amber-700">all bridge video submissions are reviewed by the Staff Command Center before they are published or shared with the chapter. You'll receive a notification once your submission is approved or returned with feedback.</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Kard label="Videos Submitted" value={BRIDGE_VIDEOS.length}                                  accent={BLUE}    icon={Video}/>
        <Kard label="Total Views"      value={BRIDGE_VIDEOS.reduce((a,v)=>a+v.views,0)}             accent="#7C3AED" icon={Eye}/>
        <Kard label="Total Likes"      value={BRIDGE_VIDEOS.reduce((a,v)=>a+v.likes,0)}             accent={YELLOW}  icon={ThumbsUp}/>
        <Kard label="Chapters Using"   value={BRIDGE_VIDEOS.reduce((a,v)=>a+v.chaptersUsing,0)}     accent="#16A34A" icon={Globe}/>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(c=>(
          <button key={c} onClick={()=>setcat(c)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer
              ${cat===c ? "bg-[#1A56E8] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Photo card grid — mirrors "Field Updates" layout */}
      <div className="grid grid-cols-3 gap-4">
        {shown.map(v=>(
          <button key={v.id} onClick={()=>setOpenId(v.id)}
            className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            {/* Photo with overlays */}
            <div className="relative h-44 bg-slate-200 overflow-hidden">
              <img
                src={`https://images.unsplash.com/${v.photo}?w=600&h=350&fit=crop&auto=format`}
                alt={v.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
                  <Play size={18} className="text-white ml-0.5"/>
                </div>
              </div>
              {/* Top badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                  style={{background: catColor[v.cat] || BLUE}}>{v.cat}</span>
                {v.featured && (
                  <span className="px-2 py-0.5 bg-amber-400 rounded-full text-[9px] font-black text-amber-900">⭐ Featured</span>
                )}
              </div>
              {/* Duration badge */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white">{v.duration}</span>
              </div>
              {/* Title + author at bottom of photo */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white font-black text-sm leading-snug">{v.title}</div>
                <div className="text-white/70 text-[11px] mt-0.5">{v.author}</div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3 overflow-hidden">{v.description.slice(0,120)}…</p>
              {/* Stats */}
              <div className="flex gap-4 text-[11px] text-slate-400 mb-3">
                <span className="flex items-center gap-1"><Eye size={10}/>{v.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={10}/>{v.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare size={10}/>{v.comments}</span>
                <span className="flex items-center gap-1 text-green-600 font-semibold"><Globe size={10}/>{v.chaptersUsing} chapters</span>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">Submitted {v.date}</span>
                <span className="text-[11px] text-blue-500 font-semibold group-hover:underline">Watch →</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Culture reminder */}
      <div className="bg-[#07192E] rounded-2xl p-6 flex items-start gap-4">
        <BookOpen size={20} className="text-blue-300 mt-0.5 shrink-0"/>
        <div>
          <div className="font-bold text-white text-sm mb-1">Bridge Culture Reminder</div>
          <p className="text-xs text-blue-200 leading-relaxed">Every leader who submits a bridge video ensures the next generation doesn't start from zero. Encourage all committee chairs to submit at least one before end of semester. Videos adopted by other chapters earn network-wide recognition.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 9: Succession ────────────────────────────────────────
// ─── Transition Plan Builder ──────────────────────────────────────

const ROLES_TO_TRANSITION = [
  { id:"president",   label:"President",               committee:"E-Board",           color:"#1A56E8", urgency:"Medium" },
  { id:"vp-events",   label:"VP of Events",            committee:"E-Board",           color:"#7C3AED", urgency:"Medium" },
  { id:"vp-comms",    label:"VP of Communications",    committee:"E-Board",           color:"#DB2777", urgency:"Low" },
  { id:"recruitment", label:"Recruitment Chair",       committee:"Recruitment",        color:"#0891B2", urgency:"Low" },
  { id:"fundraising", label:"Fundraising Chair",       committee:"Fundraising",        color:"#D97706", urgency:"High" },
  { id:"engagement",  label:"Member Engagement Chair", committee:"Member Engagement", color:"#DC2626", urgency:"High" },
  { id:"slt",         label:"SLT Promotion Chair",     committee:"SLT Promotion",     color:"#7C3AED", urgency:"Medium" },
  { id:"service",     label:"Service Chair",           committee:"Service",            color:"#059669", urgency:"Low" },
];

const TRANSITION_TASKS = [
  { id:"bridge",    label:"Submit Bridge Video",         desc:"Record knowledge, lessons learned, and advice for successor",  pts:50,  required:true  },
  { id:"docs",      label:"Create Transition Document",  desc:"Written handoff: contacts, processes, ongoing projects",       pts:30,  required:true  },
  { id:"shadow",    label:"Shadow Sessions (3×)",        desc:"Successor shadows current leader in meetings and events",      pts:40,  required:false },
  { id:"intro",     label:"Team Introductions",          desc:"Introduce successor to key contacts and partners",             pts:20,  required:false },
  { id:"values",    label:"Values Interview",            desc:"Formal interview: Impeccable Character, Fire/Agency, Growth",  pts:25,  required:true  },
  { id:"handoff",   label:"Official Handoff Meeting",    desc:"Final handoff: keys, access, and formal announcement",        pts:15,  required:true  },
];

// Eligibility: chairs, e-board, SLT participants/interested, top points, high event count
function isEligible(m: typeof MEMBERS[0]) {
  return (
    ["Chair","E-Board","Chair candidate"].includes(m.pipeline) ||
    m.slt === true ||
    m.evtCreated >= 3 ||
    m.pts >= 650
  );
}

// Eligibility reason label(s) for a member
function eligibilityReasons(m: typeof MEMBERS[0]): string[] {
  const r: string[] = [];
  if (["E-Board"].includes(m.pipeline))                       r.push("E-Board");
  if (["Chair"].includes(m.pipeline))                         r.push("Committee Chair");
  if (["Chair candidate"].includes(m.pipeline))               r.push("Chair candidate");
  if (m.slt)                                                   r.push("SLT participant");
  if (!m.slt && m.pts >= 650 && !r.length)                    r.push("Top points earner");
  if (m.evtCreated >= 3 && !r.length)                         r.push("High event creator");
  return r;
}

function TransitionPlanBuilder({ onBack, onViewProfile }: { onBack: () => void; onViewProfile: (id:number) => void }) {
  const [step, setStep]                   = useState<1|2|3|4>(1);
  const [selectedRole, setSelectedRole]   = useState("");
  const [targetDate, setTargetDate]       = useState("");
  const [announceDate, setAnnounceDate]   = useState("");
  const [reason, setReason]               = useState("");
  const [nominees, setNominees]           = useState<number[]>([]);       // selected candidate ids
  const [primaryId, setPrimaryId]         = useState<number|null>(null);  // confirmed primary nominee
  const [activeTasks, setActiveTasks]     = useState<string[]>(
    TRANSITION_TASKS.filter(t => t.required).map(t => t.id)
  );
  const [notes, setNotes]                 = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [published, setPublished]         = useState(false);

  const role         = ROLES_TO_TRANSITION.find(r => r.id === selectedRole);
  const primaryMember = MEMBERS.find(m => m.id === primaryId);

  // Eligible candidates: sorted by points desc
  const eligibleCandidates = useMemo(() =>
    MEMBERS
      .filter(isEligible)
      .filter(m => m.name.toLowerCase().includes(candidateSearch.toLowerCase()))
      .sort((a, b) => b.pts - a.pts),
    [candidateSearch]
  );

  const toggleNominee = (id: number) => {
    if (nominees.includes(id)) {
      setNominees(p => p.filter(x => x !== id));
      if (primaryId === id) setPrimaryId(null);
    } else if (nominees.length < 5) {
      setNominees(p => [...p, id]);
    }
  };
  const toggleTask = (id: string) =>
    setActiveTasks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const canAdvance = (
    (step === 1 && !!selectedRole) ||
    (step === 2 && !!targetDate)   ||
    (step === 3 && activeTasks.length >= 3) ||
    (step === 4)
  );

  const formattedTarget = targetDate
    ? new Date(targetDate + "T12:00:00").toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })
    : "";

  // ── Success state ──
  if (published && role) return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: role.color + "20" }}>
        <GitBranch size={36} style={{ color: role.color }}/>
      </div>
      <div className="text-center max-w-lg">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Transition Plan Activated</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          The <strong className="text-slate-800">{role.label}</strong> transition plan is live.
          {nominees.length > 0 && <> {nominees.length} candidate{nominees.length > 1 ? "s" : ""} nominated.</>}
          {primaryMember && <> Primary: <strong className="text-slate-800">{primaryMember.name}</strong>.</>}
          {formattedTarget && ` Target date: ${formattedTarget}.`}
        </p>
        <p className="text-xs text-slate-400 mt-2">{activeTasks.length} transition tasks assigned · Nominees notified in myMEDLIFE.</p>
      </div>
      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer hover:bg-slate-50">Back to Succession</button>
        {primaryId && (
          <button onClick={() => onViewProfile(primaryId)}
            className="px-5 py-2.5 text-sm font-bold rounded-xl cursor-pointer text-white hover:opacity-90" style={{ background: role.color }}>
            View {primaryMember?.name.split(" ")[0]}'s Profile
          </button>
        )}
      </div>
    </div>
  );

  const stepLabels = ["Choose Role","Set Timeline","Assign Tasks","Review & Activate"];

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180"/>Back to Succession
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-xl font-black text-slate-900">Leadership Transition Plan</h1>
          {role && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: role.color }}>{role.label}</span>}
        </div>
        <button
          disabled={step !== 4 || nominees.length === 0}
          onClick={() => setPublished(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          <Flag size={14}/>Activate Plan
        </button>
      </div>

      {/* Step progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-0">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => s < step && setStep(s as 1|2|3|4)}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer group ${s < step ? "cursor-pointer" : "cursor-default"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
                    ${done ? "bg-green-500 text-white" : active ? "text-white" : "bg-slate-100 text-slate-400"}`}
                    style={active ? { background: role?.color || BLUE } : {}}>
                    {done ? <CheckCircle size={16}/> : s}
                  </div>
                  <div className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-slate-800" : "text-slate-400"}`}>{label}</div>
                </button>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${step > s ? "bg-green-400" : "bg-slate-200"}`}/>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Main content ── */}
        <div className="col-span-2">

          {/* STEP 1: Select role */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Which role are you transitioning?</h2>
                <p className="text-xs text-slate-400 mt-1">Select the position that needs a successor. You can create multiple plans.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ROLES_TO_TRANSITION.map(r => {
                  const sel = selectedRole === r.id;
                  return (
                    <button key={r.id} onClick={() => setSelectedRole(r.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer text-left transition-all
                        ${sel ? "ring-2" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                      style={sel ? { borderColor: r.color, background: r.color + "0d", boxShadow: `0 0 0 2px ${r.color}` } : {}}>
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: r.color }}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900">{r.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{r.committee}</div>
                        <div className="mt-2">
                          <Pill label={`${r.urgency} priority`} color={r.urgency==="High"?"red":r.urgency==="Medium"?"yellow":"slate"}/>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Reason for transition (optional)</label>
                <select className={`${inputCls} mt-1.5`} value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select reason…</option>
                  <option>Graduation</option>
                  <option>Studying abroad</option>
                  <option>Stepping down voluntarily</option>
                  <option>Proactive / planned succession</option>
                  <option>Performance concerns</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Timeline */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-900">Set the transition timeline</h2>
                <p className="text-xs text-slate-400 mt-1">Define when the transition happens and when to announce it to the chapter.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Target Transition Date" required>
                  <input type="date" className={inputCls} value={targetDate} onChange={e => setTargetDate(e.target.value)}/>
                  <p className="text-[10px] text-slate-400 mt-1">When the new leader takes over completely</p>
                </Field>
                <Field label="Announcement Date">
                  <input type="date" className={inputCls} value={announceDate} onChange={e => setAnnounceDate(e.target.value)}/>
                  <p className="text-[10px] text-slate-400 mt-1">When to inform the chapter (can be before transition)</p>
                </Field>
              </div>
              {/* Auto milestones */}
              {targetDate && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Auto-generated milestones</div>
                  <div className="space-y-2">
                    {[
                      { label:"Nominate & interview candidates",   offset:-56 },
                      { label:"Values interviews complete",         offset:-42 },
                      { label:"Primary candidate confirmed",        offset:-35 },
                      { label:"Shadow sessions begin (3 sessions)", offset:-28 },
                      { label:"Bridge video submitted by outgoing", offset:-21 },
                      { label:"Transition document created",        offset:-14 },
                      { label:"Official handoff meeting",           offset:-7  },
                      { label:"New leader takes over",              offset:0   },
                    ].map(m => {
                      const d = new Date(targetDate + "T12:00:00");
                      d.setDate(d.getDate() + m.offset);
                      const label = d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
                      const isPast = d < new Date();
                      return (
                        <div key={m.label} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${m.offset===0 ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${m.offset===0 ? "bg-[#1A56E8]" : isPast ? "bg-red-400" : "bg-slate-300"}`}/>
                          <span className="text-xs text-slate-700 flex-1">{m.label}</span>
                          <span className={`text-[11px] font-mono font-semibold ${m.offset===0 ? "text-blue-600" : isPast ? "text-red-500" : "text-slate-400"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Assign tasks (nomination happens in left panel) */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-900">Assign transition tasks</h2>
                <p className="text-xs text-slate-400 mt-1">Required tasks are pre-selected. Add optional tasks as needed.</p>
              </div>
              <div className="space-y-2.5">
                {TRANSITION_TASKS.map(t => {
                  const active = activeTasks.includes(t.id);
                  return (
                    <button key={t.id} onClick={() => !t.required && toggleTask(t.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all
                        ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}
                        ${t.required ? "cursor-default" : "cursor-pointer"}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                        ${active ? "bg-[#1A56E8] border-[#1A56E8]" : "border-slate-300"}`}>
                        {active && <CheckCircle size={11} className="text-white"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{t.label}</span>
                          {t.required && <span className="text-[10px] text-red-400 font-semibold">Required</span>}
                          <span className="ml-auto text-[11px] font-semibold text-amber-600">+{t.pts} pts</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-base font-black text-slate-900 mb-4">Review your transition plan</h2>

                {/* Role */}
                <ReviewRow label="Role being transitioned">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: role?.color }}/>
                    <span className="font-semibold text-slate-800">{role?.label}</span>
                    <span className="text-slate-400">({role?.committee})</span>
                    {reason && <Pill label={reason} color="slate"/>}
                  </div>
                </ReviewRow>

                {/* Timeline */}
                <ReviewRow label="Target transition date">
                  <span className="font-semibold text-slate-800">{formattedTarget || "—"}</span>
                </ReviewRow>

                {/* Nominees */}
                <ReviewRow label="Nominated candidates">
                  <div className="flex gap-2 flex-wrap">
                    {nominees.map(id => {
                      const m = MEMBERS.find(x=>x.id===id)!;
                      return (
                        <div key={id} className="flex items-center gap-1.5">
                          <Avatar name={m.name} color={m.color} size={20}/>
                          <span className="text-xs font-semibold text-slate-700">{m.name}</span>
                          {primaryId===id && <Pill label="Primary" color="blue"/>}
                        </div>
                      );
                    })}
                    {nominees.length === 0 && <span className="text-slate-400 text-xs">None selected</span>}
                  </div>
                </ReviewRow>

                {/* Tasks */}
                <ReviewRow label="Transition tasks" last>
                  <div className="flex gap-1.5 flex-wrap">
                    {activeTasks.map(id => {
                      const t = TRANSITION_TASKS.find(x=>x.id===id)!;
                      return <Pill key={id} label={t.label} color={t.required?"blue":"slate"}/>;
                    })}
                  </div>
                </ReviewRow>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Additional notes for the plan (optional)</label>
                <textarea className={`${inputCls} mt-1.5 resize-none`} rows={3}
                  placeholder="Any context, special instructions, or message to the nominated candidates…"
                  value={notes} onChange={e => setNotes(e.target.value)}/>
              </div>

              {!primaryId && nominees.length > 0 && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0"/>
                  <p className="text-xs text-amber-800">No primary candidate set. Go back to Step 3 and mark one nominee as primary before activating.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Plan summary sidebar ── */}
        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Plan Summary</div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Role</span>
                  <span className="font-semibold text-slate-800">{role?.label || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target date</span>
                  <span className="font-semibold text-slate-800">{formattedTarget || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nominees</span>
                  <span className="font-semibold text-slate-800">{nominees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary</span>
                  <span className="font-semibold text-slate-800">
                    {primaryMember ? primaryMember.name.split(" ")[0] : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks</span>
                  <span className="font-semibold text-slate-800">{activeTasks.length} assigned</span>
                </div>
              </div>
            </div>

            {/* Primary candidate card */}
            {primaryMember && (
              <div className="bg-white rounded-2xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: BLUE }}>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BLUE }}>Primary Candidate</div>
                <div className="flex items-center gap-2.5">
                  <Avatar name={primaryMember.name} color={primaryMember.color} size={36}/>
                  <div>
                    <div className="text-sm font-black text-slate-900">{primaryMember.name}</div>
                    <div className="text-xs text-slate-400">{primaryMember.role}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Points", primaryMember.pts.toLocaleString()],
                    ["Events Made", primaryMember.evtCreated],
                    ["Attended", primaryMember.evtAttended],
                  ].map(([l,v]) => (
                    <div key={l as string} className="bg-slate-50 rounded-lg py-2">
                      <div className="text-sm font-black text-slate-800 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
                      <div className="text-[9px] text-slate-400">{l}</div>
                    </div>
                  ))}
                </div>
                {valuesPill(primaryMember.values)}
                <button onClick={() => onViewProfile(primaryMember.id)}
                  className="w-full text-center text-[11px] text-blue-500 font-semibold hover:underline cursor-pointer">
                  View full profile →
                </button>
              </div>
            )}

            {/* Readiness checklist */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Plan Readiness</div>
              <div className="space-y-1.5">
                {[
                  { label:"Role selected",           done: !!selectedRole },
                  { label:"Timeline set",            done: !!targetDate },
                  { label:"Candidate nominated",     done: nominees.length > 0 },
                  { label:"Primary candidate set",   done: !!primaryId },
                  { label:"Tasks assigned",          done: activeTasks.length >= 3 },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.done
                      ? <CheckCircle size={12} className="text-green-500 shrink-0"/>
                      : <div className="w-3 h-3 rounded-full border-2 border-slate-300 shrink-0"/>}
                    <span className={`text-xs ${item.done ? "text-slate-700 font-medium" : "text-slate-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step nav footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
        <button onClick={() => step > 1 ? setStep((step-1) as 1|2|3|4) : onBack()}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
          {step === 1 ? "← Cancel" : "← Back"}
        </button>
        {step < 5 ? (
          <button disabled={!canAdvance} onClick={() => setStep((step+1) as 2|3|4)}
            className="px-6 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Continue →
          </button>
        ) : (
          <button
            disabled={!primaryId || nominees.length === 0}
            onClick={() => setPublished(true)}
            className="px-6 py-2.5 text-white text-sm font-bold rounded-xl cursor-pointer hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: role?.color || BLUE }}>
            <Flag size={14} className="inline mr-1.5"/>Activate Transition Plan
          </button>
        )}
      </div>
    </div>
  );
}

// Shared review row helper for step 5
function ReviewRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-start gap-4 py-3 ${!last ? "border-b border-slate-100" : ""}`}>
      <div className="text-xs font-bold text-slate-400 w-40 shrink-0 pt-0.5">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function SuccessionScreen({ onNavigate, onSelectMember }: { onNavigate:(s:Screen)=>void; onSelectMember:(id:number)=>void }) {
  const [showTransition, setShowTransition] = useState(false);

  if (showTransition) return (
    <TransitionPlanBuilder
      onBack={() => setShowTransition(false)}
      onViewProfile={(id) => { setShowTransition(false); onSelectMember(id); }}
    />
  );

  const gaps = [
    { issue:"Member Engagement has no chair — inactive 3+ weeks",       urgency:"High",   action:"Appoint chair immediately; assign re-engagement action" },
    { issue:"No Fundraising chair backup identified",                     urgency:"High",   action:"Identify a backup from current active Fundraising members" },
    { issue:"President Sofia Reyes graduating May 2026",                  urgency:"Medium", action:"Begin succession planning — identify president candidate now" },
    { issue:"No bridge videos submitted for leadership transitions",       urgency:"Medium", action:"Assign bridge video to all chairs before end of semester" },
    { issue:"SLT Promotion committee under capacity (only 6 members)",    urgency:"Low",    action:"Add 2 members and set SLT promotion KPIs" },
  ];
  const pipeline = MEMBERS.filter(m=>["Chair candidate","Chair","E-Board"].includes(m.pipeline));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leadership Succession</h1>
          <p className="text-sm text-slate-500 mt-1">Ensure the chapter can survive and grow beyond any single leader.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => setShowTransition(true)}><Flag size={11}/>Nominate Candidate</Btn>
          <Btn variant="primary"    onClick={() => setShowTransition(true)}><ArrowRight size={11}/>Start Transition Plan</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Kard label="E-Board Roles Filled"   value="6 / 7" accent={BLUE}    icon={Shield}/>
        <Kard label="Active Committees"       value="5 / 7" accent="#16A34A" icon={Layers}/>
        <Kard label="Chair Pipeline"          value="4"     sub="candidates identified" accent="#7C3AED" icon={Star}/>
        <Kard label="Transition Readiness"    value="62%"   sub="needs improvement" trend="down" accent={YELLOW} icon={Activity}/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Gaps */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SH>Leadership Gaps</SH>
          <div className="mt-3 space-y-2.5">
            {gaps.map((g,i)=>(
              <div key={i} className={`px-3 py-2.5 rounded-lg border ${g.urgency==="High"?"bg-red-50 border-red-200":g.urgency==="Medium"?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Pill label={g.urgency} color={g.urgency==="High"?"red":g.urgency==="Medium"?"yellow":"slate"}/>
                  <span className="text-xs font-semibold text-slate-800">{g.issue}</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-0.5 leading-relaxed">{g.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline + timeline */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <SH>Candidate Pipeline</SH>
              <button onClick={()=>onNavigate("members")} className="text-[11px] text-blue-600 hover:underline cursor-pointer font-semibold flex items-center gap-1">
                Full table <ExternalLink size={10}/>
              </button>
            </div>
            <div className="space-y-1">
              {pipeline.map((m, idx)=>(
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-400 w-6 text-center shrink-0" style={{fontFamily:"'JetBrains Mono',monospace"}}>#{idx+1}</span>
                    <Avatar name={m.name} color={m.color} size={24}/>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.committee} · {m.pts.toLocaleString()} pts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{pipelinePill(m.pipeline)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SH>Succession Timeline</SH>
            <div className="mt-3 relative">
              <div className="absolute left-[6px] top-1 bottom-1 w-px bg-slate-200"/>
              {[
                { date:"Jun 2025", event:"Appoint Member Engagement chair", status:"urgent" },
                { date:"Jul 2025", event:"Values interviews for all chair candidates", status:"upcoming" },
                { date:"Aug 2025", event:"Bridge videos due from all chairs", status:"upcoming" },
                { date:"Sep 2025", event:"E-Board nominations open for Fall", status:"planned" },
                { date:"Nov 2025", event:"President succession announced", status:"planned" },
                { date:"May 2026", event:"Full E-Board transition complete", status:"planned" },
              ].map((t,i)=>(
                <div key={i} className="pl-6 pb-3 relative last:pb-0">
                  <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white
                    ${t.status==="urgent"?"bg-red-500":t.status==="upcoming"?"bg-amber-400":"bg-blue-300"}`}/>
                  <div className="text-[10px] text-slate-400 font-mono">{t.date}</div>
                  <div className="text-xs font-semibold text-slate-700 leading-snug">{t.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Values Screen ────────────────────────────────────────────────
const MEDLIFE_VALUES = [
  {
    id:"character", emoji:"⚖️", title:"Impeccable Character",
    color:"#1A56E8", bg:"#EFF6FF", border:"#BFDBFE",
    description:"We hold ourselves to the highest standard of integrity — in how we show up, follow through, and treat every person we serve. Reliability is not optional. Accountability is how we build trust.",
    traits:["Shows up consistently without being asked","Follows through on commitments","Takes ownership when things go wrong","Treats every community member with dignity","Models honesty in leadership decisions"],
  },
  {
    id:"fire", emoji:"🔥", title:"Fire / Agency",
    color:"#D97706", bg:"#FFFBEB", border:"#FDE68A",
    description:"We don't wait for permission to create change. Fire is the drive to identify a problem and move on it — to recruit, build, lead, and act without being prompted. Agency is what separates leaders from bystanders.",
    traits:["Creates events without being asked","Recruits new members independently","Leads their committee with initiative","Brings ideas to leadership proactively","Takes on challenges beyond their defined role"],
  },
  {
    id:"growth", emoji:"🌱", title:"Growth",
    color:"#059669", bg:"#F0FDF4", border:"#BBF7D0",
    description:"We are committed to becoming better — as leaders, as community members, and as humans. Growth means seeking feedback, embracing discomfort, reflecting honestly, and passing what you've learned to the next generation.",
    traits:["Actively seeks coaching and feedback","Reflects on their leadership after events","Submits bridge videos for future leaders","Engages in leadership development resources","Asks hard questions about their own performance"],
  },
];

function ValuesScreen() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">MEDLIFE Values</h1>
          <p className="text-sm text-slate-500 mt-1">
            Three values guide every MEDLIFE leader. They are not automatic — they require human review, honest conversation, and intentional practice.
          </p>
        </div>
        <a
          href="https://www.hubspot.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
          <MessageSquare size={14}/>Values Alignment Interview
        </a>
      </div>

      {/* Values cards */}
      <div className="space-y-5">
        {MEDLIFE_VALUES.map((v, idx) => (
          <div key={v.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: v.border, background: v.bg }}>
            <div className="px-7 py-6">
              <div className="flex items-start gap-5">
                {/* Number + emoji */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-3xl font-black text-slate-200 leading-none" style={{fontFamily:"'JetBrains Mono',monospace"}}>0{idx+1}</span>
                  <span className="text-3xl">{v.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black mb-2" style={{ color: v.color }}>{v.title}</h2>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{v.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {v.traits.map(t => (
                      <div key={t} className="flex items-start gap-2">
                        <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: v.color }}/>
                        <span className="text-xs text-slate-600 leading-snug">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Interview CTA bar */}
            <div className="px-7 py-3 border-t flex items-center justify-between" style={{ borderColor: v.border, background: v.color + "0a" }}>
              <span className="text-xs text-slate-500">Values alignment requires a human conversation — not an automatic score.</span>
              <a
                href="https://www.hubspot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-white"
                style={{ background: v.color }}>
                <MessageSquare size={11}/>Schedule Interview
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Interview guide note */}
      <div className="bg-[#07192E] rounded-2xl p-6 flex items-start gap-4">
        <BookOpen size={20} className="text-blue-300 mt-0.5 shrink-0"/>
        <div>
          <div className="font-bold text-white text-sm mb-1">Values Alignment Interview</div>
          <p className="text-xs text-blue-200 leading-relaxed">
            The Values Alignment Interview is a structured conversation between a chapter leader and a candidate for Chair or E-Board. It is not a test — it is a chance to understand who someone is, what drives them, and whether they are ready to lead with character, fire, and growth. Use the interview form linked above to capture your notes and submit a recommendation.
          </p>
          <a href="https://www.hubspot.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-300 hover:text-white transition-colors cursor-pointer">
            <ExternalLink size={11}/>Open Values Alignment Interview Form →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 10: Feed Analytics ────────────────────────────────────
function FeedScreen() {
  const chartData = FEED_POSTS.map(p=>({
    name: p.title.slice(0,14)+"…",
    Likes: p.likes, Comments: p.comments, ActionsAfter: p.actions,
  }));
  const byEngage = (arr: typeof MEMBERS) => [...arr].sort((a,b)=>b.engage-a.engage);
  const least = [...MEMBERS].sort((a,b)=>a.engage-b.engage).slice(0,4);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Feed & Engagement Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Understand what content drives real action — not just views.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary"><Share2 size={11}/>Share to Feed</Btn>
          <Btn variant="primary"><MessageSquare size={11}/>Ask Members to Respond</Btn>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Kard label="Posts Published"     value={FEED_POSTS.length}                               accent={BLUE}    icon={BookOpen}/>
        <Kard label="Total Views"         value={FEED_POSTS.reduce((a,p)=>a+p.views,0)}           accent="#7C3AED" icon={Eye}/>
        <Kard label="Total Likes"         value={FEED_POSTS.reduce((a,p)=>a+p.likes,0)}           accent={YELLOW}  icon={ThumbsUp}/>
        <Kard label="Actions After View"  value={FEED_POSTS.reduce((a,p)=>a+p.actions,0)}         accent="#16A34A" icon={Zap}/>
        <Kard label="RSVPs From Feed"     value={FEED_POSTS.reduce((a,p)=>a+p.rsvps,0)}           accent="#DB2777" icon={Calendar}/>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SH>Content Engagement — Actions Driven</SH>
        <div className="mt-1 mb-3 flex items-center gap-5 text-[11px] text-slate-400">
          {[["Likes","#BFDBFE"],["Comments",BLUE],["Actions After View",YELLOW]].map(([l,c])=>(
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{background:c}}/>
              {l}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{top:4,right:8,left:-8,bottom:4}}>
            <CartesianGrid key="feed-grid" strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
            <XAxis key="feed-x" dataKey="name" tick={{fontSize:10,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
            <YAxis key="feed-y" tick={{fontSize:10,fill:"#94A3B8"}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar key="feed-likes"   dataKey="Likes"        fill="#BFDBFE" radius={[3,3,0,0]}/>
            <Bar key="feed-comments"dataKey="Comments"     fill={BLUE}    radius={[3,3,0,0]}/>
            <Bar key="feed-actions" dataKey="ActionsAfter" fill={YELLOW}  radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><SH>Recent Posts</SH></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Post","Type","Author","Views","Likes","Comments","Shares","Actions After","RSVPs","Date"].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEED_POSTS.map((p,i)=>(
                <tr key={p.id} className={`border-b border-slate-100 last:border-0 hover:bg-blue-50/20 ${i%2!==0?"bg-slate-50/40":""}`}>
                  <td className="px-3 py-3 font-semibold text-slate-800 max-w-52 truncate">{p.title}</td>
                  <td className="px-3 py-3">
                    <Pill label={p.type} color={p.type==="Bridge Video"?"blue":p.type==="Best Practice"?"purple":"slate"}/>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{p.author}</td>
                  <td className="px-3 py-3 font-mono text-slate-700">{p.views}</td>
                  <td className="px-3 py-3 font-mono text-slate-700">{p.likes}</td>
                  <td className="px-3 py-3 font-mono text-slate-700">{p.comments}</td>
                  <td className="px-3 py-3 font-mono text-slate-700">{p.shares}</td>
                  <td className="px-3 py-3 font-mono font-bold text-green-700">{p.actions}</td>
                  <td className="px-3 py-3 font-mono text-slate-700">{p.rsvps}</td>
                  <td className="px-3 py-3 text-slate-400 font-mono">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingUp size={14} className="text-green-500"/><SH>Most Engaged Members</SH></div>
          {byEngage(MEMBERS).slice(0,4).map(m=>(
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2">
                <Avatar name={m.name} color={m.color} size={22}/>
                <span className="text-xs font-semibold text-slate-700">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width:`${m.engage}%`}}/>
                </div>
                <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{m.engage}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3"><TrendingDown size={14} className="text-red-400"/><SH>Least Engaged — Re-engage</SH></div>
          {least.map(m=>(
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2">
                <Avatar name={m.name} color={m.color} size={22}/>
                <span className="text-xs font-semibold text-slate-700">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{width:`${m.engage}%`}}/>
                </div>
                <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{m.engage}%</span>
                <button disabled title="Direct member messages are blocked in this preview" className="p-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors"><MessageSquare size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
type NavItem = { id: Screen; label: string; icon: React.ComponentType<{ size?: number }> };
type NavGroup = { label: string; items: NavItem[] };

// ─── Network member data (other chapters) ────────────────────────
const NETWORK_MEMBERS = [
  // West
  { id:101, name:"Alex Rivera",     chapter:"UCLA MEDLIFE",          region:"West",         color:"#1A56E8", pts:1580, ptsWk:92, evtCreated:10, evtAttended:21, actions:28 },
  { id:102, name:"Priya Patel",     chapter:"UCLA MEDLIFE",          region:"West",         color:"#7C3AED", pts:1420, ptsWk:78, evtCreated:8,  evtAttended:19, actions:24 },
  { id:103, name:"Keanu Makoa",     chapter:"UCLA MEDLIFE",          region:"West",         color:"#059669", pts:1190, ptsWk:65, evtCreated:7,  evtAttended:16, actions:21 },
  // Canada
  { id:201, name:"Sophie Tremblay", chapter:"McGill MEDLIFE",        region:"Canada",       color:"#DB2777", pts:1380, ptsWk:85, evtCreated:9,  evtAttended:18, actions:26 },
  { id:202, name:"Liam Bouchard",   chapter:"McGill MEDLIFE",        region:"Canada",       color:"#D97706", pts:1260, ptsWk:74, evtCreated:8,  evtAttended:17, actions:23 },
  { id:203, name:"Marie Dupont",    chapter:"UBC MEDLIFE",           region:"Canada",       color:"#0891B2", pts:1120, ptsWk:65, evtCreated:7,  evtAttended:14, actions:19 },
  // New England (BC + others)
  { id:301, name:"Emma Bradford",   chapter:"MIT MEDLIFE",           region:"New England",  color:"#6366F1", pts:1180, ptsWk:68, evtCreated:6,  evtAttended:15, actions:20 },
  { id:302, name:"Carlos Mendez",   chapter:"Northeastern MEDLIFE",  region:"New England",  color:"#16A34A", pts:1050, ptsWk:61, evtCreated:5,  evtAttended:13, actions:18 },
  { id:303, name:"Nia Okafor",      chapter:"BU MEDLIFE",            region:"New England",  color:"#DC2626", pts:980,  ptsWk:57, evtCreated:4,  evtAttended:12, actions:16 },
  // Mid-Atlantic
  { id:401, name:"Jordan Walsh",    chapter:"NYU MEDLIFE",           region:"Mid-Atlantic", color:"#1A56E8", pts:1290, ptsWk:71, evtCreated:7,  evtAttended:16, actions:22 },
  { id:402, name:"Fatima Al-Amin",  chapter:"NYU MEDLIFE",           region:"Mid-Atlantic", color:"#7C3AED", pts:1040, ptsWk:60, evtCreated:5,  evtAttended:13, actions:17 },
  // South
  { id:501, name:"Aisha Johnson",   chapter:"Emory MEDLIFE",         region:"South",        color:"#059669", pts:980,  ptsWk:58, evtCreated:5,  evtAttended:12, actions:16 },
  { id:502, name:"Wei Chen",        chapter:"UT Austin MEDLIFE",     region:"South",        color:"#D97706", pts:940,  ptsWk:55, evtCreated:4,  evtAttended:11, actions:15 },
];

// Combined: BC members (from MEMBERS) adapted + network members
function buildOrgLeaderboard() {
  const bcRows = MEMBERS.map(m => ({
    id: m.id, name: m.name, chapter:"Boston College MEDLIFE",
    region:"New England", color: m.color,
    pts: m.pts, ptsWk: m.ptsWk, evtCreated: m.evtCreated,
    evtAttended: m.evtAttended, actions: m.actions,
    isBC: true,
  }));
  const networkRows = NETWORK_MEMBERS.map(m => ({ ...m, isBC: false }));
  return [...bcRows, ...networkRows].sort((a,b) => b.pts - a.pts);
}

// ─── E-Board positions ────────────────────────────────────────────
const EBOARD_ROLES = [
  { role:"President",                  holder:"Sofia Reyes",     filled:true  },
  { role:"VP of Events",               holder:"Marcus Chen",     filled:true  },
  { role:"VP of Membership",           holder:null,              filled:false },
  { role:"VP of Fundraising",          holder:"Amara Okonkwo",   filled:true  },
  { role:"VP of Communications",       holder:"Priya Sharma",    filled:true  },
  { role:"VP of Service Learning",     holder:"DeShawn Williams",filled:true  },
  { role:"Secretary",                  holder:null,              filled:false },
];

// ─── Current Leaders Screen ───────────────────────────────────────
function LeadersScreen({ onSelectMember }: { onSelectMember:(id:number)=>void }) {
  const memberByName = (name: string | null) =>
    name ? MEMBERS.find(m => m.name === name) : null;

  const committeeChairs = COMMITTEES.map(c => ({
    committee: c.name,
    color: c.color,
    chairs: c.chairs,
    health: c.health,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Current Leaders</h1>
        <p className="text-sm text-slate-500 mt-1">Every E-Board position and Event Committee chair for Boston College MEDLIFE.</p>
      </div>

      {/* E-Board */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-blue-600"/>
          <h2 className="text-base font-black text-slate-900">E-Board</h2>
          <Pill label={`${EBOARD_ROLES.filter(r=>r.filled).length}/${EBOARD_ROLES.length} filled`} color={EBOARD_ROLES.filter(r=>r.filled).length===EBOARD_ROLES.length?"green":"yellow"}/>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {EBOARD_ROLES.map((r,i) => {
            const m = memberByName(r.holder);
            return (
              <div key={r.role} className={`bg-white rounded-xl border p-4 ${r.filled?"border-slate-200":"border-dashed border-slate-300"}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{r.role}</div>
                {r.filled && m ? (
                  <button onClick={() => onSelectMember(m.id)} className="flex items-center gap-2 w-full text-left group">
                    <Avatar name={m.name} color={m.color} size={32}/>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-blue-600 group-hover:underline cursor-pointer truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.pts.toLocaleString()} pts</div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <Plus size={12} className="text-slate-300"/>
                    </div>
                    <span className="text-xs text-slate-400 italic">Vacant</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Committee Chairs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-indigo-600"/>
          <h2 className="text-base font-black text-slate-900">Event Committee Chairs</h2>
        </div>
        <div className="space-y-2">
          {committeeChairs.map(c => {
            const hasChairs = c.chairs.length > 0;
            return (
              <div key={c.committee} className={`bg-white rounded-xl border overflow-hidden ${!hasChairs ? "border-dashed border-slate-300" : "border-slate-200"}`}>
                <div className="flex items-center">
                  <div className="w-1.5 self-stretch rounded-l-xl shrink-0" style={{ background: c.color }}/>
                  <div className="flex-1 px-4 py-3 flex items-center gap-4 flex-wrap">
                    <div className="min-w-48">
                      <div className="text-sm font-bold text-slate-800">{c.committee}</div>
                      <div className="mt-0.5">{healthPill(c.health)}</div>
                    </div>
                    {hasChairs ? (
                      <div className="flex gap-4 flex-wrap">
                        {c.chairs.map(chairName => {
                          const m = memberByName(chairName);
                          return m ? (
                            <button key={chairName} onClick={() => onSelectMember(m.id)}
                              className="flex items-center gap-2 group cursor-pointer">
                              <Avatar name={m.name} color={m.color} size={28}/>
                              <div>
                                <div className="text-xs font-bold text-blue-600 group-hover:underline">{m.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{m.pts.toLocaleString()} pts</div>
                              </div>
                            </button>
                          ) : (
                            <span key={chairName} className="text-xs text-slate-600 font-semibold">{chairName}</span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <Plus size={11} className="text-slate-300"/>
                        </div>
                        <span className="text-xs italic">No chair assigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Member Leaderboard ───────────────────────────────────────────
type LBView = "chapter" | "regional" | "org";

function MembersScreen({ onSelectMember }: { onSelectMember: (id:number)=>void }) {
  const [view, setView]     = useState<LBView>("chapter");
  const [search, setSearch] = useState("");

  // Chapter leaderboard — BC members sorted by pts
  const chapterBoard = [...MEMBERS]
    .sort((a,b) => b.pts - a.pts)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  // Regional leaderboard — BC members + New England network members
  const regionalAll = buildOrgLeaderboard()
    .filter(m => m.region === "New England")
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  // Org-wide leaderboard
  const orgAll = buildOrgLeaderboard()
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const tabs: { id:LBView; label:string; count:number }[] = [
    { id:"chapter",  label:"Chapter",      count: MEMBERS.length },
    { id:"regional", label:"New England",  count: regionalAll.length },
    { id:"org",      label:"Organizational",count: orgAll.length },
  ];

  // Rank in chapter for profile use (unfiltered, by pts)
  const chapterRank = (id: number) => {
    const sorted = [...MEMBERS].sort((a,b)=>b.pts-a.pts);
    const idx = sorted.findIndex(m=>m.id===id);
    return idx === -1 ? null : idx+1;
  };

  const rows = view==="chapter" ? chapterBoard
             : view==="regional" ? regionalAll
             : orgAll;

  // Global rank for org view
  const getGlobalRank = (id:number) => orgAll.findIndex(m=>m.id===id)+1;
  const getRegionalRank = (id:number) => regionalAll.findIndex(m=>m.id===id)+1;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Member Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-1">See how members rank within the chapter, region, and organization.</p>
        </div>
        <Btn variant="primary"><Plus size={11}/>Add Member</Btn>
      </div>

      {/* View tabs */}
      <div className="flex gap-3">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setView(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-sm cursor-pointer transition-all
              ${view===t.id ? "bg-[#1A56E8] text-white border-[#1A56E8] shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            {t.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${view===t.id?"bg-white/20 text-white":"bg-slate-100 text-slate-500"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Context callout for regional/org */}
      {view !== "chapter" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-800">
          <Sparkles size={14} className="text-blue-500 mt-0.5 shrink-0"/>
          <span>
            {view==="regional"
              ? <><strong>New England Region</strong> — members from Boston College, MIT, Northeastern, BU, and other New England chapters.</>
              : <><strong>Organizational Leaderboard</strong> — members from all MEDLIFE chapters globally, sorted by total points.</>}
            {" "}Boston College members are <strong>highlighted</strong>.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input className={`${inputCls} pl-8`} placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Leaderboard table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member</th>
              {view !== "chapter" && <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapter</th>}
              {view !== "chapter" && <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region</th>}
              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pts/Wk</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Events Made</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attended</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => {
              const isBC = (m as any).isBC !== false && (view==="chapter" || MEMBERS.some(bm=>bm.id===m.id));
              const isBCMember = MEMBERS.some(bm=>bm.id===m.id);
              const rank = i + 1;
              const medals = ["🥇","🥈","🥉"];
              return (
                <tr key={m.id}
                  className={`border-b border-slate-100 last:border-0 transition-colors
                    ${isBCMember && view!=="chapter" ? "bg-blue-50/40 hover:bg-blue-50/60" : "hover:bg-slate-50/40"}
                    ${i%2!==0 && !isBCMember ? "bg-slate-50/30":""}`}>
                  {/* Rank */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-black text-slate-500 tabular-nums" style={{fontFamily:"'JetBrains Mono',monospace"}}>#{rank}</span>
                      {rank <= 3 && <span className="text-sm leading-none">{medals[rank-1]}</span>}
                    </div>
                  </td>
                  {/* Member */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={m.name} color={m.color} size={26}/>
                      <div>
                        {isBCMember
                          ? <button onClick={()=>onSelectMember(m.id)} className="font-semibold text-blue-600 hover:underline cursor-pointer text-left">{m.name}</button>
                          : <span className="font-semibold text-slate-700">{m.name}</span>
                        }
                        {isBCMember && view!=="chapter" && <div className="text-[9px] text-blue-500 font-semibold">Your Chapter</div>}
                      </div>
                    </div>
                  </td>
                  {view !== "chapter" && <td className="px-3 py-3 text-slate-500 text-[11px]">{(m as any).chapter}</td>}
                  {view !== "chapter" && <td className="px-3 py-3"><Pill label={(m as any).region} color="slate"/></td>}
                  <td className="px-3 py-3 text-right font-black tabular-nums text-slate-800" style={{fontFamily:"'JetBrains Mono',monospace"}}>{m.pts.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center font-mono">
                    <span className={m.ptsWk >= (view==="chapter"?(MEMBERS.find(x=>x.id===m.id)?.ptsLast||0):50)?"text-green-600 font-bold":"text-slate-600"}>{m.ptsWk}</span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-slate-600">{m.evtCreated}</td>
                  <td className="px-3 py-3 text-center font-mono text-slate-600">{m.evtAttended}</td>
                  <td className="px-3 py-3 text-center font-mono text-slate-600">{m.actions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No members match this search.</div>
        )}
      </div>

      {view !== "chapter" && (
        <p className="text-[11px] text-slate-400 text-center">
          Showing {rows.length} members across {view==="regional" ? "New England" : "the organization"}.
          Only chapter-wide points, events, and tasks are shown — values alignment and profile details are private.
        </p>
      )}
    </div>
  );
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Chapter", items: [
    { id: "home",        label: "Chapter Home",       icon: Home },
    { id: "leaderboard", label: "Chapter Leaderboard",icon: Trophy },
  ]},
  { label: "Event Operations", items: [
    { id: "events",        label: "Event Performance", icon: Calendar },
  ]},
];
const MISSING_LEADERSHIP_PAGES: { label: string; icon: any }[] = [];

function Sidebar({ active, onNav }: { active: Screen; onNav: (s: Screen) => void }) {
  const groups = NAV_GROUPS;

  return (
    <aside className="w-56 bg-[#07192E] flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Wordmark */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <button
          onClick={() => onNav("home")}
          className="flex items-center gap-2.5 cursor-pointer group w-full text-left"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:opacity-80 transition-opacity" style={{background:`linear-gradient(135deg, ${BLUE}, #3B82F6)`}}>
            <span className="text-white text-sm font-black">M</span>
          </div>
          <div>
            <div className="text-white text-sm font-black leading-none group-hover:text-blue-200 transition-colors">myMEDLIFE</div>
            <div className="text-blue-300/60 text-[10px] mt-0.5 group-hover:text-blue-300/80 transition-colors">Leadership Center</div>
          </div>
        </button>
      </div>

      {/* Campaign badge */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
        <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-0.5">Active Campaign</div>
        <div className="text-xs text-amber-200 font-semibold">Moving Mountains 🏔</div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {groups.map(g=>(
          <div key={g.label}>
            <div className="px-3 mb-1 text-[9px] font-bold text-blue-300/40 uppercase tracking-widest">{g.label}</div>
            {g.items.map(({id,label,icon:Icon})=>(
              <a
                key={id}
                href={`/leader?view=${getLeaderCommandCenterViewForScreen(id)}`}
                onClick={() => {
                  onNav(id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-left transition-all cursor-pointer
                  ${active===id
                    ? "bg-[#1A56E8] text-white shadow-md shadow-blue-900/50"
                    : "text-white/50 hover:text-white hover:bg-white/6"}`}>
                <Icon size={14}/>
                <span className="text-[11px] font-semibold">{label}</span>
              </a>
            ))}
          </div>
        ))}
        <div>
          <div className="px-3 mb-1 text-[9px] font-bold text-blue-300/40 uppercase tracking-widest">Not Yet Available</div>
          {MISSING_LEADERSHIP_PAGES.map(({label, icon:Icon})=>(
            <button key={label} disabled title={`Leadership page not yet available: ${label}`}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-left transition-all cursor-not-allowed text-white/35">
              <Icon size={14}/><span className="text-[11px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User profile + view switcher */}
      <UserProfileSwitcher/>
    </aside>
  );
}

const VIEW_OPTIONS = [
  { id:"student-feed",    label:"Student Feed",             desc:"General member mobile view",       icon:Users    },
  { id:"command-center",  label:"Student Command Center",   desc:"Leadership dashboard (current)",   icon:BarChart2},
  { id:"staff",           label:"Staff Command Center",     desc:"Staff / coach oversight view",     icon:Shield   },
  { id:"admin",           label:"Admin",                    desc:"Full org-wide admin access",       icon:Flag     },
];

function UserProfileSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState("command-center");
  const active = VIEW_OPTIONS.find(v => v.id === activeView)!;

  return (
    <div className="relative border-t border-white/10 shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3.5 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-colors text-left">
        <Avatar name="Sofia Reyes" color={BLUE} size={28}/>
        <div className="min-w-0 flex-1">
          <div className="text-white text-[11px] font-bold truncate">Sofia Reyes</div>
          <div className="text-blue-300/50 text-[10px]">{active.label}</div>
        </div>
        <ChevronUp size={12} className={`text-white/40 transition-transform ${open ? "" : "rotate-180"}`}/>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-[#0B1E38] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="px-3 py-2 border-b border-white/10">
            <div className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest">Switch View</div>
          </div>
          {VIEW_OPTIONS.map(v => {
            const Icon = v.icon;
            const isActive = v.id === activeView;
            return (
              <button
                key={v.id}
                onClick={() => { setActiveView(v.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer transition-colors
                  ${isActive ? "bg-[#1A56E8]/30" : "hover:bg-white/5"}`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isActive ? "bg-[#1A56E8]" : "bg-white/10"}`}>
                  <Icon size={12} className="text-white"/>
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] font-semibold ${isActive ? "text-white" : "text-white/70"}`}>{v.label}</div>
                  <div className="text-[9px] text-white/30">{v.desc}</div>
                </div>
                {isActive && <CheckCircle size={12} className="text-blue-400 shrink-0 ml-auto"/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Assign Action Modal ─────────────────────────────────────────
const ACTION_TYPES = [
  { id:"bridge",    label:"Submit Bridge Video",      desc:"Pass knowledge to the next generation",       icon:Video,        pts:50  },
  { id:"event",     label:"Create & Host an Event",   desc:"Recruit, fundraise, or educate the chapter",  icon:Calendar,     pts:75  },
  { id:"evidence",  label:"Submit Action Evidence",   desc:"Prove impact with a photo, doc, or link",     icon:Upload,       pts:30  },
  { id:"slt",       label:"SLT Sign-Up & Promotion",  desc:"Recruit members for a MEDLIFE SLT",           icon:Globe,        pts:40  },
  { id:"fundraise", label:"Fundraising Goal",         desc:"Raise a specific dollar amount this week",    icon:Target,       pts:60  },
  { id:"recruit",   label:"Recruit a New Member",     desc:"Bring someone into the MEDLIFE community",    icon:Users,        pts:35  },
  { id:"values",    label:"Values Interview",         desc:"Complete a formal values alignment review",   icon:Star,         pts:25  },
  { id:"custom",    label:"Custom Action",            desc:"Define your own action with a clear outcome", icon:Zap,          pts:0   },
];

function AssignActionModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1|2|3>(1);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [pts, setPts] = useState(0);
  const [note, setNote] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(false);

  const filtered = MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const toggleMember = (id: number) =>
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const chosenAction = ACTION_TYPES.find(a => a.id === selectedAction);
  const selectedNames = MEMBERS.filter(m => selectedMembers.includes(m.id)).map(m => m.name.split(" ")[0]);

  const handleSelectAction = (id: string) => {
    setSelectedAction(id);
    const a = ACTION_TYPES.find(x => x.id === id);
    if (a) setPts(a.pts);
  };

  if (done) return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500"/>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-slate-900">Task Assigned!</div>
          <p className="text-sm text-slate-500 mt-1">
            <strong>{selectedNames.join(", ")}</strong> {selectedNames.length > 1 ? "have" : "has"} been assigned
            {" "}<strong>{chosenAction?.id === "custom" ? customLabel : chosenAction?.label}</strong>.
          </p>
          <p className="text-xs text-slate-400 mt-1">They'll see it in their myMEDLIFE feed and action list.</p>
        </div>
        <button onClick={onClose} className="mt-2 px-6 py-2 bg-[#1A56E8] text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">Done</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell onClose={onClose}>
      {/* Header + progress */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            Step {step} of 3
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {step === 1 ? "Choose Members" : step === 2 ? "Choose Task Type" : "Set Details & Assign"}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? "bg-[#1A56E8]" : "bg-slate-200"}`}/>
          ))}
        </div>
      </div>

      {/* Step 1: select members */}
      {step === 1 && (
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {filtered.map(m => {
              const sel = selectedMembers.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleMember(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-left
                    ${sel ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <Avatar name={m.name} color={m.color} size={28}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-400">{m.role} · {m.pipeline}</div>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                    ${sel ? "bg-[#1A56E8] border-[#1A56E8]" : "border-slate-300"}`}>
                    {sel && <CheckCircle size={10} className="text-white"/>}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedMembers.length > 0 && (
            <div className="text-xs text-blue-600 font-semibold">{selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected</div>
          )}
        </div>
      )}

      {/* Step 2: choose action */}
      {step === 2 && (
        <div className="px-6 py-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {ACTION_TYPES.map(a => {
            const Icon = a.icon;
            const sel = selectedAction === a.id;
            return (
              <button key={a.id} onClick={() => handleSelectAction(a.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer text-left transition-all
                  ${sel ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sel ? "bg-[#1A56E8]" : "bg-slate-100"}`}>
                  <Icon size={15} className={sel ? "text-white" : "text-slate-500"}/>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{a.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{a.desc}</div>
                  {a.pts > 0 && <div className="text-[10px] font-semibold text-amber-600 mt-1">+{a.pts} pts</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 3: details */}
      {step === 3 && (
        <div className="px-6 py-4 space-y-4">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
            {chosenAction && <chosenAction.icon size={16} className="text-blue-600 mt-0.5 shrink-0"/>}
            <div>
              <div className="text-xs font-bold text-blue-900">
                {chosenAction?.id === "custom" ? (customLabel || "Custom Action") : chosenAction?.label}
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5">Assigning to: {selectedNames.join(", ")}</div>
            </div>
          </div>

          {selectedAction === "custom" && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Action Title</label>
              <input className="mt-1.5 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. 'Create recruitment flyer for info night'" value={customLabel} onChange={e => setCustomLabel(e.target.value)}/>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Due Date</label>
              <input type="date" className="mt-1.5 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={dueDate} onChange={e => setDueDate(e.target.value)}/>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Points Value</label>
              <input type="number" className="mt-1.5 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={pts} onChange={e => setPts(Number(e.target.value))} min={0} max={500}/>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Note to Member <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <textarea rows={3} className="mt-1.5 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="e.g. 'This is a great opportunity to show your leadership. Let me know if you have questions.'"
              value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep((step - 1) as 1|2|3) : onClose()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        <button
          disabled={
            (step === 1 && selectedMembers.length === 0) ||
            (step === 2 && !selectedAction) ||
            (step === 3 && selectedAction === "custom" && !customLabel.trim())
          }
          onClick={() => {
            if (step < 3) setStep((step + 1) as 2|3);
            else setDone(true);
          }}
          className="px-5 py-2 bg-[#1A56E8] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {step === 3 ? `Assign to ${selectedMembers.length} Member${selectedMembers.length > 1 ? "s" : ""}` : "Continue →"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Promote Emerging Leader Modal ───────────────────────────────
const PIPELINE_LEVELS = [
  { id:"Active contributor",  label:"Active Contributor",  desc:"Consistently taking actions and attending events",           color:"#16A34A" },
  { id:"Chair candidate",     label:"Chair Candidate",     desc:"Showing leadership potential — values interview recommended", color:"#0891B2" },
  { id:"Chair",               label:"Committee Chair",     desc:"Ready to lead a committee and develop other members",        color:"#7C3AED" },
  { id:"E-Board candidate",   label:"E-Board Candidate",   desc:"Demonstrated chapter-wide leadership and values alignment",  color:"#D97706" },
  { id:"E-Board",             label:"E-Board Member",      desc:"Taking on a formal leadership role for the chapter",         color:"#1A56E8" },
  { id:"Alumni mentor",       label:"Alumni Mentor",       desc:"Graduated — continuing to support and guide the chapter",    color:"#64748B" },
];

const VALUES_CHECKS = [
  { id:"character", label:"Impeccable Character", desc:"Shows reliability, accountability, and integrity in their actions" },
  { id:"fire",      label:"Fire / Agency",         desc:"Takes initiative without being asked — creates, recruits, leads" },
  { id:"growth",    label:"Growth",                desc:"Actively seeks feedback, reflection, and improvement" },
];

function PromoteLeaderModal({ onClose, onViewProfile }: { onClose: () => void; onViewProfile: (id: number) => void }) {
  const [step, setStep] = useState<1|2|3>(1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [newLevel, setNewLevel] = useState<string>("");
  const [valuesChecked, setValuesChecked] = useState<string[]>([]);
  const [interviewDone, setInterviewDone] = useState(false);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(false);

  const member = MEMBERS.find(m => m.id === selectedMemberId);
  const filtered = MEMBERS.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const toggleValue = (id: string) =>
    setValuesChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const currentIdx = PIPELINE_LEVELS.findIndex(l => l.id === member?.pipeline);
  const availableLevels = PIPELINE_LEVELS.filter((_, i) => i > currentIdx);
  const chosenLevel = PIPELINE_LEVELS.find(l => l.id === newLevel);
  const needsInterview = ["Chair","E-Board candidate","E-Board"].includes(newLevel);
  const canProceed3 = valuesChecked.length === 3 && (!needsInterview || interviewDone);

  if (done && member && chosenLevel) return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center justify-center py-10 gap-4 px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: chosenLevel.color + "20" }}>
          <Star size={28} style={{ color: chosenLevel.color }}/>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-slate-900">{member.name} has been promoted!</div>
          <p className="text-sm text-slate-500 mt-1">
            New role: <strong style={{ color: chosenLevel.color }}>{chosenLevel.label}</strong>
          </p>
          <p className="text-xs text-slate-400 mt-1">Their pipeline status has been updated. The chapter will see their new role.</p>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { onViewProfile(member.id); onClose(); }}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            View Profile
          </button>
          <button onClick={onClose}
            className="px-6 py-2 bg-[#1A56E8] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell onClose={onClose}>
      {/* Header + progress */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Step {step} of 3</div>
          <h2 className="text-lg font-black text-slate-900">
            {step === 1 ? "Select Member to Promote" : step === 2 ? "Choose New Pipeline Role" : "Confirm Values & Promote"}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? "bg-[#1A56E8]" : "bg-slate-200"}`}/>
          ))}
        </div>
      </div>

      {/* Step 1: pick member */}
      {step === 1 && (
        <div className="px-6 py-4 flex flex-col gap-3">
          <p className="text-xs text-slate-500">Promotions are based on action, consistency, and character — not just points. Select the member you want to move up.</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {filtered.map(m => {
              const sel = selectedMemberId === m.id;
              const level = PIPELINE_LEVELS.find(l => l.id === m.pipeline);
              return (
                <button key={m.id} onClick={() => setSelectedMemberId(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-left
                    ${sel ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <Avatar name={m.name} color={m.color} size={30}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-400">{m.role} · {m.pts.toLocaleString()} pts</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: level?.color, background: level?.color + "18" }}>
                      {m.pipeline}
                    </span>
                    {valuesPill(m.values)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: choose new level */}
      {step === 2 && member && (
        <div className="px-6 py-4 space-y-3">
          {/* Mini profile summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Avatar name={member.name} color={member.color} size={36}/>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">{member.name}</div>
              <div className="text-xs text-slate-500">{member.role} · Currently: <strong>{member.pipeline}</strong></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center shrink-0">
              {[["Points", member.pts.toLocaleString()],["Actions",member.actions],["Events",member.evtAttended]].map(([l,v])=>(
                <div key={l as string}>
                  <div className="text-xs font-black text-slate-800" style={{fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
                  <div className="text-[10px] text-slate-400">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline options */}
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Promote to</div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {availableLevels.length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">This member is already at the highest pipeline level.</p>
            )}
            {availableLevels.map(level => {
              const sel = newLevel === level.id;
              return (
                <button key={level.id} onClick={() => setNewLevel(level.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer text-left transition-all
                    ${sel ? "ring-1" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                  style={sel ? { borderColor: level.color, background: level.color + "0f", outline: `1px solid ${level.color}` } : {}}>
                  <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ background: level.color }}/>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{level.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{level.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: confirm values */}
      {step === 3 && member && chosenLevel && (
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: chosenLevel.color, background: chosenLevel.color + "0d" }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chosenLevel.color }}/>
            <div className="text-xs font-bold" style={{ color: chosenLevel.color }}>
              Promoting {member.name} → {chosenLevel.label}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
              MEDLIFE Values Alignment
              <span className="ml-1 text-slate-400 normal-case font-normal">— confirm all three before promoting</span>
            </div>
            <div className="space-y-2">
              {VALUES_CHECKS.map(v => {
                const checked = valuesChecked.includes(v.id);
                return (
                  <button key={v.id} onClick={() => toggleValue(v.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-left transition-all
                      ${checked ? "border-green-400 bg-green-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                      ${checked ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                      {checked && <CheckCircle size={12} className="text-white"/>}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{v.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{v.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {needsInterview && (
            <button onClick={() => setInterviewDone(p => !p)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-left transition-all
                ${interviewDone ? "border-blue-400 bg-blue-50" : "border-amber-300 bg-amber-50"}`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                ${interviewDone ? "bg-[#1A56E8] border-[#1A56E8]" : "border-amber-400"}`}>
                {interviewDone && <CheckCircle size={12} className="text-white"/>}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Values interview completed</div>
                <div className="text-[11px] text-amber-700 mt-0.5">Required for {chosenLevel.label} promotion — confirms character, fire, and growth in conversation</div>
              </div>
            </button>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Promotion Note <span className="text-slate-400 font-normal normal-case">(optional — visible to leadership)</span></label>
            <textarea rows={2} className="mt-1.5 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="e.g. 'Consistently shows up, recruits, and takes ownership. Ready for a bigger role.'"
              value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <button onClick={() => step > 1 ? setStep((step - 1) as 1|2|3) : onClose()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
          {step === 1 ? "Cancel" : "← Back"}
        </button>
        <button
          disabled={
            (step === 1 && !selectedMemberId) ||
            (step === 2 && (!newLevel || availableLevels.length === 0)) ||
            (step === 3 && !canProceed3)
          }
          onClick={() => {
            if (step < 3) setStep((step + 1) as 2|3);
            else setDone(true);
          }}
          className="px-5 py-2 bg-[#1A56E8] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {step === 3 ? `Confirm Promotion` : "Continue →"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(7,25,46,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors z-10">
          <X size={14}/>
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── Screen labels ────────────────────────────────────────────────
const LABELS: Record<Screen,string> = {
  home:"Chapter Leadership Home", leaderboard:"Chapter Leaderboard",
  members:"Member Pipeline", profile:"Member Profile",
  committees:"Event Committees", events:"Event Performance",
  "create-event":"Create Event", leaders:"Current Leaders", stories:"MEDLIFE Stories",
  impact:"Impact Dashboard", bridge:"Bridge Video Hub",
  succession:"Succession Planning", feed:"Feed Analytics",
  training:"Leadership Training", values:"Values",
};

// ─── App ──────────────────────────────────────────────────────────
type FigmaLeaderCommandCenterProps = {
  initialScreen?: Screen;
};

export function FigmaLeaderCommandCenter({
  initialScreen = "home",
}: FigmaLeaderCommandCenterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryScreen = resolveLeaderCommandCenterScreen(searchParams.get("view"));
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [showAssignAction, setShowAssignAction] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    setScreen(queryScreen);
  }, [queryScreen]);

  const navigateToScreen = (nextScreen: Screen) => {
    setScreen(nextScreen);
    router.replace(
      buildLeaderCommandCenterHrefForScreen(nextScreen, {
        pathname,
        search: searchParams.toString(),
      }),
      { scroll: false },
    );
  };

  const handleCreateEvent = () => {
    navigateToScreen("events");
    setShowCreateEvent(true);
  };

  const handleSelectMember = (id: number) => {
    setSelectedId(id);
    navigateToScreen("profile");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100"
      style={{ fontFamily:"'Inter', system-ui, sans-serif" }}>
      {showAssignAction && <AssignActionModal onClose={() => setShowAssignAction(false)}/>}
      {showPromote && <PromoteLeaderModal onClose={() => setShowPromote(false)} onViewProfile={handleSelectMember}/>}
      <Sidebar active={screen} onNav={navigateToScreen}/>
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{LABELS[screen]}</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled title="Notifications are blocked in this preview" className="relative w-8 h-8 rounded-full hover:bg-white flex items-center justify-center cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <Bell size={14} className="text-slate-500"/>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"/>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 max-w-[1400px] w-full">
          {screen==="home"        && (
            <HomeScreen
              onCreateEvent={handleCreateEvent}
              onOpenEvents={() => navigateToScreen("events")}
              onOpenLeaderboard={() => navigateToScreen("leaderboard")}
            />
          )}
          {screen==="leaderboard" && <LeaderboardScreen onNavigate={navigateToScreen}/>}
          {screen==="members"     && <MembersScreen onSelectMember={handleSelectMember}/>}
          {screen==="profile"     && <ProfileScreen memberId={selectedId} onBack={()=>navigateToScreen("members")}/>}
          {screen==="committees"  && <CommitteesScreen onAssignAction={() => setShowAssignAction(true)} onPromote={() => setShowPromote(true)}/>}
          {screen==="events"      && <EventsScreen externalCreate={showCreateEvent} onExternalCreateHandled={() => setShowCreateEvent(false)}/>}
          {screen==="impact"      && <ImpactScreen/>}
          {screen==="bridge"      && <BridgeScreen/>}
          {screen==="succession"  && <SuccessionScreen onNavigate={navigateToScreen} onSelectMember={handleSelectMember}/>}
          {screen==="feed"        && <FeedScreen/>}
          {screen==="training"    && <TrainingScreen/>}
          {screen==="values"      && <ValuesScreen/>}
          {screen==="leaders"     && <LeadersScreen onSelectMember={handleSelectMember}/>}
          {screen==="create-event"&& <div className="p-0"><CreateEventForm onBack={() => navigateToScreen("events")}/></div>}
          {screen==="stories"     && <MedlifeStoriesScreen/>}
        </div>
      </main>
    </div>
  );
}
