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

export type DesignQaReadiness = {
  canReadReadiness: boolean;
  title: string;
  summary: string;
  figmaTarget: string;
  mobileViewport: string;
  items: DesignQaItem[];
  counts: {
    total: number;
    readyForLocalReview: number;
    needsVisualReview: number;
    blockedBeforeLaunch: number;
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
      items: [],
      counts: emptyCounts(),
    };
  }

  const items = getDesignQaItems();

  return {
    canReadReadiness: true,
    title: getTitle(actor),
    summary:
      "Use this checklist to keep the app aligned to the Figma prototype direction, mobile-first student clarity, accessibility, and pilot safety before a real launch.",
    figmaTarget,
    mobileViewport: "390px wide phone viewport",
    items,
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
        "The app has skip links, focus states, semantic sections, readable copy, and strong contrast intent, but still needs manual keyboard and screen-reader QA.",
      reviewerPrompt:
        "Tab through core routes and confirm focus order, labels, contrast, and restricted states make sense.",
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
      key: "production_visual_qa",
      label: "Final production visual QA",
      status: "blocked_before_launch",
      plainEnglish:
        "Final polish still requires side-by-side Figma comparison, real mobile browser checks, accessibility QA, and staging review after deployment.",
      reviewerPrompt:
        "Do not call the app launch-ready until Figma, mobile, accessibility, and staging smoke checks are complete.",
      evidence: ["Figma Make target", "staging deployment", "mobile smoke checks"],
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
    browserWritesExpected: 0,
    externalWritesExpected: 0,
  };
}
