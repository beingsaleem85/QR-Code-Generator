export interface UserProfile {
  /** `null` until the user sets one — `profiles.display_name` has no
   * default and every account gets a bare `{ id }` row on first sign-in
   * (`ensureProfile`), so this is a genuinely unset state, not a loading
   * placeholder. */
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}
