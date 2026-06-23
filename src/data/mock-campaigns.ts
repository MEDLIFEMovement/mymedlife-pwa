import type {
  ActionCommittee,
  CampaignShell,
  ChapterEventPlan,
  ProofLibraryItem,
} from "@/shared/types/campaigns";

export const campaignShells: CampaignShell[] = [
  {
    slug: "rush-month",
    name: "Rush Month",
    family: "rush_month",
    status: "active",
    summary:
      "Turn campus interest into actual student action through invites, events, follow-up, and proof.",
    studentPromise:
      "A new student should quickly know where to show up, who to meet, and what small action to take next.",
    operatingRhythm:
      "Weekly assignments, action-committee events, proof/testimonial collection, KPI readout, and coach decision.",
    actionCommitteeLanes: ["Recruitment", "Social", "Med Talk", "Local Volunteering"],
    proofUse:
      "Show future students that real peers found friends, purpose, and momentum by joining MEDLIFE.",
    coachFocus:
      "Watch whether leaders are assigning real work instead of only running passive general body meetings.",
    primaryKpis: ["student_invites", "event_rsvps", "event_attendance", "proof_items", "member_actions"],
    integrationPosture:
      "Luma links and future reminder workflows are mocked. No live external send is enabled.",
  },
  {
    slug: "planning-goal-setting",
    name: "Planning / Goal Setting",
    family: "planning_goal_setting",
    status: "template",
    summary:
      "Help chapter leaders set annual goals, define owners, and turn broad ambition into a visible action calendar.",
    studentPromise:
      "Students should understand what the chapter is trying to accomplish and how they can help this month.",
    operatingRhythm:
      "Set chapter goals, assign officer lanes, publish first actions, identify risks, and schedule coach check-ins.",
    actionCommitteeLanes: ["Executive Board", "Action Committee Chairs", "Coach"],
    proofUse:
      "Capture before/after leadership stories that show how clearer planning changed chapter behavior.",
    coachFocus:
      "Check whether goals are specific, owned, time-bound, and connected to student action rather than wish lists.",
    primaryKpis: ["goals_set", "owners_assigned", "calendar_published", "risks_identified", "coach_checkins"],
    integrationPosture:
      "Goal planning exports and reminders are disabled until the first campaign loop is stable.",
  },
  {
    slug: "chapter-engagement",
    name: "Chapter Engagement",
    family: "chapter_engagement",
    status: "template",
    summary:
      "Build recurring chapter energy through events, recognition, leaderboards, and member follow-up.",
    studentPromise:
      "Members should see real ways to participate, earn recognition, and feel part of an active chapter.",
    operatingRhythm:
      "Run engagement events, assign follow-up, update leaderboards, collect proof, and coach stalled committees.",
    actionCommitteeLanes: ["Social", "Local Volunteering", "Recognition", "Proof"],
    proofUse:
      "Use member stories to show why active chapters feel more meaningful than passive meetings.",
    coachFocus:
      "Watch whether the chapter is creating weekly student participation, not just tracking attendance.",
    primaryKpis: ["active_members", "event_attendance", "actions_completed", "points_awarded", "retention_signals"],
    integrationPosture:
      "Engagement reminders and reports are shaped as future outbox events only.",
  },
  {
    slug: "fundraising-sprint",
    name: "Fundraising Sprint",
    family: "fundraising",
    status: "planned",
    summary:
      "Help chapters run concrete fundraising events with owners, attendance, dollars raised, and reusable proof.",
    studentPromise:
      "Students can join a real fundraiser, see the impact, and earn recognition for contributing.",
    operatingRhythm:
      "Pick event concept, assign owners, publish through Luma later, collect attendance/NPS/proof, close out lessons.",
    actionCommitteeLanes: ["Fundraising", "Marketing", "Social"],
    proofUse:
      "Show chapters which fundraiser formats actually worked and why students wanted to participate.",
    coachFocus:
      "Separate chapters with real event momentum from chapters stuck in planning-only meetings.",
    primaryKpis: ["events_opened", "attendance", "dollars_raised", "nps_score", "proof_items"],
    integrationPosture:
      "Fundraiser handoffs are outbox-ready only. HubSpot, Luma, warehouse, and Power BI writes remain disabled.",
  },
  {
    slug: "local-volunteering-push",
    name: "Local Volunteering Push",
    family: "local_volunteering",
    status: "planned",
    summary:
      "Make local volunteering a visible student action lane, not just a meeting topic.",
    studentPromise:
      "Students should be able to help locally, meet other members, and understand how the event connects to MEDLIFE.",
    operatingRhythm:
      "Open a local service opportunity, promote it, track attendance, collect NPS, and capture the story.",
    actionCommitteeLanes: ["Local Volunteering", "Operations", "Proof"],
    proofUse:
      "Use testimonials to reduce hesitation from students who want service but do not know where to start.",
    coachFocus:
      "Check whether the chapter is creating visible service opportunities with clear owners and follow-up.",
    primaryKpis: ["volunteer_events", "attendance", "student_hours", "nps_score", "testimonial_items"],
    integrationPosture:
      "Attendance and feedback imports are mocked until the operating loop is approved.",
  },
  {
    slug: "med-talk-series",
    name: "Med Talk Series",
    family: "med_talk",
    status: "template",
    summary:
      "Give students a recurring reason to gather around health equity, careers, and MEDLIFE mission stories.",
    studentPromise:
      "Students hear something useful, meet people with similar interests, and leave with a next action.",
    operatingRhythm:
      "Book speaker/topic, promote, host, collect feedback, record proof, and share what worked.",
    actionCommitteeLanes: ["Med Talk", "Recruitment", "Marketing"],
    proofUse:
      "Share clips and testimonials that show why the conversation mattered to students.",
    coachFocus:
      "Watch whether talks create follow-up actions instead of ending as one-off lectures.",
    primaryKpis: ["talks_hosted", "attendance", "new_member_followups", "nps_score", "proof_items"],
    integrationPosture:
      "Speaker/event sync remains a future integration. Current shell records only mock-safe intent.",
  },
  {
    slug: "social-belonging-events",
    name: "Social Belonging Events",
    family: "social",
    status: "template",
    summary:
      "Create fun, low-friction ways for students to make friends and become part of the chapter culture.",
    studentPromise:
      "A student should feel MEDLIFE is a place to belong, not a club that only talks at them.",
    operatingRhythm:
      "Plan social event, assign hosts, promote, welcome new students, collect feedback, and capture bridge stories.",
    actionCommitteeLanes: ["Social", "Recruitment", "Proof"],
    proofUse:
      "Bridge videos can show freshmen and sophomores that joining MEDLIFE helps them find community.",
    coachFocus:
      "Look for chapter culture signals: repeated events, student-led ownership, and strong attendance.",
    primaryKpis: ["social_events", "attendance", "new_member_conversion", "nps_score", "bridge_videos"],
    integrationPosture:
      "Luma and reminder automation are not live. Events stay mock-linked until approved.",
  },
  {
    slug: "slt-promotion",
    name: "SLT Promotion",
    family: "slt_promotion",
    status: "template",
    summary:
      "Help chapters move students from interest to Service Learning Trip conversations and commitments.",
    studentPromise:
      "Students understand what an SLT is, hear credible peer proof, and know the next step.",
    operatingRhythm:
      "Run info sessions, assign follow-up owners, share proof, track questions, and coach blockers.",
    actionCommitteeLanes: ["SLT Recruitment", "Proof", "Follow-Up"],
    proofUse:
      "Use peer and alumni stories to break self-limiting beliefs about travel, cost, time, and impact.",
    coachFocus:
      "Identify chapters that need belief-building proof or stronger follow-up discipline.",
    primaryKpis: ["info_sessions", "interested_students", "followups_completed", "deposits", "proof_items"],
    integrationPosture:
      "HubSpot handoff and reminder automations are shaped only as disabled future outbox rows.",
  },
  {
    slug: "moving-mountains",
    name: "Moving Mountains",
    family: "moving_mountains",
    status: "template",
    summary:
      "Help chapters run mission-centered advocacy, fundraising, and storytelling work around MEDLIFE's bigger movement.",
    studentPromise:
      "Students understand how their campus actions connect to a larger movement against poverty.",
    operatingRhythm:
      "Assign campaign owners, run movement-building actions, collect proof, share progress, and close out lessons.",
    actionCommitteeLanes: ["Advocacy", "Fundraising", "Storytelling", "Recruitment"],
    proofUse:
      "Collect stories that connect individual campus action to the broader MEDLIFE mission.",
    coachFocus:
      "Make sure the campaign creates action and belief, not just inspirational messaging.",
    primaryKpis: ["actions_completed", "funds_raised", "new_supporters", "proof_items", "chapter_participation"],
    integrationPosture:
      "Movement-wide reporting and external syncs remain disabled until approved.",
  },
  {
    slug: "leadership-transition",
    name: "Leadership Transition",
    family: "leadership_transition",
    status: "template",
    summary:
      "Help outgoing leaders hand off knowledge, roles, playbooks, and relationships to the next chapter team.",
    studentPromise:
      "New leaders should know what to do next without rebuilding the chapter from scratch.",
    operatingRhythm:
      "Name successors, transfer role notes, confirm committee chairs, schedule coach handoff, and capture lessons.",
    actionCommitteeLanes: ["Executive Board", "Coach", "Action Committee Chairs"],
    proofUse:
      "Capture leadership handoff stories that help other chapters see what good transition looks like.",
    coachFocus:
      "Watch for missing successors, undocumented owner lanes, and chapters at risk of losing momentum.",
    primaryKpis: ["roles_handed_off", "successors_confirmed", "handoff_notes", "coach_validations", "open_risks"],
    integrationPosture:
      "Role and coach handoff notifications stay disabled until live auth and membership writes are approved.",
  },
  {
    slug: "grow-the-movement",
    name: "Grow the Movement",
    family: "grow_the_movement",
    status: "template",
    summary:
      "Help chapters expand reach through member referrals, campus partnerships, alumni proof, and visible impact stories.",
    studentPromise:
      "Students can invite others into a movement that feels active, credible, and worth joining.",
    operatingRhythm:
      "Assign referral owners, run partnership outreach, publish proof, track conversion, and coach follow-up.",
    actionCommitteeLanes: ["Recruitment", "Partnerships", "Proof", "Alumni"],
    proofUse:
      "Use alumni and peer proof to show why joining MEDLIFE changes students and campuses.",
    coachFocus:
      "Identify bottlenecks in outreach confidence, follow-up discipline, and chapter belief.",
    primaryKpis: ["referrals", "partnerships_opened", "new_members", "proof_items", "followups_completed"],
    integrationPosture:
      "Future HubSpot/n8n referral and alumni workflows stay disabled.",
  },
  {
    slug: "start-a-chapter",
    name: "Start a Chapter",
    family: "start_a_chapter",
    status: "template",
    summary:
      "Give expansion chapters a clear phase path from interest to active chapter operations.",
    studentPromise:
      "A founding student should know the next concrete step to launch MEDLIFE on campus.",
    operatingRhythm:
      "Confirm sponsor interest, recruit founding team, run first events, collect proof, and pass coach gates.",
    actionCommitteeLanes: ["Expansion", "Recruitment", "Coach", "Proof"],
    proofUse:
      "Share proof from successful founding teams to break the belief that starting a chapter is too hard.",
    coachFocus:
      "Move chapters from expansion coaching to portfolio coaching only after readiness gates are met.",
    primaryKpis: ["founding_team", "first_events", "members_joined", "readiness_gates", "coach_handoff"],
    integrationPosture:
      "Expansion handoffs and CRM syncs are future disabled outbox events only.",
  },
];

export const actionCommittees: ActionCommittee[] = [
  {
    id: "committee-recruitment",
    name: "Recruitment Action Committee",
    lane: "Recruitment",
    purpose:
      "Invite students into MEDLIFE through concrete outreach, events, and follow-up instead of passive announcements.",
    typicalOwnerRole: "Action Committee Chair",
    sampleMonthlyActions: [
      "Run classroom invite push",
      "Open Rush table shift schedule",
      "Assign follow-up owners for new students",
    ],
  },
  {
    id: "committee-fundraising",
    name: "Fundraising Action Committee",
    lane: "Fundraising",
    purpose:
      "Create student-run events that raise money, teach ownership, and generate reusable best practices.",
    typicalOwnerRole: "Action Committee Chair",
    sampleMonthlyActions: [
      "Open one fundraiser event",
      "Assign promotion owners",
      "Collect results, NPS, and proof",
    ],
  },
  {
    id: "committee-local-volunteering",
    name: "Local Volunteering Action Committee",
    lane: "Local Volunteering",
    purpose:
      "Give students regular local service opportunities that make MEDLIFE action visible on campus.",
    typicalOwnerRole: "Action Committee Chair",
    sampleMonthlyActions: [
      "Confirm service partner",
      "Publish volunteer event",
      "Collect attendance and reflection proof",
    ],
  },
  {
    id: "committee-social",
    name: "Social Action Committee",
    lane: "Social",
    purpose:
      "Build chapter culture through welcoming events where students meet friends and keep coming back.",
    typicalOwnerRole: "Action Committee Chair",
    sampleMonthlyActions: [
      "Host one low-friction social",
      "Assign welcome hosts",
      "Capture bridge videos from new members",
    ],
  },
  {
    id: "committee-proof",
    name: "Proof and Storytelling Committee",
    lane: "Proof",
    purpose:
      "Collect testimonials, bridge videos, and event stories that help other students believe action is possible.",
    typicalOwnerRole: "Action Committee Member",
    sampleMonthlyActions: [
      "Ask three attendees for bridge videos",
      "Tag hesitation addressed",
      "Send candidate stories to HQ review",
    ],
  },
];

export const chapterEventPlans: ChapterEventPlan[] = [
  {
    id: "event-rush-social-001",
    title: "Tabling at Bruin Walk",
    campaignSlug: "rush-month",
    committeeId: "committee-social",
    eventType: "social",
    ownerRole: "Action Committee Chair",
    supportLane: "Leader",
    timing: "Tue Nov 13 · 11:00 AM - 1:00 PM · Bruin Walk Table 7",
    lumaStatus: "mock_linked",
    expectedStudentAction:
      "Stop by the table, meet two chapter members, and invite one interested student to the Intro GBM.",
    feedbackPlan: "Send a simple NPS and belonging prompt to attendees after the event.",
    proofPrompt:
      "Capture one short student note or bridge video about why the table made MEDLIFE feel approachable.",
    npsQuestion: "How likely are you to recommend this MEDLIFE event to another student?",
  },
  {
    id: "event-rush-med-talk-001",
    title: "Intro GBM",
    campaignSlug: "rush-month",
    committeeId: "committee-recruitment",
    eventType: "med_talk",
    ownerRole: "E-Board Member",
    supportLane: "Leader",
    timing: "Thu Nov 15 · 6:00 PM - 8:00 PM · Ackerman 2100",
    lumaStatus: "future_sync_disabled",
    expectedStudentAction:
      "Attend the GBM, bring one friend if you can, and choose one clear follow-up action before leaving.",
    feedbackPlan: "Collect NPS and one open-text note on what made the chapter feel worth joining.",
    proofPrompt:
      "Capture one short student testimonial about why the GBM made MEDLIFE feel worth joining.",
    npsQuestion: "How useful was this Intro GBM for understanding MEDLIFE's mission?",
  },
  {
    id: "event-rush-social-002",
    title: "Rush Week Social",
    campaignSlug: "rush-month",
    committeeId: "committee-social",
    eventType: "social",
    ownerRole: "Action Committee Chair",
    supportLane: "Leader",
    timing: "Sat Nov 18 · 7:00 PM · Student Activities Center",
    lumaStatus: "not_linked",
    expectedStudentAction:
      "Show up, bring one new student into a conversation, and make the chapter feel welcoming.",
    feedbackPlan: "Ask attendees whether the social helped them picture themselves in the chapter.",
    proofPrompt:
      "Capture a quick testimonial about belonging, energy, or why the event made the chapter feel real.",
    npsQuestion: "How welcoming did this Rush Week Social feel to a new student?",
  },
  {
    id: "event-rush-orientation-001",
    title: "Member Orientation",
    campaignSlug: "rush-month",
    committeeId: "committee-recruitment",
    eventType: "med_talk",
    ownerRole: "E-Board Member",
    supportLane: "Leader",
    timing: "Wed Nov 22 · 5:30 PM · Engineering VI 289",
    lumaStatus: "not_linked",
    expectedStudentAction:
      "Attend orientation, learn the next chapter roles, and pick one concrete way you will help this semester.",
    feedbackPlan: "Collect one confidence score and one note about what still feels unclear.",
    proofPrompt:
      "Capture one short member reflection about what helped them understand how to contribute next.",
    npsQuestion: "How prepared do you feel to contribute after this member orientation?",
  },
  {
    id: "event-fundraiser-001",
    title: "Campus fundraiser pop-up",
    campaignSlug: "fundraising-sprint",
    committeeId: "committee-fundraising",
    eventType: "fundraiser",
    ownerRole: "Action Committee Chair",
    supportLane: "Leader",
    timing: "Planned",
    lumaStatus: "not_linked",
    expectedStudentAction: "Sign up for a shift, invite friends, and help close the event.",
    feedbackPlan: "Track attendance, dollars raised, and quick NPS from participants.",
    proofPrompt:
      "Ask a student why the fundraiser felt doable and what another chapter should copy.",
    npsQuestion: "How likely are you to help with this kind of fundraiser again?",
  },
  {
    id: "event-volunteering-001",
    title: "Local service Saturday",
    campaignSlug: "local-volunteering-push",
    committeeId: "committee-local-volunteering",
    eventType: "local_volunteering",
    ownerRole: "Action Committee Chair",
    supportLane: "Leader",
    timing: "Planned",
    lumaStatus: "not_linked",
    expectedStudentAction: "Attend the service event and submit a short reflection.",
    feedbackPlan: "Collect attendance, student-hours, NPS, and one learning note.",
    proofPrompt:
      "Invite a participant to explain why local volunteering made MEDLIFE feel action-oriented.",
    npsQuestion: "How meaningful was this local volunteering experience?",
  },
  {
    id: "event-slt-info-001",
    title: "SLT peer proof night",
    campaignSlug: "slt-promotion",
    committeeId: "committee-proof",
    eventType: "slt_info",
    ownerRole: "E-Board Member",
    supportLane: "Leader",
    timing: "Template",
    lumaStatus: "future_sync_disabled",
    expectedStudentAction: "Hear peer proof, name one concern, and ask for follow-up.",
    feedbackPlan: "Collect top concerns, confidence score, and follow-up owner.",
    proofPrompt:
      "Capture proof that addresses cost, travel, impact, belonging, or parent hesitation.",
    npsQuestion: "How much did this session increase your confidence about exploring an SLT?",
  },
];

export const proofLibraryItems: ProofLibraryItem[] = [
  {
    id: "proof-rush-friends",
    campaignSlug: "rush-month",
    sourceLabel: "Tabling at Bruin Walk",
    proofType: "bridge_video",
    hesitationAddressed: "I do not know anyone in the chapter.",
    summary:
      "A new member explains that the tabling event made it easy to start a conversation and feel comfortable joining.",
    sharingStatus: "needs_hq_review",
    recommendedUse: "Recruitment and social-event promotion.",
  },
  {
    id: "proof-volunteering-action",
    campaignSlug: "local-volunteering-push",
    sourceLabel: "Local service Saturday",
    proofType: "testimonial_text",
    hesitationAddressed: "I want to help but do not know where to start.",
    summary:
      "A volunteer describes how a simple local service event made MEDLIFE feel practical and action-oriented.",
    sharingStatus: "future_public_candidate",
    recommendedUse: "Local volunteering playbook and chapter inspiration feed.",
  },
  {
    id: "proof-fundraiser-repeatable",
    campaignSlug: "fundraising-sprint",
    sourceLabel: "Campus fundraiser pop-up",
    proofType: "chapter_recap",
    hesitationAddressed: "Our chapter cannot raise meaningful money.",
    summary:
      "A chapter recap explains the owner list, promotion steps, attendance, and what another university should copy.",
    sharingStatus: "approved_for_internal_learning",
    recommendedUse: "Fundraising sprint SOP examples.",
  },
  {
    id: "proof-slt-belief",
    campaignSlug: "slt-promotion",
    sourceLabel: "SLT peer proof night",
    proofType: "alumni_ugc",
    hesitationAddressed: "I am unsure an SLT is worth the time or cost.",
    summary:
      "A past participant explains how the trip changed their confidence and why they recommend taking the next step.",
    sharingStatus: "needs_hq_review",
    recommendedUse: "SLT recruitment objection handling.",
  },
];
