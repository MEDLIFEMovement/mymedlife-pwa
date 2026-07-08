"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Calendar, Rss, Film,
  Database, BarChart3, Settings, Search, ChevronDown,
  X, AlertTriangle, CheckCircle, Clock, ArrowRight,
  Users, TrendingUp, Eye, Heart, MessageSquare, Share2,
  Star, Bell, RefreshCw, ExternalLink, Plus,
  Send, Tag, Globe, Activity, Zap,
  Shield, Terminal, AlertCircle, FileText,
  Video, MoreHorizontal, ChevronRight,
  Target, Award, Lightbulb, Filter, Download,
  Play, BookOpen, CheckSquare, Bookmark, Flag,
  BarChart2, PieChart, Layers, Radio, Inbox,
  UserCheck, TrendingDown, Circle, Wifi, WifiOff,
  RotateCcw, Info, MapPin, Hash, Camera, Mail,
  ChevronUp, Package, Link, Edit3, Copy, Trash2,
  GitBranch, ArrowLeft
} from "lucide-react";
import {
  LibraryScreen as SOPLibraryScreen,
  BuilderScreen as SOPBuilderScreen,
} from "@/components/figma-sop-builder";
import {
  StaffLaunchEventsOperations,
  StaffLaunchOrganizationLeaderboard,
} from "@/components/staff-launch-events-panels";
import { getStaffChapterTypeFilterLabel, getStaffChapterTypeLabel, getStaffChapterTypeValue, staffChapterTypeFilterOptions, type StaffLaunchChapterTypeFilter } from "@/services/staff-chapter-type";
import type { SOPCampaign } from "@/components/figma-sop-builder";
import { FigmaAdminPanel as AdminPanel } from "@/components/figma-admin-panel";

/* ─────────────────────────────────────────────────────────── */
/*  TYPES                                                       */
/* ─────────────────────────────────────────────────────────── */

type RiskLevel = "healthy" | "at-risk" | "intervene";
type Decision = "Advance" | "Hold" | "Intervene" | "—";
type CampaignStatus = "on-track" | "behind" | "not-started" | "complete" | "paused";

interface Chapter {
  id: string;
  name: string;
  school: string;
  country: string;
  region: string;
  coach: string;
  leaders: string[];
  activeMembers: number;
  campaign: string;
  campaignStatus: CampaignStatus;
  leads: number;
  rsvps: number;
  attendance: number;
  followUps: number;
  assignments: number;
  evidencePending: number;
  evidenceApproved: number;
  pointsWeek: number;
  hubspotLifecycle: string;
  hubspotTasks: number;
  lumaEvents: number;
  lastActivity: string;
  risk: RiskLevel;
  decision: Decision;
  healthScore: number;
  newMembers: number;
  feedViews: number;
  chapterType: "established" | "new" | "growing";
  medlifeRegion: "New England" | "Mid Atlantic" | "South" | "Midwest" | "West" | "Puerto Rico" | "UK" | "Canada" | "International";
  // Event & NPS cornerstones
  eventsThisYear: number;
  eventsThisMonth: number;
  leadAttendancePct: number;   // % of leads who attended ≥1 event
  avgNpsScore: number | null;  // NPS -100 to 100; null = no surveys yet
  totalPointsYear: number;
}

type Platform = "linkedin" | "instagram" | "facebook" | "loom" | "youtube" | "tiktok" | "upload";

interface ContentCard {
  id: string;
  type: "proof-video" | "bridge-video" | "best-practice" | "event-recap" | "student-story" | "campaign-tip" | "announcement" | "social-link";
  platform?: Platform;
  url?: string;
  linkTitle?: string;
  linkDomain?: string;
  previewImage: string;
  chapter: string;
  student: string;
  campaign: string;
  assignment: string;
  submitted: string;
  consent: "public" | "chapter-only" | "multi-chapter" | "pending" | "none";
  visibility: "pending" | "chapter" | "selected" | "all" | "rejected";
  qualityScore: number;
  engagementPotential: "high" | "medium" | "low";
  views?: number;
  likes?: number;
  duration?: string;
  caption?: string;
}

interface BestPractice {
  id: string;
  title: string;
  chapter: string;
  campaign: string;
  why: string;
  kpiResult: string;
  type: string;
  country: string;
  engagementScore: number;
  recommended: string[];
}


type Screen = "chapters" | "campaigns" | "events" | "ugc" | "reports" | "admin" | "best-practices" | "sops";

const STAFF_HEADER_ACCOUNT_CLEARANCE = "pr-[11rem] sm:pr-[16rem] lg:pr-[18rem] xl:pr-[19rem]";
const STAFF_HEADER_ALERT_VISIBILITY = "hidden md:flex max-w-[8.5rem] lg:max-w-[10rem] xl:max-w-[11.5rem]";

/* ─────────────────────────────────────────────────────────── */
/*  MOCK DATA                                                   */
/* ─────────────────────────────────────────────────────────── */

const CHAPTERS: Chapter[] = [
  { id:"ch1",  name:"TEST UC Berkeley",          school:"TEST University of California, Berkeley",       country:"USA",       region:"North America",   coach:"TEST Maria Santos",  leaders:["TEST Priya Nair","TEST Ethan Liu"],           activeMembers:48, campaign:"Rush Month",          campaignStatus:"on-track",   leads:87,  rsvps:62, attendance:51, followUps:54, assignments:38, evidencePending:4,  evidenceApproved:22, pointsWeek:1240, hubspotLifecycle:"MQL", hubspotTasks:3,  lumaEvents:4, lastActivity:"2h ago",  risk:"healthy",   decision:"Advance",   healthScore:91, newMembers:12, feedViews:340, chapterType:"established", eventsThisYear:18, eventsThisMonth:4, leadAttendancePct:59, avgNpsScore:67,   totalPointsYear:14200, medlifeRegion:"West"           },
  { id:"ch2",  name:"TEST Yale University",       school:"TEST Yale University",                         country:"USA",       region:"North America",   coach:"TEST James Okafor",  leaders:["TEST Sofia Chen"],                      activeMembers:22, campaign:"Rush Month",          campaignStatus:"behind",     leads:19,  rsvps:11, attendance:7,  followUps:4,  assignments:12, evidencePending:8,  evidenceApproved:3,  pointsWeek:210,  hubspotLifecycle:"Lead", hubspotTasks:11, lumaEvents:1, lastActivity:"3d ago",  risk:"at-risk",   decision:"Hold",      healthScore:38, newMembers:1,  feedViews:45,  chapterType:"growing",     eventsThisYear:6,  eventsThisMonth:1, leadAttendancePct:37, avgNpsScore:28,   totalPointsYear:3100,  medlifeRegion:"New England"    },
  { id:"ch3",  name:"TEST University of Florida", school:"TEST University of Florida",                   country:"USA",       region:"North America",   coach:"TEST Maria Santos",  leaders:["TEST Marcus Webb","TEST Diana Torres"],       activeMembers:61, campaign:"Rush Month",          campaignStatus:"on-track",   leads:104, rsvps:91, attendance:78, followUps:88, assignments:55, evidencePending:2,  evidenceApproved:41, pointsWeek:1680, hubspotLifecycle:"SQL", hubspotTasks:1,  lumaEvents:5, lastActivity:"4h ago",  risk:"healthy",   decision:"Advance",   healthScore:96, newMembers:18, feedViews:510, chapterType:"established", eventsThisYear:22, eventsThisMonth:5, leadAttendancePct:75, avgNpsScore:71,   totalPointsYear:19800, medlifeRegion:"South"          },
  { id:"ch4",  name:"TEST McGill University",     school:"TEST McGill University",                       country:"Canada",    region:"North America",   coach:"TEST Aisha Kamara",  leaders:["TEST Louis Tremblay"],                  activeMembers:34, campaign:"SLT Promotion",       campaignStatus:"on-track",   leads:47,  rsvps:38, attendance:31, followUps:35, assignments:28, evidencePending:1,  evidenceApproved:17, pointsWeek:820,  hubspotLifecycle:"MQL", hubspotTasks:2,  lumaEvents:3, lastActivity:"6h ago",  risk:"healthy",   decision:"Advance",   healthScore:82, newMembers:7,  feedViews:210, chapterType:"established", eventsThisYear:15, eventsThisMonth:3, leadAttendancePct:66, avgNpsScore:58,   totalPointsYear:10400, medlifeRegion:"Canada"         },
  { id:"ch5",  name:"TEST PUCP Lima",             school:"TEST Pontificia Universidad Católica del Perú",country:"Peru",      region:"Latin America",   coach:"TEST Carlos Quispe", leaders:["TEST Valentina Ruiz","TEST Alejandro Flores"],activeMembers:41, campaign:"Rush Month",          campaignStatus:"behind",     leads:38,  rsvps:22, attendance:14, followUps:11, assignments:20, evidencePending:6,  evidenceApproved:8,  pointsWeek:380,  hubspotLifecycle:"Lead", hubspotTasks:7,  lumaEvents:2, lastActivity:"1d ago",  risk:"at-risk",   decision:"Hold",      healthScore:44, newMembers:3,  feedViews:120, chapterType:"growing",     eventsThisYear:9,  eventsThisMonth:2, leadAttendancePct:37, avgNpsScore:44,   totalPointsYear:5800,  medlifeRegion:"International"  },
  { id:"ch6",  name:"TEST UNMSM Lima",            school:"TEST Universidad Nacional Mayor de San Marcos", country:"Peru",      region:"Latin America",   coach:"TEST Carlos Quispe", leaders:["TEST Ricardo Mamani"],                  activeMembers:17, campaign:"Rush Month",          campaignStatus:"not-started",leads:6,   rsvps:2,  attendance:2,  followUps:0,  assignments:4,  evidencePending:12, evidenceApproved:0,  pointsWeek:40,   hubspotLifecycle:"Lead", hubspotTasks:14, lumaEvents:0, lastActivity:"6d ago",  risk:"intervene", decision:"Intervene", healthScore:12, newMembers:0,  feedViews:18,  chapterType:"new",         eventsThisYear:2,  eventsThisMonth:0, leadAttendancePct:33, avgNpsScore:null, totalPointsYear:900,   medlifeRegion:"International"  },
  { id:"ch7",  name:"TEST USP São Paulo",         school:"TEST Universidade de São Paulo",               country:"Brazil",    region:"Latin America",   coach:"TEST Fernanda Lima", leaders:["TEST Beatriz Souza","TEST Gabriel Martins"], activeMembers:55, campaign:"Moving Mountains",    campaignStatus:"on-track",   leads:78,  rsvps:69, attendance:58, followUps:61, assignments:44, evidencePending:3,  evidenceApproved:33, pointsWeek:1420, hubspotLifecycle:"MQL", hubspotTasks:2,  lumaEvents:4, lastActivity:"1h ago",  risk:"healthy",   decision:"Advance",   healthScore:88, newMembers:14, feedViews:440, chapterType:"established", eventsThisYear:19, eventsThisMonth:4, leadAttendancePct:74, avgNpsScore:65,   totalPointsYear:17400, medlifeRegion:"International"  },
  { id:"ch8",  name:"TEST UFMG Belo Horizonte",   school:"TEST Universidade Federal de Minas Gerais",    country:"Brazil",    region:"Latin America",   coach:"TEST Fernanda Lima", leaders:["TEST Lucas Pereira"],                   activeMembers:28, campaign:"Rush Month",          campaignStatus:"behind",     leads:22,  rsvps:14, attendance:9,  followUps:7,  assignments:15, evidencePending:9,  evidenceApproved:4,  pointsWeek:190,  hubspotLifecycle:"Lead", hubspotTasks:8,  lumaEvents:1, lastActivity:"2d ago",  risk:"at-risk",   decision:"Hold",      healthScore:33, newMembers:2,  feedViews:65,  chapterType:"growing",     eventsThisYear:7,  eventsThisMonth:1, leadAttendancePct:41, avgNpsScore:38,   totalPointsYear:4200,  medlifeRegion:"International"  },
  { id:"ch9",  name:"TEST UNAH Tegucigalpa",      school:"TEST Universidad Nacional Autónoma de Honduras",country:"Honduras",  region:"Central America",  coach:"TEST Lucia Herrera", leaders:["TEST Andrea Sánchez","TEST Miguel Reyes"],   activeMembers:39, campaign:"Chapter Engagement",  campaignStatus:"on-track",   leads:52,  rsvps:44, attendance:37, followUps:40, assignments:30, evidencePending:2,  evidenceApproved:19, pointsWeek:910,  hubspotLifecycle:"MQL", hubspotTasks:3,  lumaEvents:3, lastActivity:"3h ago",  risk:"healthy",   decision:"Advance",   healthScore:79, newMembers:8,  feedViews:280, chapterType:"established", eventsThisYear:14, eventsThisMonth:3, leadAttendancePct:71, avgNpsScore:62,   totalPointsYear:11900, medlifeRegion:"International"  },
  { id:"ch10", name:"TEST UNAN Managua",          school:"TEST Universidad Nacional Autónoma de Nicaragua",country:"Nicaragua",region:"Central America",  coach:"TEST Lucia Herrera", leaders:["TEST Karla López"],                     activeMembers:21, campaign:"Rush Month",          campaignStatus:"behind",     leads:14,  rsvps:7,  attendance:5,  followUps:3,  assignments:9,  evidencePending:7,  evidenceApproved:2,  pointsWeek:130,  hubspotLifecycle:"Lead", hubspotTasks:9,  lumaEvents:1, lastActivity:"3d ago",  risk:"at-risk",   decision:"Hold",      healthScore:29, newMembers:1,  feedViews:38,  chapterType:"growing",     eventsThisYear:5,  eventsThisMonth:1, leadAttendancePct:36, avgNpsScore:35,   totalPointsYear:3600,  medlifeRegion:"International"  },
  { id:"ch11", name:"TEST University of Nairobi", school:"TEST University of Nairobi",                   country:"Kenya",     region:"Africa",           coach:"TEST Samuel Mutua",  leaders:["TEST Faith Wanjiru","TEST Daniel Otieno"],    activeMembers:44, campaign:"Grow the Movement",   campaignStatus:"on-track",   leads:61,  rsvps:54, attendance:46, followUps:50, assignments:37, evidencePending:1,  evidenceApproved:26, pointsWeek:1090, hubspotLifecycle:"MQL", hubspotTasks:2,  lumaEvents:4, lastActivity:"5h ago",  risk:"healthy",   decision:"Advance",   healthScore:85, newMembers:11, feedViews:320, chapterType:"established", eventsThisYear:16, eventsThisMonth:3, leadAttendancePct:75, avgNpsScore:69,   totalPointsYear:14800, medlifeRegion:"International"  },
  { id:"ch12", name:"TEST Makerere University",   school:"TEST Makerere University",                     country:"Uganda",    region:"Africa",           coach:"TEST Samuel Mutua",  leaders:["TEST Grace Nakato"],                    activeMembers:31, campaign:"Rush Month",          campaignStatus:"on-track",   leads:43,  rsvps:36, attendance:29, followUps:32, assignments:24, evidencePending:3,  evidenceApproved:14, pointsWeek:690,  hubspotLifecycle:"MQL", hubspotTasks:4,  lumaEvents:3, lastActivity:"8h ago",  risk:"healthy",   decision:"Advance",   healthScore:74, newMembers:6,  feedViews:190, chapterType:"established", eventsThisYear:12, eventsThisMonth:3, leadAttendancePct:67, avgNpsScore:61,   totalPointsYear:9400,  medlifeRegion:"International"  },
  { id:"ch13", name:"TEST Stanford University",   school:"TEST Stanford University",                     country:"USA",       region:"North America",   coach:"TEST James Okafor",  leaders:["TEST Mia Rodriguez","TEST Chris Park"],       activeMembers:52, campaign:"Leadership Transition",campaignStatus:"complete",   leads:91,  rsvps:80, attendance:68, followUps:75, assignments:60, evidencePending:0,  evidenceApproved:48, pointsWeek:1890, hubspotLifecycle:"SQL", hubspotTasks:0,  lumaEvents:5, lastActivity:"30m ago", risk:"healthy",   decision:"Advance",   healthScore:98, newMembers:20, feedViews:620, chapterType:"established", eventsThisYear:24, eventsThisMonth:5, leadAttendancePct:75, avgNpsScore:78,   totalPointsYear:22100, medlifeRegion:"West"           },
  { id:"ch14", name:"TEST Johns Hopkins",         school:"TEST Johns Hopkins University",                country:"USA",       region:"North America",   coach:"TEST James Okafor",  leaders:["TEST Alex Kim"],                        activeMembers:26, campaign:"SLT Promotion",       campaignStatus:"behind",     leads:21,  rsvps:12, attendance:8,  followUps:6,  assignments:11, evidencePending:10, evidenceApproved:2,  pointsWeek:180,  hubspotLifecycle:"Lead", hubspotTasks:12, lumaEvents:1, lastActivity:"4d ago",  risk:"at-risk",   decision:"Hold",      healthScore:27, newMembers:1,  feedViews:42,  chapterType:"growing",     eventsThisYear:7,  eventsThisMonth:1, leadAttendancePct:38, avgNpsScore:31,   totalPointsYear:3800,  medlifeRegion:"Mid Atlantic"   },
  { id:"ch15", name:"TEST UPCH Lima",             school:"TEST Universidad Peruana Cayetano Heredia",    country:"Peru",      region:"Latin America",   coach:"TEST Carlos Quispe", leaders:["TEST Isabella Morales","TEST Juan Chávez"],   activeMembers:49, campaign:"Rush Month",          campaignStatus:"on-track",   leads:72,  rsvps:61, attendance:52, followUps:57, assignments:42, evidencePending:3,  evidenceApproved:29, pointsWeek:1190, hubspotLifecycle:"MQL", hubspotTasks:2,  lumaEvents:4, lastActivity:"2h ago",  risk:"healthy",   decision:"Advance",   healthScore:87, newMembers:13, feedViews:380, chapterType:"established", eventsThisYear:17, eventsThisMonth:4, leadAttendancePct:72, avgNpsScore:64,   totalPointsYear:15600,  medlifeRegion:"International"  },
  { id:"ch16", name:"TEST Universidad de Chile",  school:"TEST Universidad de Chile",                    country:"Chile",     region:"Latin America",   coach:"TEST Fernanda Lima", leaders:["TEST Camila Vásquez"],                  activeMembers:19, campaign:"Rush Month",          campaignStatus:"paused",     leads:11,  rsvps:4,  attendance:3,  followUps:2,  assignments:5,  evidencePending:11, evidenceApproved:1,  pointsWeek:60,   hubspotLifecycle:"Lead", hubspotTasks:13, lumaEvents:0, lastActivity:"5d ago",  risk:"at-risk",   decision:"Intervene", healthScore:19, newMembers:0,  feedViews:22,  chapterType:"new",         eventsThisYear:4,  eventsThisMonth:0, leadAttendancePct:27, avgNpsScore:25,   totalPointsYear:2100,  medlifeRegion:"International"  },
  { id:"ch17", name:"TEST UNAM Mexico City",      school:"TEST Universidad Nacional Autónoma de México",country:"Mexico",    region:"Latin America",   coach:"TEST Carlos Quispe", leaders:["TEST Rodrigo Hernández","TEST Daniela Vargas"],activeMembers:63, campaign:"Moving Mountains",    campaignStatus:"on-track",   leads:99,  rsvps:86, attendance:74, followUps:82, assignments:58, evidencePending:2,  evidenceApproved:44, pointsWeek:1760, hubspotLifecycle:"SQL", hubspotTasks:1,  lumaEvents:5, lastActivity:"1h ago",  risk:"healthy",   decision:"Advance",   healthScore:94, newMembers:19, feedViews:570, chapterType:"established", eventsThisYear:21, eventsThisMonth:5, leadAttendancePct:75, avgNpsScore:70,   totalPointsYear:20400, medlifeRegion:"International"  },
  { id:"ch18", name:"TEST University of Ghana",   school:"TEST University of Ghana, Legon",             country:"Ghana",     region:"Africa",           coach:"TEST Samuel Mutua",  leaders:["TEST Kwame Asante"],                    activeMembers:14, campaign:"Start a Chapter",     campaignStatus:"not-started",leads:4,   rsvps:1,  attendance:1,  followUps:0,  assignments:2,  evidencePending:8,  evidenceApproved:0,  pointsWeek:20,   hubspotLifecycle:"Lead", hubspotTasks:16, lumaEvents:0, lastActivity:"8d ago",  risk:"intervene", decision:"Intervene", healthScore:8,  newMembers:0,  feedViews:9,   chapterType:"new",         eventsThisYear:1,  eventsThisMonth:0, leadAttendancePct:25, avgNpsScore:null, totalPointsYear:600,   medlifeRegion:"International"  },
  { id:"ch19", name:"TEST University of Toronto", school:"TEST University of Toronto",                  country:"Canada",    region:"North America",   coach:"TEST Aisha Kamara",  leaders:["TEST Nadia Singh","TEST Tommy Chen"],         activeMembers:45, campaign:"Chapter Engagement",  campaignStatus:"on-track",   leads:63,  rsvps:55, attendance:47, followUps:51, assignments:38, evidencePending:2,  evidenceApproved:23, pointsWeek:1050, hubspotLifecycle:"MQL", hubspotTasks:3,  lumaEvents:4, lastActivity:"3h ago",  risk:"healthy",   decision:"Advance",   healthScore:83, newMembers:10, feedViews:310, chapterType:"established", eventsThisYear:16, eventsThisMonth:3, leadAttendancePct:75, avgNpsScore:63,   totalPointsYear:13800, medlifeRegion:"Canada"         },
  { id:"ch20", name:"TEST MIT",                   school:"TEST Massachusetts Institute of Technology",  country:"USA",       region:"North America",   coach:"TEST Maria Santos",  leaders:["TEST Elise Park","TEST Jordan Nakamura"],     activeMembers:57, campaign:"Leadership Transition",campaignStatus:"on-track",   leads:82,  rsvps:74, attendance:63, followUps:70, assignments:51, evidencePending:1,  evidenceApproved:38, pointsWeek:1540, hubspotLifecycle:"SQL", hubspotTasks:1,  lumaEvents:5, lastActivity:"45m ago", risk:"healthy",   decision:"Advance",   healthScore:93, newMembers:16, feedViews:490, chapterType:"established", eventsThisYear:20, eventsThisMonth:5, leadAttendancePct:77, avgNpsScore:74,   totalPointsYear:18200, medlifeRegion:"New England"    },
];

const UGC_CARDS: ContentCard[] = [
  {
    id:"ugc1", type:"social-link", platform:"instagram",
    url:"https://instagram.com/p/abc123",
    linkTitle:"TEST Rush Month tabling — 80+ students stopped by our table today 🩺",
    linkDomain:"instagram.com",
    previewImage:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST UC Berkeley", student:"TEST Priya Nair", campaign:"Rush Month", assignment:"TEST Tabling Event Recap",
    submitted:"2h ago", consent:"public", visibility:"pending", qualityScore:94, engagementPotential:"high",
    views:0, likes:0, caption:"TEST Incredible energy at our Rush Month tabling event! Over 80 people stopped by."
  },
  {
    id:"ugc2", type:"social-link", platform:"loom",
    url:"https://loom.com/share/xyz789",
    linkTitle:"TEST Bridge Video: Why I joined MEDLIFE — TEST Rodrigo Hernández, UNAM",
    linkDomain:"loom.com",
    previewImage:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST UNAM Mexico City", student:"TEST Rodrigo Hernández", campaign:"Moving Mountains", assignment:"TEST Bridge Video - My Why",
    submitted:"5h ago", consent:"multi-chapter", visibility:"pending", qualityScore:88, engagementPotential:"high",
    duration:"3:42", caption:"TEST A powerful story about why healthcare access matters in rural communities."
  },
  {
    id:"ugc3", type:"social-link", platform:"facebook",
    url:"https://facebook.com/posts/def456",
    linkTitle:"TEST UF MEDLIFE Info Night Recap — 78 attendees, best turnout ever!",
    linkDomain:"facebook.com",
    previewImage:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST University of Florida", student:"TEST Marcus Webb", campaign:"Rush Month", assignment:"TEST Info Night Recap",
    submitted:"1d ago", consent:"public", visibility:"chapter", qualityScore:76, engagementPotential:"medium",
    views:142, likes:31, caption:"TEST Our info night brought in 78 attendees — best turnout ever!"
  },
  {
    id:"ugc4", type:"best-practice", platform:"upload",
    linkTitle:"TEST Best Practice: QR Lead Capture — 91 leads in one weekend",
    linkDomain:"mymedlife.org",
    previewImage:"https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST Stanford University", student:"TEST Mia Rodriguez", campaign:"Leadership Transition", assignment:"TEST Best Practice: QR Lead Capture",
    submitted:"1d ago", consent:"public", visibility:"selected", qualityScore:97, engagementPotential:"high",
    views:380, likes:87, caption:"TEST How we captured 91 leads in one weekend using QR codes at 5 campus events."
  },
  {
    id:"ugc5", type:"social-link", platform:"youtube",
    url:"https://youtube.com/watch?v=ghi012",
    linkTitle:"TEST Faith Wanjiru: How MEDLIFE changed my understanding of community health",
    linkDomain:"youtube.com",
    previewImage:"https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST University of Nairobi", student:"TEST Faith Wanjiru", campaign:"Grow the Movement", assignment:"TEST Student Story",
    submitted:"2d ago", consent:"public", visibility:"pending", qualityScore:91, engagementPotential:"high",
    duration:"4:10", caption:"TEST Faith shares how MEDLIFE changed her understanding of community health."
  },
  {
    id:"ugc6", type:"social-link", platform:"linkedin",
    url:"https://linkedin.com/posts/jkl345",
    linkTitle:"TEST PUCP Lima Rush Month — tabling at the Faculty of Medicine",
    linkDomain:"linkedin.com",
    previewImage:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST PUCP Lima", student:"TEST Valentina Ruiz", campaign:"Rush Month", assignment:"TEST Tabling Event",
    submitted:"3d ago", consent:"chapter-only", visibility:"pending", qualityScore:62, engagementPotential:"medium",
    duration:"1:34", caption:"TEST Rush table at the faculty of medicine."
  },
  {
    id:"ugc7", type:"event-recap", platform:"upload",
    linkTitle:"TEST Makerere MEDLIFE — Info Session Highlights",
    linkDomain:"mymedlife.org",
    previewImage:"https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST Makerere University", student:"TEST Grace Nakato", campaign:"Rush Month", assignment:"TEST Info Session",
    submitted:"3d ago", consent:"pending", visibility:"pending", qualityScore:79, engagementPotential:"medium",
    views:0, likes:0, caption:"TEST Consent form still pending."
  },
  {
    id:"ugc8", type:"social-link", platform:"tiktok",
    url:"https://tiktok.com/@ufmgmedlife/video/mno678",
    linkTitle:"TEST Quick tabling clip — UFMG Belo Horizonte Rush Month",
    linkDomain:"tiktok.com",
    previewImage:"https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=340&fit=crop&auto=format",
    chapter:"TEST UFMG Belo Horizonte", student:"TEST Lucas Pereira", campaign:"Rush Month", assignment:"TEST Tabling",
    submitted:"4d ago", consent:"none", visibility:"rejected", qualityScore:55, engagementPotential:"low",
    duration:"0:48", caption:"TEST Short clip, no consent obtained."
  },
];

const BEST_PRACTICES: BestPractice[] = [
  { id:"bp1", title:"TEST QR Code Lead Capture at Multi-Event Weekend", chapter:"TEST Stanford University", campaign:"Rush Month", why:"TEST Chapter deployed QR codes at 5 events simultaneously with a mock-safe CRM import checklist, capturing 91 qualified leads in 48 hours.", kpiResult:"+91 leads, 74% RSVP rate", type:"Event Strategy", country:"USA", engagementScore:97, recommended:["TEST Yale University","TEST Johns Hopkins","TEST PUCP Lima"] },
  { id:"bp2", title:"TEST Morning Motivation Text Sequence for Members", chapter:"TEST UC Berkeley", campaign:"Chapter Engagement", why:"TEST Coach co-created a 5-day WhatsApp check-in series that boosted assignment completion from 62% to 89% in 2 weeks.", kpiResult:"+27% assignment completion", type:"Coach Communication", country:"USA", engagementScore:92, recommended:["TEST UFMG Belo Horizonte","TEST UNAN Managua","TEST University of Ghana"] },
  { id:"bp3", title:"TEST 'Why I Travel' Bridge Video Campaign", chapter:"TEST UNAM Mexico City", campaign:"Moving Mountains", why:"TEST Leaders filmed 3-minute personal story videos and shared them on chapter social media before Rush, driving 40% more RSVPs than previous year.", kpiResult:"+40% RSVPs vs. baseline", type:"Content Strategy", country:"Mexico", engagementScore:88, recommended:["TEST UNMSM Lima","TEST Universidad de Chile","TEST UNAH Tegucigalda"] },
  { id:"bp4", title:"TEST Faculty Partnership for Tabling Prime Spots", chapter:"TEST University of Florida", campaign:"Rush Month", why:"TEST Chapter partnered with Health Sciences dean office to secure 3 high-traffic tabling locations, resulting in 104 leads captured.", kpiResult:"104 leads, best in region", type:"Outreach Strategy", country:"USA", engagementScore:85, recommended:["TEST McGill University","TEST University of Toronto"] },
  { id:"bp5", title:"TEST Peer-to-Peer Recruitment Bonus Structure", chapter:"TEST USP São Paulo", campaign:"Grow the Movement", why:"TEST Members earned bonus points for recruiting classmates who attended events, creating a viral spread effect.", kpiResult:"+14 new members in one campaign", type:"Membership Growth", country:"Brazil", engagementScore:81, recommended:["TEST UFMG Belo Horizonte","TEST UNMSM Lima","TEST University of Ghana"] },
];


/* ─────────────────────────────────────────────────────────── */
/*  UTILITY COMPONENTS                                          */
/* ─────────────────────────────────────────────────────────── */

function RiskPill({ level }: { level: RiskLevel }) {
  const map = {
    healthy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "at-risk": "bg-amber-50 text-amber-700 border border-amber-200",
    intervene: "bg-red-50 text-red-700 border border-red-200",
  };
  const label = { healthy: "Healthy", "at-risk": "At Risk", intervene: "Intervene" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${map[level]}`}>
      <Circle className="w-1.5 h-1.5 fill-current" />
      {label[level]}
    </span>
  );
}

function CampaignBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, string> = {
    "on-track": "bg-sky-50 text-sky-700 border border-sky-200",
    "behind": "bg-orange-50 text-orange-700 border border-orange-200",
    "not-started": "bg-gray-100 text-gray-500 border border-gray-200",
    "complete": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "paused": "bg-purple-50 text-purple-600 border border-purple-200",
  };
  const label: Record<CampaignStatus, string> = {
    "on-track": "On Track", "behind": "Behind", "not-started": "Not Started",
    "complete": "Complete", "paused": "Paused"
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function DecisionControl({ value, onChange }: { value: Decision; onChange: (v: Decision) => void }) {
  const options: Decision[] = ["Advance", "Hold", "Intervene"];
  const map = {
    Advance: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
    Hold: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    Intervene: "bg-red-100 text-red-800 ring-1 ring-red-300",
    "—": "bg-gray-100 text-gray-500",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Decision)}
      className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer outline-none ${map[value]} appearance-none`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function KPICard({ label, value, sub, color = "blue" }: { label: string; value: string | number; sub?: string; color?: "blue" | "yellow" | "green" | "red" | "gray" }) {
  const accent = {
    blue: "border-t-2 border-t-blue-600",
    yellow: "border-t-2 border-t-amber-400",
    green: "border-t-2 border-t-emerald-500",
    red: "border-t-2 border-t-red-500",
    gray: "border-t-2 border-t-gray-300",
  };
  return (
    <div className={`bg-white rounded-lg p-4 ${accent[color]} shadow-sm`}>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ConsentTag({ status }: { status: ContentCard["consent"] }) {
  const map = {
    public: "bg-emerald-100 text-emerald-800",
    "chapter-only": "bg-sky-100 text-sky-800",
    "multi-chapter": "bg-violet-100 text-violet-800",
    pending: "bg-amber-100 text-amber-800",
    none: "bg-red-100 text-red-800",
  };
  const label = {
    public: "Public", "chapter-only": "Chapter Only",
    "multi-chapter": "Multi-Chapter", pending: "Consent Pending", none: "No Consent"
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status]}`}>{label[status]}</span>;
}

function IntegrationStatus({ name, status, lastSync }: { name: string; status: "live" | "mock" | "error" | "degraded"; lastSync: string }) {
  const map = { live: "text-emerald-600", mock: "text-amber-500", error: "text-red-600", degraded: "text-orange-500" };
  const icon = { live: <Wifi className="w-3 h-3" />, mock: <Radio className="w-3 h-3" />, error: <WifiOff className="w-3 h-3" />, degraded: <AlertCircle className="w-3 h-3" /> };
  const label = { live: "Live", mock: "Mock", error: "Error", degraded: "Degraded" };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded bg-muted ${map[status]}`}>{icon[status]}</div>
        <div>
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">Last sync: {lastSync}</div>
        </div>
      </div>
      <span className={`text-xs font-mono font-bold ${map[status]}`}>{label[status]}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  NPS UTILITIES                                               */
/* ─────────────────────────────────────────────────────────── */

function NpsScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground font-mono italic">No data</span>;
  const cls = score >= 60 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : score >= 30 ? "text-sky-600 bg-sky-50 border-sky-200"
    : score >= 0  ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${cls}`}>
      {score > 0 ? "+" : ""}{score}
    </span>
  );
}

function NPSSurveyPreview({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative" onClick={e => e.stopPropagation()}>
        <div className="w-[300px] bg-white rounded-3xl shadow-2xl border-[3px] border-slate-200 overflow-hidden">
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-[9px] font-black text-sidebar">M</div>
            <span className="text-white text-xs font-bold">myMEDLIFE</span>
          </div>
          {!submitted ? (
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 text-center">Quick Event Feedback</div>
                <p className="text-sm font-semibold text-foreground text-center leading-snug">
                  How likely are you to recommend MEDLIFE to a friend?
                </p>
              </div>
              <div>
                <div className="grid grid-cols-11 gap-0.5 mb-1.5">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`py-1.5 rounded text-xs font-bold transition-all ${
                        selected === i
                          ? i >= 9 ? "bg-emerald-500 text-white" : i >= 7 ? "bg-sky-500 text-white" : "bg-red-400 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Not likely</span><span>Very likely</span>
                </div>
              </div>
              <textarea
                placeholder="What stood out? (optional)"
                rows={2}
                className="w-full bg-muted/60 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none border border-border"
              />
              <button
                onClick={() => setSubmitted(true)}
                disabled={selected === null}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-30 hover:bg-primary/90 transition-colors"
              >
                Submit
              </button>
              <p className="text-[10px] text-muted-foreground text-center">Takes &lt;30 sec · Sent automatically after every event</p>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <div className="font-bold text-foreground text-sm">Thank you!</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Your feedback helps MEDLIFE improve every event.</div>
            </div>
          )}
        </div>
        <div className="text-center mt-3">
          <span className="text-xs text-white/80 bg-black/30 px-3 py-1 rounded-full">Students receive this after every event</span>
        </div>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-muted">
          <X className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  CHAPTER DETAIL DRAWER                                       */
/* ─────────────────────────────────────────────────────────── */

export function ChapterDetailDrawer({
  chapter,
  onClose,
  adminPreviewHref,
}: {
  chapter: Chapter;
  onClose: () => void;
  adminPreviewHref?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showSurvey, setShowSurvey] = useState(false);
  const resolvedAdminPreviewHref =
    adminPreviewHref ??
    buildStaffChapterAdminHref(
      chapter.id,
      chapter.name,
      pathname,
      searchParams.toString(),
    );

  const recentEvents = [
    { name:"TEST Rush Month Info Night",   date:"Jun 14",  attendees: chapter.attendance,                  nps: chapter.avgNpsScore },
    { name:"TEST Tabling — Main Quad",     date:"Jun 7",   attendees: Math.round(chapter.attendance * 0.6), nps: chapter.avgNpsScore ? chapter.avgNpsScore - 6 : null },
    { name:"TEST MEDLIFE Info Session",    date:"May 28",  attendees: Math.round(chapter.attendance * 0.8), nps: chapter.avgNpsScore ? chapter.avgNpsScore + 4 : null },
  ].slice(0, Math.min(chapter.eventsThisYear, 3));

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-50 flex flex-col border-l border-border">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border sticky top-0 bg-white z-10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Chapter Detail</span>
              <CampaignBadge status={chapter.campaignStatus} />
            </div>
            <h2 className="text-base font-bold text-foreground">{chapter.name}</h2>
            <div className="text-xs text-muted-foreground">{chapter.school}</div>
            <div className="mt-1 text-[11px] text-amber-700">Preview readback only - no chapter writes, owner changes, or outreach sends run from this drawer. Use the Admin preview for DS directory and audit review.</div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{chapter.country}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{chapter.activeMembers} members</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{chapter.eventsThisYear} events this year</span>
              <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{getStaffChapterTypeLabel(chapter)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Core 4 pillars */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label:"Events / Year", value: chapter.eventsThisYear,   accent:"bg-primary/10 text-primary" },
              { label:"Events / Month", value: chapter.eventsThisMonth, accent:"bg-primary/10 text-primary" },
              { label:"Total Leads",   value: chapter.leads,            accent:"bg-foreground/8 text-foreground" },
              { label:"Points / Year", value: (chapter.totalPointsYear/1000).toFixed(1)+"k", accent:"bg-amber-100 text-amber-700" },
            ].map(k => (
              <div key={k.label} className={`rounded-xl p-3 text-center ${k.accent}`}>
                <div className="text-xl font-mono font-bold leading-none">{k.value}</div>
                <div className="text-[10px] font-medium mt-1 opacity-70 leading-tight">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Lead → Attendance funnel */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Lead → Event Funnel</span>
              <span className={`text-sm font-mono font-bold ${chapter.leadAttendancePct >= 60 ? "text-emerald-600" : chapter.leadAttendancePct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                {chapter.leadAttendancePct}% of leads attended
              </span>
            </div>
            <div className="px-4 py-3 flex items-end gap-3">
              {[
                { label:"Leads", n: chapter.leads, pct: 100, color:"bg-primary/70" },
                { label:"RSVPs", n: chapter.rsvps, pct: Math.round(chapter.rsvps/Math.max(chapter.leads,1)*100), color:"bg-primary/40" },
                { label:"Attended", n: chapter.attendance, pct: Math.round(chapter.attendance/Math.max(chapter.leads,1)*100), color:"bg-emerald-500" },
                { label:"New Mbrs", n: chapter.newMembers, pct: Math.round(chapter.newMembers/Math.max(chapter.leads,1)*100), color:"bg-amber-400" },
              ].map(s => (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-foreground">{s.n}</span>
                  <div className={`w-full rounded-t ${s.color}`} style={{ height: Math.max(s.pct * 0.5, 4) }} />
                  <span className="text-[9px] text-muted-foreground text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Event NPS */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Post-Event NPS</span>
              <button onClick={() => setShowSurvey(true)} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1">
                <Eye className="w-3 h-3" /> Preview Survey
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-5 mb-3">
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Avg NPS</div>
                  <NpsScore score={chapter.avgNpsScore} />
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Surveys Sent</div>
                  <div className="text-sm font-mono font-bold text-foreground">{chapter.eventsThisYear}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground mb-1">Response Rate</div>
                  <div className="text-sm font-mono font-bold text-foreground">
                    {chapter.eventsThisYear > 0 ? `${Math.min(94, 58 + chapter.eventsThisYear)}%` : "—"}
                  </div>
                </div>
                <button
                  onClick={() => setShowSurvey(true)}
                  title="Survey sending is blocked in this preview"
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-3 h-3" /> Preview NPS Survey
                </button>
              </div>
              <div className="text-[10px] text-amber-600 font-medium mb-2">
                Survey sending stays blocked in this preview. Use the NPS buttons to review the chapter survey flow only.
              </div>
              {recentEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {recentEvents.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-t border-border first:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{ev.name}</div>
                        <div className="text-[10px] text-muted-foreground">{ev.date} · {ev.attendees} attendees</div>
                      </div>
                      <NpsScore score={ev.nps} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-1">No events yet — NPS will appear after the first event.</p>
              )}
            </div>
          </div>

          {/* Campaigns (parallel) + Points */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-3.5">
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Active Campaigns</div>
              {/* Primary campaign */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-semibold text-foreground leading-tight">{chapter.campaign}</div>
                <CampaignBadge status={chapter.campaignStatus} />
              </div>
              {/* Second campaign — shown for established chapters running parallel campaigns */}
              {chapter.chapterType === "established" && (
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                  <div className="text-xs font-medium text-muted-foreground leading-tight">Chapter Engagement</div>
                  <CampaignBadge status="on-track" />
                </div>
              )}
              {/* Third for high-volume chapters */}
              {chapter.eventsThisYear >= 18 && (
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                  <div className="text-xs font-medium text-muted-foreground leading-tight">Grow the Movement</div>
                  <CampaignBadge status="on-track" />
                </div>
              )}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-1">Points / Year</div>
              <div className="text-2xl font-mono font-bold text-amber-600">{chapter.totalPointsYear.toLocaleString()}</div>
              <div className="text-[10px] text-amber-500 mt-0.5">+{chapter.pointsWeek.toLocaleString()} this week</div>
            </div>
          </div>

          {/* Coach + Leaders */}
          <div className="border border-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Coach</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{chapter.coach}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Leaders</div>
              <div className="flex flex-wrap gap-1.5">
                {chapter.leaders.map(l => (
                  <span key={l} className="bg-secondary text-primary px-2 py-0.5 rounded text-xs font-medium">{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Note */}
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coach Note</div>
            <textarea
              readOnly
              title="Coach notes stay preview-only in this chapter drawer"
              value={`Coach notes stay preview-only in this chapter drawer. No note save, intervention status write, or follow-up task write runs for ${chapter.name} from this surface.`}
              className="w-full bg-muted/50 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 border border-border"
              rows={3}
            />
            <p className="mt-2 text-[10px] leading-relaxed text-amber-700">
              Chapter support notes stay visible for coach review. Next step: open the Admin preview for DS directory readback, audit, and blocked-control follow-through before requesting any write path. Return to this chapter in the same Command Center loop after the Admin readback closes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex gap-2 flex-shrink-0">
          <button disabled title="Content sending is blocked until external-send approval is complete" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="w-3.5 h-3.5" /> Send blocked
          </button>
          <button
            onClick={() => setShowSurvey(true)}
            title="Survey sending is blocked in this preview"
            className="flex-1 bg-secondary border border-primary/20 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" /> Preview NPS Survey
          </button>
          <a
            href={resolvedAdminPreviewHref}
            title="Open the embedded Admin preview for DS directory readback and audit review"
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Open Admin preview</span>
          </a>
          <button
            onClick={onClose}
            title="Return to the chapters overview after this preview readback"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to chapters</span>
          </button>
        </div>
      </div>

      {showSurvey && <NPSSurveyPreview onClose={() => setShowSurvey(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  SCREEN 1 – PORTFOLIO OVERVIEW                              */
/* ─────────────────────────────────────────────────────────── */

function PortfolioOverview({
  onSelectChapter,
  initialSearch = "",
  initialRegionFilter = "all",
  initialCoachFilter = "all",
  initialChapterTypeFilter = "all",
  initialSortBy = "name",
}: {
  onSelectChapter: (c: Chapter) => void;
  initialSearch?: string;
  initialRegionFilter?: string;
  initialCoachFilter?: string;
  initialChapterTypeFilter?: StaffLaunchChapterTypeFilter;
  initialSortBy?: "name"|"nps"|"events"|"leads"|"leadPct"|"points";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("chapterSearch") ?? initialSearch;
  const regionFilter = searchParams.get("chapterRegion") ?? initialRegionFilter;
  const coachFilter = searchParams.get("chapterCoach") ?? initialCoachFilter;
  const chapterTypeFilter = resolveStaffChapterTypeFilter(searchParams.get("chapterType"), initialChapterTypeFilter);
  const sortBy = resolveStaffChapterSort(searchParams.get("chapterSort"), initialSortBy);
  const [showSurvey, setShowSurvey] = useState(false);

  const REGIONS = ["New England", "Mid Atlantic", "South", "Midwest", "West", "Puerto Rico", "UK", "Canada", "International"];
  const coaches = ["all", ...Array.from(new Set(CHAPTERS.map(c => c.coach))).sort()];

  const filtered = useMemo(() => {
    let list = CHAPTERS.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.school.toLowerCase().includes(search.toLowerCase())) return false;
      if (regionFilter !== "all" && c.medlifeRegion !== regionFilter) return false;
      if (coachFilter !== "all" && c.coach !== coachFilter) return false;
      if (chapterTypeFilter !== "all" && getStaffChapterTypeValue(c) !== chapterTypeFilter) return false;
      return true;
    });
    if (sortBy === "nps")     list = [...list].sort((a,b) => (b.avgNpsScore ?? -999) - (a.avgNpsScore ?? -999));
    if (sortBy === "events")  list = [...list].sort((a,b) => b.eventsThisYear - a.eventsThisYear);
    if (sortBy === "leads")   list = [...list].sort((a,b) => b.leads - a.leads);
    if (sortBy === "leadPct") list = [...list].sort((a,b) => b.leadAttendancePct - a.leadAttendancePct);
    if (sortBy === "points")  list = [...list].sort((a,b) => b.totalPointsYear - a.totalPointsYear);
    return list;
  }, [search, regionFilter, coachFilter, chapterTypeFilter, sortBy]);

  const avgEventsPerMonth = (CHAPTERS.reduce((a,c) => a + c.eventsThisMonth, 0) / CHAPTERS.length).toFixed(1);
  const handleChapterFilterChange = (updates: Partial<Record<"chapterSearch" | "chapterRegion" | "chapterCoach" | "chapterType" | "chapterSort", string>>) => {
    const params = new URLSearchParams(searchParams.toString());

    const applyValue = (key: "chapterSearch" | "chapterRegion" | "chapterCoach" | "chapterType" | "chapterSort", defaultValue: string) => {
      const value = updates[key];
      if (value === undefined) return;
      if (!value || value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    };

    applyValue("chapterSearch", "");
    applyValue("chapterRegion", "all");
    applyValue("chapterCoach", "all");
    applyValue("chapterType", "all");
    applyValue("chapterSort", "name");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Chapters" value={CHAPTERS.length} sub="all active" color="blue" />
        <KPICard label="Avg Events / Month" value={avgEventsPerMonth} sub="per chapter average" color="blue" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-44 bg-muted/60 rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => handleChapterFilterChange({ chapterSearch: e.target.value })}
            placeholder="Search chapter or school…"
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground" />
          {search && <button onClick={() => handleChapterFilterChange({ chapterSearch: "" })}><X className="w-3 h-3 text-muted-foreground" /></button>}
        </div>
        <div className="relative">
          <select value={regionFilter} onChange={e => handleChapterFilterChange({ chapterRegion: e.target.value })}
            className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-foreground">
            <option value="all">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={coachFilter} onChange={e => handleChapterFilterChange({ chapterCoach: e.target.value })}
            className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-foreground">
            <option value="all">All Coaches</option>
            {coaches.filter(o => o !== "all").map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={chapterTypeFilter} onChange={e => handleChapterFilterChange({ chapterType: e.target.value })}
            className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-foreground">
            {staffChapterTypeFilterOptions.map(type => <option key={type} value={type}>{getStaffChapterTypeFilterLabel(type)}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={sortBy} onChange={e => handleChapterFilterChange({ chapterSort: e.target.value })}
            className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground">
            <option value="name">Sort: Name</option>
            <option value="nps">Sort: NPS ↓</option>
            <option value="events">Sort: Events ↓</option>
            <option value="leads">Sort: Leads ↓</option>
            <option value="leadPct">Sort: Lead % ↓</option>
            <option value="points">Sort: Points ↓</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <button disabled title="Export is blocked until reporting approval is complete" className="ml-auto flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50">
          <Download className="w-3.5 h-3.5" /> Export blocked
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">
            {filtered.length} chapters
            {filtered.length !== CHAPTERS.length && <span className="text-muted-foreground font-normal ml-1">filtered</span>}
          </div>
          <span className="text-[10px] text-muted-foreground">Click any row to open chapter detail</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {[
                  "#", "Chapter", "Type", "Coach", "Region", "Events/Yr", "Events/Mo",
                  "Leads", "RSVPs", "Attended", "Lead→Event %", "Avg NPS", "Points/Yr"
                ].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ch, idx) => {
                const pctColor = ch.leadAttendancePct >= 65 ? "text-emerald-600" : ch.leadAttendancePct >= 45 ? "text-amber-600" : "text-red-500";
                return (
                  <tr key={ch.id} onClick={() => onSelectChapter(ch)}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-secondary/40 transition-colors group">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px] w-8">#{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{ch.name}</div>
                      <div className="text-muted-foreground text-[10px]">{ch.country}</div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[11px]">{getStaffChapterTypeLabel(ch)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{ch.coach.split(" ")[0]}</td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[11px]">{ch.medlifeRegion}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground text-center">{ch.eventsThisYear}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-mono font-semibold ${ch.eventsThisMonth === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                        {ch.eventsThisMonth}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-foreground">{ch.leads}</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{ch.rsvps}</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{ch.attendance}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-mono font-bold ${pctColor}`}>{ch.leadAttendancePct}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <NpsScore score={ch.avgNpsScore} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{(ch.totalPointsYear/1000).toFixed(1)}k</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showSurvey && <NPSSurveyPreview onClose={() => setShowSurvey(false)} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  SCREEN 3 – CAMPAIGN OPERATIONS                             */
/* ─────────────────────────────────────────────────────────── */

// ── Campaign YoY historical data ──────────────────────────────────────────────
const CHAPTER_HISTORY: Record<string, {
  rush:   { lyMembers: number; lyEvents: number };
  slt:    { lyMembers: number; lySLT: number };
  mm:     { lyMembers: number; lyParticipants: number; lyFundraised: number };
  events: { lyMonthEvents: number; lyAnnualEvents: number };
  social: { ig: number; fb: number; tiktok: number; igLY: number; fbLY: number; tiktokLY: number };
}> = {
  ch1:  { rush:{lyMembers:42,lyEvents:15},  slt:{lyMembers:42,lySLT:7},  mm:{lyMembers:42,lyParticipants:32,lyFundraised:4100}, events:{lyMonthEvents:3,lyAnnualEvents:15}, social:{ig:3200,fb:1100,tiktok:1800,igLY:2600,fbLY:920,tiktokLY:800}  },
  ch2:  { rush:{lyMembers:19,lyEvents:4},   slt:{lyMembers:19,lySLT:2},  mm:{lyMembers:19,lyParticipants:13,lyFundraised:1200}, events:{lyMonthEvents:1,lyAnnualEvents:4},  social:{ig:980,fb:420,tiktok:310,igLY:800,fbLY:380,tiktokLY:90}     },
  ch3:  { rush:{lyMembers:55,lyEvents:18},  slt:{lyMembers:55,lySLT:10}, mm:{lyMembers:55,lyParticipants:41,lyFundraised:5800}, events:{lyMonthEvents:4,lyAnnualEvents:18}, social:{ig:2700,fb:1800,tiktok:2100,igLY:2100,fbLY:1500,tiktokLY:900} },
  ch4:  { rush:{lyMembers:30,lyEvents:12},  slt:{lyMembers:30,lySLT:5},  mm:{lyMembers:30,lyParticipants:22,lyFundraised:3100}, events:{lyMonthEvents:3,lyAnnualEvents:12}, social:{ig:1400,fb:700,tiktok:640,igLY:1100,fbLY:580,tiktokLY:200}   },
  ch5:  { rush:{lyMembers:36,lyEvents:7},   slt:{lyMembers:36,lySLT:5},  mm:{lyMembers:36,lyParticipants:27,lyFundraised:2200}, events:{lyMonthEvents:2,lyAnnualEvents:7},  social:{ig:1900,fb:1100,tiktok:750,igLY:1500,fbLY:950,tiktokLY:200}  },
  ch6:  { rush:{lyMembers:14,lyEvents:1},   slt:{lyMembers:14,lySLT:1},  mm:{lyMembers:14,lyParticipants:9,lyFundraised:600},  events:{lyMonthEvents:0,lyAnnualEvents:1},  social:{ig:480,fb:220,tiktok:90,igLY:350,fbLY:180,tiktokLY:0}        },
  ch7:  { rush:{lyMembers:49,lyEvents:16},  slt:{lyMembers:49,lySLT:9},  mm:{lyMembers:49,lyParticipants:37,lyFundraised:5100}, events:{lyMonthEvents:4,lyAnnualEvents:16}, social:{ig:2100,fb:1400,tiktok:1200,igLY:1700,fbLY:1100,tiktokLY:400} },
  ch8:  { rush:{lyMembers:24,lyEvents:5},   slt:{lyMembers:24,lySLT:3},  mm:{lyMembers:24,lyParticipants:17,lyFundraised:1400}, events:{lyMonthEvents:1,lyAnnualEvents:5},  social:{ig:790,fb:380,tiktok:220,igLY:640,fbLY:300,tiktokLY:60}      },
  ch9:  { rush:{lyMembers:34,lyEvents:11},  slt:{lyMembers:34,lySLT:6},  mm:{lyMembers:34,lyParticipants:26,lyFundraised:2900}, events:{lyMonthEvents:2,lyAnnualEvents:11}, social:{ig:1600,fb:920,tiktok:580,igLY:1300,fbLY:780,tiktokLY:150}   },
  ch10: { rush:{lyMembers:18,lyEvents:3},   slt:{lyMembers:18,lySLT:2},  mm:{lyMembers:18,lyParticipants:12,lyFundraised:900},  events:{lyMonthEvents:1,lyAnnualEvents:3},  social:{ig:560,fb:290,tiktok:130,igLY:440,fbLY:250,tiktokLY:40}      },
  ch11: { rush:{lyMembers:39,lyEvents:13},  slt:{lyMembers:39,lySLT:7},  mm:{lyMembers:39,lyParticipants:30,lyFundraised:3600}, events:{lyMonthEvents:3,lyAnnualEvents:13}, social:{ig:1800,fb:1100,tiktok:620,igLY:1400,fbLY:880,tiktokLY:180}  },
  ch12: { rush:{lyMembers:27,lyEvents:9},   slt:{lyMembers:27,lySLT:4},  mm:{lyMembers:27,lyParticipants:20,lyFundraised:2100}, events:{lyMonthEvents:2,lyAnnualEvents:9},  social:{ig:1100,fb:640,tiktok:320,igLY:870,fbLY:510,tiktokLY:80}     },
  ch13: { rush:{lyMembers:47,lyEvents:20},  slt:{lyMembers:47,lySLT:11}, mm:{lyMembers:47,lyParticipants:35,lyFundraised:6200}, events:{lyMonthEvents:4,lyAnnualEvents:20}, social:{ig:4200,fb:2100,tiktok:3100,igLY:3400,fbLY:1800,tiktokLY:1400}},
  ch14: { rush:{lyMembers:22,lyEvents:5},   slt:{lyMembers:22,lySLT:3},  mm:{lyMembers:22,lyParticipants:15,lyFundraised:1300}, events:{lyMonthEvents:1,lyAnnualEvents:5},  social:{ig:820,fb:390,tiktok:180,igLY:680,fbLY:330,tiktokLY:50}      },
  ch15: { rush:{lyMembers:43,lyEvents:14},  slt:{lyMembers:43,lySLT:8},  mm:{lyMembers:43,lyParticipants:33,lyFundraised:4400}, events:{lyMonthEvents:3,lyAnnualEvents:14}, social:{ig:2000,fb:1200,tiktok:880,igLY:1600,fbLY:980,tiktokLY:300}   },
  ch16: { rush:{lyMembers:16,lyEvents:3},   slt:{lyMembers:16,lySLT:2},  mm:{lyMembers:16,lyParticipants:11,lyFundraised:700},  events:{lyMonthEvents:0,lyAnnualEvents:3},  social:{ig:410,fb:190,tiktok:60,igLY:330,fbLY:160,tiktokLY:0}         },
  ch17: { rush:{lyMembers:57,lyEvents:18},  slt:{lyMembers:57,lySLT:12}, mm:{lyMembers:57,lyParticipants:43,lyFundraised:6800}, events:{lyMonthEvents:4,lyAnnualEvents:18}, social:{ig:3100,fb:2200,tiktok:1900,igLY:2500,fbLY:1800,tiktokLY:700} },
  ch18: { rush:{lyMembers:11,lyEvents:1},   slt:{lyMembers:11,lySLT:1},  mm:{lyMembers:11,lyParticipants:7,lyFundraised:400},   events:{lyMonthEvents:0,lyAnnualEvents:1},  social:{ig:280,fb:110,tiktok:40,igLY:180,fbLY:80,tiktokLY:0}          },
  ch19: { rush:{lyMembers:40,lyEvents:13},  slt:{lyMembers:40,lySLT:7},  mm:{lyMembers:40,lyParticipants:30,lyFundraised:3800}, events:{lyMonthEvents:2,lyAnnualEvents:13}, social:{ig:1700,fb:980,tiktok:720,igLY:1300,fbLY:810,tiktokLY:220}    },
  ch20: { rush:{lyMembers:51,lyEvents:17},  slt:{lyMembers:51,lySLT:10}, mm:{lyMembers:51,lyParticipants:39,lyFundraised:5600}, events:{lyMonthEvents:4,lyAnnualEvents:17}, social:{ig:3800,fb:1900,tiktok:2600,igLY:3100,fbLY:1600,tiktokLY:1100}},
};

// ── YoY helpers ───────────────────────────────────────────────────────────────
function yoyPct(ty: number, ly: number): number | null {
  if (ly === 0) return null;
  return Math.round(((ty - ly) / ly) * 100);
}

function YoYBadge({ ty, ly, prefix }: { ty: number; ly: number; prefix?: string }) {
  const pct = yoyPct(ty, ly);
  if (pct === null) return <span className="text-muted-foreground text-[10px]">—</span>;
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span className={`text-[11px] font-mono font-semibold ${up ? "text-emerald-600" : flat ? "text-muted-foreground" : "text-red-500"}`}>
      {up ? "↑" : flat ? "→" : "↓"}{Math.abs(pct)}%{prefix ? ` ${prefix}` : ""}
    </span>
  );
}

function PctBadge({ pct, lyPct }: { pct: number; lyPct: number }) {
  const color = pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
  return (
    <div>
      <span className={`text-xs font-mono font-bold ${color}`}>{pct}%</span>
      <span className="text-[10px] text-muted-foreground ml-1">vs {lyPct}% LY</span>
    </div>
  );
}

type CampaignOpsProps = {
  initialCampaign?: string | null;
};

function CampaignOps({ initialCampaign = null }: CampaignOpsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedCampaign = searchParams.get("campaign") ?? initialCampaign;
  const activeCampaign = resolveStaffCampaignTab(requestedCampaign);
  const [regionFilter, setRegionFilter] = useState("all");
  const [coachFilter, setCoachFilter]   = useState("all");
  const [showRiskTooltip, setShowRiskTooltip] = useState(false);
  const campaignShellHrefs: Record<string, string | undefined> = { "Rush Month": "/campaigns/rush-month", "SLT Promotion": "/campaigns/slt-promotion", "Moving Mountains": "/campaigns/moving-mountains", "Leadership Transition": "/campaigns/leadership-transition", "Chapter Organization and Planning": "/campaigns/planning-goal-setting" };
  const campaignLaneLinks: Record<string, { href: string; label: string } | undefined> = { "Rush Month": { href: "/rush-month/events", label: "Open event loop" }, "Chapter Events": { href: "/staff?view=events", label: "Open event operations" }, "Social Media": { href: "/staff?view=proof_ugc", label: "Open proof / UGC lane" } };

  const CAMPAIGNS = [
    "Rush Month",
    "SLT Promotion",
    "Moving Mountains",
    "Chapter Events",
    "Leadership Transition",
    "Chapter Organization and Planning",
    "Social Media",
  ];

  const REGIONS = ["New England", "Mid Atlantic", "South", "Midwest", "West", "Puerto Rico", "UK", "Canada", "International"];

  // For Rush Month show all; others filter by campaign match
  // Social Media and Chapter Events show all chapters; others filter by campaign
  const campaignChapters = (activeCampaign === "Rush Month" || activeCampaign === "Social Media" || activeCampaign === "Chapter Events")
    ? CHAPTERS
    : CHAPTERS.filter(c => c.campaign === activeCampaign);

  // A chapter is at risk if: no events in last month OR attendance < 10
  const atRiskChapters = campaignChapters.filter(
    c => c.eventsThisMonth === 0 || c.attendance < 10
  );

  const coaches = ["all", ...Array.from(new Set(campaignChapters.map(c => c.coach))).sort()];

  const filtered = campaignChapters.filter(c => {
    if (regionFilter !== "all" && c.medlifeRegion !== regionFilter) return false;
    if (coachFilter  !== "all" && c.coach         !== coachFilter)  return false;
    return true;
  });

  const ACTION_SUGGESTIONS = [
    { icon:"📅", text:"Schedule a tabling or info event within the next 7 days" },
    { icon:"📱", text:"Contact chapter leaders directly via WhatsApp or email" },
    { icon:"✅", text:"Review the chapter's event planning checklist in myMEDLIFE" },
    { icon:"📞", text:"Book a 15-min coach check-in call to unblock the chapter" },
    { icon:"🌟", text:"Share a best-practice post from a high-performing chapter" },
    { icon:"🔍", text:"Check if an SOP step is blocking event creation or approval" },
  ];

  // Why a chapter is at risk
  const riskReason = (c: Chapter) => {
    const reasons: string[] = [];
    if (c.eventsThisMonth === 0) reasons.push("no events this month");
    if (c.attendance < 10)       reasons.push(`low attendance (${c.attendance})`);
    return reasons.join(" · ");
  };

  const handleCampaignChange = (campaign: string) => {
    setRegionFilter("all");
    setCoachFilter("all");
    router.replace(
      buildStaffCampaignHref(campaign, pathname, searchParams.toString()),
      { scroll: false },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Campaign Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CAMPAIGNS.map(c => (
          <button key={c} onClick={() => handleCampaignChange(c)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeCampaign === c
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* At-Risk Alert Bar with hover tooltip */}
      {atRiskChapters.length > 0 ? (
        <div className="relative"
          onMouseEnter={() => setShowRiskTooltip(true)}
          onMouseLeave={() => setShowRiskTooltip(false)}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-default select-none">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-amber-800">
                {atRiskChapters.length} chapter{atRiskChapters.length !== 1 ? "s" : ""} at risk
              </span>
              <span className="text-xs text-amber-600 ml-2">
                — no events in the last month or attendance below 10
              </span>
              <div className="text-xs text-amber-600 mt-0.5 truncate">
                {atRiskChapters.slice(0, 4).map(c => c.name).join(", ")}
                {atRiskChapters.length > 4 ? ` +${atRiskChapters.length - 4} more` : ""}
              </div>
            </div>
            <span className="text-[10px] text-amber-500 font-medium flex-shrink-0 flex items-center gap-1">
              <Info className="w-3 h-3" /> Hover for suggestions
            </span>
          </div>

          {/* Hover tooltip — action suggestions */}
          {showRiskTooltip && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-border rounded-xl shadow-xl p-4"
              onMouseEnter={() => setShowRiskTooltip(true)}
              onMouseLeave={() => setShowRiskTooltip(false)}>
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Suggested Actions for At-Risk Chapters
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {ACTION_SUGGESTIONS.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="text-sm flex-shrink-0">{s.icon}</span>
                    <span className="text-xs text-foreground leading-snug">{s.text}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  At-risk chapters in {activeCampaign}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {atRiskChapters.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground truncate block">{c.name}</span>
                        <span className="text-[10px] text-amber-600">{riskReason(c)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">All chapters on track</span>
          <span className="text-xs text-emerald-600 ml-1">— every chapter has events this month and attendance ≥ 10</span>
        </div>
      )}

      {/* Table with column filters */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="text-sm font-semibold text-foreground">
            {activeCampaign}
            <span className="text-muted-foreground font-normal ml-2 text-xs">{filtered.length} chapters</span>
          </div>
          {activeCampaign !== "Social Media" && (
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                  className="bg-muted/60 text-xs px-3 py-1.5 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground">
                  <option value="all">All Regions</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}
                  className="bg-muted/60 text-xs px-3 py-1.5 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground">
                  <option value="all">All Coaches</option>
                  {coaches.filter(o => o !== "all").map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-b border-border bg-slate-50/60 flex flex-wrap items-center gap-2">
          {campaignShellHrefs[activeCampaign] ? <a href={campaignShellHrefs[activeCampaign]} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-primary/40 hover:text-primary transition-colors">Open campaign shell <ArrowRight className="w-3 h-3" /></a> : <button disabled title="No deeper campaign shell is source-backed for this staff tab yet" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-400 cursor-not-allowed">Shell pending</button>}
          {campaignLaneLinks[activeCampaign] ? <a href={campaignLaneLinks[activeCampaign]?.href} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-semibold text-cyan-700 hover:border-cyan-300 transition-colors">{campaignLaneLinks[activeCampaign]?.label} <ArrowRight className="w-3 h-3" /></a> : null}
          <button disabled title="Campaign template save, launch, closeout, lead persistence, proof completion, points awards, and provider sync remain blocked in this preview" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 cursor-not-allowed">Launch blocked</button>
          <span className="text-[11px] text-slate-500">Route-backed review stays visible here, but writes, syncs, and rollout proof remain preview-only.</span>
        </div>

        {/* ── Rush Month table ───────────────────────────────────────────── */}
        {activeCampaign === "Rush Month" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Chapter","Coach","Region","Members TY","Members LY","Mbr YoY","Events TY","Events LY","Event YoY","% Mbrs Active","Status"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ch => {
                  const h = CHAPTER_HISTORY[ch.id];
                  const isAtRisk = ch.eventsThisMonth === 0 || ch.attendance < 10;
                  const mbrPct = Math.round(ch.activeMembers / Math.max(ch.leads, 1) * 100);
                  const lyMbrPct = Math.round(h.rush.lyMembers / Math.max(h.rush.lyMembers + 5, 1) * 100);
                  return (
                    <tr key={ch.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isAtRisk ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-2.5"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.country}</div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.coach.split(" ")[0]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.medlifeRegion}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.activeMembers}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.rush.lyMembers}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={ch.activeMembers} ly={h.rush.lyMembers} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.eventsThisYear}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.rush.lyEvents}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={ch.eventsThisYear} ly={h.rush.lyEvents} /></td>
                      <td className="px-3 py-2.5"><PctBadge pct={mbrPct} lyPct={lyMbrPct} /></td>
                      <td className="px-3 py-2.5">
                        {isAtRisk
                          ? <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">At Risk</span>
                          : <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">On Track</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SLT Promotion table ────────────────────────────────────────── */}
        {activeCampaign === "SLT Promotion" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Chapter","Coach","Region","Members TY","Members LY","Mbr YoY","SLT Students TY","SLT Students LY","SLT YoY","% on SLT (TY vs LY)","Status"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ch => {
                  const h = CHAPTER_HISTORY[ch.id];
                  const tySLT = Math.round(ch.activeMembers * 0.16);
                  const tyPct = Math.round(tySLT / Math.max(ch.activeMembers, 1) * 100);
                  const lyPct = Math.round(h.slt.lySLT / Math.max(h.slt.lyMembers, 1) * 100);
                  const isAtRisk = ch.eventsThisMonth === 0 || ch.attendance < 10;
                  return (
                    <tr key={ch.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isAtRisk ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-2.5"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.country}</div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.coach.split(" ")[0]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.medlifeRegion}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.activeMembers}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.slt.lyMembers}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={ch.activeMembers} ly={h.slt.lyMembers} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{tySLT}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.slt.lySLT}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={tySLT} ly={h.slt.lySLT} /></td>
                      <td className="px-3 py-2.5"><PctBadge pct={tyPct} lyPct={lyPct} /></td>
                      <td className="px-3 py-2.5">
                        {isAtRisk
                          ? <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">At Risk</span>
                          : <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">On Track</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Moving Mountains table ─────────────────────────────────────── */}
        {activeCampaign === "Moving Mountains" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Chapter","Coach","Region","Members TY","Members LY","MM Participants TY","MM Participants LY","Part. YoY","% Participating (TY vs LY)","Fundraised TY","Fundraised LY","Fundraising YoY","Status"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ch => {
                  const h = CHAPTER_HISTORY[ch.id];
                  const tyPart = Math.round(ch.activeMembers * 0.63);
                  const tyPct  = Math.round(tyPart / Math.max(ch.activeMembers, 1) * 100);
                  const lyPct  = Math.round(h.mm.lyParticipants / Math.max(h.mm.lyMembers, 1) * 100);
                  const tyFund = h.mm.lyFundraised + Math.round(h.mm.lyFundraised * 0.12);
                  const isAtRisk = ch.eventsThisMonth === 0 || ch.attendance < 10;
                  return (
                    <tr key={ch.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isAtRisk ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-2.5"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.country}</div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.coach.split(" ")[0]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.medlifeRegion}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.activeMembers}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.mm.lyMembers}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{tyPart}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.mm.lyParticipants}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={tyPart} ly={h.mm.lyParticipants} /></td>
                      <td className="px-3 py-2.5"><PctBadge pct={tyPct} lyPct={lyPct} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">${tyFund.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">${h.mm.lyFundraised.toLocaleString()}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={tyFund} ly={h.mm.lyFundraised} /></td>
                      <td className="px-3 py-2.5">
                        {isAtRisk
                          ? <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">At Risk</span>
                          : <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">On Track</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Chapter Events table ───────────────────────────────────────── */}
        {activeCampaign === "Chapter Events" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Chapter","Coach","Region","This Month Events","Same Month LY","Month YoY","Events This Year","Events LY (Annual)","Annual YoY","Status"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ch => {
                  const h = CHAPTER_HISTORY[ch.id];
                  const isAtRisk = ch.eventsThisMonth === 0 || ch.attendance < 10;
                  return (
                    <tr key={ch.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isAtRisk ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-2.5"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.country}</div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.coach.split(" ")[0]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.medlifeRegion}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.eventsThisMonth}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.events.lyMonthEvents}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={ch.eventsThisMonth} ly={h.events.lyMonthEvents} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{ch.eventsThisYear}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{h.events.lyAnnualEvents}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={ch.eventsThisYear} ly={h.events.lyAnnualEvents} /></td>
                      <td className="px-3 py-2.5">
                        {isAtRisk
                          ? <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">At Risk</span>
                          : <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">On Track</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Leadership Transition / Org & Planning — simple table ─────── */}
        {(activeCampaign === "Leadership Transition" || activeCampaign === "Chapter Organization and Planning") && (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Chapter","Coach","Region","Members","Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => {
                const isAtRisk = ch.eventsThisMonth === 0 || ch.attendance < 10;
                return (
                  <tr key={ch.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${isAtRisk ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.school}</div></td>
                    <td className="px-4 py-3 text-muted-foreground">{ch.coach}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ch.medlifeRegion}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">{ch.activeMembers}</td>
                    <td className="px-4 py-3">
                      {isAtRisk
                        ? <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">At Risk</span>
                        : <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">On Track</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── Social Media table ────────────────────────────────────────── */}
        {activeCampaign === "Social Media" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Chapter","Coach","Region","Instagram TY","Instagram LY","IG YoY","Facebook TY","Facebook LY","FB YoY","TikTok TY","TikTok LY","TikTok YoY","Total Followers","Total YoY"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHAPTERS.map(ch => {
                  const s = CHAPTER_HISTORY[ch.id].social;
                  const tyTotal = s.ig + s.fb + s.tiktok;
                  const lyTotal = s.igLY + s.fbLY + s.tiktokLY;
                  return (
                    <tr key={ch.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5"><div className="font-semibold text-foreground">{ch.name}</div><div className="text-[10px] text-muted-foreground">{ch.country}</div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.coach.split(" ")[0]}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{ch.medlifeRegion}</td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{color:"#E1306C"}}>{s.ig.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.igLY.toLocaleString()}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={s.ig} ly={s.igLY} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{color:"#1877F2"}}>{s.fb.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.fbLY.toLocaleString()}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={s.fb} ly={s.fbLY} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{s.tiktok.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.tiktokLY.toLocaleString()}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={s.tiktok} ly={s.tiktokLY} /></td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{tyTotal.toLocaleString()}</td>
                      <td className="px-3 py-2.5"><YoYBadge ty={tyTotal} ly={lyTotal} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  SCREEN 4 – PROOF / UGC REVIEW QUEUE                       */
/* ─────────────────────────────────────────────────────────── */

// ── Platform config ────────────────────────────────────────────
const PLATFORM_CONFIG: Record<Platform, { label: string; bg: string; text: string; dot: string }> = {
  linkedin:  { label:"LinkedIn",  bg:"#0A66C2", text:"#fff", dot:"bg-[#0A66C2]" },
  instagram: { label:"Instagram", bg:"#E1306C", text:"#fff", dot:"bg-[#E1306C]" },
  facebook:  { label:"Facebook",  bg:"#1877F2", text:"#fff", dot:"bg-[#1877F2]" },
  loom:      { label:"Loom",      bg:"#625DF5", text:"#fff", dot:"bg-[#625DF5]" },
  youtube:   { label:"YouTube",   bg:"#FF0000", text:"#fff", dot:"bg-[#FF0000]" },
  tiktok:    { label:"TikTok",    bg:"#010101", text:"#fff", dot:"bg-[#010101]" },
  upload:    { label:"Uploaded",  bg:"#64748B", text:"#fff", dot:"bg-slate-500" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const p = PLATFORM_CONFIG[platform];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {p.label}
    </span>
  );
}

type ProofQueueStatusFilter = "all" | "pending" | "approved" | "rejected";

function ProofUGCQueue({
  initialStatusFilter = "all",
  initialPlatformFilter = "all",
  initialSelectedCardId = null,
  initialRouteSearch = "",
}: {
  initialStatusFilter?: ProofQueueStatusFilter;
  initialPlatformFilter?: Platform | "all";
  initialSelectedCardId?: string | null;
  initialRouteSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [linkInput, setLinkInput] = useState("");
  const currentSearch = searchParams.toString() || initialRouteSearch;
  const statusFilter = resolveProofQueueStatusFilter(searchParams.get("proofStatus"), initialStatusFilter);
  const platformFilter = resolveProofQueuePlatformFilter(searchParams.get("proofPlatform"), initialPlatformFilter);
  const selectedCardId = searchParams.get("ugcCard") ?? initialSelectedCardId;
  const selectedCard = selectedCardId
    ? UGC_CARDS.find((card) => card.id === selectedCardId) ?? null
    : null;
  const approvedCount = UGC_CARDS.filter(
    (c) => c.visibility === "chapter" || c.visibility === "selected",
  ).length;

  const filtered = UGC_CARDS.filter((c) => {
    return matchesProofQueueFilters(c, statusFilter, platformFilter);
  });

  const pendingCount = UGC_CARDS.filter(c => c.visibility === "pending").length;
  const genericProofQueueHref = buildStaffProofHref(pathname, currentSearch);
  const genericProofAdminHref = buildStaffAdminProofHref(pathname, currentSearch);
  const handleFilterChange = (
    nextStatusFilter: ProofQueueStatusFilter,
    nextPlatformFilter: Platform | "all",
  ) => {
    const params = new URLSearchParams(currentSearch);

    if (nextStatusFilter === "all") {
      params.delete("proofStatus");
    } else {
      params.set("proofStatus", nextStatusFilter);
    }

    if (nextPlatformFilter === "all") {
      params.delete("proofPlatform");
    } else {
      params.set("proofPlatform", nextPlatformFilter);
    }

    if (selectedCard && !matchesProofQueueFilters(selectedCard, nextStatusFilter, nextPlatformFilter)) {
      params.delete("ugcCard");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex gap-5 items-start">
      {/* Left: queue */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Proof / UGC review stays visible, but moderation writes stay blocked
              </div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Use this queue to review TEST story context, consent posture, share targets, and the next Admin audit handoff before any publishing, note save, provider ingest, or moderation write is approved.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
                Read-only preview
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                Blocked moderation writes
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                Source-backed Admin handoff
              </span>
            </div>
          </div>
        </div>

        {/* Link paste bar */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Submit a story link</span>
            <span className="text-xs text-muted-foreground">— paste from LinkedIn, Instagram, Facebook, Loom, YouTube, TikTok</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://www.instagram.com/p/…  or  https://loom.com/share/…"
                className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 pr-28"
              />
              {/* Platform quick-detect chips */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {(["linkedin","instagram","loom","facebook","youtube"] as Platform[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setLinkInput(`https://${PLATFORM_CONFIG[p].label.toLowerCase()}.com/`)}
                    className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[8px] font-black hover:scale-110 transition-transform"
                    style={{ backgroundColor: PLATFORM_CONFIG[p].bg }}
                    title={PLATFORM_CONFIG[p].label}
                  >
                    {PLATFORM_CONFIG[p].label[0]}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled
              title="Story link ingestion is blocked until proof-review writes are approved"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 bg-primary text-white opacity-50 cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              Submit blocked
            </button>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Link submission stays visible for review, but provider fetch and queue writes are blocked in this preview.
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
            {([
              { key:"all", label:`All (${UGC_CARDS.length})` },
              { key:"pending", label:`Pending (${pendingCount})` },
              { key:"approved", label:`Approved (${approvedCount})` },
              { key:"rejected", label:`Rejected (${UGC_CARDS.filter((c) => c.visibility === "rejected").length})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key, platformFilter)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${statusFilter === key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => handleFilterChange(statusFilter, e.target.value as Platform | "all")}
              className="bg-white border border-border text-xs px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground"
            >
              <option value="all">All Platforms</option>
              {(Object.keys(PLATFORM_CONFIG) as Platform[]).map(p => (
                <option key={p} value={p}>{PLATFORM_CONFIG[p].label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} stories</span>
        </div>

        {/* Story cards grid */}
        <div className={`grid gap-4 ${selectedCard ? "grid-cols-2" : "grid-cols-3"}`}>
          {filtered.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            const plat = card.platform ? PLATFORM_CONFIG[card.platform] : null;
            return (
              <div
                key={card.id}
                onClick={() =>
                  router.replace(
                    buildStaffProofHref(pathname, currentSearch, isSelected ? null : card.id),
                    { scroll: false },
                  )
                }
                className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md group ${
                  isSelected ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:border-slate-300"
                } ${card.visibility === "rejected" ? "opacity-60" : ""}`}
              >
                {/* Preview image */}
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <img
                    src={card.previewImage}
                    alt={card.linkTitle ?? card.assignment}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Platform badge — top left */}
                  {plat && (
                    <div className="absolute top-2 left-2">
                      <PlatformBadge platform={card.platform!} />
                    </div>
                  )}

                  {/* Quality score — top right */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                      card.qualityScore >= 85 ? "bg-emerald-500 text-white" :
                      card.qualityScore >= 65 ? "bg-amber-400 text-white" : "bg-red-500 text-white"
                    }`}>
                      Q{card.qualityScore}
                    </span>
                  </div>

                  {/* Duration pill — bottom right */}
                  {card.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-white" />{card.duration}
                    </span>
                  )}

                  {/* Domain — bottom left */}
                  {card.linkDomain && (
                    <span className="absolute bottom-2 left-2 text-white/80 text-[10px] font-mono">
                      {card.linkDomain}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3">
                  {/* Title */}
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-1.5">
                    {card.linkTitle ?? card.assignment}
                  </p>

                  {/* Caption */}
                  {card.caption && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">
                      {card.caption}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-foreground truncate">{card.chapter}</div>
                      <div className="text-[10px] text-muted-foreground">{card.student} · {card.submitted}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ConsentTag status={card.consent} />
                    </div>
                  </div>

                  {/* Engagement + status row */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-semibold ${
                      card.engagementPotential === "high" ? "text-emerald-600" :
                      card.engagementPotential === "medium" ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {card.engagementPotential === "high" ? "↑ High" : card.engagementPotential === "medium" ? "→ Medium" : "↓ Low"} potential
                    </span>
                    {card.views !== undefined && card.views > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" />{card.views}
                        <Heart className="w-2.5 h-2.5 ml-1" />{card.likes}
                      </span>
                    )}
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      card.visibility === "pending" ? "bg-amber-100 text-amber-700" :
                      card.visibility === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {card.visibility === "pending" ? "Pending" : card.visibility === "rejected" ? "Rejected" : "Approved"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Review panel */}
      <div className="w-72 flex-shrink-0 sticky top-4 flex flex-col gap-3">
        {selectedCard ? (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Preview mini */}
            <div className="relative aspect-video overflow-hidden bg-slate-100">
              <img src={selectedCard.previewImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {selectedCard.platform && (
                <div className="absolute top-2 left-2"><PlatformBadge platform={selectedCard.platform} /></div>
              )}
              {selectedCard.url && (
                <button
                  disabled
                  title="External source links are blocked in this preview"
                  className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 opacity-70 cursor-not-allowed"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Open link
                </button>
              )}
            </div>

            <div className="px-4 py-3 border-b border-border">
              <div className="text-xs font-bold text-foreground leading-snug">{selectedCard.linkTitle ?? selectedCard.assignment}</div>
              <div className="mt-0.5 text-[10px]"><span className="min-w-0 truncate text-muted-foreground">{selectedCard.chapter} · {selectedCard.student}</span></div>
              <div className="mt-1 text-[10px] leading-relaxed text-sky-700">Embedded Admin review keeps DS directory, audit logs, and blocked controls in the same command-center walkthrough.</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={buildStaffAdminProofHref(
                    pathname,
                    currentSearch,
                    selectedCard.id,
                    selectedCard.chapter,
                  )}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-100"
                >
                  <Shield className="w-3 h-3" /> Open Admin preview
                </a>
                <a
                  href={buildStaffProofHref(pathname, currentSearch, selectedCard.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-3 h-3" /> Return to Proof / UGC
                </a>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                  Read-only preview
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  No moderation save
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                  DS Admin audit handoff
                </span>
              </div>

              {/* Consent */}
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Consent & Visibility</div>
                <ConsentTag status={selectedCard.consent} />
                <div className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  {selectedCard.consent === "public" ? "May be used publicly and across all chapters." :
                   selectedCard.consent === "chapter-only" ? "Restricted to this chapter only — do not share wider." :
                   selectedCard.consent === "multi-chapter" ? "Can be shared with selected chapters." :
                   selectedCard.consent === "pending" ? "⚠ Awaiting student consent. Do not share yet." :
                   "🚫 No consent obtained. Cannot be shared."}
                </div>
              </div>

              {/* Approve for */}
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Share to Feed</div>
                <div className="space-y-1.5">
                  {[
                    { label:"This chapter only", i:0 },
                    { label:"Selected chapters", i:1 },
                    { label:"All chapters", i:2 },
                    { label:"Global / Public", i:3 },
                  ].map(({ label, i }) => (
                    <button
                      key={label}
                      disabled
                      title="Proof sharing is blocked until feed publishing approval is complete"
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium border border-border disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-3 h-3 text-primary flex-shrink-0" /> {label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-amber-700 mt-2 leading-relaxed">
                  Share targets stay visible for moderation review. Next step: finish consent and coach context here, then open Admin preview for embedded DS audit readback and blocked-control posture before any publishing request.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-1.5">
                <button disabled title="Best-practice publishing is blocked until feed approval is complete" className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Mark as Best Practice
                </button>
                <div className="flex gap-1.5">
                  <button disabled title="Change requests are blocked until proof-review writes are approved" className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                    Request Changes
                  </button>
                  <button disabled title="Reject decisions are blocked until proof-review writes are approved" className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>

              {/* Coach note */}
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Coach Note</div>
                <textarea
                  readOnly
                  title="Caption and coach-note drafting stays local-only in this preview"
                  value="Caption and coach-note drafting stays local-only in this preview. No moderation note save runs from this panel."
                  className="w-full bg-muted/50 rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none border border-border"
                  rows={3}
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-amber-700">
                  Context drafting stays visible for review, but no coach note, moderation note, or caption save runs from this queue until Admin review approves the next step in the same command-center flow. Return to Proof / UGC after Admin readback to continue the same review loop in the staff shell.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">Select a story to review</div>
            <div className="text-xs text-muted-foreground leading-relaxed">Click any card to review consent and blocked actions, or open the Admin preview for DS audit readback without leaving the Staff Command Center.</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <a
                href={genericProofAdminHref}
                className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-100"
              >
                <Shield className="w-3 h-3" /> Open Admin preview
              </a>
              <a
                href={genericProofQueueHref}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="w-3 h-3" /> Return to Proof / UGC
              </a>
            </div>
          </div>
        )}

        {/* Queue stats */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Queue Summary</div>
          <div className="space-y-2">
            {[
              { label:"Pending review", value: UGC_CARDS.filter(c=>c.visibility==="pending").length, color:"text-amber-600" },
              { label:"Approved", value: UGC_CARDS.filter(c=>c.visibility!=="pending"&&c.visibility!=="rejected").length, color:"text-emerald-600" },
              { label:"Rejected", value: UGC_CARDS.filter(c=>c.visibility==="rejected").length, color:"text-red-500" },
              { label:"Consent pending", value: UGC_CARDS.filter(c=>c.consent==="pending").length, color:"text-amber-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Next review step</div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Review consent and blocked actions here, then open the Admin preview for DS audit readback before any publishing or coach-note approval request.
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Return to Proof / UGC after the Admin readback to continue the same Command Center review loop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────── */
/*  SCREEN 8 – BEST PRACTICES LIBRARY                          */
/* ─────────────────────────────────────────────────────────── */

function BestPracticesLibrary() {
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const BP_REGIONS = ["New England", "Mid Atlantic", "South", "Midwest", "West", "Puerto Rico", "UK", "Canada", "International"];
  const campaigns  = ["all", ...Array.from(new Set(BEST_PRACTICES.map((b) => b.campaign)))];

  const filtered = BEST_PRACTICES.filter((bp) => {
    if (campaignFilter !== "all" && bp.campaign !== campaignFilter) return false;
    // Best practices use country field; map to region bucket loosely for demo
    if (regionFilter !== "all") {
      const regionMap: Record<string, string> = { USA:"West", Canada:"Canada", Mexico:"International", Peru:"International", Brazil:"International" };
      const bpRegion = regionMap[bp.country] ?? "International";
      if (bpRegion !== regionFilter) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-3 flex items-center gap-3">
        {[
          { label:"Campaign", value: campaignFilter, set: setCampaignFilter, opts: campaigns },
        ].map(({ label, value, set, opts }) => (
          <div key={label} className="relative">
            <select value={value} onChange={(e) => set(e.target.value)} className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground">
              <option value="all">All Campaigns</option>
              {opts.filter(o => o !== "all").map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        ))}
        <div className="relative">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-muted/60 text-sm px-3 py-2 rounded-lg pr-7 appearance-none cursor-pointer focus:outline-none font-medium text-foreground">
            <option value="all">All Regions</option>
            {BP_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="ml-auto">
          <span className="text-sm text-muted-foreground">{filtered.length} best practices</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((bp) => (
          <div key={bp.id} className="bg-white rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">{bp.type}</span>
                </div>
                <h3 className="font-bold text-foreground leading-tight">{bp.title}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {bp.chapter} · {bp.country} · {bp.campaign}
                </div>
              </div>
              <div className="flex-shrink-0 ml-3 text-right">
                <div className="text-xs text-muted-foreground">Eng. Score</div>
                <div className="text-2xl font-mono font-bold text-primary">{bp.engagementScore}</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it worked</div>
                <div className="text-xs text-foreground leading-relaxed">{bp.why}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">KPI Result</div>
                <div className="text-xs font-bold text-emerald-800">{bp.kpiResult}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recommended for</div>
                <div className="flex flex-wrap gap-1">
                  {bp.recommended.map((ch) => (
                    <span key={ch} className="bg-secondary text-primary px-2 py-0.5 rounded text-[10px] font-medium">{ch}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button disabled title="Feed sharing is blocked until external publishing approval is complete" className="flex-1 py-1.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1">
                <Send className="w-3 h-3" /> Share to Feed
              </button>
              <button disabled title="Coach emails are blocked until external-send approval is complete" className="flex-1 py-1.5 bg-muted text-foreground rounded text-xs font-semibold hover:bg-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" /> Send to Coaches
              </button>
              <button disabled title="Bookmarking best practices is blocked in this preview" className="py-1.5 px-2 bg-muted text-foreground rounded text-xs font-semibold hover:bg-muted/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                <Bookmark className="w-3 h-3" />
              </button>
            </div>
            <div className="px-4 pb-4 -mt-1">
              <p className="text-[10px] leading-relaxed text-amber-700">
                Best-practice sharing stays visible for review, but feed publishing,
                coach outreach, and bookmarking remain blocked in this preview.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  SCREEN 9 – ADMIN SYSTEM HEALTH                            */
/* ─────────────────────────────────────────────────────────── */

function AdminHealth() {
  const integrations: { name: string; status: "live" | "mock" | "error" | "degraded"; lastSync: string; note?: string }[] = [
    { name:"HubSpot CRM", status:"mock", lastSync:"off", note:"Writes disabled for this run" },
    { name:"Luma Events", status:"mock", lastSync:"staging readback only", note:"No live Luma writes from this shell" },
    { name:"Data Hub / Warehouse", status:"mock", lastSync:"off", note:"Exports disabled" },
    { name:"Power BI Reports", status:"mock", lastSync:"off", note:"Reporting connector disabled" },
    { name:"n8n Automation", status:"mock", lastSync:"off", note:"Workflow execution disabled" },
    { name:"AI Summary Engine", status:"mock", lastSync:"n/a", note:"Using mock data in staging" },
  ];

  const outbox = [
    { id:1, event:"contact.created", source:"myMEDLIFE", dest:"HubSpot", status:"blocked", retries:0, error:"External write disabled", created:"Jun 17 14:21", processed:"—" },
    { id:2, event:"rsvp.confirmed", source:"Luma", dest:"myMEDLIFE", status:"blocked", retries:0, error:"Read/import approval required", created:"Jun 17 14:18", processed:"—" },
    { id:3, event:"evidence.approved", source:"myMEDLIFE", dest:"Data Hub", status:"blocked", retries:0, error:"Warehouse export disabled", created:"Jun 17 13:44", processed:"—" },
    { id:4, event:"hubspot.task.created", source:"n8n", dest:"HubSpot", status:"blocked", retries:0, error:"n8n execution disabled", created:"Jun 17 13:30", processed:"—" },
    { id:5, event:"member.joined", source:"myMEDLIFE", dest:"HubSpot", status:"blocked", retries:0, error:"CRM write disabled", created:"Jun 17 12:55", processed:"—" },
    { id:6, event:"ai.summary.drafted", source:"AI Engine", dest:"myMEDLIFE", status:"blocked", retries:0, error:"AI actions disabled", created:"Jun 17 12:00", processed:"—" },
    { id:7, event:"chapter.data.sync", source:"n8n", dest:"Power BI", status:"blocked", retries:0, error:"Reporting export disabled", created:"Jun 17 10:00", processed:"—" },
  ];

  const auditLog = [
    { actor:"TEST.maria.santos@medlife.org", action:"Approved evidence", object:"TEST PUCP Lima — Tabling Video", ts:"Jun 17 14:30", role:"Coach", chapter:"TEST PUCP Lima" },
    { actor:"TEST.james.okafor@medlife.org", action:"Set decision: Intervene", object:"TEST Yale University", ts:"Jun 17 13:55", role:"Coach", chapter:"TEST Yale University" },
    { actor:"TEST.admin@medlife.org", action:"Queued post for review", object:"TEST Stanford QR Best Practice", ts:"Jun 17 13:20", role:"Admin", chapter:"TEST Global" },
    { actor:"TEST.aisha.kamara@medlife.org", action:"Wrote coach note", object:"TEST McGill University", ts:"Jun 17 12:44", role:"Coach", chapter:"TEST McGill University" },
    { actor:"system@n8n", action:"Blocked automation execution", object:"TEST Rush Month — follow-up sequence", ts:"Jun 17 12:00", role:"System", chapter:"TEST All" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Integration Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Integration Status</span>
          </div>
          <div className="px-4 py-2">
            {integrations.map((i) => (
              <div key={i.name}>
                <IntegrationStatus name={i.name} status={i.status} lastSync={i.lastSync} />
                {i.note && <div className="text-[10px] text-amber-600 pb-2 -mt-1">{i.note}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Automation Outbox</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">{outbox.filter(o=>o.status==="failed").length} failed</span>
              <button disabled title="Outbox retries are blocked until automation approval is complete" className="flex items-center gap-1 text-xs font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="w-3 h-3" /> Retry blocked</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Event","Source","Destination","Status","Retries","Error","Created","Processed"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outbox.map((row) => (
                  <tr key={row.id} className={`border-b border-border last:border-0 ${row.status === "failed" ? "bg-red-50/30" : ""}`}>
                    <td className="px-3 py-2 font-mono text-foreground font-medium">{row.event}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.source}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.dest}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.status === "success" ? "bg-emerald-100 text-emerald-700" : row.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-center">{row.retries}</td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px] max-w-32 truncate">{row.error}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{row.created}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{row.processed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Audit Log</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {["Actor","Role","Action","Object","Chapter","Timestamp"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLog.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-3 py-2.5 font-mono text-foreground text-[11px]">{row.actor}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${row.role === "Admin" ? "bg-violet-100 text-violet-700" : row.role === "System" ? "bg-gray-100 text-gray-600" : "bg-sky-100 text-sky-700"}`}>
                    {row.role}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-foreground">{row.action}</td>
                <td className="px-3 py-2.5 text-muted-foreground max-w-48 truncate">{row.object}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.chapter}</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">{row.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  ADMIN ROLE GATE                                             */
/* ─────────────────────────────────────────────────────────── */

type AdminRole = "ds-admin" | "super-admin";

function AdminRouteBlocked({
  onBack,
  backLabel,
  chapterContext,
  proofQueueContext,
}: {
  onBack: () => void;
  backLabel: string;
  chapterContext?: string | null;
  proofQueueContext?: string | null;
}) {
  const contextLabel = getStaffAdminContextLabel(backLabel, chapterContext, proofQueueContext);
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-1">Admin access blocked</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This Staff Command Center keeps the Admin handoff visible, but only{" "}
            <span className="text-sky-400 font-semibold">DS Admin</span> and{" "}
            <span className="text-sky-400 font-semibold">Super Admin</span> roles can open the
            admin preview route.
          </p>
        </div>

        <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-5 text-left">
          <p className="text-[11px] text-slate-600 font-mono uppercase tracking-wider mb-2">Current posture</p>
          <p className="text-[12px] text-slate-400 leading-relaxed">Admin controls stay route-backed and visible for review, but this actor cannot open the embedded admin preview from the staff workspace.</p>
          {contextLabel ? (
            <div className="mt-3 rounded-lg border border-sky-500/15 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-300">
              {contextLabel}
            </div>
          ) : null}
        </div>

        <button
          onClick={onBack}
          className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          {`Return to ${backLabel}`}
        </button>
      </div>
    </div>
  );
}

function AdminRoleGate({
  onGrant,
  onBack,
  backLabel,
  chapterContext,
  proofQueueContext,
}: {
  onGrant: (role: AdminRole) => void;
  onBack: () => void;
  backLabel: string;
  chapterContext?: string | null;
  proofQueueContext?: string | null;
}) {
  const [picked, setPicked] = useState<AdminRole>("ds-admin");
  const contextLabel = getStaffAdminContextLabel(backLabel, chapterContext, proofQueueContext);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Lock icon */}
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-400" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-1">Restricted Preview Access</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The Admin preview is restricted to <span className="text-sky-400 font-semibold">DS Admin</span> and{" "}
            <span className="text-sky-400 font-semibold">Super Admin</span> roles only.
            All deeper admin actions stay logged, audited, and blocked or read-only unless the shell explicitly says otherwise.
          </p>
          {contextLabel ? (
            <div className="mt-3 inline-flex max-w-full items-center rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-[10px] font-mono text-sky-300">
              {contextLabel}
            </div>
          ) : null}
        </div>

        {/* Role selector */}
        <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-5 text-left space-y-3">
          <p className="text-[11px] text-slate-600 font-mono uppercase tracking-wider mb-1">Preview as</p>
          {([
            { value: "ds-admin" as AdminRole, label: "DS Admin", desc: "Data Systems Administrator — full read access, no key rotation" },
            { value: "super-admin" as AdminRole, label: "Super Admin", desc: "Full access including API key rotation, write toggles, and role changes" },
          ]).map(({ value, label, desc }) => (
            <label
              key={value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                picked === value ? "border-sky-500/40 bg-sky-500/8" : "border-white/[0.05] hover:border-white/[0.1]"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={picked === value}
                onChange={() => setPicked(value)}
                className="mt-0.5 accent-sky-500 flex-shrink-0"
              />
              <div>
                <div className={`text-sm font-semibold ${picked === value ? "text-sky-300" : "text-slate-300"}`}>{label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => onGrant(picked)}
          className="w-full py-2.5 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-400 transition-colors"
        >
          Open Admin preview
        </button>

        <p className="text-[11px] text-slate-700">
          Not DS Admin or Super Admin?{" "}
          <button onClick={onBack} className="text-slate-500 underline underline-offset-2">{`Return to ${backLabel}`}</button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  TOP NAV                                                     */
/* ─────────────────────────────────────────────────────────── */

const NAV_ITEMS: { key: Screen; label: string; icon: ReactNode }[] = [
  { key:"chapters", label:"Chapters", icon:<LayoutDashboard className="w-3.5 h-3.5" /> },
  { key:"campaigns", label:"Campaigns", icon:<Megaphone className="w-3.5 h-3.5" /> },
  { key:"ugc", label:"Proof / UGC", icon:<Film className="w-3.5 h-3.5" /> },
  { key:"best-practices", label:"Best Practices", icon:<BookOpen className="w-3.5 h-3.5" /> },
  { key:"sops", label:"Campaign SOPs", icon:<GitBranch className="w-3.5 h-3.5" /> },
  { key:"admin", label:"Admin", icon:<Settings className="w-3.5 h-3.5" /> },
];

const SCREEN_TITLES: Record<Screen, string> = {
  chapters: "Portfolio Overview",
  campaigns: "Campaign Operations",
  events: "Events",
  ugc: "Proof / UGC Review Queue",
  reports: "Organization Leaderboard",
  admin: "System Health",
  "best-practices": "Best Practices Library",
  sops: "Campaign SOP Builder",
};

/* ─────────────────────────────────────────────────────────── */
/*  APP ROOT                                                    */
/* ─────────────────────────────────────────────────────────── */

type FigmaStaffCommandCenterProps = {
  canAccessAdminPanel?: boolean;
  initialView?: string;
  initialCampaign?: string | null;
  initialRouteParams?: Partial<
    Record<
      "view" | "campaign" | "chapter" | "ugcCard" | "returnView" | "chapterContext" | "proofStatus" | "proofPlatform" | "chapterSearch" | "chapterRegion" | "chapterCoach" | "chapterType" | "chapterSort",
      string | null | undefined
    >
  >;
};

export function FigmaStaffCommandCenter({
  canAccessAdminPanel = false,
  initialView,
  initialCampaign = null,
  initialRouteParams,
}: FigmaStaffCommandCenterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const getRouteParam = (
    key: "view" | "campaign" | "chapter" | "ugcCard" | "returnView" | "chapterContext" | "proofStatus" | "proofPlatform" | "chapterSearch" | "chapterRegion" | "chapterCoach" | "chapterType" | "chapterSort",
  ) =>
    searchParams.get(key) ?? initialRouteParams?.[key] ?? null;
  const activeScreen = resolveStaffShellScreen(getRouteParam("view") ?? initialView ?? null);
  const selectedChapterId = getRouteParam("chapter");
  const selectedChapter =
    activeScreen === "chapters" && selectedChapterId
      ? CHAPTERS.find((chapter) => chapter.id === selectedChapterId) ?? null
      : null;
  const adminReturnScreen =
    activeScreen === "admin" ? resolveStaffAdminReturnScreen(getRouteParam("returnView")) : "chapters";
  const adminReturnChapterId =
    activeScreen === "admin" && adminReturnScreen === "chapters" ? getRouteParam("chapter") : null;
  const adminChapterContext = activeScreen === "admin" ? getRouteParam("chapterContext") : null;
  const adminProofQueueContext =
    activeScreen === "admin"
      ? getEmbeddedProofQueueContext(getRouteParam("proofStatus"), getRouteParam("proofPlatform"))
      : null;
  const adminBackLabel = getStaffAdminReturnLabel(adminReturnScreen, adminReturnChapterId);
  const adminHeaderSubtitle =
    activeScreen === "admin"
      ? getStaffAdminHeaderSubtitle(adminBackLabel, adminChapterContext, adminProofQueueContext)
      : null;
  const initialProofStatusFilter = resolveProofQueueStatusFilter(getRouteParam("proofStatus"));
  const initialProofPlatformFilter = resolveProofQueuePlatformFilter(getRouteParam("proofPlatform"));
  const initialChapterSearch = getRouteParam("chapterSearch") ?? "";
  const initialChapterRegionFilter = getRouteParam("chapterRegion") ?? "all";
  const initialChapterCoachFilter = getRouteParam("chapterCoach") ?? "all";
  const initialChapterTypeFilter = resolveStaffChapterTypeFilter(getRouteParam("chapterType"));
  const initialChapterSort = resolveStaffChapterSort(getRouteParam("chapterSort"));
  const initialRouteSearch = buildStaffShellQueryFromInitialRouteParams(initialRouteParams);

  // SOP Builder sub-navigation
  const [sopView, setSopView] = useState<"library" | "builder">("library");
  const [sopCampaign, setSopCampaign] = useState<SOPCampaign | null>(null);

  // Admin panel — DS Admin / Super Admin gate
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);

  const handleSelectChapter = (ch: Chapter) => {
    router.replace(buildStaffChapterHref(ch.id, pathname, searchParams.toString()), { scroll: false });
  };

  const handleNavChange = (key: Screen) => {
    if (key !== "sops") { setSopView("library"); setSopCampaign(null); }
    if (key !== "admin") setAdminRole(null);
    router.replace(buildStaffShellHref(key, pathname, searchParams.toString()), { scroll: false });
  };

  const handleCloseChapterDrawer = () => {
    router.replace(buildStaffShellHref("chapters", pathname, searchParams.toString()), { scroll: false });
  };

  const handleAdminBack = () => {
    setAdminRole(null);
    if (adminReturnScreen === "chapters" && adminReturnChapterId) {
      router.replace(buildStaffChapterHref(adminReturnChapterId, pathname, searchParams.toString()), { scroll: false });
      return;
    }
    handleNavChange(adminReturnScreen);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top Bar */}
      <header className="bg-sidebar border-b border-sidebar-border flex-shrink-0 z-30 relative">
        <div className={`flex h-12 items-center gap-4 overflow-hidden px-5 sm:gap-6 ${STAFF_HEADER_ACCOUNT_CLEARANCE}`}>
          {/* Logo */}
          <a
            href={buildStaffShellHref("chapters", pathname, searchParams.toString())}
            onClick={(event) => {
              event.preventDefault();
              handleNavChange("chapters");
            }}
            className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded bg-accent flex items-center justify-center text-xs font-black text-sidebar">M</div>
            <div className="text-left">
              <div className="text-white text-sm font-bold leading-tight">myMEDLIFE</div>
              <div className="text-sidebar-foreground/50 text-[9px] font-medium uppercase tracking-widest leading-tight">Staff Command Center</div>
            </div>
          </a>

          {/* Nav */}
          <nav className="flex min-w-0 flex-1 items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={buildStaffShellHref(item.key, pathname, searchParams.toString())}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavChange(item.key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeScreen === item.key
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
                }`}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className={`pointer-events-none ml-auto min-w-0 flex-none items-center justify-end ${STAFF_HEADER_ALERT_VISIBILITY}`}>
            <div className="pointer-events-none flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-600/20 px-2.5 py-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="truncate text-xs font-semibold text-red-300">2 chapters need intervention</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className={`flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-6 py-3 ${STAFF_HEADER_ACCOUNT_CLEARANCE}`}>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-foreground">{SCREEN_TITLES[activeScreen]}</h1>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {activeScreen === "chapters" && `${CHAPTERS.length} chapters · Rush Month active · Last updated 2 min ago`}
            {activeScreen === "campaigns" && "7 campaigns active across all regions"}
            {activeScreen === "ugc" && `${UGC_CARDS.filter(c=>c.visibility==="pending").length} items pending review`}
            {activeScreen === "best-practices" && `${BEST_PRACTICES.length} verified best practices ready to share`}
            {activeScreen === "admin" &&
              (adminRole
                ? `Previewing as ${adminRole === "super-admin" ? "Super Admin" : "DS Admin"} · blocked controls stay preview-only unless explicitly approved${adminHeaderSubtitle ? ` · ${adminHeaderSubtitle}` : ""}`
                : `Restricted to DS Admin and Super Admin only${adminHeaderSubtitle ? ` · ${adminHeaderSubtitle}` : ""}`)}
            {activeScreen === "sops" && (sopView === "builder" && sopCampaign ? `${sopCampaign.name} · ${sopCampaign.version}` : "Build, version, and publish campaign workflows — steps, roles, points, and comms")}
          </div>
        </div>
        <div className="ml-4 hidden flex-shrink-0 text-xs font-mono text-muted-foreground xl:block">Jun 17, 2026 · 14:41 UTC</div>
      </div>

      {/* Content */}
      <main className={`flex-1 flex flex-col ${activeScreen === "sops" ? "overflow-hidden" : "overflow-auto"}`}>
        {/* SOP Builder — owns its own full-height layout */}
        {activeScreen === "sops" && (
          sopView === "library" ? (
            <SOPLibraryScreen
              onOpen={(c) => { setSopCampaign(c); setSopView("builder"); }}
            />
          ) : sopCampaign ? (
            <SOPBuilderScreen
              campaign={sopCampaign}
              onBack={() => { setSopView("library"); setSopCampaign(null); }}
            />
          ) : null
        )}

        {/* Admin — role gate (shown before access granted) */}
        {activeScreen === "admin" && !adminRole && (
          canAccessAdminPanel ? (
            <AdminRoleGate
              onGrant={(role) => setAdminRole(role)}
              onBack={handleAdminBack}
              backLabel={adminBackLabel}
              chapterContext={adminChapterContext}
              proofQueueContext={adminProofQueueContext}
            />
          ) : (
            <AdminRouteBlocked
              onBack={handleAdminBack}
              backLabel={adminBackLabel}
              chapterContext={adminChapterContext}
              proofQueueContext={adminProofQueueContext}
            />
          )
        )}

        {/* All other non-admin, non-SOP screens */}
        {activeScreen !== "sops" && activeScreen !== "admin" && (
          <div className="px-6 py-5 max-w-[1600px] mx-auto w-full">
            {activeScreen === "chapters" && (
              <PortfolioOverview
                onSelectChapter={handleSelectChapter}
                initialSearch={initialChapterSearch}
                initialRegionFilter={initialChapterRegionFilter}
                initialCoachFilter={initialChapterCoachFilter}
                initialChapterTypeFilter={initialChapterTypeFilter}
                initialSortBy={initialChapterSort}
              />
            )}
            {activeScreen === "events" && <StaffLaunchEventsOperations chapters={CHAPTERS} />}
            {activeScreen === "reports" && <StaffLaunchOrganizationLeaderboard chapters={CHAPTERS} />}
            {activeScreen === "campaigns" && <CampaignOps initialCampaign={initialCampaign} />}
            {activeScreen === "ugc" && (
              <ProofUGCQueue
                initialStatusFilter={initialProofStatusFilter}
                initialPlatformFilter={initialProofPlatformFilter}
                initialSelectedCardId={getRouteParam("ugcCard")}
                initialRouteSearch={initialRouteSearch}
              />
            )}
            {activeScreen === "best-practices" && <BestPracticesLibrary />}
          </div>
        )}
      </main>

      {/* Admin Panel full-screen overlay — DS Admin / Super Admin only */}
      {activeScreen === "admin" && adminRole && canAccessAdminPanel && (
        <div className="fixed inset-0 z-[60] flex flex-col">
          <AdminPanel
            onBack={handleAdminBack}
            embeddedBackLabel={adminBackLabel}
          />
        </div>
      )}

      {/* Chapter Detail Drawer */}
      {selectedChapter && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
            onClick={handleCloseChapterDrawer}
          />
          <div className="relative z-50">
            <ChapterDetailDrawer
              chapter={selectedChapter}
              onClose={handleCloseChapterDrawer}
              adminPreviewHref={buildStaffChapterAdminHref(
                selectedChapter.id,
                selectedChapter.name,
                pathname,
                searchParams.toString() || initialRouteSearch,
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

function resolveStaffShellScreen(view: string | null): Screen {
  switch (view) {
    case "campaigns":
      return "campaigns";
    case "events":
      return "events";
    case "leaderboard":
    case "reports":
      return "reports";
    case "proof_ugc":
    case "ugc":
      return "ugc";
    case "best_practices":
    case "best-practices":
      return "best-practices";
    case "sops":
      return "sops";
    case "admin":
      return "admin";
    case "chapters":
    default:
      return "chapters";
  }
}

function resolveStaffAdminReturnScreen(view: string | null): Extract<Screen, "chapters" | "ugc"> {
  return resolveStaffShellScreen(view) === "ugc" ? "ugc" : "chapters";
}

function resolveStaffChapterTypeFilter(
  value: string | null | undefined,
  fallback: StaffLaunchChapterTypeFilter = "all",
): StaffLaunchChapterTypeFilter {
  return staffChapterTypeFilterOptions.includes(value as StaffLaunchChapterTypeFilter)
    ? (value as StaffLaunchChapterTypeFilter)
    : fallback;
}

function resolveStaffChapterSort(
  value: string | null | undefined,
  fallback: "name" | "nps" | "events" | "leads" | "leadPct" | "points" = "name",
) {
  return value === "nps" || value === "events" || value === "leads" || value === "leadPct" || value === "points" || value === "name"
    ? value
    : fallback;
}

function resolveProofQueueStatusFilter(
  value: string | null | undefined,
  fallback: ProofQueueStatusFilter = "all",
): ProofQueueStatusFilter {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return fallback;
}

function resolveProofQueuePlatformFilter(
  value: string | null | undefined,
  fallback: Platform | "all" = "all",
): Platform | "all" {
  if (
    value === "facebook" ||
    value === "instagram" ||
    value === "linkedin" ||
    value === "loom" ||
    value === "tiktok" ||
    value === "upload" ||
    value === "youtube"
  ) {
    return value;
  }
  return fallback;
}

function matchesProofQueueFilters(
  card: ContentCard,
  statusFilter: ProofQueueStatusFilter,
  platformFilter: Platform | "all",
) {
  if (statusFilter === "pending" && card.visibility !== "pending") return false;
  if (statusFilter === "rejected" && card.visibility !== "rejected") return false;
  if (
    statusFilter === "approved" &&
    card.visibility !== "chapter" &&
    card.visibility !== "selected"
  ) {
    return false;
  }
  if (platformFilter !== "all" && card.platform !== platformFilter) return false;
  return true;
}

function getStaffAdminReturnLabel(screen: Extract<Screen, "chapters" | "ugc">, chapterId?: string | null) {
  if (screen === "ugc") return "Proof / UGC";
  return chapterId ? "this chapter" : "chapters";
}

function getStaffAdminContextLabel(
  backLabel: string,
  chapterContext?: string | null,
  proofQueueContext?: string | null,
) {
  if (backLabel === "Proof / UGC") {
    if (chapterContext && proofQueueContext) {
      return `Proof review context: ${chapterContext} (${proofQueueContext})`;
    }
    if (chapterContext) {
      return `Proof review context: ${chapterContext}`;
    }
    if (proofQueueContext) {
      return `Proof review context: ${proofQueueContext}`;
    }
    return null;
  }
  if (!chapterContext) return null;
  return `Chapter review context: ${chapterContext}`;
}

function getStaffAdminHeaderSubtitle(
  backLabel: string,
  chapterContext?: string | null,
  proofQueueContext?: string | null,
) {
  if (backLabel === "Proof / UGC") {
    if (chapterContext && proofQueueContext) {
      return `Proof / UGC review for ${chapterContext} (${proofQueueContext})`;
    }
    if (chapterContext) {
      return `Proof / UGC review for ${chapterContext}`;
    }
    if (proofQueueContext) {
      return `Proof / UGC review for ${proofQueueContext}`;
    }
    return null;
  }
  if (backLabel === "this chapter" && chapterContext) {
    return `Chapter review for ${chapterContext}`;
  }
  return null;
}

function getStaffShellViewParam(screen: Screen): string {
  switch (screen) {
    case "ugc":
      return "proof_ugc";
    case "best-practices":
      return "best_practices";
    case "reports":
      return "leaderboard";
    default:
      return screen;
  }
}

function buildStaffShellQueryFromInitialRouteParams(
  initialRouteParams?: Partial<
    Record<
      "view" | "campaign" | "chapter" | "ugcCard" | "returnView" | "chapterContext" | "proofStatus" | "proofPlatform" | "chapterSearch" | "chapterRegion" | "chapterCoach" | "chapterType" | "chapterSort",
      string | null | undefined
    >
  >,
) {
  if (!initialRouteParams) return "";
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(initialRouteParams)) {
    if (value) params.set(key, value);
  }

  return params.toString();
}

function resolveStaffCampaignTab(campaign: string | null) {
  switch (campaign) {
    case "rush-month":
      return "Rush Month";
    case "slt-promotion":
      return "SLT Promotion";
    case "moving-mountains":
      return "Moving Mountains";
    case "chapter-events":
      return "Chapter Events";
    case "leadership-transition":
      return "Leadership Transition";
    case "planning-goal-setting":
      return "Chapter Organization and Planning";
    case "social-media":
      return "Social Media";
    default:
      return "Rush Month";
  }
}

function getStaffCampaignParam(campaign: string) {
  switch (campaign) {
    case "Rush Month":
      return "rush-month";
    case "SLT Promotion":
      return "slt-promotion";
    case "Moving Mountains":
      return "moving-mountains";
    case "Chapter Events":
      return "chapter-events";
    case "Leadership Transition":
      return "leadership-transition";
    case "Chapter Organization and Planning":
      return "planning-goal-setting";
    case "Social Media":
      return "social-media";
    default:
      return "rush-month";
  }
}

function buildStaffCampaignHref(campaign: string, pathname: string, search: string) {
  const params = new URLSearchParams(search);
  params.set("view", "campaigns");
  params.set("campaign", getStaffCampaignParam(campaign));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildStaffShellHref(screen: Screen, pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.set("view", getStaffShellViewParam(screen));
  params.delete("chapter");
  if (screen !== "ugc" && screen !== "admin") {
    params.delete("ugcCard");
  }
  if (screen !== "admin") {
    params.delete("adminView");
    params.delete("returnView");
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildStaffChapterHref(chapterId: string, pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.set("view", "chapters");
  params.set("chapter", chapterId);
  params.delete("ugcCard");
  params.delete("adminView");
  params.delete("returnView");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildStaffChapterAdminHref(
  chapterId: string,
  chapterContext: string,
  pathname: string,
  search: string,
): string {
  const params = new URLSearchParams(search);
  params.set("view", "admin");
  params.set("adminView", "chapters");
  params.set("returnView", "chapters");
  params.set("chapter", chapterId);
  params.set("chapterContext", chapterContext);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildStaffProofHref(pathname: string, search: string, cardId?: string | null): string {
  const params = new URLSearchParams(search);
  params.set("view", "proof_ugc");
  params.delete("chapter");
  params.delete("adminView");
  params.delete("returnView");
  if (cardId) {
    params.set("ugcCard", cardId);
  } else {
    params.delete("ugcCard");
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildStaffAdminProofHref(
  pathname: string,
  search: string,
  cardId?: string | null,
  chapterContext?: string | null,
): string {
  const params = new URLSearchParams(search);
  params.set("view", "admin");
  params.set("adminView", "audit");
  params.set("returnView", "proof_ugc");
  params.delete("chapter");
  if (cardId) {
    params.set("ugcCard", cardId);
  } else {
    params.delete("ugcCard");
  }
  if (chapterContext) {
    params.set("chapterContext", chapterContext);
  } else {
    params.delete("chapterContext");
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getEmbeddedProofQueueContext(
  proofStatus: string | null,
  proofPlatform: string | null,
) {
  const statusLabel =
    proofStatus === "pending"
      ? "Pending"
      : proofStatus === "approved"
        ? "Approved"
        : proofStatus === "rejected"
          ? "Rejected"
          : null;
  const platformLabel =
    proofPlatform === "facebook"
      ? "Facebook"
      : proofPlatform === "instagram"
        ? "Instagram"
        : proofPlatform === "linkedin"
          ? "LinkedIn"
          : proofPlatform === "loom"
            ? "Loom"
            : proofPlatform === "tiktok"
              ? "TikTok"
              : proofPlatform === "upload"
                ? "Upload"
                : proofPlatform === "youtube"
                  ? "YouTube"
                  : null;

  if (statusLabel && platformLabel) return `${statusLabel} · ${platformLabel}`;
  return statusLabel ?? platformLabel;
}
