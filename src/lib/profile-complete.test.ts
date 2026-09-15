import { describe, expect, it } from 'vitest'
import { isProfileComplete, nextOnboardingStep } from './profile-complete'

const complete = {
  photos: ['https://r2.example/a.jpg'],
  name: 'Alex',
  location: 'Berlin, DE',
  bio: 'Here for the vibes.',
}

describe('isProfileComplete', () => {
  it('accepts a fully filled profile', () => {
    expect(isProfileComplete(complete)).toBe(true)
  })

  it('accepts a profile with no photos — photos are optional', () => {
    expect(isProfileComplete({ ...complete, photos: [] })).toBe(true)
    expect(isProfileComplete({ ...complete, photos: null })).toBe(true)
    expect(isProfileComplete({ name: 'Alex', location: 'Berlin, DE', bio: 'Here for the vibes.' })).toBe(true)
  })

  it('rejects null/undefined and each missing requirement', () => {
    expect(isProfileComplete(null)).toBe(false)
    expect(isProfileComplete(undefined)).toBe(false)
    expect(isProfileComplete({ ...complete, name: null })).toBe(false)
    expect(isProfileComplete({ ...complete, name: '   ' })).toBe(false)
    expect(isProfileComplete({ ...complete, location: null })).toBe(false)
    expect(isProfileComplete({ ...complete, location: '  ' })).toBe(false)
    expect(isProfileComplete({ ...complete, bio: null })).toBe(false)
    expect(isProfileComplete({ ...complete, bio: '  ' })).toBe(false)
  })
})

describe('nextOnboardingStep', () => {
  it('starts at the photo step when there are no photos', () => {
    expect(nextOnboardingStep(null)).toBe(1)
    expect(nextOnboardingStep({ ...complete, photos: [] })).toBe(1)
  })

  it('jumps to the first missing requirement when photos exist', () => {
    expect(nextOnboardingStep({ ...complete, name: null })).toBe(2)
    expect(nextOnboardingStep({ ...complete, location: null })).toBe(3)
    expect(nextOnboardingStep({ ...complete, bio: null })).toBe(4)
    expect(nextOnboardingStep(complete)).toBe(4)
  })
})
