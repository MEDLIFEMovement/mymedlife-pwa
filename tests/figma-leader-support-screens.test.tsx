import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateEventForm } from "@/components/figma-leader-create-event-screen";
import { MedlifeStoriesScreen } from "@/components/figma-leader-stories-screen";
import { TrainingScreen } from "@/components/figma-leader-training-screen";

describe("copied Figma leader support screens", () => {
  it("renders the copied create-event workspace with the expected form sections", () => {
    const html = renderToStaticMarkup(<CreateEventForm onBack={() => undefined} />);

    expect(html).toContain("Create New Event");
    expect(html).toContain("1. Event Type");
    expect(html).toContain("Info / General Meeting");
    expect(html).toContain("Fundraiser");
    expect(html).toContain("Recruitment / Tabling");
    expect(html).toContain("2. Event Details");
    expect(html).toContain("Action Committee");
    expect(html).toContain("3. Date &amp; Time");
    expect(html).toContain("4. Location");
    expect(html).toContain("5. RSVP Settings");
    expect(html).toContain("6. Share &amp; Publish");
    expect(html).toContain("Chapter App Feed");
    expect(html).toContain("Your Event Name");
    expect(html).toContain("RSVP for This Event");
    expect(html).toContain("Stage Event");
    expect(html).toContain("Ready to stage?");
    expect(html).not.toContain("Publish Event");
  });

  it("renders the copied leadership training hub with filters and resource cards", () => {
    const html = renderToStaticMarkup(<TrainingScreen />);

    expect(html).toContain("Leadership &amp; Resources Hub");
    expect(html).toContain("Videos, presentations, and external resources");
    expect(html).toContain("TEST training preview.");
    expect(html).toContain("Preview Resource Intake");
    expect(html).toContain("All (16)");
    expect(html).toContain("Videos (6)");
    expect(html).toContain("Presentations (5)");
    expect(html).toContain("External Links (5)");
    expect(html).toContain("TEST Featured Resources");
    expect(html).toContain("TEST What Is Servant Leadership?");
    expect(html).toContain("TEST MEDLIFE Chapter Leadership Guide");
    expect(html).toContain("Preview Video");
    expect(html).toContain("Preview Deck");
    expect(html).toContain("Preview Link");
    expect(html).toContain("Resource publishing is blocked in this preview until leadership-content approval is complete.");
    expect(html).toContain("External resource opens are blocked in this preview until leadership-content approval is complete.");
    expect(html).toContain("Video playback is blocked in this preview.");
    expect(html).toContain("Deck viewing is blocked in this preview.");
  });

  it("renders the copied MEDLIFE Stories surface with filters and featured stories", () => {
    const html = renderToStaticMarkup(<MedlifeStoriesScreen />);

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("TEST stories preview.");
    expect(html).toContain("TEST live from the field preview");
    expect(html).toContain("Add Story");
    expect(html).toContain("For You");
    expect(html).toContain("My Chapter");
    expect(html).toContain("Field Stories");
    expect(html).toContain("Student Stories");
    expect(html).toContain("Trip Moments");
    expect(html).toContain("TEST Students in Lima joined a Mobile Clinic this weekend");
    expect(html).toContain("TEST Fundraising milestone");
    expect(html).toContain("TEST UConn");
    expect(html).toContain("curated by staff");
    expect(html).toContain("9 TEST stories published");
    expect(html).toContain("Story publishing is blocked in this preview until proof and feed approvals are complete.");
    expect(html).toContain("Story reactions stay visible for shell fidelity, but they are preview-only in this leadership view.");
  });

  it("keeps hidden leader share controls explicitly blocked in the copied source", () => {
    const trainingSource = readFileSync("src/components/figma-leader-training-screen.tsx", "utf8");
    const storiesSource = readFileSync("src/components/figma-leader-stories-screen.tsx", "utf8");

    expect(trainingSource).toContain("Leadership resource sharing is blocked in this preview until feed approval is complete.");
    expect(trainingSource).toContain("Committee sends are blocked in this preview until messaging approval is complete.");
    expect(trainingSource).toContain("Leadership reading-list saves are blocked in this preview until write approval is complete.");
    expect(trainingSource).toContain("Preview Chapter Feed Share");
    expect(trainingSource).toContain("Preview Committee Send");
    expect(trainingSource).toContain("Preview Reading List Add");
    expect(storiesSource).toContain("Story saving is blocked in this preview");
    expect(storiesSource).toContain("External story sources are blocked in this preview until feed-sharing approval is complete");
    expect(storiesSource).toContain("TEST MEDLIFE Stories preview — curated by staff · requires approval before publishing");
  });
});
