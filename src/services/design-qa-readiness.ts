import type { LocalActorContext } from "@/services/local-actor-context";

export type DesignQaStatus =
  | "ready_for_local_review"
  | "needs_visual_review"
  | "blocked_before_launch";

export type DesignQaItem = {
  key: string;
  label: string;
  status: DesignQaStatus;
  plainEnglish: string;
  reviewerPrompt: string;
  evidence: string[];
};

export type MobileVisualSmokeCheck = {
  key: string;
  route: string;
  reviewerActorEmail: string;
  viewport: string;
  targetSignal: string;
  passSignal: string;
  blockedUntil: string;
};

export type AccessibilitySmokeCheck = {
  key: string;
  route: string;
  reviewerActorEmail: string;
  interaction: string;
  targetSignal: string;
  passSignal: string;
  blockedUntil: string;
};

export type DevicePwaSmokeCheck = {
  key: string;
  route: string;
  reviewerActorEmail: string;
  deviceBrowser: string;
  scenario: string;
  passSignal: string;
  blockedUntil: string;
};

export type DesignQaReadiness = {
  canReadReadiness: boolean;
  title: string;
  summary: string;
  figmaTarget: string;
  mobileViewport: string;
  evidencePacket: {
    summary: string;
    deviceFields: string[];
    accessibilityFields: string[];
    blockerFields: string[];
  };
  items: DesignQaItem[];
  mobileSmokeChecks: MobileVisualSmokeCheck[];
  accessibilitySmokeChecks: AccessibilitySmokeCheck[];
  devicePwaSmokeChecks: DevicePwaSmokeCheck[];
  counts: {
    total: number;
    readyForLocalReview: number;
    needsVisualReview: number;
    blockedBeforeLaunch: number;
    mobileSmokeChecks: number;
    accessibilitySmokeChecks: number;
    devicePwaSmokeChecks: number;
    browserWritesExpected: 0;
    externalWritesExpected: 0;
  };
};

const figmaTarget =
  "https://www.figma.com/make/YeIALD6FoYqw2G1YDdbMgl/myMEDLIFE-App-Prototype?p=f";

export function getDesignQaReadiness(
  actor: LocalActorContext,
): DesignQaReadiness {
  if (
    actor.audience !== "admin" &&
    actor.audience !== "ds_admin" &&
    actor.audience !== "super_admin"
  ) {
    return {
      canReadReadiness: false,
      title: "Design QA hidden for this role",
      summary:
        "Design readiness is an HQ review surface, not a student or chapter operating view.",
      figmaTarget,
      mobileViewport: "390px wide phone viewport",
      evidencePacket: emptyEvidencePacket(),
      items: [],
      mobileSmokeChecks: [],
      accessibilitySmokeChecks: [],
      devicePwaSmokeChecks: [],
      counts: emptyCounts(),
    };
  }

  const items = getDesignQaItems();
  const mobileSmokeChecks = getMobileVisualSmokeChecks();
  const accessibilitySmokeChecks = getAccessibilitySmokeChecks();
  const devicePwaSmokeChecks = getDevicePwaSmokeChecks();

  return {
    canReadReadiness: true,
    title: getTitle(actor),
    summary:
      "Use this checklist to keep the app aligned to the Figma prototype direction, mobile-first student clarity, accessibility, and pilot safety before a real launch.",
    figmaTarget,
    mobileViewport: "390px wide phone viewport",
    evidencePacket: {
      summary:
        "Record the staging smoke in a way that ties every result back to a real device, browser, route, and release blocker decision.",
      deviceFields: [
        "Device, browser, and whether the build was staging, preview, or local.",
        "Route checked, signed-in actor, and whether navigation fit without zooming or horizontal scroll.",
        "Offline or installed-PWA result, including whether recovery returned to the right state.",
      ],
      accessibilityFields: [
        "Keyboard-only result, including skip link, focus order, and disabled-control clarity.",
        "Screen-reader result or label audit for the routes that matter most before pilot approval.",
        "Whether any route depended on color alone, trapped focus, or hid the next action.",
      ],
      blockerFields: [
        "The first issue that should block invitations.",
        "The issues that are safe to leave for later polish.",
        "Who owns the follow-up and whether the next review must happen again on staging.",
      ],
    },
    items,
    mobileSmokeChecks,
    accessibilitySmokeChecks,
    devicePwaSmokeChecks,
    counts: {
      total: items.length,
      readyForLocalReview: items.filter(
        (item) => item.status === "ready_for_local_review",
      ).length,
      needsVisualReview: items.filter(
        (item) => item.status === "needs_visual_review",
      ).length,
      blockedBeforeLaunch: items.filter(
        (item) => item.status === "blocked_before_launch",
      ).length,
      mobileSmokeChecks: mobileSmokeChecks.length,
      accessibilitySmokeChecks: accessibilitySmokeChecks.length,
      devicePwaSmokeChecks: devicePwaSmokeChecks.length,
      browserWritesExpected: 0,
      externalWritesExpected: 0,
    },
  };
}

function getDesignQaItems(): DesignQaItem[] {
  return [
    {
      key: "figma_target",
      label: "Figma prototype direction",
      status: "needs_visual_review",
      plainEnglish:
        "The Figma Make file is the target, but the connector currently exposes source-resource links rather than a compact pixel spec. A human visual pass still needs to compare the running app to the prototype.",
      reviewerPrompt:
        "Open the Figma target beside the app and compare homepage, Rush Month, actions, proof, coach, and admin screens.",
      evidence: ["Figma Make target", "/admin", "/rush-month", "/proof-library"],
    },
    {
      key: "mobile_next_action",
      label: "Mobile first next action",
      status: "ready_for_local_review",
      plainEnglish:
        "Core student routes now lead with role guidance, campaign context, and a primary next action instead of dense SOP text.",
      reviewerPrompt:
        "On a phone viewport, ask: can a student tell what to do next within five seconds?",
      evidence: ["/", "/chapter", "/rush-month", "/rush-month/dashboard"],
    },
    {
      key: "role_complexity",
      label: "Complexity stays behind roles",
      status: "ready_for_local_review",
      plainEnglish:
        "Student routes stay simpler, while leader, coach, admin, and DS admin surfaces carry the heavier operating detail.",
      reviewerPrompt:
        "Switch local actors and confirm members do not see admin or DS integration complexity.",
      evidence: ["/rush-month/actions", "/coach", "/admin"],
    },
    {
      key: "navigation_touch_targets",
      label: "Mobile navigation and touch targets",
      status: "ready_for_local_review",
      plainEnglish:
        "The app shell includes a horizontal primary nav and fixed mobile quick nav so reviewers can move through the operating loop on a phone.",
      reviewerPrompt:
        "Tap through the bottom nav and primary pills on a phone-sized viewport without zooming.",
      evidence: ["src/components/app-navigation.tsx", "/rush-month/events"],
    },
    {
      key: "accessibility_baseline",
      label: "Accessibility baseline",
      status: "needs_visual_review",
      plainEnglish:
        "The app has skip links, focus states, semantic sections, readable copy, and strong contrast intent, and Goal 148 now names the manual keyboard and screen-reader checks still needed before launch.",
      reviewerPrompt:
        "Tab through the Goal 148 routes and confirm focus order, labels, contrast, restricted states, and disabled controls make sense.",
      evidence: ["src/components/app-shell.tsx", "src/app/globals.css"],
    },
    {
      key: "mission_tone",
      label: "Warm mission-driven tone",
      status: "ready_for_local_review",
      plainEnglish:
        "The interface explains MEDLIFE action, proof, recognition, and coach support in plain English instead of engineering language.",
      reviewerPrompt:
        "Read the top card on each core route and confirm it sounds like MEDLIFE, not a database console.",
      evidence: ["/", "/rush-month/events", "/proof-library/upload"],
    },
    {
      key: "pilot_safety_copy",
      label: "Pilot safety messaging",
      status: "ready_for_local_review",
      plainEnglish:
        "The UI repeatedly states when uploads, writes, public proof sharing, and external automation are disabled.",
      reviewerPrompt:
        "Confirm reviewers cannot confuse local/staging readiness with production launch approval.",
      evidence: ["/admin", "/proof-library/upload", "/rush-month/events"],
    },
    {
      key: "mobile_visual_smoke_plan",
      label: "Mobile visual smoke plan",
      status: "needs_visual_review",
      plainEnglish:
        "The design QA route now names the phone-sized route checks Nick should run before pilot approval, including member, leader, coach, admin, offline, and proof routes.",
      reviewerPrompt:
        "Open each mobile smoke route at the primary phone viewport and confirm next action, touch targets, text fit, role complexity, and safety copy.",
      evidence: ["/admin/design-qa", "/rush-month", "/admin/nick-review"],
    },
    {
      key: "accessibility_smoke_plan",
      label: "Accessibility smoke plan",
      status: "needs_visual_review",
      plainEnglish:
        "The design QA route now names the keyboard, focus, screen-reader, restricted-state, and disabled-control checks reviewers should run before pilot approval.",
      reviewerPrompt:
        "Run the accessibility smoke checks with keyboard-only navigation and a screen reader, then record any route that traps focus, hides context, or depends on color alone.",
      evidence: ["/admin/design-qa", "/", "/proof-library/upload", "/offline"],
    },
    {
      key: "device_pwa_smoke_plan",
      label: "Device and PWA smoke plan",
      status: "needs_visual_review",
      plainEnglish:
        "The design QA route now names the real device, browser, install, offline, and cache-update checks still needed before pilot approval.",
      reviewerPrompt:
        "Run the Goal 149 device/PWA checks on real phones and desktop browsers, then record device, browser, route, issue, and whether launch remains blocked.",
      evidence: ["/admin/design-qa", "/offline", "/manifest.webmanifest", "public/sw.js"],
    },
    {
      key: "production_visual_qa",
      label: "Final production visual QA",
      status: "blocked_before_launch",
      plainEnglish:
        "Final polish still requires side-by-side Figma comparison, real mobile browser checks, offline PWA recovery checks, accessibility QA, and staging review after deployment.",
      reviewerPrompt:
        "Do not call the app launch-ready until Figma, mobile, offline PWA, accessibility, and staging smoke checks are complete.",
      evidence: ["Figma Make target", "staging deployment", "mobile smoke checks", "/offline"],
    },
  ];
}

export function getDevicePwaSmokeChecks(): DevicePwaSmokeCheck[] {
  return [
    {
      key: "ios-safari-member-rush",
      route: "/rush-month",
      reviewerActorEmail: "member.a@mymedlife.test",
      deviceBrowser: "iPhone Safari",
      scenario:
        "Open the Rush Month overview on a real iPhone and move through primary and quick navigation.",
      passSignal:
        "Next action, campaign context, bottom navigation, and proof/event links fit without zooming or horizontal scroll.",
      blockedUntil: "Real iPhone Safari review is recorded on the release build.",
    },
    {
      key: "android-chrome-member-actions",
      route: "/rush-month/actions",
      reviewerActorEmail: "member.a@mymedlife.test",
      deviceBrowser: "Android Chrome",
      scenario:
        "Open assigned actions on a real Android phone and tap into one action detail.",
      passSignal:
        "Action cards, touch targets, disabled write copy, and detail links remain usable on Android Chrome.",
      blockedUntil: "Real Android Chrome review is recorded on the release build.",
    },
    {
      key: "desktop-chrome-admin-route-smoke",
      route: "/admin",
      reviewerActorEmail: "admin@mymedlife.test",
      deviceBrowser: "Desktop Chrome",
      scenario:
        "Review admin route smoke, launch blockers, outbox posture, audit posture, and write readiness in a desktop browser.",
      passSignal:
        "Admin can scan launch blockers, zero writes, zero sends, route smoke, and Nick review links without hidden overflow.",
      blockedUntil: "Desktop launch-review smoke is recorded on the release build.",
    },
    {
      key: "ios-standalone-pwa-offline",
      route: "/offline",
      reviewerActorEmail: "member.a@mymedlife.test",
      deviceBrowser: "iPhone installed PWA",
      scenario:
        "Install or add the app to the iPhone home screen, load it once, then test offline recovery.",
      passSignal:
        "The standalone shell reaches the offline recovery route without showing stale private chapter data or implying offline writes.",
      blockedUntil: "iPhone PWA install and offline recovery are approved.",
    },
    {
      key: "android-installed-pwa-cache",
      route: "/offline",
      reviewerActorEmail: "member.a@mymedlife.test",
      deviceBrowser: "Android installed PWA",
      scenario:
        "Install the app on Android, open once online, go offline, then return online to confirm recovery copy remains honest.",
      passSignal:
        "The app recovers without stale private data, upload claims, push claims, or background-sync claims.",
      blockedUntil: "Android PWA install, offline cache, and recovery behavior are approved.",
    },
    {
      key: "tablet-safari-leader-dashboard",
      route: "/rush-month/dashboard",
      reviewerActorEmail: "leader.a@mymedlife.test",
      deviceBrowser: "iPad Safari",
      scenario:
        "Open the leader dashboard on a tablet-sized browser and review KPI, evidence, and assignment sections.",
      passSignal:
        "Leader complexity remains organized, readable, and separated from member-only next actions.",
      blockedUntil: "Tablet leader review is recorded on the release build.",
    },
    {
      key: "production-staging-cross-browser",
      route: "/admin/design-qa",
      reviewerActorEmail: "admin@mymedlife.test",
      deviceBrowser: "Staging Safari, Chrome, and Edge",
      scenario:
        "Run the final design QA page on staging across the primary supported browsers.",
      passSignal:
        "Figma, mobile, accessibility, device/PWA, zero-write, and launch-blocker review sections all render on staging.",
      blockedUntil: "Staging cross-browser smoke is complete after deployment.",
    },
  ];
}

export function getAccessibilitySmokeChecks(): AccessibilitySmokeCheck[] {
  return [
    {
      key: "skip-link-shell",
      route: "/",
      reviewerActorEmail: "member.a@mymedlife.test",
      interaction: "Tab once from the top of the page, then activate the skip link.",
      targetSignal: "The skip link appears before navigation and moves focus to main content.",
      passSignal:
        "A keyboard-only reviewer can bypass navigation and land on the role next action.",
      blockedUntil:
        "Keyboard and screen-reader review is recorded on the release build.",
    },
    {
      key: "member-actions-focus",
      route: "/rush-month/actions",
      reviewerActorEmail: "member.a@mymedlife.test",
      interaction:
        "Tab through mobile quick navigation, assigned actions, and action-detail links.",
      targetSignal: "Visible focus follows the same order a member would read the page.",
      passSignal:
        "No focus trap appears and every actionable link has understandable text.",
      blockedUntil:
        "Keyboard and screen-reader review is recorded on the release build.",
    },
    {
      key: "proof-intake-disabled-controls",
      route: "/proof-library/upload",
      reviewerActorEmail: "admin@mymedlife.test",
      interaction:
        "Tab through proof requirements, consent copy, and disabled upload posture.",
      targetSignal: "Disabled proof controls explain why upload is not available.",
      passSignal:
        "Reviewers can understand consent, storage, and public-sharing boundaries without color alone.",
      blockedUntil: "Proof storage, consent, and accessible upload states are approved.",
    },
    {
      key: "leader-dashboard-headings",
      route: "/rush-month/dashboard",
      reviewerActorEmail: "leader.a@mymedlife.test",
      interaction: "Use heading navigation and tab order through KPI and proof sections.",
      targetSignal:
        "The dashboard exposes clear screen-reader headings, KPI context, and proof posture.",
      passSignal:
        "A screen-reader user can find overdue work, pending evidence, and disabled write boundaries.",
      blockedUntil:
        "Keyboard and screen-reader review is recorded on the release build.",
    },
    {
      key: "coach-risk-copy",
      route: "/coach",
      reviewerActorEmail: "coach@mymedlife.test",
      interaction:
        "Read and tab through risk, support notes, and advance / hold / intervene posture.",
      targetSignal: "Coach state is communicated in text, not only by color.",
      passSignal:
        "A coach can identify the next support move and why decision saves remain disabled.",
      blockedUntil: "Coach decision writes and accessible result states are approved.",
    },
    {
      key: "offline-recovery-message",
      route: "/offline",
      reviewerActorEmail: "member.a@mymedlife.test",
      interaction: "Read the offline recovery route with keyboard and screen reader.",
      targetSignal: "Offline copy explains recovery without implying private data is cached.",
      passSignal:
        "The route gives a clear return path and does not imply offline uploads or writes work.",
      blockedUntil:
        "Offline cache, background sync, and accessible recovery behavior are approved.",
    },
    {
      key: "restricted-admin-state",
      route: "/admin/design-qa",
      reviewerActorEmail: "member.a@mymedlife.test",
      interaction:
        "Open the restricted admin design QA route as a member and tab through the fallback.",
      targetSignal: "Restricted state explains why the page is hidden and where to go next.",
      passSignal:
        "A restricted reviewer can understand the boundary and use the return link.",
      blockedUntil:
        "Production auth, role routing, and restricted-state accessibility are approved.",
    },
  ];
}

export function getMobileVisualSmokeChecks(): MobileVisualSmokeCheck[] {
  const viewport = "390px wide phone viewport";

  return [
    {
      key: "member-home",
      route: "/rush-month",
      reviewerActorEmail: "member.a@mymedlife.test",
      viewport,
      targetSignal: "Student sees the Rush Month overview and one clear next action.",
      passSignal:
        "A member can name what to do next without seeing leader or admin complexity.",
      blockedUntil: "Real campaign phase writes and student invitations are approved.",
    },
    {
      key: "member-actions",
      route: "/rush-month/actions",
      reviewerActorEmail: "member.a@mymedlife.test",
      viewport,
      targetSignal: "Assigned actions fit on a phone with usable tap targets.",
      passSignal:
        "The action list, status, and disabled proof/start boundaries are understandable.",
      blockedUntil: "Assignment writes, reminders, and action-start writes are approved.",
    },
    {
      key: "member-evidence",
      route: "/rush-month/evidence",
      reviewerActorEmail: "member.a@mymedlife.test",
      viewport,
      targetSignal: "Proof submission readiness is visible without enabling uploads.",
      passSignal:
        "The member can identify the next proof item and why uploads remain disabled.",
      blockedUntil: "Proof storage, consent, RLS, and upload writes are approved.",
    },
    {
      key: "leader-dashboard",
      route: "/rush-month/dashboard",
      reviewerActorEmail: "leader.a@mymedlife.test",
      viewport,
      targetSignal: "Leader KPIs and completion tracking are scannable on a phone.",
      passSignal:
        "The leader can find overdue work, pending evidence, and assignment boundaries.",
      blockedUntil: "KPI writes, assignment saves, and proof decisions are approved.",
    },
    {
      key: "coach-portfolio",
      route: "/coach",
      reviewerActorEmail: "coach@mymedlife.test",
      viewport,
      targetSignal: "Coach health, risk, and next support posture stay readable.",
      passSignal:
        "The coach can distinguish advance, hold, and intervene review without saving.",
      blockedUntil: "Coach decisions, notes, escalations, and KPI writes are approved.",
    },
    {
      key: "admin-final-review",
      route: "/admin/nick-review",
      reviewerActorEmail: "admin@mymedlife.test",
      viewport,
      targetSignal: "The final review packet is compact enough for phone review.",
      passSignal:
        "Owner lanes, pass signals, and launch boundaries fit without hiding risk.",
      blockedUntil: "Pilot scope, live launch gates, and invitations are approved.",
    },
    {
      key: "offline-recovery",
      route: "/offline",
      reviewerActorEmail: "member.a@mymedlife.test",
      viewport,
      targetSignal: "Offline recovery explains what is cached and what is not.",
      passSignal:
        "The route does not imply private data, uploads, or offline writes are available.",
      blockedUntil: "Real offline caching, background sync, and push rules are approved.",
    },
    {
      key: "proof-upload",
      route: "/proof-library/upload",
      reviewerActorEmail: "admin@mymedlife.test",
      viewport,
      targetSignal: "Proof upload intake explains consent and disabled upload posture.",
      passSignal:
        "Reviewers can see consent/context needs and confirm no upload can be sent.",
      blockedUntil:
        "Storage, public publishing, consent review, and external export writes are approved.",
    },
  ];
}

function getTitle(actor: LocalActorContext): string {
  switch (actor.audience) {
    case "admin":
      return "Admin design QA readiness";
    case "ds_admin":
      return "DS Admin design and safety QA readiness";
    case "super_admin":
      return "Full design QA readiness";
    case "chapter_member":
    case "chapter_leader":
    case "coach":
      return "Design QA hidden for this role";
  }
}

function emptyCounts(): DesignQaReadiness["counts"] {
  return {
    total: 0,
    readyForLocalReview: 0,
    needsVisualReview: 0,
    blockedBeforeLaunch: 0,
    mobileSmokeChecks: 0,
    accessibilitySmokeChecks: 0,
    devicePwaSmokeChecks: 0,
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}

function emptyEvidencePacket(): DesignQaReadiness["evidencePacket"] {
  return {
    summary: "",
    deviceFields: [],
    accessibilityFields: [],
    blockerFields: [],
  };
}
