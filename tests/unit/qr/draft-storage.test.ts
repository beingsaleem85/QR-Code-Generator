import { describe, expect, it, beforeEach } from "vitest";
import { stashDraft, peekDraft, clearDraft, takeDraft, type QrDraft } from "@/lib/qr/draft-storage";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

describe("draft-storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const sampleDraft: QrDraft = {
    name: "My Awesome QR",
    mode: "dynamic",
    qrType: "url",
    content: { url: "https://example.com/welcome" },
    design: DEFAULT_DESIGN_CONFIG,
  };

  it("stashes and peeks draft without clearing it", () => {
    stashDraft(sampleDraft);
    const retrieved = peekDraft();
    expect(retrieved).toEqual(sampleDraft);

    // Second peek must still return the draft
    expect(peekDraft()).toEqual(sampleDraft);
  });

  it("clears draft with clearDraft", () => {
    stashDraft(sampleDraft);
    expect(peekDraft()).not.toBeNull();

    clearDraft();
    expect(peekDraft()).toBeNull();
  });

  it("takeDraft returns draft and removes it atomically", () => {
    stashDraft(sampleDraft);
    const taken = takeDraft();
    expect(taken).toEqual(sampleDraft);

    // Subsequent read must be null
    expect(peekDraft()).toBeNull();
    expect(takeDraft()).toBeNull();
  });

  it("strips sensitive tokens/keys when stashing draft", () => {
    const dirtyDraft: QrDraft = {
      name: "Dirty Draft",
      mode: "dynamic",
      qrType: "url",
      content: {
        url: "https://example.com",
        password: "super-secret-password",
        token: "jwt-token-xyz",
        secret: "private-key-123",
        apiKey: "sbp_secret",
        safeMeta: "safe-value",
      },
      design: DEFAULT_DESIGN_CONFIG,
    };

    stashDraft(dirtyDraft);
    const retrieved = peekDraft();
    expect(retrieved?.content.url).toBe("https://example.com");
    expect(retrieved?.content.safeMeta).toBe("safe-value");
    const contentRecord = retrieved?.content as Record<string, unknown> | undefined;
    expect(contentRecord?.password).toBeUndefined();
    expect(contentRecord?.token).toBeUndefined();
    expect(contentRecord?.secret).toBeUndefined();
    expect(contentRecord?.apiKey).toBeUndefined();
  });
});
