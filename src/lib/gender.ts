export const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'] as const

export type GenderOption = (typeof GENDER_OPTIONS)[number]

const LEGACY_TO_CANONICAL: Record<string, GenderOption> = {
  female: 'Woman',
  woman: 'Woman',
  male: 'Man',
  man: 'Man',
  nonbinary: 'Non-binary',
  'non-binary': 'Non-binary',
}

export function normalizeGender(raw: string | null | undefined): GenderOption | '' {
  if (!raw) return ''
  const key = raw.trim().toLowerCase()
  if (key === 'prefer not to say') return 'Prefer not to say'
  return LEGACY_TO_CANONICAL[key] ?? ''
}

export function gendersMatching(showMe: 'Women' | 'Men'): string[] {
  return showMe === 'Women' ? ['Woman', 'Female'] : ['Man', 'Male']
}

export function genderInitial(raw: string | null | undefined): string {
  const canonical = normalizeGender(raw)
  if (canonical === 'Woman') return 'W'
  if (canonical === 'Man') return 'M'
  return ''
}
