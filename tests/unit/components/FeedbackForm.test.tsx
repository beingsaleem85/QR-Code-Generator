// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackForm } from "@/components/qr/content-forms/FeedbackForm";
import { feedbackQrSchema } from "@/lib/validation/qr";

afterEach(() => cleanup());

describe("FeedbackForm", () => {
  it("reports valid content to the parent on mount, before any user interaction", () => {
    // Regression test: the form's own defaults (title + both collect
    // toggles) are already fully valid on their own — a user who accepts
    // them and clicks Save without touching a field must not submit stale
    // `{}` content. react-hook-form's watch() only fires on a change
    // event, never with the initial defaultValues, so this only passes if
    // the form explicitly syncs its initial state up on mount.
    const onChange = vi.fn();
    render(<FeedbackForm value={{}} onChange={onChange} />);

    expect(onChange).toHaveBeenCalled();
    const firstCallValue = onChange.mock.calls[0][0];
    expect(feedbackQrSchema.safeParse(firstCallValue).success).toBe(true);
  });

  it("the mounted defaults match what's actually displayed", () => {
    const onChange = vi.fn();
    render(<FeedbackForm value={{}} onChange={onChange} />);

    const firstCallValue = onChange.mock.calls[0][0];
    expect(firstCallValue).toMatchObject({
      title: "How was your experience?",
      collectRating: true,
      collectComment: true,
      collectContact: false,
    });
    expect(screen.getByLabelText("Prompt / title")).toHaveValue("How was your experience?");
  });

  it("still reports updated content when the user edits a field", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackForm value={{}} onChange={onChange} />);
    onChange.mockClear();

    await user.clear(screen.getByLabelText("Prompt / title"));
    await user.type(screen.getByLabelText("Prompt / title"), "Rate your visit");

    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.title).toBe("Rate your visit");
  });

  it("respects a pre-existing value (edit mode) rather than overwriting it with defaults", () => {
    const onChange = vi.fn();
    render(
      <FeedbackForm
        value={{
          title: "Custom prompt",
          collectRating: false,
          collectComment: true,
          collectContact: true,
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText("Prompt / title")).toHaveValue("Custom prompt");
    const firstCallValue = onChange.mock.calls[0][0];
    expect(firstCallValue).toMatchObject({
      title: "Custom prompt",
      collectRating: false,
      collectComment: true,
      collectContact: true,
    });
  });
});
