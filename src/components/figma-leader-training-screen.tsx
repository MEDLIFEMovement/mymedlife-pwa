"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useMemo } from "react";
import { BookOpen, Play, Upload, ExternalLink, Search, Plus, Star, Share2, Bell, Users, X, MessageSquare } from "lucide-react";

const NAVY = "#07192E";

// ── Local minimal component copies ──
const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";

function Pill({ label, color="slate" }: { label:string; color?:string }) {
  const m: Record<string,string> = {
    blue:"bg-blue-100 text-blue-800 border-blue-200",
    yellow:"bg-amber-100 text-amber-800 border-amber-200",
    slate:"bg-slate-100 text-slate-600 border-slate-200",
    green:"bg-green-100 text-green-800 border-green-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m[color]??m.slate}`}>{label}</span>;
}

function Btn({ children, variant="primary", onClick, className="" }: {
  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"|"danger";
  onClick?: () => void; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap";
  const v = {
    primary:   "bg-[#1A56E8] text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost:     "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    danger:    "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100",
  }[variant];
  return <button className={`${base} ${v} ${className}`} onClick={onClick}>{children}</button>;
}

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
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}

// ─── Leadership & Resources Hub ──────────────────────────────────────

const VALUES_TAGS = ["All", "Impeccable Character", "Fire / Agency", "Growth"];
const ROLE_TAGS   = ["All Roles", "President", "VP / E-Board", "Committee Chair", "General Member"];

type ResourceType = "video" | "deck" | "link";

interface TrainingResource {
  id: number;
  type: ResourceType;
  title: string;
  description: string;
  author: string;
  source: string;        // channel, platform, or org name
  url?: string;
  duration?: string;     // for videos
  slides?: number;       // for decks
  values: string[];      // MEDLIFE values this covers
  roles: string[];       // who it's for
  tags: string[];
  featured: boolean;
  thumbnail?: string;    // gradient CSS string or unsplash id
  added: string;
}

const TRAINING_RESOURCES: TrainingResource[] = [
  // ── Videos ──
  {
    id:1, type:"video",
    title:"What Is Servant Leadership? A MEDLIFE Framework",
    description:"MEDLIFE's executive director walks through the organization's leadership philosophy: how servant leadership, impeccable character, and fire/agency work together in student chapters.",
    author:"MEDLIFE Staff", source:"MEDLIFE YouTube", duration:"18 min",
    values:["Impeccable Character","Fire / Agency","Growth"], roles:["President","VP / E-Board"],
    tags:["Leadership","Foundations","MEDLIFE"], featured:true, added:"May 2025",
    thumbnail:"linear-gradient(135deg, #1A56E8, #3B82F6)",
  },
  {
    id:2, type:"video",
    title:"How to Run Your First Committee as Chair",
    description:"A former chapter president shares what she learned in her first semester as Events Chair — how to set expectations, delegate, give feedback, and keep members engaged.",
    author:"Sofia Reyes", source:"MEDLIFE Bridge Videos", duration:"12 min",
    values:["Fire / Agency","Growth"], roles:["Committee Chair"],
    tags:["Committees","Chair","Delegation"], featured:true, added:"Apr 2025",
    thumbnail:"linear-gradient(135deg, #7C3AED, #A855F7)",
  },
  {
    id:3, type:"video",
    title:"Difficult Conversations: Coaching Without Conflict",
    description:"Stanford's d.school course excerpt on giving feedback with empathy. Especially relevant when addressing underperforming committee members or values misalignment.",
    author:"Stanford d.school", source:"YouTube", duration:"24 min",
    values:["Impeccable Character","Growth"], roles:["President","VP / E-Board","Committee Chair"],
    tags:["Feedback","Coaching","Communication"], featured:false, added:"Mar 2025",
    thumbnail:"linear-gradient(135deg, #059669, #34D399)",
  },
  {
    id:4, type:"video",
    title:"Fire & Agency: How Student Leaders Create Change",
    description:"A former MEDLIFE SLT participant and chapter president shares how agency — doing things without being asked — transformed their chapter and their own growth.",
    author:"MEDLIFE Alumni Panel", source:"MEDLIFE YouTube", duration:"31 min",
    values:["Fire / Agency"], roles:["General Member","Committee Chair"],
    tags:["Agency","Motivation","Values"], featured:false, added:"Feb 2025",
    thumbnail:"linear-gradient(135deg, #D97706, #F59E0B)",
  },
  {
    id:5, type:"video",
    title:"Leading Meetings That Actually Work",
    description:"A practical guide to facilitating productive meetings — agenda design, time management, inclusive participation, and following up on decisions made.",
    author:"Harvard Leadership Lab", source:"YouTube", duration:"14 min",
    values:["Impeccable Character","Fire / Agency"], roles:["President","VP / E-Board","Committee Chair"],
    tags:["Meetings","Facilitation","Productivity"], featured:false, added:"Jan 2025",
    thumbnail:"linear-gradient(135deg, #0891B2, #06B6D4)",
  },
  {
    id:6, type:"video",
    title:"Building a Leadership Pipeline in Student Organizations",
    description:"How to identify, develop, and promote emerging leaders before you need them. Covers pipeline thinking, mentorship, and transition planning in the student org context.",
    author:"NASPA Leadership Institute", source:"NASPA", duration:"42 min",
    values:["Growth","Impeccable Character"], roles:["President","VP / E-Board"],
    tags:["Pipeline","Succession","Development"], featured:false, added:"Jan 2025",
    thumbnail:"linear-gradient(135deg, #DB2777, #EC4899)",
  },

  // ── Decks / Presentations ──
  {
    id:7, type:"deck",
    title:"MEDLIFE Chapter Leadership Guide — Full Onboarding",
    description:"The official chapter leadership onboarding deck. Covers MEDLIFE's mission, the three values, chapter structure, E-Board roles, action committees, KPIs, and what success looks like.",
    author:"MEDLIFE Staff", source:"MEDLIFE HQ", slides:48,
    values:["Impeccable Character","Fire / Agency","Growth"], roles:["President","VP / E-Board","Committee Chair"],
    tags:["Onboarding","Official","Foundations"], featured:true, added:"Jan 2025",
    thumbnail:"linear-gradient(135deg, #1A56E8, #6366F1)",
  },
  {
    id:8, type:"deck",
    title:"Values Interview Framework: Conducting a Great Interview",
    description:"Step-by-step guide for running a values interview with a chair or E-Board candidate. Includes sample questions for each of the three values, scoring notes, and debrief template.",
    author:"MEDLIFE Staff", source:"MEDLIFE HQ", slides:22,
    values:["Impeccable Character","Fire / Agency","Growth"], roles:["President","VP / E-Board"],
    tags:["Values Interview","Hiring","Leadership"], featured:true, added:"Feb 2025",
    thumbnail:"linear-gradient(135deg, #059669, #10B981)",
  },
  {
    id:9, type:"deck",
    title:"Moving Mountains Campaign Playbook",
    description:"How to run a successful fundraising campaign from kickoff to close. Covers goal-setting, team motivation, social media strategy, donor outreach, and tracking.",
    author:"MEDLIFE Fundraising Team", source:"MEDLIFE HQ", slides:34,
    values:["Fire / Agency"], roles:["Committee Chair","General Member"],
    tags:["Fundraising","Campaign","Moving Mountains"], featured:false, added:"Mar 2025",
    thumbnail:"linear-gradient(135deg, #D97706, #B45309)",
  },
  {
    id:10, type:"deck",
    title:"Chapter Health: Understanding Your Dashboard",
    description:"A walkthrough of what each metric on your chapter health dashboard means, how it's calculated, and what leaders can do this week to improve it.",
    author:"MEDLIFE Staff", source:"MEDLIFE HQ", slides:18,
    values:["Growth"], roles:["President","VP / E-Board","Committee Chair"],
    tags:["Dashboard","KPIs","Metrics"], featured:false, added:"Apr 2025",
    thumbnail:"linear-gradient(135deg, #7C3AED, #9333EA)",
  },
  {
    id:11, type:"deck",
    title:"SLT Preparation: What to Know Before You Go",
    description:"Pre-departure orientation deck for students going on a MEDLIFE Service-Learning Trip. Covers clinic operations, cultural humility, safety, evidence collection, and impact documentation.",
    author:"MEDLIFE Programs Team", source:"MEDLIFE HQ", slides:41,
    values:["Impeccable Character","Growth"], roles:["General Member","Committee Chair"],
    tags:["SLT","Preparation","Global Health"], featured:false, added:"Dec 2024",
    thumbnail:"linear-gradient(135deg, #0891B2, #0E7490)",
  },

  // ── External Links ──
  {
    id:12, type:"link",
    title:"The Servant Leader — Robert Greenleaf Center",
    description:"The foundational text and framework behind servant leadership. Essential reading for any chapter president or E-Board member seeking to understand MEDLIFE's leadership philosophy at a deeper level.",
    author:"Greenleaf Center for Servant Leadership", source:"greenleaf.org", url:"https://www.greenleaf.org",
    values:["Impeccable Character","Growth"], roles:["President","VP / E-Board"],
    tags:["Leadership Theory","Servant Leadership","Reading"], featured:false, added:"Jan 2025",
    thumbnail:"linear-gradient(135deg, #475569, #64748B)",
  },
  {
    id:13, type:"link",
    title:"Crucial Conversations — Free Summary & Toolkit",
    description:"Tools for holding high-stakes conversations where opinions differ and emotions run high. Especially useful for values misalignment discussions and leadership performance conversations.",
    author:"VitalSmarts", source:"cruciallearning.com", url:"https://cruciallearning.com",
    values:["Impeccable Character","Fire / Agency"], roles:["President","VP / E-Board","Committee Chair"],
    tags:["Conflict","Communication","Coaching"], featured:false, added:"Feb 2025",
    thumbnail:"linear-gradient(135deg, #DC2626, #EF4444)",
  },
  {
    id:14, type:"link",
    title:"AshokaU — Social Innovation Leadership Resources",
    description:"Free leadership development resources for student changemakers. Includes frameworks for building a culture of initiative, managing diverse teams, and sustaining a mission-driven organization.",
    author:"Ashoka", source:"ashoka.org/ashokau", url:"https://www.ashoka.org",
    values:["Fire / Agency","Growth"], roles:["President","VP / E-Board","General Member"],
    tags:["Social Innovation","Changemaking","Online"], featured:true, added:"Mar 2025",
    thumbnail:"linear-gradient(135deg, #16A34A, #15803D)",
  },
  {
    id:15, type:"link",
    title:"CliftonStrengths — Free Student Access (via your university)",
    description:"Discover the top 5 strengths of each chapter leader. Useful as a team exercise during E-Board onboarding or committee chair training to build self-awareness and complementary teams.",
    author:"Gallup", source:"gallup.com/cliftonstrengths", url:"https://www.gallup.com/cliftonstrengths",
    values:["Growth"], roles:["All Roles"],
    tags:["Self-Awareness","Strengths","Team Building"], featured:false, added:"Jan 2025",
    thumbnail:"linear-gradient(135deg, #B45309, #D97706)",
  },
  {
    id:16, type:"link",
    title:"Global Health Leadership — Coursera (Johns Hopkins)",
    description:"A free 6-week course on global health leadership, equity, and systems thinking. Ideal for SLT participants and chapter leaders interested in understanding the 'why' behind MEDLIFE's mission.",
    author:"Johns Hopkins Bloomberg School of Public Health", source:"coursera.org", url:"https://www.coursera.org",
    values:["Growth","Impeccable Character"], roles:["General Member","Committee Chair","VP / E-Board"],
    tags:["Global Health","Course","Certificate"], featured:false, added:"Feb 2025",
    thumbnail:"linear-gradient(135deg, #0891B2, #1A56E8)",
  },
];

const TYPE_META: Record<ResourceType, { label:string; icon:React.ComponentType<{size?:number; className?:string}>; color:string }> = {
  video: { label:"Video",        icon:Play,      color:"#1A56E8" },
  deck:  { label:"Presentation", icon:Upload,    color:"#7C3AED" },
  link:  { label:"External Link",icon:ExternalLink,color:"#059669" },
};

export function TrainingScreen() {
  const [activeType,   setActiveType]   = useState<"all"|ResourceType>("all");
  const [activeValue,  setActiveValue]  = useState("All");
  const [activeRole,   setActiveRole]   = useState("All Roles");
  const [search,       setSearch]       = useState("");
  const [expanded,     setExpanded]     = useState<number|null>(null);

  const filtered = useMemo(() => TRAINING_RESOURCES.filter(r => {
    const typeMatch  = activeType  === "all"       || r.type === activeType;
    const valueMatch = activeValue === "All"        || r.values.includes(activeValue);
    const roleMatch  = activeRole  === "All Roles" || r.roles.includes(activeRole) || r.roles.includes("All Roles");
    const textMatch  = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
                       r.description.toLowerCase().includes(search.toLowerCase()) ||
                       r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return typeMatch && valueMatch && roleMatch && textMatch;
  }), [activeType, activeValue, activeRole, search]);

  const featured   = filtered.filter(r => r.featured);
  const rest        = filtered.filter(r => !r.featured);

  const TypeIcon = ({ type, size=14 }: { type:ResourceType; size?:number }) => {
    const M = TYPE_META[type];
    return <M.icon size={size}/>;
  };

  const typeCounts: Record<string,number> = {
    all:   TRAINING_RESOURCES.length,
    video: TRAINING_RESOURCES.filter(r=>r.type==="video").length,
    deck:  TRAINING_RESOURCES.filter(r=>r.type==="deck").length,
    link:  TRAINING_RESOURCES.filter(r=>r.type==="link").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Leadership & Resources Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Videos, presentations, and external resources to develop MEDLIFE leaders.
          </p>
        </div>
        <Btn variant="primary"><Plus size={11}/>Add Resource</Btn>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type tabs */}
        <div className="flex gap-1.5">
          {(["all","video","deck","link"] as const).map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg cursor-pointer transition-all border
                ${activeType===t ? "text-white border-transparent" : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"}`}
              style={activeType===t ? { background: t==="all" ? NAVY : TYPE_META[t as ResourceType].color, borderColor:"transparent" } : {}}>
              {t !== "all" && <TypeIcon type={t as ResourceType} size={11}/>}
              {t==="all" ? `All (${typeCounts.all})` : t==="video" ? `Videos (${typeCounts.video})` : t==="deck" ? `Presentations (${typeCounts.deck})` : `External Links (${typeCounts.link})`}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <select className={`${inputCls} w-40`} value={activeRole} onChange={e => setActiveRole(e.target.value)}>
          {ROLE_TAGS.map(r => <option key={r}>{r}</option>)}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className={`${inputCls} pl-8`} placeholder="Search resources…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        <span className="text-xs text-slate-400 ml-auto font-medium">{filtered.length} resources</span>
      </div>

      {/* Featured resources */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-amber-500"/>
            <h2 className="text-sm font-black text-slate-900">Featured</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {featured.map(r => (
              <ResourceCard key={r.id} resource={r} expanded={expanded===r.id} onToggle={() => setExpanded(expanded===r.id?null:r.id)}/>
            ))}
          </div>
        </div>
      )}

      {/* All resources */}
      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <h2 className="text-sm font-black text-slate-900 mb-3">All Resources</h2>
          )}
          <div className="grid grid-cols-3 gap-4">
            {rest.map(r => (
              <ResourceCard key={r.id} resource={r} expanded={expanded===r.id} onToggle={() => setExpanded(expanded===r.id?null:r.id)}/>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
          <BookOpen size={36} className="mx-auto mb-3 opacity-25"/>
          <p className="text-sm font-semibold">No resources match this filter.</p>
          <p className="text-xs mt-1">Try adjusting your search, type, or values filter.</p>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource: r, expanded, onToggle }: { resource: TrainingResource; expanded: boolean; onToggle: () => void }) {
  const meta = TYPE_META[r.type];

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-shadow
      ${expanded ? "border-slate-300 shadow-md" : "border-slate-200 hover:shadow-sm"}`}>

      {/* Thumbnail */}
      <div className="relative h-28 flex items-center justify-center" style={{ background: r.thumbnail }}>
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <meta.icon size={24} className="text-white"/>
        </div>
        {/* Featured badge */}
        {r.featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-amber-400 rounded-full">
            <Star size={9} className="text-amber-900"/>
            <span className="text-[9px] font-black text-amber-900">Featured</span>
          </div>
        )}
        {/* Type + duration/slides badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/30 backdrop-blur-sm rounded-full">
          <meta.icon size={9} className="text-white"/>
          <span className="text-[10px] font-semibold text-white">
            {r.type==="video" ? r.duration : r.type==="deck" ? `${r.slides} slides` : "External"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="text-sm font-black text-slate-900 leading-snug flex-1">{r.title}</h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{r.description}</p>

        {/* Roles */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {r.roles.slice(0,3).map(role => (
            <Pill key={role} label={role} color="slate"/>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3">
          <span className="truncate">{r.author} · {r.source}</span>
          <span className="shrink-0 ml-2">{r.added}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {r.type === "link" ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: meta.color }}>
              <ExternalLink size={11}/>Open Resource
            </a>
          ) : (
            <button
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl text-white cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: meta.color }}>
              {r.type==="video" ? <Play size={11}/> : <Upload size={11}/>}
              {r.type==="video" ? "Watch" : "View Deck"}
            </button>
          )}
          <button
            onClick={onToggle}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 transition-colors">
            <Share2 size={11}/>
          </button>
        </div>

        {/* Expanded: share options */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Share this resource</div>
            <Btn variant="secondary" className="w-full justify-start"><Bell size={10}/>Share to Chapter Feed</Btn>
            <Btn variant="secondary" className="w-full justify-start"><Users size={10}/>Send to Committee</Btn>
            <Btn variant="secondary" className="w-full justify-start"><Star size={10}/>Add to Leadership Reading List</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
