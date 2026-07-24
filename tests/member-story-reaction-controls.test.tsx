// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/app/stories/actions", () => ({
  submitMemberStoryReactionAction: vi.fn(),
}));

import { MemberStoryReactionForm } from "@/components/member-story-reaction-controls";

describe("member story reaction controls", () => {
  afterEach(cleanup);

  it.each([
    [false, "true", "React to story"],
    [true, "false", "Remove reaction"],
  ] as const)("submits an explicit desired state when liked is %s", (liked, desired, label) => {
    const { container } = render(
      <MemberStoryReactionForm
        storyId="story-1"
        liked={liked}
        reactionCount={2}
        filter="For You"
      />,
    );

    expect(
      container.querySelector<HTMLInputElement>('input[name="desiredLiked"]')?.value,
    ).toBe(desired);
    expect(
      screen.getByRole("button", { name: label }).getAttribute("aria-pressed"),
    ).toBe(String(liked));
  });
});
