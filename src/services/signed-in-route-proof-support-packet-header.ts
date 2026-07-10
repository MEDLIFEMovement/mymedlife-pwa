import type { SignedInRouteProofSupportPacket } from "./signed-in-route-proof-support-packet.ts";
import {
  formatSignedInRouteProofPreflightCard,
} from "./signed-in-route-proof-preflight-card.ts";

export function formatSignedInRouteProofSupportPacketHeader(
  packet: SignedInRouteProofSupportPacket,
): string {
  return [
    packet.title,
    "",
    `Scope: ${packet.summary}`,
    "",
    formatSignedInRouteProofOperatorSummary(packet),
    "",
    formatSignedInRouteProofPreflightCard(packet.preflightCard),
    "",
    "Mini-packet note:",
    "- This header is support-only and no-write. It exists to help an operator decide what artifact to request next before reading the full packet details.",
  ].join("\n");
}

export function formatSignedInRouteProofOperatorSummary(
  packet: SignedInRouteProofSupportPacket,
): string {
  return [
    "Signed-in proof operator summary:",
    `- source rows: ${packet.rowGapSnapshot.sourceRowCount}`,
    `- normalized rows: ${packet.rowGapSnapshot.normalizedRowCount}`,
    `- accepted workspaces: ${formatListOrNone(packet.rowGapSnapshot.acceptedWorkspaces)}`,
    `- missing workspaces: ${formatListOrNone(packet.rowGapSnapshot.missingWorkspaces)}`,
    `- unsafe rows: ${formatListOrNone(packet.rowGapSnapshot.unsafeSourceRows)}`,
    `- no-write posture: local-only, no provider calls, no production reads/writes`,
    `- next smallest goal: ${packet.nextSmallestGoal}`,
  ].join("\n");
}

function formatListOrNone(items: string[]) {
  return items.length === 0 ? "none" : items.join(", ");
}
