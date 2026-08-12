// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/dashboard/EmptyState";

afterEach(() => cleanup());

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(<EmptyState title="No QR codes yet" description="Create your first one." />);

    expect(screen.getByText("No QR codes yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first one.")).toBeInTheDocument();
  });

  it("renders the provided action", () => {
    render(<EmptyState title="No QR codes yet" action={<button>Create QR Code</button>} />);

    expect(screen.getByRole("button", { name: "Create QR Code" })).toBeInTheDocument();
  });

  it("omits the description when not provided", () => {
    render(<EmptyState title="No QR codes yet" />);

    expect(screen.queryByText("Create your first one.")).not.toBeInTheDocument();
  });
});
