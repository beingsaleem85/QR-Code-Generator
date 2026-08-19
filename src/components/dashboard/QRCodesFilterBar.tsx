"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listQrTypeDefinitions } from "@/lib/qr/registry";
import type { QrFolder } from "@/types/folder";

interface QRCodesFilterBarProps {
  folders: QrFolder[];
}

const SORT_OPTIONS = [
  { value: "updated_at:desc", label: "Recently updated" },
  { value: "updated_at:asc", label: "Oldest updated" },
  { value: "created_at:desc", label: "Recently created" },
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "scan_count_cached:desc", label: "Most scans" },
] as const;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Every control here writes straight to the URL's search params — the
 * page itself is a Server Component that re-fetches from `listQrCodesPage`
 * on every navigation, so there's no separate client-side filter state to
 * keep in sync (the URL *is* the state, bookmarkable/shareable as a side
 * effect). Any change other than paging resets `page` back to 1, since a
 * new filter almost never still has enough matching rows for whatever page
 * the user happened to be on.
 */
export function QRCodesFilterBar({ folders }: QRCodesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const pushParams = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (searchInput === current) return;
    const timeout = setTimeout(() => pushParams({ q: searchInput || null }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on searchInput changes; re-running on searchParams/pushParams would fight the debounce.
  }, [searchInput]);

  const sortValue = `${searchParams.get("sort") || "updated_at"}:${searchParams.get("dir") || "desc"}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        type="search"
        placeholder="Search by name"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        className="w-full sm:max-w-xs"
        aria-label="Search QR codes by name"
      />

      <Select
        value={searchParams.get("type") ?? ""}
        onChange={(event) => pushParams({ type: event.target.value || null })}
        aria-label="Filter by type"
      >
        <option value="">All types</option>
        {listQrTypeDefinitions().map((definition) => (
          <option key={definition.key} value={definition.key}>
            {definition.label}
          </option>
        ))}
      </Select>

      <Select
        value={searchParams.get("mode") ?? ""}
        onChange={(event) => pushParams({ mode: event.target.value || null })}
        aria-label="Filter by static or dynamic"
      >
        <option value="">Static + Dynamic</option>
        <option value="static">Static</option>
        <option value="dynamic">Dynamic</option>
      </Select>

      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(event) => pushParams({ status: event.target.value || null })}
        aria-label="Filter by status"
      >
        <option value="">Active + Paused</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="archived">Archived</option>
      </Select>

      {folders.length > 0 ? (
        <Select
          value={searchParams.get("folder") ?? ""}
          onChange={(event) => pushParams({ folder: event.target.value || null })}
          aria-label="Filter by folder"
        >
          <option value="">All folders</option>
          <option value="unfiled">Unfiled</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </Select>
      ) : null}

      <Select
        value={sortValue}
        onChange={(event) => {
          const [sort, dir] = event.target.value.split(":");
          pushParams({ sort, dir }, false);
        }}
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
