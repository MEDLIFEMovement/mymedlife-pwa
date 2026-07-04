"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unused-expressions, react/no-unescaped-entities */

import React, { useState, useEffect } from "react";
import { Heart, ExternalLink, Play, MapPin, X, ArrowLeft, Bookmark, Share2, Sparkles, TrendingUp, Star } from "lucide-react";

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

// ─── MEDLIFE Stories ─────────────────────────────────────────────

type StorySource = "instagram"|"linkedin"|"youtube"|"loom"|"facebook"|"field";
type StoryTag = "For You"|"My Chapter"|"Field Stories"|"Student Stories"|"Trip Moments"|"Events"|"Featured";
interface MStory {
  id:number; title:string; caption:string; source:StorySource; type:string;
  chapter:string; country:string; tag?:string; image:string; likes:number;
  views:number; date:string; featured:boolean; trending?:boolean;
  isVideo?:boolean; duration?:string; embedUrl?:string;
  quote?:string; body?:string; filters:StoryTag[];
}

const MSTORIES: MStory[] = [
  { id:1, title:"Students in Lima joined a Mobile Clinic this weekend", caption:"Twenty-three MEDLIFE volunteers set up in San Juan de Lurigancho, seeing over 180 patients in a single day. This is why we show up.", source:"field", type:"Field Story", chapter:"Nationwide", country:"Peru", tag:"Featured", image:"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=600&fit=crop&auto=format", likes:214, views:1847, date:"Jun 28, 2025", featured:true, trending:true, quote:"\"We didn't just hand out medicine — we listened.\" — Ana, Penn State MEDLIFE", body:"On a humid Saturday morning in San Juan de Lurigancho, students from twelve different universities arrived before dawn. By 7am, the Mobile Clinic was fully operational. Nurses triaged patients while volunteers translated, escorted, and connected families to the services they needed. This clinic marks the 400th service event MEDLIFE has run in Lima alone.", filters:["For You","Field Stories","Featured"] },
  { id:2, title:"UConn MEDLIFE chapter packed the room at their intro event", caption:"Over 90 students showed up to learn about MEDLIFE's mission. The chapter is already planning their first fundraiser for September.", source:"instagram", type:"Chapter Highlight", chapter:"UConn", country:"USA", image:"https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=530&fit=crop&auto=format", likes:88, views:612, date:"Jun 25, 2025", featured:false, trending:false, filters:["For You","My Chapter","Events"] },
  { id:3, title:"Trip reflection: two weeks in Ecuador changed everything", caption:"Cassandra from Florida State shares what she learned in the cloud forests of Chimborazo Province — from patient care to community organizing.", source:"linkedin", type:"Student Story", chapter:"Florida State", country:"Ecuador", image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=530&fit=crop&auto=format", likes:143, views:934, date:"Jun 22, 2025", featured:false, trending:true, quote:"\"I came to help. I left understanding what help actually means.\"", body:"Cassandra spent fourteen days in Riobamba with a MEDLIFE team running environmental health assessments and accompanying community health workers. She wrote about the moment she realized that medicine without infrastructure is incomplete — and why she's now leading a Safe Homes fundraising campaign back at FSU.", filters:["For You","Student Stories","Trip Moments"] },
  { id:4, title:"Safe Homes project update: 12 stoves, 4 weeks, one community", caption:"The Cajamarca team completed Phase 2 of the smokeless stove installation project. Respiratory illness rates in this community are already declining.", source:"field", type:"Field Story", chapter:"Program Staff", country:"Peru", tag:"From the Field", image:"https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=530&fit=crop&auto=format", likes:176, views:1103, date:"Jun 19, 2025", featured:true, quote:"\"The family invited us in for lunch after we finished. That meal meant more than any metric.\"", body:"Twelve smokeless stoves installed. Four weeks of community organizing. One neighborhood transformed. The Cajamarca Safe Homes team worked alongside local masons to build and install improved cookstoves that reduce indoor smoke exposure — a leading driver of childhood respiratory disease in highland Peru. Phase 3 begins in August.", filters:["Field Stories","Featured"] },
  { id:5, title:"Why I joined MEDLIFE — a student interview", caption:"Marcus from Rutgers talks about growing up without healthcare access and why that shaped his decision to volunteer internationally.", source:"loom", type:"Student Story", chapter:"Rutgers", country:"USA", image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=530&fit=crop&auto=format", likes:97, views:489, date:"Jun 17, 2025", featured:false, isVideo:true, duration:"6:34", embedUrl:"https://www.loom.com/embed/example", filters:["Student Stories","For You"] },
  { id:6, title:"Community health fair draws 300+ in Managua", caption:"The Nicaragua team partnered with a local health center to run dental screenings, vision checks, and preventive health education for an entire Saturday.", source:"facebook", type:"Event Highlight", chapter:"Miami MEDLIFE", country:"Nicaragua", image:"https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=530&fit=crop&auto=format", likes:61, views:378, date:"Jun 14, 2025", featured:false, filters:["Events","Field Stories"] },
  { id:7, title:"Fundraising milestone: $42,000 raised for Safe Homes 2025", caption:"Seventeen chapters rallied to hit this goal before summer. Every dollar funds construction materials and community labor for stove and water filter projects.", source:"instagram", type:"Fundraising", chapter:"National Campaign", country:"MEDLIFE", tag:"Trending", image:"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=530&fit=crop&auto=format", likes:203, views:1542, date:"Jun 10, 2025", featured:false, trending:true, filters:["For You","Featured"] },
  { id:8, title:"A grandmother's story: forty years without access to a doctor", caption:"Doña Carmen, 72, describes what it meant to finally receive a full health evaluation — and the student who sat with her through the wait.", source:"field", type:"Patient Voice", chapter:"Program Staff", country:"Guatemala", tag:"Patient Voice", image:"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=530&fit=crop&auto=format", likes:318, views:2104, date:"Jun 6, 2025", featured:true, quote:"\"The young woman held my hand the whole time. I wasn't afraid anymore.\"", body:"Doña Carmen walked two hours from her village to attend the MEDLIFE Mobile Clinic in Quetzaltenango. She had never seen a physician. A MEDLIFE student volunteer stayed with her through every step — translating, explaining each test, and making sure she understood her diagnosis and next steps.", filters:["Field Stories","Featured","For You"] },
  { id:9, title:"Yale chapter hosts pre-trip training weekend", caption:"Forty-two students went through clinical skills workshops, cultural competency training, and logistics prep ahead of their July trip to Peru.", source:"youtube", type:"Chapter Highlight", chapter:"Yale", country:"USA", image:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=530&fit=crop&auto=format", likes:54, views:301, date:"Jun 2, 2025", featured:false, isVideo:true, duration:"4:12", embedUrl:"https://www.youtube.com/embed/TpyFm3qdqCY", filters:["Events","My Chapter","Trip Moments"] },
];

const STORY_SOURCE_CFG: Record<StorySource,{label:string;color:string;bg:string;icon:string}> = {
  instagram:{ label:"Instagram", color:"#fff", bg:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", icon:"IG" },
  linkedin: { label:"LinkedIn",  color:"#fff", bg:"#0A66C2",  icon:"in" },
  youtube:  { label:"YouTube",   color:"#fff", bg:"#FF0000",  icon:"▶"  },
  loom:     { label:"Loom",      color:"#fff", bg:"#625DF5",  icon:"◉"  },
  facebook: { label:"Facebook",  color:"#fff", bg:"#1877F2",  icon:"f"  },
  field:    { label:"Field Note",color:"#fff", bg:"#3D7A5A",  icon:"✦"  },
};

function SrcBadge({ source }: { source:StorySource }) {
  const c = STORY_SOURCE_CFG[source];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background:c.bg, color:c.color, fontFamily:"'JetBrains Mono',monospace" }}>
      <span className="opacity-90">{c.icon}</span>{c.label}
    </span>
  );
}

function TagBadgeStory({ tag }: { tag:string }) {
  const v: Record<string,string> = {
    "Featured":       "bg-blue-50 text-blue-700 border border-blue-200",
    "Trending":       "bg-amber-50 text-amber-700 border border-amber-200",
    "From the Field": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Patient Voice":  "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${v[tag]??"bg-slate-100 text-slate-600 border border-slate-200"}`}
      style={{ fontFamily:"'JetBrains Mono',monospace" }}>
      {tag==="Featured"&&<Star size={9}/>}{tag==="Trending"&&<TrendingUp size={9}/>}{tag}
    </span>
  );
}

function StoryHeartBtn({ count, id, liked, onToggle }: { count:number; id:number; liked:boolean; onToggle:(id:number)=>void }) {
  const [burst,setBurst] = useState(false);
  return (
    <button onClick={e=>{e.stopPropagation();onToggle(id);if(!liked){setBurst(true);setTimeout(()=>setBurst(false),400);}}}
      className={`flex items-center gap-1.5 text-sm transition-all ${liked?"text-blue-600":"text-slate-400 hover:text-blue-600"}`}>
      <Heart size={15} className={`transition-all ${liked?"fill-blue-600 stroke-blue-600":""} ${burst?"scale-125":""}`}/>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px"}}>{liked?count+1:count}</span>
    </button>
  );
}

function MStoryCard({ story, liked, onToggle, onClick, hero }: {
  story:MStory; liked:boolean; onToggle:(id:number)=>void; onClick:(s:MStory)=>void; hero?:boolean;
}) {
  if (hero) return (
    <div onClick={()=>onClick(story)}
      className="group col-span-3 overflow-hidden rounded-2xl cursor-pointer bg-white border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-blue-300">
      <div className="grid md:grid-cols-2 min-h-[320px]">
        <div className="relative overflow-hidden bg-slate-200">
          <img src={story.image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[260px]"/>
          {story.isVideo&&<div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Play size={22} className="text-blue-600 ml-1"/></div></div>}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {story.featured&&<TagBadgeStory tag="Featured"/>}
            {story.trending&&<TagBadgeStory tag="Trending"/>}
          </div>
        </div>
        <div className="flex flex-col justify-between p-7">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <SrcBadge source={story.source}/>
              <span className="text-xs text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>{story.type}</span>
            </div>
            <h2 className="text-2xl leading-snug font-semibold text-slate-900 group-hover:text-blue-700 transition-colors"
              style={{fontFamily:"'Playfair Display',serif"}}>{story.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{story.caption}</p>
            {story.quote&&<blockquote className="border-l-2 border-blue-400 pl-3 text-sm italic text-slate-700" style={{fontFamily:"'Playfair Display',serif"}}>{story.quote}</blockquote>}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StoryHeartBtn count={story.likes} id={story.id} liked={liked} onToggle={onToggle}/>
              <span className="text-xs text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>{story.views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={11}/><span>{story.country}</span><span className="opacity-30">·</span><span>{story.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={()=>onClick(story)}
      className="group overflow-hidden rounded-xl cursor-pointer bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative overflow-hidden bg-slate-200 aspect-[16/10] flex-shrink-0">
        <img src={story.image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
        {story.isVideo&&<div className="absolute inset-0 flex items-center justify-center"><div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"><Play size={16} className="text-blue-600 ml-0.5"/></div></div>}
        <div className="absolute top-3 left-3"><SrcBadge source={story.source}/></div>
        {story.tag&&<div className="absolute top-3 right-3"><TagBadgeStory tag={story.tag}/></div>}
        {story.duration&&<span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded" style={{fontFamily:"'JetBrains Mono',monospace"}}>{story.duration}</span>}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
          <span>{story.type}</span><span className="opacity-30">·</span><span>{story.chapter}</span>
        </div>
        <h3 className="text-base leading-snug font-semibold text-slate-900 group-hover:text-blue-700 transition-colors overflow-hidden" style={{fontFamily:"'Playfair Display',serif"}}>{story.title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed flex-1 overflow-hidden">{story.caption}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <StoryHeartBtn count={story.likes} id={story.id} liked={liked} onToggle={onToggle}/>
            <span className="text-[11px] text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>{story.views>=1000?`${(story.views/1000).toFixed(1)}k`:story.views} views</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={10}/><span>{story.country}</span></div>
        </div>
      </div>
    </div>
  );
}

function MStoryModal({ story, liked, onToggle, onClose }: { story:MStory; liked:boolean; onToggle:(id:number)=>void; onClose:()=>void }) {
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[onClose]);
  const cfg = STORY_SOURCE_CFG[story.source];
  const [playing,setPlaying] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{background:"rgba(7,25,46,0.6)",backdropFilter:"blur(6px)"}}>
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10">
        {/* Media */}
        {story.isVideo&&!playing ? (
          <div className="relative flex-shrink-0" style={{aspectRatio:"16/9"}}>
            <img src={story.image} alt={story.title} className="w-full h-full object-cover opacity-80"/>
            <div className="absolute inset-0 bg-black/30"/>
            <button onClick={()=>setPlaying(true)} className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><Play size={26} className="text-blue-600 ml-1.5"/></div>
            </button>
            <button onClick={onClose} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"><ArrowLeft size={15}/></button>
          </div>
        ) : story.isVideo&&playing ? (
          <div className="relative flex-shrink-0 bg-black" style={{aspectRatio:"16/9"}}>
            {story.embedUrl
              ? <iframe src={`${story.embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={story.title}/>
              : <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">Video unavailable</div>}
          </div>
        ) : (
          <div className="relative h-64 flex-shrink-0 overflow-hidden bg-slate-200">
            <img src={story.image} alt={story.title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent"/>
            <button onClick={onClose} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition-colors cursor-pointer"><ArrowLeft size={16}/></button>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white transition-colors cursor-pointer"><X size={16}/></button>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex gap-2 flex-wrap">
                <SrcBadge source={story.source}/>
                {story.tag&&<TagBadgeStory tag={story.tag}/>}
                {story.featured&&!story.tag&&<TagBadgeStory tag="Featured"/>}
              </div>
              {story.duration&&<span className="bg-black/70 text-white text-xs px-2 py-1 rounded" style={{fontFamily:"'JetBrains Mono',monospace"}}>{story.duration}</span>}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
            <span>{story.type}</span><span className="opacity-30">·</span>
            <MapPin size={11}/><span>{story.country}</span><span className="opacity-30">·</span>
            <span>{story.chapter}</span><span className="opacity-30">·</span><span>{story.date}</span>
          </div>
          <h2 className="text-2xl leading-snug font-semibold text-slate-900" style={{fontFamily:"'Playfair Display',serif"}}>{story.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{story.caption}</p>
          {story.quote&&<blockquote className="border-l-2 border-blue-400 pl-4 py-1 text-base italic text-slate-700 leading-relaxed" style={{fontFamily:"'Playfair Display',serif"}}>{story.quote}</blockquote>}
          {story.body&&<p className="text-sm text-slate-600 leading-7">{story.body}</p>}
        </div>

        <div className="flex-shrink-0 p-5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <StoryHeartBtn count={story.likes} id={story.id} liked={liked} onToggle={onToggle}/>
            {liked&&<span className="text-xs text-slate-400 animate-pulse">Thanks for engaging ✦</span>}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer">
              <Bookmark size={13}/>Save
            </button>
            <a href="#" onClick={e=>e.preventDefault()}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors cursor-pointer hover:opacity-90"
              style={{background:cfg.bg}}>
              <ExternalLink size={13}/>Open on {cfg.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MedlifeStoriesScreen() {
  const allFilters: StoryTag[] = ["For You","My Chapter","Field Stories","Student Stories","Trip Moments","Events","Featured"];
  const [activeFilter, setActiveFilter] = useState<StoryTag>("For You");
  const [likedIds, setLikedIds]         = useState<Set<number>>(new Set());
  const [selected, setSelected]         = useState<MStory|null>(null);

  const toggleLike = (id:number) => setLikedIds(prev => {
    const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n;
  });

  const filtered      = MSTORIES.filter(s=>s.filters.includes(activeFilter));
  const heroStory     = filtered.find(s=>s.featured);
  const gridStories   = filtered.filter(s=>s.id!==heroStory?.id);

  return (
    <div className="space-y-6">
      {selected&&<MStoryModal story={selected} liked={likedIds.has(selected.id)} onToggle={toggleLike} onClose={()=>setSelected(null)}/>}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">MEDLIFE Stories</h1>
          <p className="text-sm text-slate-500 mt-1">See what's happening across chapters and communities — from the field, from students, from the heart.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
            <span className="w-2 h-2 rounded-full bg-[#3D7A5A] inline-block"/>Live from the field
          </div>
          <Btn variant="primary"><Sparkles size={11}/>Add Story</Btn>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {allFilters.map(f=>(
          <button key={f} onClick={()=>setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer
              ${activeFilter===f ? "bg-[#1A56E8] text-white border-[#1A56E8] shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-slate-800"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length===0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><Heart size={24}/></div>
          <p className="text-slate-400 text-sm">No stories in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {heroStory&&<MStoryCard story={heroStory} liked={likedIds.has(heroStory.id)} onToggle={toggleLike} onClick={setSelected} hero/>}
          {gridStories.map(s=>(
            <MStoryCard key={s.id} story={s} liked={likedIds.has(s.id)} onToggle={toggleLike} onClick={setSelected}/>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
        <span>MEDLIFE Stories — curated by staff · requires approval before publishing</span>
        <span>{MSTORIES.length} stories published</span>
      </div>
    </div>
  );
}
