import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

/**
 * `qrforge.space` is this app's single canonical production domain — these
 * are the only two hosts that must never remain independent production
 * identities. Matched by exact hostname, never a `*.vercel.app` wildcard:
 * Vercel's own per-deployment/preview/branch aliases (used for build
 * previews, screenshots, internal tooling) must keep working unredirected,
 * so only this one specific, publicly-known old production hostname is
 * targeted. `www` is a real custom domain (unlike the auto-generated old
 * host), but redirecting it here rather than via Vercel's own domain
 * settings keeps both canonicalization rules in one place, verifiable in
 * code instead of split across the Vercel dashboard.
 */
const CANONICAL_ORIGIN = "https://qrforge.space";
const REDIRECT_HOSTS = new Set(["qr-code-generator-ebon-seven.vercel.app", "www.qrforge.space"]);

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host");
  if (!host || !REDIRECT_HOSTS.has(host)) return null;

  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, CANONICAL_ORIGIN);
  // 308 preserves the request method (a redirected POST stays a POST),
  // and signals "permanent" the way 301 traditionally did for GETs — the
  // correct choice for a domain migration search engines and clients
  // should learn to stop hitting the old host for.
  return NextResponse.redirect(target, 308);
}

/**
 * Optimistic, cookie-based auth check per Next.js's own guidance: Proxy
 * runs on every request (including prefetches), so it only reads the
 * session from the cookie and never hits the database. The mandatory,
 * database-verified re-check lives in `src/lib/supabase/dal.ts`, called
 * from the `(dashboard)` layout — this is defense in depth, not the only
 * line of defense.
 */
export async function proxy(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (not getSession()) validates the JWT against Supabase Auth
  // rather than trusting the cookie's claims outright — still cheap enough
  // to run on every request, and it's what refreshes an expiring session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthOnlyRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
