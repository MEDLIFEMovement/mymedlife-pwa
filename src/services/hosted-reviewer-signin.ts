import {
  getMockLocalActorContext,
  type LocalActorContext,
} from "@/services/local-actor-context";
import { normalizeLoginRedirect } from "@/services/auth-session";

export type HostedReviewerSigninRequirement = {
  loginHref: string;
  eyebrow: string;
  title: string;
  message: string;
  nextLabel: string;
};

export function getHostedReviewerSigninRequirement(
  actor: LocalActorContext,
  redirectTo: string,
  title: string,
  message: string,
): HostedReviewerSigninRequirement | null {
  if (actor.isLocalOnly || actor.authSessionStatus === "signed_in") {
    return null;
  }

  const safeRedirect = normalizeLoginRedirect(redirectTo);
  const params = new URLSearchParams({
    redirectTo: safeRedirect,
  });

  return {
    loginHref: `/login?${params.toString()}`,
    eyebrow: "Hosted reviewer sign-in required",
    title,
    message,
    nextLabel: "Open staging sign-in",
  };
}

export function getHostedReviewerShellActor(
  actor: LocalActorContext,
  shellEmail: string,
): LocalActorContext {
  if (actor.isLocalOnly || actor.authSessionStatus === "signed_in") {
    return actor;
  }

  return getMockLocalActorContext(
    shellEmail,
    actor.source.message,
    actor.source.status,
    actor.identitySource,
    actor.authSessionStatus,
    actor.isLocalOnly,
  );
}
