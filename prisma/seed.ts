import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function pic(seed: string, idx: number) {
  return `https://picsum.photos/seed/${seed}${idx}/400/600`
}

async function main() {
  // Create profiles for demo users (user IDs will come from Better Auth)
  // First, we need to create users via Better Auth or directly
  // For seeding, we'll create placeholder user IDs

  const profiles = [
    { userId: 'u1', name: 'Maya', bio: 'Architect by day, pottery enthusiast by night.', photos: [pic('maya', 1), pic('maya', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Coffee', 'Hiking', 'Indie Music', 'Pottery'], job: 'Architect at Studio North' },
    { userId: 'u2', name: 'Jordan', bio: 'Dog lover and weekend hiker.', photos: [pic('jordan', 1), pic('jordan', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Dogs', 'Hiking', 'Coffee', 'Photography'], job: 'Marketing Coordinator' },
    { userId: 'u3', name: 'Sam', bio: 'Musician and creative. I play guitar and write songs.', photos: [pic('sam', 1), pic('sam', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Music', 'Guitar', 'Concerts', 'Writing'], job: 'Sound Engineer' },
    { userId: 'u4', name: 'Taylor', bio: 'Foodie traveler searching for the best tacos.', photos: [pic('taylor', 1), pic('taylor', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Food', 'Travel', 'Cooking', 'Tacos'], job: 'Travel Blogger' },
    { userId: 'u5', name: 'Casey', bio: 'Fitness coach and early riser.', photos: [pic('casey', 1), pic('casey', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Fitness', 'Running', 'Smoothies', 'Yoga'], job: 'Personal Trainer' },
    { userId: 'u6', name: 'Alex', bio: 'Software engineer by day, board game nerd by night.', photos: [pic('alex', 1), pic('alex', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Board Games', 'Coding', 'Pizza', 'Sci-Fi'], job: 'Software Engineer' },
    { userId: 'u7', name: 'Riley', bio: 'Art student who loves museums and galleries.', photos: [pic('riley', 1), pic('riley', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Art', 'Museums', 'Sketching', 'Nature'], job: 'Art Student' },
    { userId: 'u8', name: 'Drew', bio: 'Craft beer enthusiast and home brewer.', photos: [pic('drew', 1), pic('drew', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Craft Beer', 'Brewing', 'Pubs', 'Football'], job: 'Brewmaster' },
    { userId: 'u9', name: 'Quinn', bio: 'Plant parent and bookworm.', photos: [pic('quinn', 1), pic('quinn', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Plants', 'Reading', 'Tea', 'Stationery'], job: 'Library Assistant' },
    { userId: 'u10', name: 'Avery', bio: 'Chef exploring farm-to-table cuisine.', photos: [pic('avery', 1), pic('avery', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Cooking', 'Farming', 'Wine', 'Markets'], job: 'Sous Chef' },
    { userId: 'u11', name: 'Parker', bio: 'Photographer capturing the Pacific Northwest.', photos: [pic('parker', 1), pic('parker', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Photography', 'Hiking', 'Sunsets', 'Camping'], job: 'Freelance Photographer' },
    { userId: 'u12', name: 'Skyler', bio: 'Yoga instructor and mindfulness coach.', photos: [pic('skyler', 1), pic('skyler', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Yoga', 'Meditation', 'Tea', 'Wellness'], job: 'Yoga Instructor' },
    { userId: 'u13', name: 'Cameron', bio: 'Gamer and tech reviewer.', photos: [pic('cameron', 1), pic('cameron', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Gaming', 'Tech', 'Streaming', 'Sushi'], job: 'Tech Reviewer' },
    { userId: 'u14', name: 'Reese', bio: 'Dancer and choreographer.', photos: [pic('reese', 1), pic('reese', 2)], gender: 'Female', location: 'Seattle, WA', interests: ['Dance', 'Choreography', 'Music', 'Theater'], job: 'Choreographer' },
    { userId: 'u15', name: 'Blake', bio: 'Entrepreneur building the next big thing.', photos: [pic('blake', 1), pic('blake', 2)], gender: 'Male', location: 'Seattle, WA', interests: ['Startups', 'Travel', 'Coffee', 'Networking'], job: 'Startup Founder' },
  ]

  // Seed profiles
  for (const p of profiles) {
    await prisma.profile.upsert({
      where: { userId: p.userId },
      update: {},
      create: p,
    })
  }
  console.log('Seeded 15 profiles')

  // Seed events
  const events = [
    { code: 'ARTWALK', name: 'Capitol Hill Art Walk', description: 'Monthly gallery crawl through Capitol Hill.', location: 'Capitol Hill, Seattle', createdById: 'u1', isActive: true, maxAttendees: 100, startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { code: 'FREMONT', name: 'Fremont Friday Night', description: 'Weekly social at the Fremont Brewing taproom.', location: 'Fremont Brewing, Seattle', createdById: 'u6', isActive: true, maxAttendees: 50, startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { code: 'COFFEE', name: 'Downtown Coffee Fest', description: 'Weekend coffee tasting event.', location: 'Pike Place Market, Seattle', createdById: 'u11', isActive: true, maxAttendees: 200, startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { code: 'SUMMIT', name: 'Tech Summit Afterparty', description: 'Networking afterparty for local tech professionals.', location: 'South Lake Union, Seattle', createdById: 'u3', isActive: true, maxAttendees: 150, startsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
  ]

  for (const e of events) {
    await prisma.event.upsert({
      where: { code: e.code },
      update: {},
      create: e,
    })
  }
  console.log('Seeded 4 events')

  // Seed attendees
  const artwalk = await prisma.event.findUnique({ where: { code: 'ARTWALK' } })
  const fremont = await prisma.event.findUnique({ where: { code: 'FREMONT' } })
  const coffee = await prisma.event.findUnique({ where: { code: 'COFFEE' } })

  if (artwalk) {
    for (const uid of ['u1', 'u2', 'u3', 'u4', 'u5']) {
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: artwalk.id, userId: uid } },
        update: {},
        create: { eventId: artwalk.id, userId: uid },
      })
    }
  }
  if (fremont) {
    for (const uid of ['u6', 'u7', 'u8', 'u9', 'u10']) {
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: fremont.id, userId: uid } },
        update: {},
        create: { eventId: fremont.id, userId: uid },
      })
    }
  }
  if (coffee) {
    for (const uid of ['u11', 'u12', 'u13', 'u14', 'u15']) {
      await prisma.eventAttendee.upsert({
        where: { eventId_userId: { eventId: coffee.id, userId: uid } },
        update: {},
        create: { eventId: coffee.id, userId: uid },
      })
    }
  }
  console.log('Seeded attendees')
}

main()
  .then(() => {
    console.log('Done seeding')
    return prisma.$disconnect()
  })
  .catch((e) => {
    console.error(e)
    return prisma.$disconnect()
  })
