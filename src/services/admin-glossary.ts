import type { LocalActorContext } from "@/services/local-actor-context";
import {
  canReadAdminReviewSurface,
  getActorSurfaceFamily,
} from "@/services/role-visibility";

export type AdminGlossaryTerm = {
  term: string;
  plainEnglish: string;
  whyItMatters: string;
};

export type AdminGlossary = {
  canReadGlossary: boolean;
  title: string;
  summary: string;
  terms: AdminGlossaryTerm[];
};

const glossaryTerms: AdminGlossaryTerm[] = [
  {
    term: "Local actor",
    plainEnglish:
      "The fake role selected for review, such as member, leader, coach, admin, DS Admin, or super admin.",
    whyItMatters:
      "It lets us preview permissions without turning on real student login.",
  },
  {
    term: "Mock data",
    plainEnglish:
      "Safe sample chapters, assignments, proof, points, KPIs, and outbox records.",
    whyItMatters: "Reviewers can test the app without touching real students or systems.",
  },
  {
    term: "Browser write",
    plainEnglish: "A save action triggered from the app interface.",
    whyItMatters:
      "These stay disabled until live auth and security review are explicitly approved.",
  },
  {
    term: "External send",
    plainEnglish:
      "Anything that would send data to HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI tools.",
    whyItMatters: "The MVP can be reviewed safely because these sends remain off.",
  },
  {
    term: "Outbox",
    plainEnglish:
      "A structured record of what an external automation could do later.",
    whyItMatters: "It makes n8n-ready automation possible without sending anything now.",
  },
  {
    term: "Proof",
    plainEnglish:
      "A testimonial, bridge video, or experience note that can help another student believe action is possible.",
    whyItMatters:
      "HQ decides later whether proof should be shared broadly with other chapters.",
  },
  {
    term: "RLS",
    plainEnglish: "Database rules that limit what each role can read or change.",
    whyItMatters:
      "RLS is the safety layer that keeps chapter, role, proof, and admin boundaries enforceable.",
  },
  {
    term: "Stakeholder review",
    plainEnglish:
      "A guided walkthrough for staff to understand what the local MVP can and cannot do.",
    whyItMatters:
      "It helps non-coders review the operating loop without mistaking mock readiness for launch approval.",
  },
];

export function getAdminGlossary(actor: LocalActorContext): AdminGlossary {
  if (!canReadAdminReviewSurface(actor)) {
    return {
      canReadGlossary: false,
      title: "Admin glossary hidden for this role",
      summary: "The glossary is for admin review contexts.",
      terms: [],
    };
  }

  return {
    canReadGlossary: true,
    title: getTitle(actor),
    summary:
      "Plain-English definitions for the review build so non-coders can understand what is safe, mock-only, and still disabled.",
    terms: glossaryTerms,
  };
}

function getTitle(actor: LocalActorContext): string {
  switch (getActorSurfaceFamily(actor)) {
    case "staff":
      return "Admin glossary";
    case "ds_admin":
      return "DS Admin glossary";
    case "super_admin":
      return "Full local glossary";
    case "member":
    case "leader":
    case "coach":
      return "Admin glossary hidden for this role";
  }
}
