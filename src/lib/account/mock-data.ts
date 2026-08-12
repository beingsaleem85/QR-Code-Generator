import type { UserProfile } from "@/types/account";

/**
 * Phase 2 (UI) stand-in for the real `profiles` row + `auth.users` email,
 * joined together the same way the Account page will once Module 3.1 wires
 * real auth — `display_name`/`avatar_url` live in `profiles`, `email` lives
 * on `auth.users` and is not itself editable from this app.
 */
export const MOCK_PROFILE: UserProfile = {
  displayName: "Ada Lovelace",
  email: "ada@example.com",
  avatarUrl: null,
};
