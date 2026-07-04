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
    expect(html).toContain("Ready to publish?");
  });

  it("renders the copied leadership training hub with filters and resource cards", () => {
    const html = renderToStaticMarkup(<TrainingScreen />);

    expect(html).toContain("Leadership &amp; Resources Hub");
    expect(html).toContain("Videos, presentations, and external resources");
    expect(html).toContain("Add Resource");
    expect(html).toContain("All (16)");
    expect(html).toContain("Videos (6)");
    expect(html).toContain("Presentations (5)");
    expect(html).toContain("External Links (5)");
    expect(html).toContain("Featured");
    expect(html).toContain("What Is Servant Leadership?");
    expect(html).toContain("MEDLIFE Chapter Leadership Guide");
    expect(html).toContain("Open Resource");
  });

  it("renders the copied MEDLIFE Stories surface with filters and featured stories", () => {
    const html = renderToStaticMarkup(<MedlifeStoriesScreen />);

    expect(html).toContain("MEDLIFE Stories");
    expect(html).toContain("Live from the field");
    expect(html).toContain("Add Story");
    expect(html).toContain("For You");
    expect(html).toContain("My Chapter");
    expect(html).toContain("Field Stories");
    expect(html).toContain("Student Stories");
    expect(html).toContain("Trip Moments");
    expect(html).toContain("Students in Lima joined a Mobile Clinic this weekend");
    expect(html).toContain("Fundraising milestone");
    expect(html).toContain("curated by staff");
    expect(html).toContain("9 stories published");
  });
});
