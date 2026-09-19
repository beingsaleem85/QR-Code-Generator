// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Pagination } from "@/components/dashboard/Pagination";

let currentParams = new URLSearchParams();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/dashboard/qr-codes",
  useSearchParams: () => currentParams,
}));

afterEach(() => cleanup());
beforeEach(() => {
  currentParams = new URLSearchParams();
  pushMock.mockReset();
});

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination page={1} pageCount={1} totalCount={3} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total count", () => {
    render(<Pagination page={2} pageCount={5} totalCount={97} />);
    expect(screen.getByText(/Page 2 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/97 total/)).toBeInTheDocument();
  });

  it("disables Previous on the first page and links Next to page 2", () => {
    render(<Pagination page={1} pageCount={5} totalCount={97} />);

    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes?page=2",
    );
  });

  it("disables Next on the last page and links Previous back one page, omitting page=1 entirely", () => {
    render(<Pagination page={5} pageCount={5} totalCount={97} />);

    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes?page=4",
    );
  });

  it("preserves other search params while changing page", () => {
    currentParams = new URLSearchParams("type=pdf&sort=name");
    render(<Pagination page={2} pageCount={3} totalCount={50} />);

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes?type=pdf&sort=name&page=3",
    );
  });

  it("displays the correct range for middle page (e.g. 11-20 of 23)", () => {
    render(<Pagination page={2} pageCount={3} totalCount={23} pageSize={10} />);
    expect(screen.getByText(/11–20 of 23 total/)).toBeInTheDocument();
  });

  it("displays exactly 10, 25, 50, 100 as selectable page sizes", () => {
    render(<Pagination page={1} pageCount={3} totalCount={23} pageSize={10} />);
    const select = screen.getByRole("combobox", { name: "Page size" });
    expect(select).toBeInTheDocument();
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toEqual(["10", "25", "50", "100"]);
  });

  it("updates pageSize in URL and resets page to 1 on page size change", async () => {
    currentParams = new URLSearchParams("page=2&q=test");
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<Pagination page={2} pageCount={3} totalCount={23} pageSize={10} />);

    const select = screen.getByRole("combobox", { name: "Page size" });
    await user.selectOptions(select, "25");

    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes?q=test&pageSize=25");
  });
});
