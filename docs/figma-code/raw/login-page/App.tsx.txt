import { useState } from "react";
import medlifeLogo from "@/imports/MEDLIFE-circle_logo.png";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import {
  Users,
  GraduationCap,
  TrendingUp,
  Briefcase,
  Database,
  ShieldAlert,
  ArrowRight,
  Activity,
  Bell,
  ChevronRight,
  Star,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart2,
  Zap,
  Lock,
  Key,
  Terminal,
  Flag,
  UserCheck,
  MapPin,
  Trophy,
  Target,
  BookOpen,
  ClipboardList,
  PieChart,
  Home,
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

/**
 * AppView drives the top-level router.
 * "login"          → login screen (unauthenticated)
 * "pick-profile"   → profile picker (authenticated, multiple profiles assigned)
 * All other values → a specific app shell (single profile or user has chosen one)
 */
type AppView =
  | "login"
  | "pick-profile"
  | "member"
  | "student-leader"
  | "sales-coach"
  | "staff"
  | "ds-admin"
  | "super-admin";

/**
 * ProfileKey is the canonical identifier for each role profile.
 * These map 1-to-1 with app shells.
 *
 * "member"         → General Member / Student experience
 * "student-leader" → Chapter/Student Leader experience
 * "sales-coach"    → Sales Coach / Sales Staff Command Center
 * "staff"          → Non-Sales Staff Workspace
 * "ds-admin"       → Data Solutions / Admin Backend
 * "super-admin"    → Super Admin Backend (breakglass access)
 */
type ProfileKey =
  | "member"
  | "student-leader"
  | "sales-coach"
  | "staff"
  | "ds-admin"
  | "super-admin";

/**
 * AuthenticatedUser represents what the backend returns after a successful login.
 *
 * BACKEND CONTRACT (for Codex / implementation):
 * ─────────────────────────────────────────────
 * POST /auth/login  →  { token, user: AuthenticatedUser }
 *
 * The `profiles` array contains ONLY the profiles actually assigned to this user
 * in the database. The frontend must never show a profile the user has not been
 * granted. Empty array = no access (should not occur in practice; show an error).
 *
 * Routing rules after authentication:
 *   profiles.length === 0  → show "no access" error
 *   profiles.length === 1  → skip picker, route directly to that shell
 *   profiles.length  > 1   → show ProfilePicker so user can choose their context
 *
 * The chosen profile is stored in session state (not persisted across sign-outs).
 * On next login the picker appears again if the user still has multiple profiles.
 */
interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  /** Profiles assigned to this user in the permissions engine. Never add profiles
   *  client-side — this array comes from the server and is the source of truth. */
  profiles: ProfileKey[];
}

// ─── Profile metadata (display only — not access control) ────────────────────

interface ProfileMeta {
  key: ProfileKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const PROFILE_META: ProfileMeta[] = [
  {
    key: "member",
    label: "Student",
    description: "Access your actions, events, points, and campaigns.",
    icon: <Users size={20} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    key: "student-leader",
    label: "Leader",
    description: "Manage your chapter, members, and committees.",
    icon: <GraduationCap size={20} />,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
  },
  {
    key: "sales-coach",
    label: "Coach",
    description: "Chapter health, campaigns, and validation queues.",
    icon: <TrendingUp size={20} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
  },
  {
    key: "staff",
    label: "Staff",
    description: "Department dashboards, review queues, and reports.",
    icon: <Briefcase size={20} />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
  },
  {
    key: "ds-admin",
    label: "DS / Admin",
    description: "Users, roles, permissions, API keys, and audit logs.",
    icon: <Database size={20} />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
  },
  {
    key: "super-admin",
    label: "Super Admin",
    description: "Full platform access and emergency controls.",
    icon: <ShieldAlert size={20} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-700",
  },
];

// ─── Mock authenticated users (replace with real API call in production) ──────

/**
 * MOCK DATA — for prototyping only.
 *
 * In production, remove this object entirely. The AuthenticatedUser object
 * is returned by the backend after POST /auth/login and should never be
 * constructed or augmented client-side.
 *
 * Each entry simulates a different user with a different set of assigned
 * profiles, so the profile picker behavior can be tested in this mockup.
 */
const MOCK_USERS: Record<string, AuthenticatedUser> = {
  // Multi-profile user — will see the profile picker
  "jordan@demo.com": {
    id: "u_001",
    name: "Jordan Davis",
    email: "jordan@demo.com",
    profiles: ["member", "student-leader"],
  },
  // Coach who is also a staff member — will see the profile picker
  "marcus@demo.com": {
    id: "u_002",
    name: "Marcus Webb",
    email: "marcus@demo.com",
    profiles: ["sales-coach", "staff"],
  },
  // Admin with all access — will see the full picker
  "admin@demo.com": {
    id: "u_003",
    name: "Alex Kim",
    email: "admin@demo.com",
    profiles: ["staff", "ds-admin", "super-admin"],
  },
  // Single-profile user — skips picker, goes straight to their shell
  "maya@demo.com": {
    id: "u_004",
    name: "Maya Patel",
    email: "maya@demo.com",
    profiles: ["member"],
  },
};

// ─── Login page ───────────────────────────────────────────────────────────────

function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthenticatedUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      /**
       * PRODUCTION REPLACEMENT:
       * Replace this block with a real POST /auth/login call.
       * On success, the server returns an AuthenticatedUser with their assigned
       * profiles. Pass that object to onAuthenticated() — do not construct it here.
       *
       *   const res = await fetch("/auth/login", { method: "POST", body: ... });
       *   const { user } = await res.json();
       *   onAuthenticated(user);
       */
      const normalizedEmail = email.trim().toLowerCase();
      const mockUser = MOCK_USERS[normalizedEmail];
      if (mockUser && password.length >= 1) {
        onAuthenticated(mockUser);
      } else {
        setLoading(false);
        setError(
          "Invalid email or password. Try jordan@demo.com, marcus@demo.com, admin@demo.com, or maya@demo.com."
        );
      }
    }, 900);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#0d1117",
      }}
    >
      {/* subtle ambient glow behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(184,37,58,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[360px]">
        {/* logo + wordmark */}
        <div className="flex flex-col items-center mb-8">
          <ImageWithFallback
            src={medlifeLogo}
            alt="myMEDLIFE logo"
            className="w-20 h-20 object-contain mb-5"
            style={{ filter: "drop-shadow(0 0 18px rgba(184,37,58,0.45))" }}
          />
          <h1
            className="text-3xl font-extrabold tracking-tight text-white"
          >
            myMEDLIFE
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#6b7280" }}>
            Sign in to your workspace
          </p>
        </div>

        {/* card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-5"
          style={{
            background: "#161b22",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          }}
        >
          {/* email */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
              style={{ color: "#6b7280" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
              style={{
                background: "#0d1117",
                border: "1.5px solid rgba(255,255,255,0.1)",
                color: "#f3f4f6",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#b8253a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "#6b7280" }}
              >
                Password
              </label>
              <button
                type="button"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "#b8253a" }}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
              style={{
                background: "#0d1117",
                border: "1.5px solid rgba(255,255,255,0.1)",
                color: "#f3f4f6",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#b8253a")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {error && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{
                color: "#fca5a5",
                background: "rgba(184,37,58,0.15)",
                border: "1px solid rgba(184,37,58,0.3)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold text-sm rounded-xl py-3 text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            style={{ background: "#b8253a" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#a01f32")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#b8253a")}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#374151" }}>
          &copy; {new Date().getFullYear()} myMEDLIFE. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Profile picker ───────────────────────────────────────────────────────────

/**
 * ProfilePicker is shown when an authenticated user has more than one profile.
 * It renders only the profiles present in `user.profiles` — never all profiles.
 *
 * BACKEND CONTRACT (for Codex):
 * The list of selectable profiles comes exclusively from user.profiles (returned
 * by the auth endpoint). Do not add, filter, or reorder profiles client-side
 * based on any other condition. If a profile should be hidden, remove it from
 * the server response, not here.
 *
 * After the user picks a profile, call onSelect(profileKey). The shell router
 * maps that key to the correct app shell. The chosen profile is held in React
 * state for the session duration; signing out clears it.
 */
function ProfilePicker({
  user,
  onSelect,
  onSignOut,
}: {
  user: AuthenticatedUser;
  onSelect: (profile: ProfileKey) => void;
  onSignOut: () => void;
}) {
  // Build the ordered list of profile metadata for only this user's assigned profiles.
  // PROFILE_META order defines display order; the user.profiles array is the access gate.
  const assignedProfiles = PROFILE_META.filter((meta) =>
    user.profiles.includes(meta.key)
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#0d1117",
      }}
    >
      {/* ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(184,37,58,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* logo + greeting */}
        <div className="flex flex-col items-center mb-8">
          <ImageWithFallback
            src={medlifeLogo}
            alt="myMEDLIFE logo"
            className="w-16 h-16 object-contain mb-4"
            style={{ filter: "drop-shadow(0 0 14px rgba(184,37,58,0.45))" }}
          />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            myMEDLIFE
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Welcome back,{" "}
            <span className="font-semibold text-white">{user.name.split(" ")[0]}</span>
          </p>
        </div>

        {/* picker card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#161b22",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="px-6 pt-5 pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>
              Choose a workspace
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#374151" }}>
              {assignedProfiles.length} profile{assignedProfiles.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <div>
            {assignedProfiles.map((meta, i) => (
              <button
                key={meta.key}
                onClick={() => onSelect(meta.key)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left group transition-colors"
                style={{
                  borderBottom:
                    i < assignedProfiles.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(184,37,58,0.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} ${meta.iconColor}`}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{meta.label}</p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                    {meta.description}
                  </p>
                </div>
                <ArrowRight
                  size={15}
                  className="shrink-0 transition-opacity opacity-20 group-hover:opacity-60"
                  style={{ color: "#b8253a" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* sign out */}
        <div className="flex justify-center mt-5">
          <button
            onClick={onSignOut}
            className="text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-60"
            style={{ color: "#374151" }}
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── shared shell chrome ──────────────────────────────────────────────────────

interface NavItem {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

function AppShell({
  role,
  navItems,
  accentColor,
  accentText,
  accentBg,
  headerBg,
  children,
  onBack,
  previewBanner,
}: {
  role: string;
  navItems: NavItem[];
  accentColor: string;
  accentText: string;
  accentBg: string;
  headerBg: string;
  children: React.ReactNode;
  onBack: () => void;
  previewBanner?: boolean;
}) {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f0f4f8" }}
    >
      {previewBanner && (
        <div className="bg-amber-400 text-amber-900 text-xs font-bold text-center py-2 tracking-wide">
          YOU ARE PREVIEWING THIS EXPERIENCE — NO ACTIONS WILL BE SUBMITTED
        </div>
      )}

      {/* topbar */}
      <header className={`${headerBg} px-6 py-3 flex items-center justify-between border-b border-white/10`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-white/60 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ← WORKSPACES
          </button>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">myMEDLIFE</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accentBg} ${accentText}`}
            >
              {role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-white/70 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* sidebar */}
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col py-4 shrink-0">
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveNav(i)}
              className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeNav === i
                  ? `${accentColor} text-white`
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="opacity-80">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeNav === i ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="mt-auto mx-3 border-t border-slate-100 pt-3">
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 w-full transition-all">
              <Settings size={15} />
              Settings
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all">
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* main */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-[#0f172a] leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Member App shell ─────────────────────────────────────────────────────────

function MemberApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "Home" },
    { icon: <ClipboardList size={15} />, label: "My Actions", badge: "4" },
    { icon: <Calendar size={15} />, label: "Events" },
    { icon: <Target size={15} />, label: "Campaigns" },
    { icon: <Star size={15} />, label: "Points" },
    { icon: <Trophy size={15} />, label: "Leaderboard" },
    { icon: <FileText size={15} />, label: "Submit Evidence" },
    { icon: <BookOpen size={15} />, label: "SLT Prep" },
    { icon: <Users size={15} />, label: "Profile" },
  ];

  return (
    <AppShell
      role="General Member"
      navItems={nav}
      accentColor="bg-emerald-500"
      accentText="text-emerald-700"
      accentBg="bg-emerald-100"
      headerBg="bg-[#0f172a]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        {/* welcome */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
          <p className="text-emerald-100 text-sm font-medium mb-1">Good morning,</p>
          <h2 className="text-2xl font-extrabold mb-1">Jordan Davis</h2>
          <p className="text-emerald-100 text-sm">
            Chapter: <span className="font-semibold text-white">Alpha Sigma — University of Texas</span>
          </p>
          <div className="mt-4 flex items-center gap-6">
            <div>
              <p className="text-emerald-200 text-xs">Total Points</p>
              <p className="text-white font-extrabold text-xl">1,240</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">Chapter Rank</p>
              <p className="text-white font-extrabold text-xl">#3</p>
            </div>
            <div>
              <p className="text-emerald-200 text-xs">Actions Due</p>
              <p className="text-white font-extrabold text-xl">4</p>
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Points" value="1,240" sub="+80 this week" icon={<Star size={16} className="text-emerald-600" />} color="bg-emerald-50" />
          <StatCard label="Actions Done" value="18/22" sub="82% complete" icon={<CheckCircle size={16} className="text-sky-600" />} color="bg-sky-50" />
          <StatCard label="Events" value="6" sub="3 upcoming" icon={<Calendar size={16} className="text-violet-600" />} color="bg-violet-50" />
          <StatCard label="Campaigns" value="2" sub="Active" icon={<Target size={16} className="text-amber-600" />} color="bg-amber-50" />
        </div>

        {/* action list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f172a]">Assigned Actions</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              4 pending
            </span>
          </div>
          {[
            { label: "Submit wellness log for May", due: "Due Jun 28", pts: "+50 pts", status: "pending" },
            { label: "Attend chapter meeting", due: "Jun 30", pts: "+75 pts", status: "upcoming" },
            { label: "Complete fundraiser pledge", due: "Jul 5", pts: "+100 pts", status: "pending" },
            { label: "Upload volunteer evidence", due: "Jul 10", pts: "+60 pts", status: "upcoming" },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${a.status === "pending" ? "bg-amber-400" : "bg-slate-300"}`} />
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{a.label}</p>
                  <p className="text-xs text-slate-400">{a.due}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{a.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── Student Leader shell ─────────────────────────────────────────────────────

function StudentLeaderApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "Dashboard" },
    { icon: <Users size={15} />, label: "Members", badge: "42" },
    { icon: <UserCheck size={15} />, label: "Committees" },
    { icon: <Calendar size={15} />, label: "Events" },
    { icon: <ClipboardList size={15} />, label: "Actions" },
    { icon: <CheckCircle size={15} />, label: "Attendance" },
    { icon: <FileText size={15} />, label: "Evidence Review", badge: "7" },
    { icon: <Star size={15} />, label: "Chapter Points" },
    { icon: <Target size={15} />, label: "Campaigns" },
    { icon: <Trophy size={15} />, label: "Leadership Pipeline" },
  ];

  return (
    <AppShell
      role="Student Leader"
      navItems={nav}
      accentColor="bg-violet-600"
      accentText="text-violet-700"
      accentBg="bg-violet-100"
      headerBg="bg-[#3b0764]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#0f172a]">Chapter Dashboard</h2>
          <p className="text-sm text-slate-500">Alpha Sigma · University of Texas · Spring 2025</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Members" value="42" sub="3 pending approval" icon={<Users size={16} className="text-violet-600" />} color="bg-violet-50" />
          <StatCard label="Chapter Points" value="8,340" sub="+340 this week" icon={<Trophy size={16} className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Event Attendance" value="87%" sub="Last 4 events" icon={<CheckCircle size={16} className="text-emerald-600" />} color="bg-emerald-50" />
          <StatCard label="Evidence Queue" value="7" sub="Needs review" icon={<FileText size={16} className="text-sky-600" />} color="bg-sky-50" />
        </div>

        {/* member table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f172a]">Members</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                <Filter size={11} /> Filter
              </button>
              <button className="flex items-center gap-1.5 text-xs text-white bg-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
                <Plus size={11} /> Add Member
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Points</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Jordan Davis", role: "President", pts: 1240, status: "Active" },
                { name: "Maya Patel", role: "VP Events", pts: 980, status: "Active" },
                { name: "Chris Lee", role: "Treasurer", pts: 840, status: "Active" },
                { name: "Sofia Ruiz", role: "Committee Chair", pts: 760, status: "Active" },
                { name: "Tyler Nguyen", role: "Member", pts: 420, status: "Pending" },
              ].map((m, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0f172a]">{m.name}</td>
                  <td className="px-5 py-3 text-slate-500">{m.role}</td>
                  <td className="px-5 py-3 font-semibold text-violet-700">{m.pts.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Sales Coach shell ────────────────────────────────────────────────────────

function SalesCoachApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "Command Center" },
    { icon: <MapPin size={15} />, label: "Coach Portfolio" },
    { icon: <Activity size={15} />, label: "Chapter Health" },
    { icon: <Target size={15} />, label: "Campaign Readiness" },
    { icon: <AlertTriangle size={15} />, label: "Risk Flags", badge: "3" },
    { icon: <ClipboardList size={15} />, label: "Validation Tasks", badge: "9" },
    { icon: <FileText size={15} />, label: "Coach Notes" },
    { icon: <BarChart2 size={15} />, label: "Performance" },
    { icon: <Eye size={15} />, label: "Experience Preview" },
  ];

  return (
    <AppShell
      role="Sales Coach"
      navItems={nav}
      accentColor="bg-amber-500"
      accentText="text-amber-700"
      accentBg="bg-amber-100"
      headerBg="bg-[#78350f]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#0f172a]">Command Center</h2>
            <p className="text-sm text-slate-500">Portfolio: 8 chapters · Region: Southwest</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
            <Eye size={14} /> View As Member
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Chapters" value="8" sub="2 at risk" icon={<MapPin size={16} className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Risk Flags" value="3" sub="Requires action" icon={<AlertTriangle size={16} className="text-red-600" />} color="bg-red-50" />
          <StatCard label="Validation Queue" value="9" sub="Pending review" icon={<ClipboardList size={16} className="text-violet-600" />} color="bg-violet-50" />
          <StatCard label="Avg Health Score" value="74%" sub="↑ 3% this month" icon={<Activity size={16} className="text-emerald-600" />} color="bg-emerald-50" />
        </div>

        {/* chapter health table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f172a]">Chapter Health Overview</h3>
            <button className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
              <Download size={11} /> Export
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Chapter</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Health</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Campaign</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Risk</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Alpha Sigma — UT Austin", health: 91, campaign: "Ready", risk: "Low" },
                { name: "Beta Theta — Texas A&M", health: 78, campaign: "In Progress", risk: "Medium" },
                { name: "Gamma Kappa — Rice", health: 55, campaign: "Delayed", risk: "High" },
                { name: "Delta Lambda — SMU", health: 82, campaign: "Ready", risk: "Low" },
                { name: "Epsilon Nu — Baylor", health: 63, campaign: "Not Started", risk: "High" },
              ].map((c, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#0f172a]">{c.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.health >= 80 ? "bg-emerald-500" : c.health >= 65 ? "bg-amber-400" : "bg-red-500"}`}
                          style={{ width: `${c.health}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{c.health}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.campaign === "Ready" ? "bg-emerald-100 text-emerald-700" : c.campaign === "In Progress" ? "bg-sky-100 text-sky-700" : c.campaign === "Delayed" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {c.campaign}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.risk === "Low" ? "bg-emerald-100 text-emerald-700" : c.risk === "Medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {c.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Staff shell ──────────────────────────────────────────────────────────────

function StaffApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "Workspace" },
    { icon: <BarChart2 size={15} />, label: "Dashboards" },
    { icon: <ClipboardList size={15} />, label: "Review Queues", badge: "12" },
    { icon: <FileText size={15} />, label: "Content Review" },
    { icon: <Target size={15} />, label: "Campaign View" },
    { icon: <PieChart size={15} />, label: "Department Reports" },
    { icon: <Eye size={15} />, label: "Experience Preview" },
  ];

  return (
    <AppShell
      role="Non-Sales Staff"
      navItems={nav}
      accentColor="bg-sky-600"
      accentText="text-sky-700"
      accentBg="bg-sky-100"
      headerBg="bg-[#0c4a6e]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#0f172a]">Staff Workspace</h2>
          <p className="text-sm text-slate-500">Department: Member Experience · Q2 2025</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Review Queue" value="12" sub="4 urgent" icon={<ClipboardList size={16} className="text-sky-600" />} color="bg-sky-50" />
          <StatCard label="Content Pending" value="5" sub="Awaiting approval" icon={<FileText size={16} className="text-violet-600" />} color="bg-violet-50" />
          <StatCard label="Active Campaigns" value="3" sub="Visible to dept." icon={<Target size={16} className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Reports" value="8" sub="Generated this month" icon={<PieChart size={16} className="text-emerald-600" />} color="bg-emerald-50" />
        </div>

        {/* review queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f172a]">Review Queue</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">12 items</span>
            </div>
          </div>
          {[
            { title: "Spring Health Campaign — Banner Copy", type: "Content", priority: "High", assigned: "Jun 25" },
            { title: "Chapter Event Proof — Alpha Sigma", type: "Evidence", priority: "Medium", assigned: "Jun 24" },
            { title: "Member Onboarding Email Draft", type: "Content", priority: "Low", assigned: "Jun 23" },
            { title: "Fundraiser Results Verification", type: "Evidence", priority: "High", assigned: "Jun 22" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.type === "Content" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                  {item.type}
                </div>
                <p className="text-sm font-medium text-[#0f172a]">{item.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.priority === "High" ? "bg-red-100 text-red-700" : item.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {item.priority}
                </span>
                <span className="text-xs text-slate-400">{item.assigned}</span>
                <button className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors">Review →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ─── DS Admin shell ───────────────────────────────────────────────────────────

function DSAdminApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "System Overview" },
    { icon: <Users size={15} />, label: "Users & Roles" },
    { icon: <Lock size={15} />, label: "Permissions" },
    { icon: <UserCheck size={15} />, label: "Committees" },
    { icon: <FileText size={15} />, label: "Campaign SOP Builder" },
    { icon: <Key size={15} />, label: "API Keys" },
    { icon: <Terminal size={15} />, label: "MCP Settings" },
    { icon: <Zap size={15} />, label: "Automation Outbox" },
    { icon: <Flag size={15} />, label: "Feature Flags" },
    { icon: <Activity size={15} />, label: "System Health" },
    { icon: <ClipboardList size={15} />, label: "Audit Logs" },
  ];

  return (
    <AppShell
      role="DS Admin"
      navItems={nav}
      accentColor="bg-purple-600"
      accentText="text-purple-700"
      accentBg="bg-purple-100"
      headerBg="bg-[#2e1065]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        {/* security badge */}
        <div className="flex items-center gap-3 bg-purple-950/10 border border-purple-200 rounded-xl px-5 py-3">
          <Lock size={16} className="text-purple-600" />
          <p className="text-sm font-semibold text-purple-800">
            Restricted access — step-up authentication required for sensitive operations. All actions are
            logged.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#0f172a]">System Overview</h2>
          <p className="text-sm text-slate-500">DS Admin Backend · Audit-heavy environment</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value="3,841" sub="12 added today" icon={<Users size={16} className="text-purple-600" />} color="bg-purple-50" />
          <StatCard label="Active Roles" value="6" sub="0 pending changes" icon={<Lock size={16} className="text-sky-600" />} color="bg-sky-50" />
          <StatCard label="API Keys" value="14" sub="2 expiring soon" icon={<Key size={16} className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Audit Events" value="2,190" sub="Last 24 hours" icon={<ClipboardList size={16} className="text-slate-600" />} color="bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* system health */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0f172a]">System Health</h3>
            </div>
            {[
              { service: "Auth Engine", status: "Operational", uptime: "99.99%" },
              { service: "Database (Primary)", status: "Operational", uptime: "100%" },
              { service: "Automation Worker", status: "Degraded", uptime: "94.2%" },
              { service: "MCP Integration", status: "Operational", uptime: "99.8%" },
              { service: "Evidence Storage", status: "Operational", uptime: "99.95%" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                <p className="text-sm font-medium text-[#0f172a]">{s.service}</p>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === "Operational" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {s.status}
                  </span>
                  <span
                    className="text-xs font-mono text-slate-400"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {s.uptime}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* recent audit */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0f172a]">Recent Audit Events</h3>
              <button className="text-xs text-purple-600 font-semibold hover:text-purple-800 transition-colors">View all →</button>
            </div>
            {[
              { action: "ROLE_UPDATED", user: "admin@medlife.org", time: "2 min ago" },
              { action: "API_KEY_CREATED", user: "dsadmin@medlife.org", time: "14 min ago" },
              { action: "PERMISSION_REVOKED", user: "admin@medlife.org", time: "1 hr ago" },
              { action: "FEATURE_FLAG_TOGGLED", user: "sys-automation", time: "2 hr ago" },
              { action: "USER_SUSPENDED", user: "admin@medlife.org", time: "3 hr ago" },
            ].map((e, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p
                    className="text-xs font-mono font-semibold text-purple-700"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {e.action}
                  </p>
                  <p className="text-xs text-slate-400">{e.user}</p>
                </div>
                <span className="text-xs text-slate-400">{e.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Super Admin shell ────────────────────────────────────────────────────────

function SuperAdminApp({ onBack }: { onBack: () => void }) {
  const nav: NavItem[] = [
    { icon: <Home size={15} />, label: "Platform Control" },
    { icon: <ShieldAlert size={15} />, label: "Breakglass Access" },
    { icon: <AlertTriangle size={15} />, label: "Danger Zone" },
    { icon: <Activity size={15} />, label: "Environment Controls" },
    { icon: <Users size={15} />, label: "All Users" },
    { icon: <Lock size={15} />, label: "Impersonation", badge: "SA" },
    { icon: <ClipboardList size={15} />, label: "Full Audit Log" },
    { icon: <Zap size={15} />, label: "Emergency Tools" },
    { icon: <Terminal size={15} />, label: "Debug Console" },
  ];

  return (
    <AppShell
      role="Super Admin"
      navItems={nav}
      accentColor="bg-red-600"
      accentText="text-red-700"
      accentBg="bg-red-100"
      headerBg="bg-[#450a0a]"
      onBack={onBack}
    >
      <div className="p-6 space-y-6">
        {/* danger warning */}
        <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-5 py-4">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">
              Super Admin — Full Platform Access
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              You have breakglass access. Destructive actions are irreversible. All actions are
              logged with full attribution. Step-up authentication required for emergency tools.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#0f172a]">Platform Control</h2>
            <p className="text-sm text-slate-500">
              Environment:{" "}
              <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                PRODUCTION
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
              <RefreshCw size={11} /> Staging
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
              <Zap size={11} /> Emergency Disable
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Platform Users" value="3,841" sub="Across all roles" icon={<Users size={16} className="text-red-600" />} color="bg-red-50" />
          <StatCard label="Chapters" value="156" sub="12 states" icon={<MapPin size={16} className="text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Open Audit Flags" value="2" sub="Requires review" icon={<AlertTriangle size={16} className="text-red-600" />} color="bg-red-50" />
          <StatCard label="Uptime" value="99.97%" sub="Last 30 days" icon={<Activity size={16} className="text-emerald-600" />} color="bg-emerald-50" />
        </div>

        {/* dangerous actions */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50/50 rounded-t-2xl">
            <AlertTriangle size={15} className="text-red-600" />
            <h3 className="font-bold text-red-800">Danger Zone — Destructive Actions</h3>
          </div>
          {[
            { action: "Disable platform-wide authentication", label: "Emergency Lock", color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" },
            { action: "Force all sessions to expire", label: "Revoke All Sessions", color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" },
            { action: "Set platform to maintenance mode", label: "Maintenance Mode", color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" },
            { action: "Hard-reset feature flags to defaults", label: "Reset Flags", color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0">
              <p className="text-sm text-slate-600">{item.action}</p>
              <button
                className={`text-xs font-bold border px-3 py-1.5 rounded-lg transition-colors ${item.color}`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>

        {/* impersonation / view-as */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-[#0f172a]">Experience Preview (View As)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Safe preview mode — no actions submitted. Impersonation requires SA step-up auth + audit reason.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-5">
            {[
              "General Member",
              "Action Committee Member",
              "Committee Chair",
              "Chapter President",
              "Sales Coach",
              "Traveler with SLT Prep",
            ].map((persona, i) => (
              <button
                key={i}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <Eye size={13} className="text-slate-400 shrink-0" />
                {persona}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── root router ──────────────────────────────────────────────────────────────

// ─── Root router ──────────────────────────────────────────────────────────────

/**
 * App manages the top-level authentication and routing flow:
 *
 *  1. Unauthenticated  →  LoginPage
 *  2. Authenticated, 1 profile  →  shell directly (no picker)
 *  3. Authenticated, N profiles →  ProfilePicker  →  shell
 *
 * `currentUser` holds the server-returned AuthenticatedUser for the session.
 * `view` drives which screen/shell is rendered.
 * Both are cleared on sign-out, returning the user to the login screen.
 */
export default function App() {
  const [view, setView] = useState<AppView>("login");
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  /** Called by LoginPage when the server confirms valid credentials. */
  function handleAuthenticated(user: AuthenticatedUser) {
    setCurrentUser(user);
    if (user.profiles.length === 0) {
      // Should not happen if the backend is correct; show login with error in prod.
      setView("login");
    } else if (user.profiles.length === 1) {
      // Single profile — skip picker entirely.
      setView(user.profiles[0]);
    } else {
      // Multiple profiles — let the user choose their context.
      setView("pick-profile");
    }
  }

  /** Called by ProfilePicker or app-shell "switch profile" actions. */
  function handleProfileSelected(profile: ProfileKey) {
    setView(profile);
  }

  /** Clears session and returns to login. */
  function handleSignOut() {
    setCurrentUser(null);
    setView("login");
  }

  if (view === "login") {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  if (view === "pick-profile" && currentUser) {
    return (
      <ProfilePicker
        user={currentUser}
        onSelect={handleProfileSelected}
        onSignOut={handleSignOut}
      />
    );
  }

  // App shells — each receives onBack which returns to the profile picker
  // (or login if the user only has one profile, in which case pick-profile is skipped).
  const backDestination: AppView =
    currentUser && currentUser.profiles.length > 1 ? "pick-profile" : "login";
  const onBack = () => setView(backDestination);

  if (view === "member") return <MemberApp onBack={onBack} />;
  if (view === "student-leader") return <StudentLeaderApp onBack={onBack} />;
  if (view === "sales-coach") return <SalesCoachApp onBack={onBack} />;
  if (view === "staff") return <StaffApp onBack={onBack} />;
  if (view === "ds-admin") return <DSAdminApp onBack={onBack} />;
  if (view === "super-admin") return <SuperAdminApp onBack={onBack} />;

  return null;
}
