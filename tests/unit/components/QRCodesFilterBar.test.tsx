// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodesFilterBar } from "@/components/dashboard/QRCodesFilterBar";

const pushMock = vi.fn();
let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/dashboard/qr-codes",
  useSearchParams: () => currentParams,
}));

afterEach(() => cleanup());

beforeEach(() => {
  pushMock.mockReset();
  currentParams = new URLSearchParams();
});

describe("QRCodesFilterBar", () => {
  it("debounces search input before updating the URL", async () => {
    render(<QRCodesFilterBar folders={[]} />);

    // fireEvent.change (not userEvent.type) sets the whole value in one
    // synchronous event — real timers throughout, matching this project's
    // own "don't fight setTimeout-based delays" guidance rather than
    // combining userEvent with fake timers.
    fireEvent.change(screen.getByLabelText("Search QR codes by name"), {
      target: { value: "menu" },
    });
    expect(pushMock).not.toHaveBeenCalled();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?q=menu"), {
      timeout: 1000,
    });
  });

  it("updates the URL immediately when the type filter changes", async () => {
    const user = userEvent.setup();
    render(<QRCodesFilterBar folders={[]} />);

    await user.selectOptions(screen.getByLabelText("Filter by type"), "pdf");

    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?type=pdf");
  });

  it("resets the page param when a filter changes", async () => {
    currentParams = new URLSearchParams("page=3");
    const user = userEvent.setup();
    render(<QRCodesFilterBar folders={[]} />);

    await user.selectOptions(screen.getByLabelText("Filter by static or dynamic"), "dynamic");

    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?mode=dynamic");
  });

  it("splits the combined sort value into sort and dir params, without resetting page", async () => {
    currentParams = new URLSearchParams("page=3");
    const user = userEvent.setup();
    render(<QRCodesFilterBar folders={[]} />);

    await user.selectOptions(screen.getByLabelText("Sort by"), "name:asc");

    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?page=3&sort=name&dir=asc");
  });

  it("shows a folder option only when folders exist", () => {
    const { rerender } = render(<QRCodesFilterBar folders={[]} />);
    expect(screen.queryByLabelText("Filter by folder")).not.toBeInTheDocument();

    rerender(
      <QRCodesFilterBar folders={[{ id: "folder-1", name: "Restaurants", createdAt: "" }]} />,
    );
    expect(screen.getByLabelText("Filter by folder")).toBeInTheDocument();
  });

  it("clearing the search box removes the q param", async () => {
    currentParams = new URLSearchParams("q=menu");
    render(<QRCodesFilterBar folders={[]} />);

    fireEvent.change(screen.getByLabelText("Search QR codes by name"), { target: { value: "" } });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?"), {
      timeout: 1000,
    });
  });
});
