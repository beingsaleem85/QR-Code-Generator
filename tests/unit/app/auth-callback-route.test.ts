import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, safeNext } from "@/app/(auth)/auth/callback/route";

const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();
const ensureProfileMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
    },
  })),
}));

vi.mock("@/lib/supabase/profile", () => ({
  ensureProfile: (...args: unknown[]) => ensureProfileMock(...args),
}));

describe("/auth/callback route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("safeNext open-redirect protection", () => {
    it("defaults to /dashboard for null, empty, or whitespace", () => {
      expect(safeNext(null)).toBe("/dashboard");
      expect(safeNext("")).toBe("/dashboard");
      expect(safeNext("   ")).toBe("/dashboard");
    });

    it("rejects absolute external URLs", () => {
      expect(safeNext("https://evil.example")).toBe("/dashboard");
      expect(safeNext("http://attacker.com/steal")).toBe("/dashboard");
      expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
    });

    it("rejects protocol-relative URLs", () => {
      expect(safeNext("//evil.example")).toBe("/dashboard");
      expect(safeNext("//evil.example/path")).toBe("/dashboard");
    });

    it("rejects backslash bypass attempts", () => {
      expect(safeNext("/\\evil.example")).toBe("/dashboard");
      expect(safeNext("\\evil.example")).toBe("/dashboard");
      expect(safeNext("/dashboard\\..\\evil.example")).toBe("/dashboard");
    });

    it("preserves safe same-origin relative paths and query params", () => {
      expect(safeNext("/dashboard")).toBe("/dashboard");
      expect(safeNext("/dashboard/qr-codes")).toBe("/dashboard/qr-codes");
      expect(safeNext("/dashboard/qr-codes?page=2&pageSize=25")).toBe(
        "/dashboard/qr-codes?page=2&pageSize=25",
      );
      expect(safeNext("/dashboard/account#plan")).toBe("/dashboard/account#plan");
    });
  });

  describe("OAuth PKCE code exchange flow", () => {
    it("exchanges code for session, ensures profile, and redirects to safe next target", async () => {
      const mockUser = { id: "user-oauth-123", email: "user@gmail.com" };
      exchangeCodeForSessionMock.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: "tok" } },
        error: null,
      });

      const request = new NextRequest(
        "https://qrforge.space/auth/callback?code=oauth-code-abc&next=/dashboard/qr-codes",
      );

      const response = await GET(request);

      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("oauth-code-abc");
      expect(ensureProfileMock).toHaveBeenCalledWith(expect.anything(), mockUser);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://qrforge.space/dashboard/qr-codes");
    });

    it("sanitizes malicious next param and redirects to /dashboard", async () => {
      const mockUser = { id: "user-oauth-123", email: "user@gmail.com" };
      exchangeCodeForSessionMock.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: "tok" } },
        error: null,
      });

      const request = new NextRequest(
        "https://qrforge.space/auth/callback?code=oauth-code-abc&next=//attacker.com",
      );

      const response = await GET(request);

      expect(response.headers.get("location")).toBe("https://qrforge.space/dashboard");
    });

    it("handles OAuth exchange failure and redirects to login with error", async () => {
      exchangeCodeForSessionMock.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid or expired code" },
      });

      const request = new NextRequest(
        "https://qrforge.space/auth/callback?code=expired-code",
      );

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://qrforge.space/login?error=oauth_failed",
      );
    });

    it("handles provider access_denied parameter (e.g. user cancelled Google dialog)", async () => {
      const request = new NextRequest(
        "https://qrforge.space/auth/callback?error=access_denied&error_description=User+cancelled",
      );

      const response = await GET(request);

      expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://qrforge.space/login?error=access_denied",
      );
    });

    it("redirects to login when no code or token_hash is provided", async () => {
      const request = new NextRequest("https://qrforge.space/auth/callback");

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://qrforge.space/login?error=oauth_failed",
      );
    });
  });

  describe("Email OTP confirmation flow preservation", () => {
    it("verifies OTP token_hash, ensures profile, and redirects to dashboard", async () => {
      const mockUser = { id: "user-email-456", email: "new@example.com" };
      verifyOtpMock.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: "tok" } },
        error: null,
      });

      const request = new NextRequest(
        "https://qrforge.space/auth/callback?token_hash=hash-123&type=signup&next=/dashboard",
      );

      const response = await GET(request);

      expect(verifyOtpMock).toHaveBeenCalledWith({ type: "signup", token_hash: "hash-123" });
      expect(ensureProfileMock).toHaveBeenCalledWith(expect.anything(), mockUser);
      expect(response.headers.get("location")).toBe("https://qrforge.space/dashboard");
    });

    it("redirects to login with confirmation_failed when verifyOtp fails", async () => {
      verifyOtpMock.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Token expired" },
      });

      const request = new NextRequest(
        "https://qrforge.space/auth/callback?token_hash=bad-hash&type=signup",
      );

      const response = await GET(request);

      expect(response.headers.get("location")).toBe(
        "https://qrforge.space/login?error=confirmation_failed",
      );
    });
  });
});
