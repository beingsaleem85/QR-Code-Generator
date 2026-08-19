// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderManager } from "@/components/dashboard/FolderManager";
import type { QrFolder } from "@/types/folder";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const createFolderMock = vi.fn();
const deleteFolderMock = vi.fn();
vi.mock("@/lib/folders/actions", () => ({
  createFolder: (...args: unknown[]) => createFolderMock(...args),
  deleteFolder: (...args: unknown[]) => deleteFolderMock(...args),
}));

afterEach(() => cleanup());
beforeEach(() => {
  refreshMock.mockReset();
  createFolderMock.mockReset();
  deleteFolderMock.mockReset();
});

const FOLDERS: QrFolder[] = [{ id: "folder-1", name: "Restaurants", createdAt: "2026-08-01" }];

describe("FolderManager", () => {
  it("shows a no-folders message when there are none yet", () => {
    render(<FolderManager folders={[]} />);
    expect(screen.getByText("No folders yet.")).toBeInTheDocument();
  });

  it("creates a folder and refreshes on success", async () => {
    createFolderMock.mockResolvedValue({ data: { id: "folder-2" } });
    const user = userEvent.setup();
    render(<FolderManager folders={[]} />);

    await user.type(screen.getByLabelText("New folder name"), "Cafes");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(createFolderMock).toHaveBeenCalledWith("Cafes");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and does not refresh when creation fails", async () => {
    createFolderMock.mockResolvedValue({ error: 'You already have a folder named "Cafes".' });
    const user = userEvent.setup();
    render(<FolderManager folders={[]} />);

    await user.type(screen.getByLabelText("New folder name"), "Cafes");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText(/already have a folder/)).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("deletes a folder after confirmation", async () => {
    deleteFolderMock.mockResolvedValue({ data: { id: "folder-1" } });
    const user = userEvent.setup();
    render(<FolderManager folders={FOLDERS} />);

    await user.click(screen.getByRole("button", { name: "Delete folder Restaurants" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm delete Restaurants" });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(deleteFolderMock).toHaveBeenCalledWith("folder-1");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("cancelling the delete dialog does not call deleteFolder", async () => {
    const user = userEvent.setup();
    render(<FolderManager folders={FOLDERS} />);

    await user.click(screen.getByRole("button", { name: "Delete folder Restaurants" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm delete Restaurants" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(deleteFolderMock).not.toHaveBeenCalled();
  });
});
