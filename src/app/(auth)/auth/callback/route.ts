import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profile";

/** Only follow a same-app path — never an arbitrary URL from the query string. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/**
 * Handles both email-link shapes Supabase Auth can send here, depending on
 * project configuration: a `token_hash`+`type` pair (the default signup-
 * confirmation/recovery template) and a PKCE `code` (used for some flow
 * configurations). Handling both makes this route work regardless of how
 * the project's email templates are set up, rather than assuming one.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  let user = null;
  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    user = result.data.user;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    user = result.data.user;
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  await ensureProfile(supabase, user);
  return NextResponse.redirect(`${origin}${next}`);
}
