// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TrialStatusWidget } from "@/components/dashboard/TrialStatusWidget";
import type { TrialInfo } from "@/lib/account/trial";

afterEach(() => {
  cleanup();
});

describe("TrialStatusWidget", () => {
  it("renders active free trial with days remaining and upgrade link", () => {
    const trialInfo: TrialInfo = {
      isFreeTrial: true,
      isTrialExpired: false,
      trialExpiresAt: new Date(Date.now() + 9 * 86400000),
      remainingMs: 9 * 86400000,
      remainingDays: 9,
      remainingHours: 216,
      displayText: "Free Trial • 9 days remaining",
    };

    render(<TrialStatusWidget trialInfo={trialInfo} />);

    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    expect(screen.getByText("9 days remaining")).toBeInTheDocument();
    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    expect(upgradeLink).toBeInTheDocument();
    expect(upgradeLink).toHaveAttribute("href", "/pricing");
  });

  it("renders active free trial with hours remaining near expiry", () => {
    const trialInfo: TrialInfo = {
      isFreeTrial: true,
      isTrialExpired: false,
      trialExpiresAt: new Date(Date.now() + 2 * 3600000),
      remainingMs: 2 * 3600000,
      remainingDays: 1,
      remainingHours: 2,
      displayText: "Free Trial • 2 hours remaining",
    };

    render(<TrialStatusWidget trialInfo={trialInfo} />);

    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    expect(screen.getByText("2 hours remaining")).toBeInTheDocument();
  });

  it("renders expired free trial with expired alert and prominent upgrade CTA", () => {
    const trialInfo: TrialInfo = {
      isFreeTrial: true,
      isTrialExpired: true,
      trialExpiresAt: new Date(Date.now() - 86400000),
      remainingMs: 0,
      remainingDays: 0,
      remainingHours: 0,
      displayText: "Free Trial Expired",
    };

    render(<TrialStatusWidget trialInfo={trialInfo} />);

    expect(screen.getByText("Free Trial Expired")).toBeInTheDocument();
    expect(
      screen.getByText("Upgrade to create new QRs and reactivate dynamic QRs."),
    ).toBeInTheDocument();
    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    expect(upgradeLink).toBeInTheDocument();
    expect(upgradeLink).toHaveAttribute("href", "/pricing");
  });

  it("renders Pro badge for paid account without upgrade CTA", () => {
    const trialInfo: TrialInfo = {
      isFreeTrial: false,
      isTrialExpired: false,
      trialExpiresAt: null,
      remainingMs: Infinity,
      remainingDays: Infinity,
      remainingHours: Infinity,
      displayText: "Pro",
    };

    render(<TrialStatusWidget trialInfo={trialInfo} />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /upgrade to pro/i })).not.toBeInTheDocument();
  });

  it("renders Lifetime Pro badge for lifetime account", () => {
    const trialInfo: TrialInfo = {
      isFreeTrial: false,
      isTrialExpired: false,
      trialExpiresAt: null,
      remainingMs: Infinity,
      remainingDays: Infinity,
      remainingHours: Infinity,
      displayText: "Lifetime Pro",
    };

    render(<TrialStatusWidget trialInfo={trialInfo} />);

    expect(screen.getByText("Lifetime Pro")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /upgrade to pro/i })).not.toBeInTheDocument();
  });
});
