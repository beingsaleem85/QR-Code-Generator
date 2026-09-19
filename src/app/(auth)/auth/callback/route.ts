import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profile";

import { safeNext } from "@/lib/auth/safe-redirect";

export { safeNext };

function getAppOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (forwardedHost && !isLocal) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return url.origin;
}

/**
 * Handles OAuth PKCE code exchange (Google sign-in/signup) and email OTP verification
 * (signup confirmation / password recovery).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getAppOrigin(request);

  // Handle provider denial or OAuth error parameters from Google/Supabase
  const oauthError = searchParams.get("error");
  if (oauthError) {
    const errorCode = oauthError === "access_denied" ? "access_denied" : "oauth_failed";
    return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  let user = null;
  let failureError = "oauth_failed";

  if (tokenHash && type) {
    failureError = "confirmation_failed";
    const result = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    user = result.data.user;
  } else if (code) {
    failureError = "oauth_failed";
    const result = await supabase.auth.exchangeCodeForSession(code);
    user = result.data.user;
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=${failureError}`);
  }

  await ensureProfile(supabase, user);
  return NextResponse.redirect(`${origin}${next}`);
}
