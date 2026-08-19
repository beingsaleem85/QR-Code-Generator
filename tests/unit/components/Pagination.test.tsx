// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Pagination } from "@/components/dashboard/Pagination";

let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/qr-codes",
  useSearchParams: () => currentParams,
}));

afterEach(() => cleanup());
beforeEach(() => {
  currentParams = new URLSearchParams();
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
});
