import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Secure (database-verified, not just cookie-presence) session check for
 * Server Components/Actions. `proxy.ts` already redirects unauthenticated
 * requests away from `/dashboard` optimistically, but per Next.js's own
 * auth guidance that check alone isn't sufficient — this is the mandatory
 * re-check close to the data, called from the `(dashboard)` layout.
 * `cache()`'d so multiple calls during one render pass reuse the same
 * request instead of re-hitting Supabase Auth.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});
