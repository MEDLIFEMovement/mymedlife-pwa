import { useState, useEffect } from "react";
import { Heart, ExternalLink, Play, MapPin, X, ArrowLeft, Bookmark, Share2, ChevronRight, Sparkles, TrendingUp, Star } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Source = "instagram" | "linkedin" | "youtube" | "loom" | "facebook" | "field";
type StoryType = "Field Story" | "Student Story" | "Chapter Highlight" | "Trip Moment" | "Event Highlight" | "Fundraising" | "Patient Voice";
type Filter = "For You" | "My Chapter" | "Field Stories" | "Student Stories" | "Trip Moments" | "Events" | "Featured";

interface Story {
  id: number;
  title: string;
  caption: string;
  source: Source;
  type: StoryType;
  chapter: string;
  country: string;
  tag?: string;
  image: string;
  likes: number;
  views: number;
  date: string;
  featured: boolean;
  trending?: boolean;
  isVideo?: boolean;
  duration?: string;
  embedUrl?: string;
  quote?: string;
  body?: string;
  filters: Filter[];
}

// ── Data ───────────────────────────────────────────────────────────────────

const stories: Story[] = [
  {
    id: 1,
    title: "Students in Lima joined a Mobile Clinic this weekend",
    caption: "Twenty-three MEDLIFE volunteers set up in San Juan de Lurigancho, seeing over 180 patients in a single day. This is why we show up.",
    source: "field",
    type: "Field Story",
    chapter: "Nationwide",
    country: "Peru",
    tag: "Featured",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=600&fit=crop&auto=format",
    likes: 214,
    views: 1847,
    date: "Jun 28, 2025",
    featured: true,
    trending: true,
    quote: "\"We didn't just hand out medicine — we listened.\" — Ana, Penn State MEDLIFE",
    body: "On a humid Saturday morning in San Juan de Lurigancho, students from twelve different universities arrived before dawn. By 7am, the Mobile Clinic was fully operational. Nurses triaged patients while volunteers translated, escorted, and connected families to the services they needed. This clinic marks the 400th service event MEDLIFE has run in Lima alone.",
    filters: ["For You", "Field Stories", "Featured"],
  },
  {
    id: 2,
    title: "UConn MEDLIFE chapter packed the room at their intro event",
    caption: "Over 90 students showed up to learn about MEDLIFE's mission. The chapter is already planning their first fundraiser for September.",
    source: "instagram",
    type: "Chapter Highlight",
    chapter: "UConn",
    country: "USA",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=530&fit=crop&auto=format",
    likes: 88,
    views: 612,
    date: "Jun 25, 2025",
    featured: false,
    trending: false,
    filters: ["For You", "My Chapter", "Events"],
  },
  {
    id: 3,
    title: "Trip reflection: two weeks in Ecuador changed everything",
    caption: "Cassandra from Florida State shares what she learned in the cloud forests of Chimborazo Province — from patient care to community organizing.",
    source: "linkedin",
    type: "Student Story",
    chapter: "Florida State",
    country: "Ecuador",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=530&fit=crop&auto=format",
    likes: 143,
    views: 934,
    date: "Jun 22, 2025",
    featured: false,
    trending: true,
    quote: "\"I came to help. I left understanding what help actually means.\"",
    body: "Cassandra spent fourteen days in Riobamba with a MEDLIFE team running environmental health assessments and accompanying community health workers. She wrote about the moment she realized that medicine without infrastructure is incomplete — and why she's now leading a Safe Homes fundraising campaign back at FSU.",
    filters: ["For You", "Student Stories", "Trip Moments"],
  },
  {
    id: 4,
    title: "Safe Homes project update: 12 stoves, 4 weeks, one community",
    caption: "The Cajamarca team completed Phase 2 of the smokeless stove installation project. Respiratory illness rates in this community are already declining.",
    source: "field",
    type: "Field Story",
    chapter: "Program Staff",
    country: "Peru",
    tag: "From the Field",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=530&fit=crop&auto=format",
    likes: 176,
    views: 1103,
    date: "Jun 19, 2025",
    featured: true,
    isVideo: false,
    quote: "\"The family invited us in for lunch after we finished. That meal meant more than any metric.\"",
    body: "Twelve smokeless stoves installed. Four weeks of community organizing. One neighborhood transformed. The Cajamarca Safe Homes team worked alongside local masons to build and install improved cookstoves that reduce indoor smoke exposure — a leading driver of childhood respiratory disease in highland Peru. Phase 3 begins in August.",
    filters: ["Field Stories", "Featured"],
  },
  {
    id: 5,
    title: "Why I joined MEDLIFE — a student interview",
    caption: "Marcus from Rutgers talks about growing up without healthcare access and why that shaped his decision to volunteer internationally.",
    source: "loom",
    type: "Student Story",
    chapter: "Rutgers",
    country: "USA",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=530&fit=crop&auto=format",
    likes: 97,
    views: 489,
    date: "Jun 17, 2025",
    featured: false,
    isVideo: true,
    duration: "6:34",
    embedUrl: "https://www.loom.com/embed/226747d11bab4e40b5e3f7c1b3c4d5e6",
    filters: ["Student Stories", "For You"],
  },
  {
    id: 6,
    title: "Community health fair draws 300+ in Managua",
    caption: "The Nicaragua team partnered with a local health center to run dental screenings, vision checks, and preventive health education for an entire Saturday.",
    source: "facebook",
    type: "Event Highlight",
    chapter: "Miami MEDLIFE",
    country: "Nicaragua",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=530&fit=crop&auto=format",
    likes: 61,
    views: 378,
    date: "Jun 14, 2025",
    featured: false,
    filters: ["Events", "Field Stories"],
  },
  {
    id: 7,
    title: "Fundraising milestone: $42,000 raised for Safe Homes 2025",
    caption: "Seventeen chapters rallied to hit this goal before summer. Every dollar funds construction materials and community labor for stove and water filter projects.",
    source: "instagram",
    type: "Fundraising",
    chapter: "National Campaign",
    country: "MEDLIFE",
    tag: "Trending",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=530&fit=crop&auto=format",
    likes: 203,
    views: 1542,
    date: "Jun 10, 2025",
    featured: false,
    trending: true,
    filters: ["For You", "Featured"],
  },
  {
    id: 8,
    title: "A grandmother's story: forty years without access to a doctor",
    caption: "Doña Carmen, 72, describes what it meant to finally receive a full health evaluation — and the student who sat with her through the wait.",
    source: "field",
    type: "Patient Voice",
    chapter: "Program Staff",
    country: "Guatemala",
    tag: "Patient Voice",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=530&fit=crop&auto=format",
    likes: 318,
    views: 2104,
    date: "Jun 6, 2025",
    featured: true,
    quote: "\"The young woman held my hand the whole time. I wasn't afraid anymore.\"",
    body: "Doña Carmen walked two hours from her village to attend the MEDLIFE Mobile Clinic in Quetzaltenango. She had never seen a physician. A MEDLIFE student volunteer, Priya from Johns Hopkins, stayed with her through every step — translating from Spanish to Mam, explaining each test, and making sure she understood her diagnosis and next steps. Stories like this are why the field exists.",
    filters: ["Field Stories", "Featured", "For You"],
  },
  {
    id: 9,
    title: "Yale chapter hosts pre-trip training weekend",
    caption: "Forty-two students went through clinical skills workshops, cultural competency training, and logistics prep ahead of their July trip to Peru.",
    source: "youtube",
    type: "Chapter Highlight",
    chapter: "Yale",
    country: "USA",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=530&fit=crop&auto=format",
    likes: 54,
    views: 301,
    date: "Jun 2, 2025",
    featured: false,
    isVideo: true,
    duration: "4:12",
    embedUrl: "https://www.youtube.com/embed/TpyFm3qdqCY",
    filters: ["Events", "My Chapter", "Trip Moments"],
  },
];

// ── Source badge config ─────────────────────────────────────────────────────

const sourceConfig: Record<Source, { label: string; color: string; bg: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#fff", bg: "linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)", icon: "IG" },
  linkedin:  { label: "LinkedIn",  color: "#fff", bg: "#0A66C2", icon: "in" },
  youtube:   { label: "YouTube",   color: "#fff", bg: "#FF0000", icon: "▶" },
  loom:      { label: "Loom",      color: "#fff", bg: "#625DF5", icon: "◉" },
  facebook:  { label: "Facebook",  color: "#fff", bg: "#1877F2", icon: "f" },
  field:     { label: "Field Note",color: "#fff", bg: "#3D7A5A", icon: "✦" },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: Source }) {
  const cfg = sourceConfig[source];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tracking-wide"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Mono', monospace" }}
    >
      <span className="opacity-90">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const variants: Record<string, string> = {
    "Featured": "bg-primary/10 text-primary border border-primary/20",
    "Trending": "bg-accent/10 text-accent border border-accent/20",
    "From the Field": "bg-[#3D7A5A]/10 text-[#3D7A5A] border border-[#3D7A5A]/20",
    "Patient Voice": "bg-purple-100 text-purple-700 border border-purple-200",
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

function HeartButton({ count, storyId, liked, onToggle }: { count: number; storyId: number; liked: boolean; onToggle: (id: number) => void }) {
  const [burst, setBurst] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(storyId);
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 400);
    }
  };
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 text-sm transition-all duration-200 group ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
    >
      <span className={`relative transition-transform duration-200 ${burst ? "scale-125" : "scale-100"} ${liked ? "scale-110" : ""}`}>
        <Heart
          size={16}
          className={`transition-all duration-200 ${liked ? "fill-primary stroke-primary" : "fill-transparent group-hover:fill-primary/10"}`}
        />
        {burst && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-primary opacity-40" />
          </span>
        )}
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px" }}>{count}</span>
    </button>
  );
}

function StoryCard({ story, liked, onToggleLike, onClick, featured }: {
  story: Story; liked: boolean; onToggleLike: (id: number) => void;
  onClick: (s: Story) => void; featured?: boolean;
}) {
  if (featured) {
    return (
      <div
        onClick={() => onClick(story)}
        className="group relative overflow-hidden rounded-2xl cursor-pointer bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
        style={{ gridColumn: "span 2" }}
      >
        <div className="grid md:grid-cols-2 min-h-[340px]">
          <div className="relative overflow-hidden bg-muted">
            <img
              src={story.image}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              style={{ minHeight: "280px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20 md:block hidden" />
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
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {story.type}
                </span>
              </div>
              <h2 className="text-2xl leading-snug font-semibold text-foreground group-hover:text-primary transition-colors duration-200"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {story.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{story.caption}</p>
              {story.quote && (
                <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-foreground/70"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {story.quote}
                </blockquote>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HeartButton count={liked ? story.likes + 1 : story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {story.views.toLocaleString()} views
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={11} />
                <span>{story.country}</span>
                <span className="opacity-40">·</span>
                <span>{story.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(story)}
      className="group relative overflow-hidden rounded-xl cursor-pointer bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col"
    >
      <div className="relative overflow-hidden bg-muted aspect-[16/10] flex-shrink-0">
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {story.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-card/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
              <Play size={16} className="text-primary ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <SourceBadge source={story.source} />
        </div>
        {story.tag && (
          <div className="absolute top-3 right-3">
            <TagBadge tag={story.tag} />
          </div>
        )}
        {story.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/70 text-white text-xs px-1.5 py-0.5 rounded" style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.duration}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
          <span>{story.type}</span>
          <span className="opacity-30">·</span>
          <span>{story.chapter}</span>
        </div>
        <h3 className="text-base leading-snug font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {story.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{story.caption}</p>
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-3">
            <HeartButton count={liked ? story.likes + 1 : story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}k` : story.views} views
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} />
            <span>{story.country}</span>
          </div>
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
          <div className="w-18 h-18 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white transition-all duration-200"
            style={{ width: 64, height: 64 }}>
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

function StoryModal({ story, liked, onToggleLike, onClose }: {
  story: Story; liked: boolean; onToggleLike: (id: number) => void; onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const cfg = sourceConfig[story.source];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10">

        {/* Media area — video player or static image */}
        {story.isVideo ? (
          <div className="flex-shrink-0 relative">
            <VideoPlayer story={story} />
            <button onClick={onClose}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-150 z-10">
              <ArrowLeft size={15} />
            </button>
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hidden sm:flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-150 z-10">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="relative h-64 sm:h-72 flex-shrink-0 overflow-hidden bg-muted">
            <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            <button onClick={onClose}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors duration-150">
              <ArrowLeft size={16} />
            </button>
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors duration-150 sm:flex hidden">
              <X size={16} />
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex gap-2 flex-wrap">
                <SourceBadge source={story.source} />
                {story.tag && <TagBadge tag={story.tag} />}
                {story.featured && !story.tag && <TagBadge tag="Featured" />}
              </div>
              {story.duration && (
                <span className="bg-black/70 text-white text-xs px-2 py-1 rounded" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {story.duration}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 sm:p-7 space-y-5" style={{ scrollbarWidth: "none" }}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            <span>{story.type}</span>
            <span className="opacity-30">·</span>
            <MapPin size={11} />
            <span>{story.country}</span>
            <span className="opacity-30">·</span>
            <span>{story.chapter}</span>
            <span className="opacity-30">·</span>
            <span>{story.date}</span>
          </div>

          <h2 className="text-2xl leading-snug font-semibold text-foreground"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {story.title}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">{story.caption}</p>

          {story.quote && (
            <blockquote className="border-l-2 border-primary pl-4 py-1 text-base italic text-foreground/80 leading-relaxed"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {story.quote}
            </blockquote>
          )}

          {story.body && (
            <p className="text-sm text-foreground/75 leading-7">{story.body}</p>
          )}
        </div>

        <div className="flex-shrink-0 p-5 sm:p-6 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <HeartButton count={liked ? story.likes + 1 : story.likes} storyId={story.id} liked={liked} onToggle={onToggleLike} />
            {liked && (
              <span className="text-xs text-muted-foreground animate-fade-in">Thanks for engaging with this story ✦</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted">
              <Bookmark size={14} />
              Save
            </button>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
              style={{ background: cfg.bg }}
            >
              <ExternalLink size={14} />
              Open {cfg.label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

const filters: Filter[] = ["For You", "My Chapter", "Field Stories", "Student Stories", "Trip Moments", "Events", "Featured"];

export default function App() {
  const [activeFilter, setActiveFilter] = useState<Filter>("For You");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const toggleLike = (id: number) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = stories.filter(s => s.filters.includes(activeFilter));
  const featuredStory = filtered.find(s => s.featured);
  const gridStories = filtered.filter(s => s.id !== featuredStory?.id);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">M</span>
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight">myMEDLIFE</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Stories</span>
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.06em" }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="opacity-60">
                <rect x="0.5" y="0.5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M3 6.5h3M4.5 6.5v1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Desktop
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Sparkles size={12} />
            Add Story
          </button>
        </div>
      </header>

      {/* Page title */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              MEDLIFE Stories
            </h1>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
              See what's happening across chapters and communities — from the field, from students, from the heart.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3D7A5A] inline-block" />Live from the field</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stories grid */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Heart size={24} />
            </div>
            <p className="text-muted-foreground text-sm">No stories in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredStory && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <StoryCard
                  story={featuredStory}
                  liked={likedIds.has(featuredStory.id)}
                  onToggleLike={toggleLike}
                  onClick={setSelectedStory}
                  featured
                />
              </div>
            )}
            {gridStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                liked={likedIds.has(story.id)}
                onToggleLike={toggleLike}
                onClick={setSelectedStory}
              />
            ))}
          </div>
        )}

        {/* Footer attribution */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground"
          style={{ fontFamily: "'DM Mono', monospace" }}>
          <span>MEDLIFE Stories — curated by staff · not a public feed</span>
          <span>{stories.length} stories published</span>
        </div>
      </main>

      {/* Story modal */}
      {selectedStory && (
        <StoryModal
          story={selectedStory}
          liked={likedIds.has(selectedStory.id)}
          onToggleLike={toggleLike}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}
