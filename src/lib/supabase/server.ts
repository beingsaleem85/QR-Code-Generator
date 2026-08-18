import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server client for Server Components/Actions/Route Handlers — reads and
 * writes the session via Next 16's async `cookies()`. `setAll` can throw
 * when called from a Server Component render (cookies are read-only there);
 * that's expected and harmless because `proxy.ts` refreshes the session
 * cookie on every request regardless.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — no-op, see above.
          }
        },
      },
    },
  );
}
