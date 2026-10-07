import sanitizeHtmlLib from 'sanitize-html'

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: { a: ['href'] },
  })
}

export function sanitizeText(text: string): string {
  return sanitizeHtmlLib(text, { allowedTags: [], allowedAttributes: {} })
}

export function sanitizeProfile(data: {
  name?: string | null
  bio?: string | null
  job?: string | null
  location?: string | null
  interests?: string[]
}) {
  return {
    ...data,
    name: data.name ? sanitizeText(data.name) : data.name,
    bio: data.bio ? sanitizeText(data.bio) : data.bio,
    job: data.job ? sanitizeText(data.job) : data.job,
    location: data.location ? sanitizeText(data.location) : data.location,
    interests: data.interests?.map(sanitizeText),
  }
}
