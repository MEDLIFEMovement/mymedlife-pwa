import { useState } from "react";
import {
  CalendarDays, MapPin, Users, QrCode, Star, CheckCircle2,
  Plus, Share2, ChevronRight, ArrowLeft, Copy, Download,
  BarChart2, Clock, Zap, Bell, Home, ClipboardList,
  Award, ChevronDown, X, Check, Wifi, AlertCircle, RefreshCw,
  UserCheck, Eye, Send, ToggleLeft, ToggleRight
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "student" | "leader" | "staff";
type Screen =
  | "student-feed" | "event-detail" | "rsvp-confirm" | "checkin" | "points-earned"
  | "leader-dashboard" | "create-event" | "qr-generated" | "share-feed" | "manage-event"
  | "staff-view";

// ─── Fake QR Code SVG ─────────────────────────────────────────────────────────
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
  const cols = 21;
  const rows = 21;
  const cell = size / cols;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#0D1B2A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: "teal" | "amber" | "green" | "slate" | "red" }) {
  const styles = {
    teal: "bg-[#E0F2F7] text-[#0E7490]",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-500",
    red: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[color]}`}>
      {label}
    </span>
  );
}

// ─── Points Pill ───────────────────────────────────────────────────────────────
function PointsPill({ pts }: { pts: number }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      {pts} pts
    </span>
  );
}

// ─── Screen Wrapper ────────────────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm mx-auto bg-[#F0F6F9] min-h-screen flex flex-col">
      {children}
    </div>
  );
}

// ─── Top Nav ───────────────────────────────────────────────────────────────────
function TopNav({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-border sticky top-0 z-10">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {onBack && (
          <button onClick={onBack} className="text-[#0E7490] -ml-1 p-1 rounded-lg hover:bg-[#E0F2F7] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <span className="font-bold text-[#0D1B2A] text-base flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </span>
        {action}
      </div>
    </div>
  );
}

// ─── Screen: Student Feed (B1) ─────────────────────────────────────────────────
function StudentFeed({ nav }: { nav: (s: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="bg-[#0E7490] px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/70 text-sm font-medium">Welcome back,</span>
          <button className="relative p-1">
            <Bell className="w-5 h-5 text-white/80" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
          </button>
        </div>
        <h1 className="text-white text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Marcus Rivera
        </h1>
        <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="bg-amber-400 rounded-xl p-2">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium">My Points Balance</div>
            <div className="text-white text-xl font-extrabold">240 pts</div>
          </div>
          <button className="ml-auto text-white/80 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 flex-1 pb-24">
        {/* Upcoming event card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E7490] to-[#0EA5C9] px-4 py-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="text-white text-xs font-bold tracking-wide uppercase">Upcoming Event</span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-bold text-[#0D1B2A] text-base leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Community Health Fair
                </h2>
                <p className="text-[#5A7384] text-sm mt-0.5">UCF MEDLIFE Chapter</p>
              </div>
              <Badge label="RSVP Open" color="teal" />
            </div>
            <div className="space-y-1.5 text-sm text-[#5A7384]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#0E7490]" />
                <span>Sat, July 12 · 10:00 AM – 2:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0E7490]" />
                <span>Student Union, Room 220</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0E7490]" />
                <span>Organized by Sofia Chen</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <PointsPill pts={10} />
              <span className="text-xs text-[#5A7384]">Check in to earn points</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => nav("event-detail")}
                className="flex-1 bg-[#0E7490] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#0B6580] transition-colors"
              >
                RSVP
              </button>
              <button
                onClick={() => nav("event-detail")}
                className="flex-1 bg-[#E0F2F7] text-[#0E7490] text-sm font-bold py-2.5 rounded-xl hover:bg-[#C7E8F2] transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* More events */}
        <h3 className="text-[#0D1B2A] font-bold mt-6 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Chapter Feed
        </h3>
        {[
          { title: "First Aid Training Workshop", date: "July 18 · 9 AM", pts: 15, status: "RSVP Open" },
          { title: "Blood Drive Volunteer Day", date: "July 22 · 8 AM", pts: 20, status: "Upcoming" },
        ].map((ev) => (
          <div key={ev.title} className="bg-white rounded-2xl border border-border p-4 mb-3 flex items-center gap-3">
            <div className="bg-[#E0F2F7] rounded-xl p-2.5 shrink-0">
              <CalendarDays className="w-5 h-5 text-[#0E7490]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#0D1B2A] text-sm leading-tight truncate">{ev.title}</div>
              <div className="text-[#5A7384] text-xs mt-0.5">{ev.date}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <PointsPill pts={ev.pts} />
              <Badge label={ev.status} color={ev.status === "RSVP Open" ? "teal" : "slate"} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 w-full max-w-sm left-1/2 -translate-x-1/2 bg-white border-t border-border px-6 py-3 flex justify-around">
        {[
          { icon: Home, label: "Home", active: true },
          { icon: CalendarDays, label: "Events" },
          { icon: Award, label: "Points" },
          { icon: ClipboardList, label: "More" },
        ].map(({ icon: Icon, label, active }) => (
          <button key={label} className={`flex flex-col items-center gap-0.5 ${active ? "text-[#0E7490]" : "text-[#5A7384]"}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ─── Screen: Event Detail (B2) ────────────────────────────────────────────────
function EventDetail({ nav }: { nav: (s: Screen) => void }) {
  const [rsvpd, setRsvpd] = useState(false);
  return (
    <PhoneFrame>
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-[#0E7490] to-[#0D5F78] flex items-center justify-center">
          <div className="text-center text-white">
            <div className="bg-white/20 rounded-full p-4 inline-flex mb-2">
              <CalendarDays className="w-8 h-8" />
            </div>
          </div>
        </div>
        <button
          onClick={() => nav("student-feed")}
          className="absolute top-12 left-4 bg-black/20 backdrop-blur-sm text-white rounded-full p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 pb-24 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h1 className="font-extrabold text-[#0D1B2A] text-xl leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Community Health Fair
            </h1>
            <Badge label="RSVP Open" color="teal" />
          </div>
          <div className="space-y-2 text-sm text-[#5A7384]">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-[#0E7490] shrink-0" />
              <span>Saturday, July 12 · 10:00 AM – 2:00 PM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#0E7490] shrink-0" />
              <span>Student Union, Room 220 · UCF Campus</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#0E7490] shrink-0" />
              <span>Organized by <span className="text-[#0E7490] font-semibold">Sofia Chen</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-bold text-[#0D1B2A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>About this event</h3>
          <p className="text-sm text-[#5A7384] leading-relaxed">
            Join us for our chapter's annual Community Health Fair! We'll be offering free blood pressure screenings, nutrition counseling, and health education booths. All members are encouraged to attend and help serve our local community.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Points Available</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="text-amber-700 text-xs font-semibold mb-0.5">Attendance Points</div>
              <div className="text-[#0D1B2A] text-2xl font-extrabold">10</div>
              <div className="text-[#5A7384] text-xs">check-in required</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="text-amber-700 text-xs font-semibold mb-0.5">Organizer Points</div>
              <div className="text-[#0D1B2A] text-2xl font-extrabold">50</div>
              <div className="text-[#5A7384] text-xs">for event leaders</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-[#0D1B2A]">RSVPs so far</span>
            <span className="text-[#0E7490] font-bold text-sm">24 going</span>
          </div>
          <div className="flex -space-x-2 mt-2">
            {["MR", "JT", "AL", "SC", "DK", "PW"].map((i, idx) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold
                ${["bg-teal-500","bg-blue-500","bg-violet-500","bg-emerald-500","bg-orange-400","bg-pink-500"][idx]}`}>
                {i}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-[#E0F2F7] flex items-center justify-center text-[#0E7490] text-[10px] font-bold">
              +18
            </div>
          </div>
        </div>

        {rsvpd && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              {"You'll earn 10 points when you check in at the event."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => { setRsvpd(true); nav("rsvp-confirm"); }}
            className={`w-full py-3.5 rounded-2xl text-base font-bold transition-colors ${rsvpd ? "bg-emerald-100 text-emerald-700" : "bg-[#0E7490] text-white hover:bg-[#0B6580]"}`}
          >
            {rsvpd ? "✓ You're RSVP'd" : "RSVP to Event"}
          </button>
          <div className="flex gap-2">
            <button className="flex-1 bg-white border border-border text-[#5A7384] text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#E0F2F7] transition-colors">
              <CalendarDays className="w-4 h-4" /> Add to Calendar
            </button>
            <button className="flex-1 bg-white border border-border text-[#5A7384] text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#E0F2F7] transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── Screen: RSVP Confirmation (B3) ──────────────────────────────────────────
function RsvpConfirm({ nav }: { nav: (s: Screen) => void }) {
  return (
    <PhoneFrame>
      <TopNav title="" onBack={() => nav("event-detail")} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#0D1B2A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {"You're RSVP'd!"}
        </h1>
        <p className="text-[#5A7384] text-sm mb-8">
          {"We'll see you there. Don't forget to check in when you arrive to earn your points."}
        </p>

        <div className="w-full bg-white rounded-2xl border border-border p-4 mb-4 text-left">
          <h3 className="font-bold text-[#0D1B2A] text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Event Summary</h3>
          <div className="space-y-2 text-sm text-[#5A7384]">
            <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#0E7490]" /><span>Sat, July 12 · 10:00 AM</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#0E7490]" /><span>Student Union, Room 220</span></div>
          </div>
        </div>

        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="font-bold text-[#0D1B2A] text-sm">Attend and check in to earn</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 ml-7">10 points</div>
          <p className="text-xs text-amber-700 ml-7 mt-1">Scan the event QR code when you arrive</p>
        </div>

        <div className="bg-[#E0F2F7] rounded-2xl p-3 w-full mb-8 flex items-start gap-2">
          <QrCode className="w-5 h-5 text-[#0E7490] shrink-0 mt-0.5" />
          <p className="text-sm text-[#0E7490] font-medium">
            Scan the event QR code at check-in to confirm your attendance.
          </p>
        </div>

        <div className="w-full space-y-3">
          <button onClick={() => nav("checkin")} className="w-full bg-[#0E7490] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0B6580] transition-colors">
            View Event
          </button>
          <button onClick={() => nav("student-feed")} className="w-full bg-white border border-border text-[#5A7384] py-3.5 rounded-2xl font-bold hover:bg-muted transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── Screen: Check-In (B4) ────────────────────────────────────────────────────
function CheckIn({ nav }: { nav: (s: Screen) => void }) {
  const [checkedIn, setCheckedIn] = useState(false);
  return (
    <PhoneFrame>
      <TopNav title="Check In" onBack={() => nav("rsvp-confirm")} />
      <div className="flex-1 flex flex-col px-4 py-6">
        {!checkedIn ? (
          <>
            <div className="bg-white rounded-2xl border border-border p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Badge label="RSVP'd" color="green" />
              </div>
              <h2 className="font-extrabold text-[#0D1B2A] text-lg mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Community Health Fair
              </h2>
              <div className="text-[#5A7384] text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Sat, July 12 · 10:00 AM – 2:00 PM
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-[#0E7490] text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" /> Scan QR Code at Event
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-border mb-5">
                <QRCodeSVG size={180} />
              </div>
              <p className="text-[#5A7384] text-sm mb-2">
                Or tap the button below to confirm check-in
              </p>
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm mb-6">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Earn 10 points after check-in
              </div>
            </div>

            <button
              onClick={() => { setCheckedIn(true); setTimeout(() => nav("points-earned"), 1800); }}
              className="w-full bg-[#0E7490] text-white py-4 rounded-2xl text-base font-bold hover:bg-[#0B6580] transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" /> Confirm Check-In
            </button>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0D1B2A] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              You checked in!
            </h1>
            <div className="text-4xl font-extrabold text-amber-500 mb-1">+10 points</div>
            <p className="text-[#5A7384] text-sm">Thanks for participating!</p>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

// ─── Screen: Points Earned (B5) ───────────────────────────────────────────────
function PointsEarned({ nav }: { nav: (s: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 px-4 pt-14 pb-10 text-center">
          <div className="text-5xl mb-2">🎉</div>
          <div className="text-white font-extrabold text-5xl mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>+10</div>
          <div className="text-amber-100 text-lg font-bold">Points Earned</div>
        </div>

        <div className="px-4 -mt-6 flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 mb-4">
            <div className="text-xs text-[#5A7384] font-semibold mb-0.5">Event Attended</div>
            <div className="font-bold text-[#0D1B2A]">Community Health Fair</div>
            <div className="text-[#5A7384] text-sm">Sat, July 12 · UCF Chapter</div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#5A7384] font-semibold">Updated Balance</div>
                <div className="text-3xl font-extrabold text-[#0D1B2A] mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>250 pts</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-[#E0F2F7] rounded-full overflow-hidden">
              <div className="h-full bg-[#0E7490] rounded-full" style={{ width: "50%" }} />
            </div>
            <div className="flex justify-between text-xs text-[#5A7384] mt-1">
              <span>250 / 500 pts</span>
              <span>Next reward at 500</span>
            </div>
          </div>

          <div className="bg-[#E0F2F7] rounded-2xl p-4 mb-6">
            <div className="text-xs font-bold text-[#0E7490] uppercase tracking-wide mb-2">Chapter Leaderboard</div>
            {[
              { name: "Alex Kim", pts: 380 },
              { name: "Sofia Chen", pts: 310 },
              { name: "Marcus Rivera", pts: 250, me: true },
            ].map((p, i) => (
              <div key={p.name} className={`flex items-center gap-3 py-2 ${p.me ? "font-bold text-[#0E7490]" : "text-[#5A7384]"}`}>
                <span className="text-sm w-5 text-center">{i + 1}</span>
                <span className="flex-1 text-sm">{p.name} {p.me && "(you)"}</span>
                <PointsPill pts={p.pts} />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={() => nav("student-feed")} className="w-full bg-[#0E7490] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0B6580] transition-colors">
              View All Points
            </button>
            <button onClick={() => nav("student-feed")} className="w-full bg-white border border-border text-[#5A7384] py-3.5 rounded-2xl font-bold hover:bg-muted transition-colors">
              Back to Events
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── Screen: Leader Dashboard (A1) ────────────────────────────────────────────
function LeaderDashboard({ nav }: { nav: (s: Screen) => void }) {
  const events = [
    { title: "Community Health Fair", date: "Jul 12", rsvps: 24, attendance: null, pts: 10, status: "RSVP Open" },
    { title: "First Aid Training", date: "Jul 18", rsvps: 14, attendance: null, pts: 15, status: "Shared" },
    { title: "Spring Blood Drive", date: "Jun 20", rsvps: 31, attendance: 28, pts: 20, status: "Completed" },
  ];
  return (
    <div className="bg-[#F0F6F9] min-h-screen pb-8">
      <div className="bg-[#0E7490] px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-white/70 text-sm">UCF MEDLIFE Chapter</div>
            <h1 className="text-white text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chapter Events</h1>
          </div>
          <button
            onClick={() => nav("create-event")}
            className="bg-white text-[#0E7490] font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-[#E0F2F7] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: "Upcoming", value: "4" },
            { label: "RSVPs", value: "69" },
            { label: "Attended", value: "28" },
            { label: "Pts Awarded", value: "560" },
          ].map((m) => (
            <div key={m.label} className="bg-white/15 rounded-xl px-2 py-2.5 text-center">
              <div className="text-white font-extrabold text-lg">{m.value}</div>
              <div className="text-white/70 text-[10px] font-medium leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto">
        {events.map((ev) => (
          <div key={ev.title} className="bg-white rounded-2xl border border-border shadow-sm mb-3 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-[#0D1B2A] leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ev.title}</h3>
                  <div className="text-[#5A7384] text-xs mt-0.5 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> {ev.date}
                    <MapPin className="w-3.5 h-3.5 ml-1" /> Student Union
                  </div>
                </div>
                <Badge
                  label={ev.status}
                  color={ev.status === "Completed" ? "slate" : ev.status === "RSVP Open" ? "teal" : "amber"}
                />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-[#5A7384]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ev.rsvps} RSVPs</span>
                </div>
                {ev.attendance !== null && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{ev.attendance} attended</span>
                  </div>
                )}
                <PointsPill pts={ev.pts} />
              </div>
            </div>
            <div className="border-t border-border px-4 py-2.5 flex gap-2">
              <button
                onClick={() => nav("manage-event")}
                className="flex-1 bg-[#0E7490] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#0B6580] transition-colors"
              >
                Manage
              </button>
              <button
                onClick={() => nav("share-feed")}
                className="flex-1 bg-[#E0F2F7] text-[#0E7490] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-[#C7E8F2] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button
                onClick={() => nav("qr-generated")}
                className="flex-1 bg-[#E0F2F7] text-[#0E7490] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-[#C7E8F2] transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" /> QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Create Event (A2) ────────────────────────────────────────────────
function CreateEvent({ nav }: { nav: (s: Screen) => void }) {
  const [rsvpToggle, setRsvpToggle] = useState(true);
  const [checkinToggle, setCheckinToggle] = useState(true);
  return (
    <div className="bg-[#F0F6F9] min-h-screen">
      <TopNav title="Create Event" onBack={() => nav("leader-dashboard")} />
      <div className="px-4 py-4 pb-32 max-w-lg mx-auto space-y-4">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Event Details</h3>
          {[
            { label: "Event Title", placeholder: "e.g. Community Health Fair" },
            { label: "Event Type", placeholder: "Community Outreach" },
            { label: "Campaign / Category", placeholder: "Health Education" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-[#5A7384] block mb-1">{f.label}</label>
              <input className="w-full bg-[#EDF4F8] rounded-xl px-3 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30" placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        {/* Date & Location */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Date & Location</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Date", placeholder: "Jul 12, 2025" },
              { label: "Start Time", placeholder: "10:00 AM" },
              { label: "End Time", placeholder: "2:00 PM" },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-[#5A7384] block mb-1">{f.label}</label>
                <input className="w-full bg-[#EDF4F8] rounded-xl px-2.5 py-2.5 text-xs text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30" placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5A7384] block mb-1">Location</label>
            <input className="w-full bg-[#EDF4F8] rounded-xl px-3 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30" placeholder="Student Union, Room 220" />
          </div>
        </div>

        {/* Description & Organizer */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Description & Organizer</h3>
          <div>
            <label className="text-xs font-semibold text-[#5A7384] block mb-1">Description</label>
            <textarea className="w-full bg-[#EDF4F8] rounded-xl px-3 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30 resize-none" rows={3} placeholder="What is this event about?" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Event Organizer", placeholder: "Sofia Chen" },
              { label: "Committee / Group", placeholder: "E-Board" },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-[#5A7384] block mb-1">{f.label}</label>
                <input className="w-full bg-[#EDF4F8] rounded-xl px-2.5 py-2.5 text-xs text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30" placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>

        {/* Points */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Points Configuration</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <label className="text-xs font-semibold text-amber-700 block mb-1">Organizer Points</label>
              <input className="w-full bg-amber-50 rounded-lg px-2 py-1.5 text-lg font-extrabold text-[#0D1B2A] text-center focus:outline-none" defaultValue="50" />
              <div className="text-amber-600 text-[10px] text-center mt-0.5">for event leaders</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <label className="text-xs font-semibold text-amber-700 block mb-1">Attendance Points</label>
              <input className="w-full bg-amber-50 rounded-lg px-2 py-1.5 text-lg font-extrabold text-[#0D1B2A] text-center focus:outline-none" defaultValue="10" />
              <div className="text-amber-600 text-[10px] text-center mt-0.5">after check-in</div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
          <h3 className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Settings</h3>
          {[
            { label: "RSVP Required", sub: "Students must RSVP before attending", val: rsvpToggle, set: setRsvpToggle },
            { label: "Check-In Required", sub: "Students must scan QR to earn points", val: checkinToggle, set: setCheckinToggle },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#0D1B2A]">{t.label}</div>
                <div className="text-xs text-[#5A7384]">{t.sub}</div>
              </div>
              <button onClick={() => t.set(!t.val)} className="shrink-0">
                {t.val
                  ? <ToggleRight className="w-8 h-8 text-[#0E7490]" />
                  : <ToggleLeft className="w-8 h-8 text-[#5A7384]" />}
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#0D1B2A]">Luma RSVP Link</div>
              <div className="text-xs text-[#5A7384]">Connect to Luma for external RSVPs</div>
            </div>
            <Badge label="Mock Mode" color="amber" />
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-border px-4 py-4 space-y-2">
          <button
            onClick={() => nav("qr-generated")}
            className="w-full bg-[#0E7490] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0B6580] transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Generate RSVP / QR Code
          </button>
          <div className="flex gap-2">
            <button className="flex-1 bg-[#E0F2F7] text-[#0E7490] py-2.5 rounded-xl font-bold text-sm hover:bg-[#C7E8F2] transition-colors">
              Save Draft
            </button>
            <button onClick={() => nav("share-feed")} className="flex-1 bg-[#E0F2F7] text-[#0E7490] py-2.5 rounded-xl font-bold text-sm hover:bg-[#C7E8F2] transition-colors flex items-center justify-center gap-1.5">
              <Send className="w-4 h-4" /> Share to Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: QR Generated (A3) ────────────────────────────────────────────────
function QRGenerated({ nav }: { nav: (s: Screen) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-[#F0F6F9] min-h-screen">
      <TopNav title="Event Created" onBack={() => nav("create-event")} />
      <div className="px-4 py-4 pb-8 max-w-lg mx-auto">
        {/* Success */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="bg-emerald-100 rounded-full p-2 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="font-bold text-emerald-800 text-sm">Event Created Successfully</div>
            <div className="text-emerald-700 text-xs">Your RSVP link and QR code are ready</div>
          </div>
        </div>

        {/* Event summary */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-bold text-[#0D1B2A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Community Health Fair</h3>
          <div className="text-[#5A7384] text-sm mt-1 space-y-1">
            <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#0E7490]" /> Sat, July 12 · 10:00 AM – 2:00 PM</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#0E7490]" /> Student Union, Room 220</div>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full bg-amber-400`} />
              <span className="text-[#5A7384]">Luma: <b className="text-amber-700">Mock</b></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[#5A7384]">RSVP: <b className="text-emerald-700">Open</b></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-[#5A7384]">Check-in: <b className="text-slate-500">Not started</b></span>
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4 text-center">
          <div className="text-sm font-bold text-[#0D1B2A] mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Check-In QR Code
          </div>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white shadow-md rounded-2xl border border-border">
              <QRCodeSVG size={180} />
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <button className="flex items-center gap-1.5 bg-[#E0F2F7] text-[#0E7490] text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#C7E8F2] transition-colors">
              <Download className="w-4 h-4" /> Download QR
            </button>
            <button className="flex items-center gap-1.5 bg-[#E0F2F7] text-[#0E7490] text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#C7E8F2] transition-colors">
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
        </div>

        {/* RSVP Link */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <div className="text-xs font-semibold text-[#5A7384] mb-1.5">Luma RSVP Link</div>
          <div className="flex items-center gap-2 bg-[#EDF4F8] rounded-xl px-3 py-2.5">
            <span className="text-[#0E7490] text-sm flex-1 font-mono truncate">lu.ma/ucf-health-fair-2025</span>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`shrink-0 transition-colors ${copied ? "text-emerald-600" : "text-[#0E7490] hover:text-[#0B6580]"}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => nav("share-feed")}
            className="w-full bg-[#0E7490] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0B6580] transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Share to Chapter Feed
          </button>
          <button
            onClick={() => nav("manage-event")}
            className="w-full bg-white border border-border text-[#5A7384] py-3 rounded-2xl font-bold hover:bg-muted transition-colors"
          >
            Go to Manage Event
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Share to Feed (A4) ────────────────────────────────────────────────
function ShareFeed({ nav }: { nav: (s: Screen) => void }) {
  const [audience, setAudience] = useState("all");
  const [posted, setPosted] = useState(false);
  return (
    <div className="bg-[#F0F6F9] min-h-screen">
      <TopNav title="Share to Chapter Feed" onBack={() => nav("qr-generated")} />
      <div className="px-4 py-4 pb-8 max-w-lg mx-auto">
        <p className="text-[#5A7384] text-sm mb-4">Preview how this event will appear in the chapter feed before posting.</p>

        {/* Preview card */}
        <div className="bg-white rounded-2xl border-2 border-[#0E7490]/20 shadow-sm mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E7490] to-[#0EA5C9] px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">SC</div>
            <div>
              <div className="text-white font-bold text-sm">Sofia Chen</div>
              <div className="text-white/70 text-[10px]">UCF MEDLIFE · Event</div>
            </div>
            <Badge label="RSVP Open" color="teal" />
          </div>
          <div className="p-4">
            <h3 className="font-extrabold text-[#0D1B2A] text-base mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Community Health Fair
            </h3>
            <div className="text-[#5A7384] text-xs space-y-1 mb-3">
              <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-[#0E7490]" /> Sat, July 12 · 10:00 AM</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#0E7490]" /> Student Union, Room 220</div>
            </div>
            <div className="text-sm text-[#5A7384] mb-3 italic">
              "Join us for our Community Health Fair. RSVP to earn points and help our chapter grow."
            </div>
            <div className="flex items-center gap-2 mb-3">
              <PointsPill pts={10} />
              <span className="text-xs text-[#5A7384]">attendance points</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-[#0E7490] text-white text-xs font-bold py-2 rounded-xl">RSVP</button>
              <button className="w-10 h-8 bg-[#EDF4F8] rounded-xl flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#0E7490]" />
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <label className="text-xs font-semibold text-[#5A7384] block mb-2">Add a Message (optional)</label>
          <textarea
            className="w-full bg-[#EDF4F8] rounded-xl px-3 py-2.5 text-sm text-[#0D1B2A] placeholder:text-[#5A7384]/60 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30 resize-none"
            rows={2}
            defaultValue="Join us for our Community Health Fair. RSVP to earn points and help our chapter grow."
          />
        </div>

        {/* Audience */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-6">
          <div className="text-xs font-semibold text-[#5A7384] mb-3">Audience</div>
          <div className="flex gap-2">
            {[
              { val: "all", label: "All Members" },
              { val: "committee", label: "Committee" },
              { val: "eboard", label: "E-Board Only" },
            ].map((a) => (
              <button
                key={a.val}
                onClick={() => setAudience(a.val)}
                className={`flex-1 text-xs font-bold py-2 rounded-xl transition-colors ${audience === a.val ? "bg-[#0E7490] text-white" : "bg-[#EDF4F8] text-[#5A7384] hover:bg-[#E0F2F7]"}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {posted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-emerald-800 text-sm">Posted to Chapter Feed!</div>
              <div className="text-emerald-700 text-xs">Members will see this in their feed now.</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setPosted(true); setTimeout(() => nav("manage-event"), 1500); }}
            className="w-full bg-[#0E7490] text-white py-3.5 rounded-2xl font-bold hover:bg-[#0B6580] transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Post to Chapter Feed
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Manage Event (A5) ────────────────────────────────────────────────
function ManageEvent({ nav }: { nav: (s: Screen) => void }) {
  const [tab, setTab] = useState<"overview" | "rsvps" | "checkins" | "points">("overview");
  const attendees = [
    { name: "Marcus Rivera", rsvp: true, checkin: true, pts: true },
    { name: "James Torres", rsvp: true, checkin: true, pts: true },
    { name: "Aisha Lee", rsvp: true, checkin: false, pts: false },
    { name: "Destiny Kim", rsvp: true, checkin: true, pts: true },
    { name: "Pedro Williams", rsvp: true, checkin: false, pts: false },
    { name: "Yuki Park", rsvp: false, checkin: false, pts: false },
  ];
  return (
    <div className="bg-[#F0F6F9] min-h-screen">
      <div className="bg-[#0E7490] px-4 pt-12 pb-5">
        <button onClick={() => nav("leader-dashboard")} className="text-white/80 hover:text-white mb-3 flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-white text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Community Health Fair</h1>
            <div className="text-white/70 text-sm mt-0.5">Sat, July 12 · Student Union</div>
          </div>
          <Badge label="RSVP Open" color="teal" />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "RSVPs", value: "24" },
            { label: "Checked In", value: "18" },
            { label: "No-shows", value: "6" },
            { label: "Pts Awarded", value: "180" },
          ].map((m) => (
            <div key={m.label} className="bg-white/15 rounded-xl px-2 py-2.5 text-center">
              <div className="text-white font-extrabold text-lg">{m.value}</div>
              <div className="text-white/70 text-[10px]">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="flex">
          {(["overview", "rsvps", "checkins", "points"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${tab === t ? "text-[#0E7490] border-b-2 border-[#0E7490]" : "text-[#5A7384]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-8">
        {tab === "overview" && (
          <>
            {/* QR + Link */}
            <div className="bg-white rounded-2xl border border-border p-4 mb-3 flex gap-4 items-center">
              <div className="shrink-0">
                <QRCodeSVG size={90} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#0D1B2A] text-sm mb-0.5">Check-In QR Code</div>
                <div className="text-[#5A7384] text-xs mb-3">Display this at your event for attendees to scan</div>
                <div className="flex gap-2">
                  <button className="text-xs font-bold text-[#0E7490] bg-[#E0F2F7] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#C7E8F2] transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button className="text-xs font-bold text-[#0E7490] bg-[#E0F2F7] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#C7E8F2] transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            </div>
            {/* Organizer points */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="font-bold text-[#0D1B2A] text-sm">Organizer Points Status</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A7384] text-sm">Sofia Chen (you)</span>
                <Badge label="50 pts earned" color="amber" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 mb-3">
              <button className="w-full text-red-500 text-sm font-bold py-1 flex items-center justify-center gap-2 hover:text-red-700 transition-colors">
                <X className="w-4 h-4" /> Close Event
              </button>
            </div>
          </>
        )}

        {(tab === "rsvps" || tab === "checkins" || tab === "points") && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 bg-[#EDF4F8] px-4 py-2 text-xs font-bold text-[#5A7384]">
              <span className="col-span-2">Student</span>
              <span className="text-center">RSVP</span>
              {tab === "checkins" && <span className="text-center">Checked In</span>}
              {tab === "rsvps" && <span className="text-center">Status</span>}
              {tab === "points" && <span className="text-center">Points</span>}
            </div>
            {attendees.map((a, i) => (
              <div key={a.name} className={`grid grid-cols-4 px-4 py-3 items-center ${i !== attendees.length - 1 ? "border-b border-border" : ""}`}>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E0F2F7] flex items-center justify-center text-[#0E7490] text-[10px] font-bold shrink-0">
                    {a.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm text-[#0D1B2A] font-medium truncate">{a.name}</span>
                </div>
                <div className="flex justify-center">
                  {a.rsvp ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex justify-center">
                  {tab === "checkins" && (a.checkin ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-400" />)}
                  {tab === "rsvps" && <Badge label={a.rsvp ? "RSVP'd" : "None"} color={a.rsvp ? "teal" : "slate"} />}
                  {tab === "points" && (a.pts ? <PointsPill pts={10} /> : <span className="text-xs text-[#5A7384]">–</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Staff View (D) ────────────────────────────────────────────────────
function StaffView({ nav }: { nav: (s: Screen) => void }) {
  const events = [
    { title: "Community Health Fair", rsvps: 24, attended: 18, pts: 180, rate: 75 },
    { title: "First Aid Training", rsvps: 14, attended: 12, pts: 180, rate: 86 },
    { title: "Spring Blood Drive", rsvps: 31, attended: 28, pts: 560, rate: 90 },
  ];
  return (
    <div className="bg-[#F0F6F9] min-h-screen">
      <div className="bg-[#0D1B2A] px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-white/50 text-sm">Staff View</div>
            <h1 className="text-white text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Chapter Overview</h1>
          </div>
          <select className="bg-white/10 text-white text-sm rounded-xl px-3 py-2 border border-white/20 focus:outline-none">
            <option>UCF MEDLIFE</option>
            <option>FIU MEDLIFE</option>
          </select>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: "Events This Month", value: "5" },
            { label: "Total RSVPs", value: "141" },
            { label: "Total Attended", value: "108" },
            { label: "Points Awarded", value: "1,620" },
          ].map((m) => (
            <div key={m.label} className="bg-white/10 rounded-xl px-2 py-2.5 text-center">
              <div className="text-white font-extrabold text-lg">{m.value}</div>
              <div className="text-white/50 text-[10px] leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-4 max-w-2xl mx-auto pb-8">
        <div className="bg-white rounded-2xl border border-border shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Events This Month</span>
            <Badge label="Sorted by attendance" color="slate" />
          </div>
          {events.map((ev, i) => (
            <div key={ev.title} className={`px-4 py-3.5 ${i !== events.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-[#0D1B2A] text-sm">{ev.title}</span>
                <span className={`text-xs font-bold ${ev.rate >= 85 ? "text-emerald-600" : ev.rate >= 70 ? "text-amber-600" : "text-red-500"}`}>
                  {ev.rate}% attendance
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#5A7384] mb-2">
                <span><b className="text-[#0D1B2A]">{ev.rsvps}</b> RSVPs</span>
                <span><b className="text-[#0D1B2A]">{ev.attended}</b> attended</span>
                <PointsPill pts={ev.pts} />
              </div>
              <div className="h-1.5 bg-[#EDF4F8] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${ev.rate >= 85 ? "bg-emerald-400" : ev.rate >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${ev.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Top students */}
        <div className="bg-white rounded-2xl border border-border shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top Engaged Students</span>
          </div>
          {[
            { name: "Alex Kim", events: 5, pts: 380 },
            { name: "Sofia Chen", events: 4, pts: 310 },
            { name: "Marcus Rivera", events: 3, pts: 250 },
          ].map((s, i) => (
            <div key={s.name} className={`flex items-center gap-3 px-4 py-3 ${i !== 2 ? "border-b border-border" : ""}`}>
              <span className="text-[#5A7384] text-sm font-bold w-4">{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-[#E0F2F7] flex items-center justify-center text-[#0E7490] text-xs font-bold shrink-0">
                {s.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#0D1B2A] text-sm">{s.name}</div>
                <div className="text-[#5A7384] text-xs">{s.events} events attended</div>
              </div>
              <PointsPill pts={s.pts} />
            </div>
          ))}
        </div>

        {/* Luma Status */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-bold text-[#0D1B2A] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Luma Integration Status</span>
            <Badge label="Mock Mode" color="amber" />
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            {[
              { label: "Events Linked", value: "5", ok: true },
              { label: "RSVPs Synced", value: "141", ok: true },
              { label: "Attendance Synced", value: "108", ok: true },
              { label: "Sync Errors", value: "0", ok: true },
              { label: "Last Sync", value: "2 min ago", ok: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[#5A7384]">{row.label}</span>
                <span className={`font-semibold ${row.ok ? "text-[#0D1B2A]" : "text-red-500"}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <button className="flex-1 text-xs font-bold text-[#0E7490] bg-[#E0F2F7] py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-[#C7E8F2] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Test Connection
            </button>
            <button className="flex-1 text-xs font-bold text-[#5A7384] bg-[#EDF4F8] py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-muted transition-colors">
              <Wifi className="w-3.5 h-3.5" /> View Sync Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Role Nav Bar ──────────────────────────────────────────────────────────────
const ROLE_SCREENS: Record<Role, { screens: Screen[]; labels: string[] }> = {
  student: {
    screens: ["student-feed", "event-detail", "rsvp-confirm", "checkin", "points-earned"],
    labels: ["Feed", "Event Detail", "RSVP'd", "Check In", "Points Earned"],
  },
  leader: {
    screens: ["leader-dashboard", "create-event", "qr-generated", "share-feed", "manage-event"],
    labels: ["Dashboard", "Create Event", "QR Ready", "Share", "Manage"],
  },
  staff: {
    screens: ["staff-view"],
    labels: ["Staff Overview"],
  },
};

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState<Role>("student");
  const [screen, setScreen] = useState<Screen>("student-feed");

  const nav = (s: Screen) => setScreen(s);

  const switchRole = (r: Role) => {
    setRole(r);
    setScreen(ROLE_SCREENS[r].screens[0]);
  };

  const roleScreens = ROLE_SCREENS[role];

  const renderScreen = () => {
    switch (screen) {
      case "student-feed": return <StudentFeed nav={nav} />;
      case "event-detail": return <EventDetail nav={nav} />;
      case "rsvp-confirm": return <RsvpConfirm nav={nav} />;
      case "checkin": return <CheckIn nav={nav} />;
      case "points-earned": return <PointsEarned nav={nav} />;
      case "leader-dashboard": return <LeaderDashboard nav={nav} />;
      case "create-event": return <CreateEvent nav={nav} />;
      case "qr-generated": return <QRGenerated nav={nav} />;
      case "share-feed": return <ShareFeed nav={nav} />;
      case "manage-event": return <ManageEvent nav={nav} />;
      case "staff-view": return <StaffView nav={nav} />;
      default: return <StudentFeed nav={nav} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top chrome */}
      <div className="bg-[#0D1B2A] px-4 pt-4 pb-3 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-4 justify-center">
          <div className="bg-[#0E7490] rounded-lg w-7 h-7 flex items-center justify-center">
            <span className="text-white font-extrabold text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>m</span>
          </div>
          <span className="text-white font-extrabold text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            my<span className="text-[#0EA5C9]">MEDLIFE</span>
          </span>
        </div>

        {/* Role switcher */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-3">
          {(["student", "leader", "staff"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${role === r ? "bg-[#0E7490] text-white shadow" : "text-white/60 hover:text-white/80"}`}
            >
              {r === "student" ? "Student" : r === "leader" ? "Leader" : "Staff"}
            </button>
          ))}
        </div>

        {/* Screen nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {roleScreens.screens.map((s, i) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${screen === s ? "bg-white text-[#0D1B2A]" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"}`}
            >
              {roleScreens.labels[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Screen area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-sm mx-auto lg:max-w-2xl">
          {renderScreen()}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
