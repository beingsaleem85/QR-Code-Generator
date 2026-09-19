// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const signInWithOAuthMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GoogleAuthButton", () => {
  it("renders with default text and Google icon", () => {
    render(<GoogleAuthButton />);
    const button = screen.getByRole("button", { name: /continue with google/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("renders with custom text when provided", () => {
    render(<GoogleAuthButton text="Sign up with Google" />);
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument();
  });

  it("calls signInWithOAuth with provider google and correct callback url", async () => {
    signInWithOAuthMock.mockReturnValue(new Promise(() => {})); // Never resolves to assert loading state
    const user = userEvent.setup();
    render(<GoogleAuthButton redirectTo="/dashboard/qr-codes" />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    await user.click(button);

    expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/callback?next=%2Fdashboard%2Fqr-codes"),
      },
    });

    // Button transitions to loading state and becomes disabled (double-click protection)
    expect(screen.getByRole("button", { name: /connecting to google.../i })).toBeDisabled();
  });

  it("prevents double-clicks while loading", async () => {
    signInWithOAuthMock.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<GoogleAuthButton />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    await user.click(button);
    await user.click(button);

    expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
  });

  it("handles OAuth errors and notifies via onError callback", async () => {
    const onError = vi.fn();
    signInWithOAuthMock.mockResolvedValueOnce({
      data: { provider: "google", url: null },
      error: { message: "OAuth service unavailable" },
    });

    const user = userEvent.setup();
    render(<GoogleAuthButton onError={onError} />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    await user.click(button);

    expect(onError).toHaveBeenCalledWith("OAuth service unavailable");
    // Button is restored to enabled state
    expect(await screen.findByRole("button", { name: /continue with google/i })).toBeEnabled();
  });

  it("respects the disabled prop", () => {
    render(<GoogleAuthButton disabled={true} />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDisabled();
  });
});
