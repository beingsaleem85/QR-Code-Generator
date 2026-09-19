import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — cookie-backed session, safe to call from Client
 * Components. Only ever constructed with the public URL/anon key, never a
 * privileged key.
 */
export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "test") {
      url = url || "https://placeholder.supabase.co";
      anonKey = anonKey || "placeholder-anon-key";
    } else {
      throw new Error(
        "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined."
      );
    }
  }

  return createBrowserClient(
    url,
    anonKey,
    {
      isSingleton: true,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}
