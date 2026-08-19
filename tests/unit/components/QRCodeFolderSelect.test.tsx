// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodeFolderSelect } from "@/components/dashboard/QRCodeFolderSelect";
import type { QrFolder } from "@/types/folder";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const assignQrCodeFolderMock = vi.fn();
vi.mock("@/lib/folders/actions", () => ({
  assignQrCodeFolder: (...args: unknown[]) => assignQrCodeFolderMock(...args),
}));

afterEach(() => cleanup());
beforeEach(() => {
  refreshMock.mockReset();
  assignQrCodeFolderMock.mockReset();
  assignQrCodeFolderMock.mockResolvedValue({ data: { id: "qr-1" } });
});

const FOLDERS: QrFolder[] = [{ id: "folder-1", name: "Restaurants", createdAt: "" }];

describe("QRCodeFolderSelect", () => {
  it("renders nothing when there are no folders", () => {
    const { container } = render(
      <QRCodeFolderSelect qrCodeId="qr-1" folderId={null} folders={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("assigns the selected folder and refreshes", async () => {
    const user = userEvent.setup();
    render(<QRCodeFolderSelect qrCodeId="qr-1" folderId={null} folders={FOLDERS} />);

    await user.selectOptions(screen.getByLabelText("Folder"), "folder-1");

    expect(assignQrCodeFolderMock).toHaveBeenCalledWith("qr-1", "folder-1");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("unfiles when 'Unfiled' is selected", async () => {
    const user = userEvent.setup();
    render(<QRCodeFolderSelect qrCodeId="qr-1" folderId="folder-1" folders={FOLDERS} />);

    await user.selectOptions(screen.getByLabelText("Folder"), "Unfiled");

    expect(assignQrCodeFolderMock).toHaveBeenCalledWith("qr-1", null);
  });
});
