/**
 * Profile-completeness rules shared by the onboarding gate (root beforeLoad)
 * and the wizard itself. Client-safe: no server imports.
 *
 * Required to count as onboarded:
 *  - a name (prefilled from the account, so usually free)
 *  - a location (shown on every card)
 *  - a short bio
 *
 * A profile photo is offered by the wizard but optional — AvatarImage falls
 * back to a placeholder everywhere, so a photo-less profile renders fine.
 */
export interface ProfileCompletenessInput {
  photos?: string[] | null
  name?: string | null
  location?: string | null
  bio?: string | null
}

export function isProfileComplete(profile: ProfileCompletenessInput | null | undefined): boolean {
  if (!profile) return false
  return (
    !!profile.name?.trim() &&
    !!profile.location?.trim() &&
    !!profile.bio?.trim()
  )
}

/** The first wizard step (1-based) the profile still needs, or 4 when done. */
export function nextOnboardingStep(profile: ProfileCompletenessInput | null | undefined): 1 | 2 | 3 | 4 {
  // No photos yet → start at the photo step, where skipping is one tap.
  if ((profile?.photos?.length ?? 0) === 0) return 1
  if (!profile?.name?.trim()) return 2
  if (!profile?.location?.trim()) return 3
  return 4
}
