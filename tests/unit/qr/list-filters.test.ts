import { describe, expect, it } from "vitest";
import { parseQrListSearchParams } from "@/lib/qr/list-filters";

describe("parseQrListSearchParams", () => {
  it("returns an empty filter set for empty params", () => {
    expect(parseQrListSearchParams({})).toEqual({});
  });

  it("trims and keeps a valid search term", () => {
    expect(parseQrListSearchParams({ q: "  menu  " })).toEqual({ search: "menu" });
  });

  it("drops a blank search term", () => {
    expect(parseQrListSearchParams({ q: "   " })).toEqual({});
  });

  it("keeps a valid registry type, drops an unknown one", () => {
    expect(parseQrListSearchParams({ type: "pdf" })).toEqual({ qrType: "pdf" });
    expect(parseQrListSearchParams({ type: "not-a-real-type" })).toEqual({});
  });

  it("keeps a valid mode, drops an unknown one", () => {
    expect(parseQrListSearchParams({ mode: "dynamic" })).toEqual({ mode: "dynamic" });
    expect(parseQrListSearchParams({ mode: "sideways" })).toEqual({});
  });

  it("keeps a valid status, drops an unknown one", () => {
    expect(parseQrListSearchParams({ status: "archived" })).toEqual({ status: "archived" });
    expect(parseQrListSearchParams({ status: "deleted" })).toEqual({});
  });

  it("keeps any non-empty folder id, including the literal 'unfiled'", () => {
    expect(parseQrListSearchParams({ folder: "folder-1" })).toEqual({ folderId: "folder-1" });
    expect(parseQrListSearchParams({ folder: "unfiled" })).toEqual({ folderId: "unfiled" });
  });

  it("keeps a valid sort field, drops an unknown one", () => {
    expect(parseQrListSearchParams({ sort: "name" })).toEqual({ sortBy: "name" });
    expect(parseQrListSearchParams({ sort: "popularity" })).toEqual({});
  });

  it("keeps a valid sort direction, drops an unknown one", () => {
    expect(parseQrListSearchParams({ dir: "asc" })).toEqual({ sortDirection: "asc" });
    expect(parseQrListSearchParams({ dir: "sideways" })).toEqual({});
  });

  it("keeps a valid positive integer page, drops zero/negative/non-numeric", () => {
    expect(parseQrListSearchParams({ page: "3" })).toEqual({ page: 3 });
    expect(parseQrListSearchParams({ page: "0" })).toEqual({});
    expect(parseQrListSearchParams({ page: "-1" })).toEqual({});
    expect(parseQrListSearchParams({ page: "abc" })).toEqual({});
  });

  it("combines every dimension at once", () => {
    expect(
      parseQrListSearchParams({
        q: "menu",
        type: "pdf",
        mode: "dynamic",
        status: "active",
        folder: "folder-1",
        sort: "updated_at",
        dir: "desc",
        page: "2",
      }),
    ).toEqual({
      search: "menu",
      qrType: "pdf",
      mode: "dynamic",
      status: "active",
      folderId: "folder-1",
      sortBy: "updated_at",
      sortDirection: "desc",
      page: 2,
    });
  });
});
