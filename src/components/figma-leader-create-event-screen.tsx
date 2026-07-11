"use client";

/* eslint-disable react/no-unescaped-entities */

import React, { useState } from "react";
import {
  ChevronRight, Calendar, Target, Globe, Heart, Star,
  Users, BookOpen, Sparkles, Bell, Share2, Upload, CheckCircle
} from "lucide-react";
import { Activity, MessageSquare } from "lucide-react";

const BLUE = "#1A56E8";

const COMMITTEE_NAMES = [
  "Recruitment & Membership Tracking",
  "Fundraising",
  "Service Learning Prep & Awareness",
  "Marketing & Social Media",
  "Team Bonding & Social Events",
  "Safe Homes",
  "Smiles Movement",
  "MED Talks & Skills Sessions",
];

function Pill({ label, color="slate" }: { label:string; color?:string }) {
  const m: Record<string,string> = {
    blue:"bg-blue-100 text-blue-800",
    yellow:"bg-amber-100 text-amber-800",
    slate:"bg-slate-100 text-slate-600",
    green:"bg-green-100 text-green-800",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${m[color]??m.slate}`}>{label}</span>;
}

// ─── Screen 6: Events ─────────────────────────────────────────────
// ─── Create Event Form ────────────────────────────────────────────
const EVENT_TYPES = [
  { id:"info",       label:"Info / General Meeting", icon:Users,      color:"#1A56E8", desc:"Chapter updates, onboarding, all-hands" },
  { id:"fundraiser", label:"Fundraiser",             icon:Target,     color:"#16A34A", desc:"Bake sale, donation drive, campaign push" },
  { id:"recruitment",label:"Recruitment / Tabling",  icon:Star,       color:"#0891B2", desc:"Attract and sign up new members" },
  { id:"slt",        label:"SLT Promotion",          icon:Globe,      color:"#7C3AED", desc:"Promote Service-Learning Trips" },
  { id:"volunteer",  label:"Volunteer / Service",    icon:Heart,      color:"#DC2626", desc:"Community meal, local partner event" },
  { id:"workshop",   label:"Workshop / Training",    icon:BookOpen,   color:"#D97706", desc:"Skills session, leadership training" },
  { id:"social",     label:"Social Event",           icon:Sparkles,   color:"#DB2777", desc:"Community building, fun, celebration" },
  { id:"other",       label:"Other Activities",        icon:Sparkles,   color:"#64748B", desc:"Any event that doesn't fit another category" },
];

const SHARE_CHANNELS = [
  { id:"app",       label:"Chapter App Feed",  sub:"Prepare a chapter feed preview in myMEDLIFE",   icon:Bell,         color:"#1A56E8" },
  { id:"instagram", label:"Instagram",         sub:"Prepare a TEST post or story preview template",  icon:Share2,       color:"#E1306C" },
  { id:"email",     label:"Email",             sub:"Draft a chapter member email preview",           icon:Upload,       color:"#16A34A" },
  { id:"whatsapp",  label:"Text / WhatsApp",   sub:"Draft message preview copy for contacts",        icon:MessageSquare,color:"#25D366" },
];

// ── Shared form helpers ──
const inputCls = "w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors";

function FormSection({ title, children, required }: { title: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {required && <span className="text-[10px] text-red-400 font-semibold">Required</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CreateEventForm({
  onBack,
  onOpenHome,
  onOpenCommittees,
  onOpenEvents,
}: {
  onBack: () => void;
  onOpenHome?: () => void;
  onOpenCommittees?: () => void;
  onOpenEvents?: () => void;
}) {
  const [published, setPublished] = useState(false);

  // Form state
  const [eventType,    setEventType]    = useState("");
  const [name,         setName]         = useState("");
  const [description,  setDescription]  = useState("");
  const [committee,    setCommittee]    = useState("");
  const [campaign,     setCampaign]     = useState("");
  const [date,         setDate]         = useState("");
  const [startTime,    setStartTime]    = useState("");
  const [endTime,      setEndTime]      = useState("");
  const [locationType, setLocationType] = useState<"in-person"|"virtual"|"hybrid">("in-person");
  const [address,      setAddress]      = useState("");
  const [virtualLink,  setVirtualLink]  = useState("");
  const [capacity,     setCapacity]     = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [shareChannels,setShareChannels] = useState<string[]>(["app"]);
  const [waMsg,        setWaMsg]        = useState("");

  const toggleChannel = (id: string) =>
    setShareChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const chosenType = EVENT_TYPES.find(t => t.id === eventType);
  const formattedDate = date ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" }) : "";
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime ? startTime : "";

  const canPublish = name.trim() && eventType && date && startTime && committee;

  // ── Success state ──
  if (published) return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle size={40} className="text-green-500"/>
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-black text-slate-900 mb-2">TEST Event Preview Ready</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          <strong className="text-slate-800">"{name}"</strong> is ready as a TEST event preview in this route-backed leader shell.
          {shareChannels.includes("app")       && " Chapter feed preview prepared."}
          {shareChannels.includes("instagram") && " TEST Instagram template prepared."}
          {shareChannels.includes("email")     && " Email preview prepared; no email was sent."}
          {shareChannels.includes("whatsapp")  && " WhatsApp/SMS copy prepared; no message was sent."}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Luma writes, external sends, attendance follow-through, and production publishing stay blocked until explicitly approved.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          Back to Event Performance
        </button>
        <button onClick={() => { setPublished(false); setName(""); setEventType(""); setDate(""); setStartTime(""); setEndTime(""); setDescription(""); setCommittee(""); }}
          className="px-5 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors">
          Build Another TEST Event
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
            <ChevronRight size={13} className="rotate-180"/>Back to Event Performance
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-xl font-black text-slate-900">Create Event Preview</h1>
        </div>
        <button
          disabled={!canPublish}
          onClick={() => setPublished(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A56E8] text-white text-sm font-bold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          <Share2 size={14}/>Stage Event Preview
          {shareChannels.length > 0 && <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{shareChannels.length}</span>}
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        This route stages TEST event previews only. Live publishing, RSVP sharing, attendance updates, points awards, and provider writes stay blocked from this shell.
      </div>

      <div className="mb-6 rounded-2xl border border-[#bfdbfe] bg-[#eef5ff] px-4 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
              TEST Event Operations Loop
            </p>
            <h2 className="mt-2 text-base font-black text-slate-900">
              Keep event staging connected to chapter-home, committee ownership, and attendance review.
            </h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Use this create-event preview while keeping Chapter Home, Event Committees, and Event
              Performance one step away. That keeps event planning attached to the real chapter
              operating loop without turning on live Luma writes, RSVP sends, attendance updates,
              or points awards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">
            <button
              type="button"
              onClick={() => onOpenHome?.()}
              className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#f8fbff]"
            >
              Back to Chapter Home
            </button>
            <button
              type="button"
              onClick={() => onOpenCommittees?.()}
              className="inline-flex rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#f8fbff]"
            >
              Open Event Committees
            </button>
            <button
              type="button"
              onClick={() => onOpenEvents?.()}
              className="inline-flex rounded-full bg-[#1A56E8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Open Event Performance
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Left: Form ── */}
        <div className="col-span-2 space-y-6">

          {/* 1. Event Type */}
          <FormSection title="1. Event Type" required>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map(t => {
                const Icon = t.icon;
                const sel = eventType === t.id;
                return (
                  <button key={t.id} onClick={() => setEventType(t.id)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-xl border cursor-pointer text-left transition-all
                      ${sel ? "ring-2" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                    style={sel ? { borderColor: t.color, background: t.color + "0e", outline: `none`, boxShadow: `0 0 0 2px ${t.color}` } : {}}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: sel ? t.color : "#F1F5F9" }}>
                      <Icon size={15} style={{ color: sel ? "#fff" : t.color }}/>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 leading-tight">{t.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* 2. Event Details */}
          <FormSection title="2. Event Details" required>
            <div className="space-y-3">
              <Field label="Event Name" required>
                <input className={inputCls} placeholder="e.g. TEST Moving Mountains Kickoff Night"
                  value={name} onChange={e => setName(e.target.value)}/>
              </Field>
              <Field label="Description">
                <textarea className={`${inputCls} resize-none`} rows={3}
                  placeholder="Tell members what this event is about, why it matters, and what to expect…"
                  value={description} onChange={e => setDescription(e.target.value)}/>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Action Committee" required>
                  <select className={inputCls} value={committee} onChange={e => setCommittee(e.target.value)}>
                    <option value="">Select committee…</option>
                    {COMMITTEE_NAMES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Campaign Tag">
                  <select className={inputCls} value={campaign} onChange={e => setCampaign(e.target.value)}>
                    <option value="">Other Activities</option>
                    <option>Moving Mountains</option>
                    <option>Rush Month</option>
                    <option>SLT Promotion</option>
                  </select>
                </Field>
              </div>
            </div>
          </FormSection>

          {/* 3. Date & Time */}
          <FormSection title="3. Date & Time" required>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Event Date" required>
                <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)}/>
              </Field>
              <Field label="Start Time" required>
                <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)}/>
              </Field>
              <Field label="End Time">
                <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)}/>
              </Field>
            </div>
          </FormSection>

          {/* 4. Location */}
          <FormSection title="4. Location">
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {(["in-person","virtual","hybrid"] as const).map(lt => (
                <button key={lt} onClick={() => setLocationType(lt)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border capitalize
                    ${locationType===lt ? "bg-[#1A56E8] text-white border-[#1A56E8]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {lt}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {(locationType === "in-person" || locationType === "hybrid") && (
                <Field label="Address / Venue Name">
                  <input className={inputCls} placeholder="e.g. McElroy Commons, Room 204, Boston College"
                    value={address} onChange={e => setAddress(e.target.value)}/>
                </Field>
              )}
              {(locationType === "virtual" || locationType === "hybrid") && (
                <Field label="Virtual Meeting Link">
                  <input className={inputCls} placeholder="https://zoom.us/j/… or Google Meet link"
                    value={virtualLink} onChange={e => setVirtualLink(e.target.value)}/>
                </Field>
              )}
            </div>
          </FormSection>

          {/* 5. RSVP Settings */}
          <FormSection title="5. RSVP Settings">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max Capacity">
                <input type="number" className={inputCls} placeholder="Leave blank for unlimited"
                  value={capacity} onChange={e => setCapacity(e.target.value)} min={1}/>
              </Field>
              <Field label="RSVP Deadline">
                <input type="date" className={inputCls}
                  value={rsvpDeadline} onChange={e => setRsvpDeadline(e.target.value)}/>
              </Field>
            </div>
          </FormSection>

          {/* 6. Share & Publish */}
          <FormSection title="6. Share & Publish">
            <p className="text-xs text-slate-500 mb-4">Choose the launch surfaces to prepare. Staging previews create copy and links only; they do not send messages or publish to production.</p>
            <div className="space-y-3">
              {SHARE_CHANNELS.map(ch => {
                const Icon = ch.icon;
                const active = shareChannels.includes(ch.id);
                return (
                  <div key={ch.id} className={`rounded-xl border transition-all overflow-hidden ${active ? "border-transparent ring-2" : "border-slate-200 bg-white"}`}
                    style={active ? { boxShadow: `0 0 0 2px ${ch.color}`, background: ch.color + "08" } : {}}>
                    <button onClick={() => toggleChannel(ch.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: ch.color + "18" }}>
                        <Icon size={16} style={{ color: ch.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800">{ch.label}</div>
                        <div className="text-xs text-slate-400">{ch.sub}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${active ? "border-transparent" : "border-slate-300"}`}
                        style={active ? { background: ch.color } : {}}>
                        {active && <CheckCircle size={11} className="text-white"/>}
                      </div>
                    </button>

                    {/* Channel-specific options when toggled on */}
                    {active && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: ch.color + "30" }}>
                        {ch.id === "app" && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preview — TEST Chapter Feed Post</div>
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: BLUE }}>M</div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800">{name || "Event Name"}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{formattedDate || "Date TBD"}{timeRange ? ` · ${timeRange}` : ""}</div>
                                {(address || virtualLink) && <div className="text-[11px] text-slate-400 mt-0.5">{address || virtualLink}</div>}
                                <div className="flex gap-2 mt-2">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">📅 RSVP Now</span>
                                  {campaign && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">#{campaign.replace(" ","")}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {ch.id === "instagram" && (
                          <div className="mt-3 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram preview formats</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3 rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 text-center">
                                <div className="text-2xl mb-1">📸</div>
                                <div className="text-xs font-bold text-slate-700">Feed Post</div>
                                <div className="text-[10px] text-slate-400">1080 × 1080 template</div>
                                <button disabled title="Caption copying is blocked in this preview" className="mt-2 text-[10px] font-semibold px-2 py-1 bg-pink-500 text-white rounded-lg cursor-not-allowed opacity-60">Caption Copy Blocked</button>
                              </div>
                              <div className="p-3 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 text-center">
                                <div className="text-2xl mb-1">✨</div>
                                <div className="text-xs font-bold text-slate-700">Story</div>
                                <div className="text-[10px] text-slate-400">1080 × 1920 template</div>
                                <button disabled title="Caption copying is blocked in this preview" className="mt-2 text-[10px] font-semibold px-2 py-1 bg-purple-500 text-white rounded-lg cursor-not-allowed opacity-60">Caption Copy Blocked</button>
                              </div>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed">
                              📣 {name || "[Event Name]"}{"\n"}
                              📅 {formattedDate || "[Date]"}{startTime ? ` at ${startTime}` : ""}{"\n"}
                              {address ? `📍 ${address}\n` : ""}
                              RSVP link in bio 👆 | #MEDLIFE #BostonCollege{campaign ? ` #${campaign.replace(" ","")}` : ""}
                            </div>
                          </div>
                        )}

                        {ch.id === "email" && (
                          <div className="mt-3 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Preview</div>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                              <div className="bg-[#07192E] px-4 py-2.5 flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-[#1A56E8] flex items-center justify-center text-white text-[9px] font-black">M</div>
                                <span className="text-white text-[11px] font-semibold">TEST Boston College MEDLIFE</span>
                              </div>
                              <div className="px-4 py-3 space-y-1.5">
                                <div className="text-slate-400 text-[10px]">To: TEST chapter member list preview (84 recipients)</div>
                                <div className="font-bold text-slate-800">📣 New Event: {name || "[Event Name]"}</div>
                                <div className="text-slate-500 text-[11px]">Hey MEDLIFE family — you're invited to <strong>{name || "our upcoming event"}</strong>{formattedDate ? ` on ${formattedDate}` : ""}!</div>
                                {description && <div className="text-slate-500 text-[11px] italic">"{description.slice(0,100)}{description.length > 100 ? "…" : ""}"</div>}
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  {formattedDate && <span>📅 {formattedDate}</span>}
                                  {timeRange && <span>⏰ {timeRange}</span>}
                                </div>
                                {(address || virtualLink) && <div className="text-[11px] text-slate-500">📍 {address || virtualLink}</div>}
                                <button disabled title="Email RSVP links are preview-only until Luma sharing is approved" className="mt-2 px-3 py-1.5 bg-[#1A56E8] text-white text-[10px] font-bold rounded-lg">Preview RSVP Link →</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {ch.id === "whatsapp" && (
                          <div className="mt-3 space-y-2">
                            <Field label="Customize Message (optional)">
                              <textarea className={`${inputCls} resize-none`} rows={3}
                                placeholder={`Hey everyone! 👋\n\nWe have a new event coming up — ${name || "[Event Name]"}! ${formattedDate ? `It's on ${formattedDate}` : ""}${timeRange ? ` at ${timeRange}` : ""}. ${address ? `📍 ${address}` : ""}\n\nRSVP link: [link]\n\nHope to see you there! 🙌`}
                                value={waMsg} onChange={e => setWaMsg(e.target.value)}/>
                            </Field>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Preview</div>
                            <div className="bg-[#ECE5DD] rounded-xl p-3">
                              <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm max-w-xs text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                                {waMsg || `Hey everyone! 👋\n\nNew event: ${name || "[Event Name]"}${formattedDate ? `\n📅 ${formattedDate}` : ""}${timeRange ? ` at ${timeRange}` : ""}${address ? `\n📍 ${address}` : ""}\n\nRSVP link: [link] 🙌`}
                              </div>
                              <div className="text-right mt-1 text-[9px] text-slate-400">TEST preview only - no message sent</div>
                            </div>
                            <div className="flex gap-2">
                              <button disabled title="WhatsApp copy is blocked in this preview" className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 text-center">📋 Copy for WhatsApp</button>
                              <button disabled title="SMS copy is blocked in this preview" className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 text-center">💬 Copy for SMS</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </FormSection>
        </div>

        {/* ── Right: Live Preview ── */}
        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Preview header */}
              <div className="h-24 flex items-end p-4" style={{
                background: chosenType ? `linear-gradient(135deg, ${chosenType.color}dd, ${chosenType.color}88)` : "linear-gradient(135deg, #1A56E8cc, #3B82F688)"
              }}>
                <div>
                  {chosenType && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{chosenType.label}</span>
                    </div>
                  )}
                  <div className="text-white font-black text-base leading-tight">{name || "Your Event Name"}</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Date & time */}
                <div className="flex items-start gap-2.5">
                  <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{formattedDate || "Date not set"}</div>
                    <div className="text-[11px] text-slate-400">{timeRange || "Time not set"}</div>
                  </div>
                </div>
                {/* Location */}
                {(address || virtualLink) ? (
                  <div className="flex items-start gap-2.5">
                    <Activity size={14} className="text-slate-400 mt-0.5 shrink-0"/>
                    <div className="text-xs text-slate-600">{address || virtualLink}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Activity size={14}/>
                    <span className="text-xs">Location not set</span>
                  </div>
                )}
                {/* Committee & campaign */}
                <div className="flex gap-2 flex-wrap">
                  {committee && <Pill label={committee} color="blue"/>}
                  {campaign  && <Pill label={campaign}  color="yellow"/>}
                  {locationType !== "in-person" && <Pill label={locationType} color="slate"/>}
                </div>
                {/* Description */}
                {description && <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">{description}</p>}
                {/* RSVP button */}
                <button disabled title="Preview RSVP is blocked until the event is created" className="w-full py-2.5 rounded-xl font-bold text-xs text-white mt-1 cursor-default" style={{ background: chosenType?.color || BLUE }}>
                  Preview RSVP Button
                </button>
                {/* Sharing summary */}
                {shareChannels.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Previewing on</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {shareChannels.map(ch => {
                        const c = SHARE_CHANNELS.find(x => x.id === ch)!;
                        const Icon = c.icon;
                        return (
                          <div key={ch} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: c.color + "18", color: c.color }}>
                            <Icon size={10}/>{c.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Readiness checklist */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ready to stage?</div>
              <div className="space-y-1.5">
                {[
                  { label:"Event type selected",    done: !!eventType },
                  { label:"Event name added",        done: !!name.trim() },
                  { label:"Date & time set",         done: !!(date && startTime) },
                  { label:"Committee assigned",      done: !!committee },
                  { label:"Location added",          done: !!(address || virtualLink) },
                  { label:"Share channel selected",  done: shareChannels.length > 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.done
                      ? <CheckCircle size={13} className="text-green-500 shrink-0"/>
                      : <div className="w-3 h-3 rounded-full border-2 border-slate-300 shrink-0"/>
                    }
                    <span className={`text-xs ${item.done ? "text-slate-700 font-medium" : "text-slate-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
