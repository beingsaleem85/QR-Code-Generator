import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — cookie-backed session, safe to call from Client
 * Components. Only ever constructed with the public URL/anon key, never a
 * privileged key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
