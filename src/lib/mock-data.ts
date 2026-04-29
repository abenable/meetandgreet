export interface MockEvent {
  id: string
  code: string
  name: string
  description: string
  location: string
  attendeeIds: string[]
  isActive: boolean
}

export interface MockProfile {
  id: string
  name: string
  age: number
  bio: string
  photos: string[]
  gender: string
  location: string
  distance: string
  interests: string[]
  job?: string
}

export interface MockMatch {
  id: string
  matchId: string
  name: string
  age: number
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
  messages: MockMessage[]
}

export interface MockMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  isSystem?: boolean
}

function pic(seed: string, idx: number) {
  return `https://picsum.photos/seed/${seed}${idx}/400/600`
}

export const mockProfiles: MockProfile[] = [
  {
    id: 'p1',
    name: 'Maya',
    age: 27,
    bio: 'Architect by day, pottery enthusiast by night. Looking for someone who does not take themselves too seriously.',
    photos: [pic('maya', 1), pic('maya', 2), pic('maya', 3)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '2 miles away',
    interests: ['Coffee', 'Hiking', 'Indie Music', 'Pottery'],
  },
  {
    id: 'p2',
    name: 'Jordan',
    age: 24,
    bio: 'Dog parent and weekend hiker. Always down for a good coffee chat or a spontaneous road trip.',
    photos: [pic('jordan', 1), pic('jordan', 2)],
    gender: 'Non-binary',
    location: 'Seattle, WA',
    distance: '5 miles away',
    interests: ['Dogs', 'Hiking', 'Coffee', 'Photography'],
  },
  {
    id: 'p3',
    name: 'Alex',
    age: 26,
    bio: 'Software engineer who loves climbing, cooking, and trying every ramen shop in the city.',
    photos: [pic('alex', 1), pic('alex', 2), pic('alex', 3)],
    gender: 'Man',
    location: 'Seattle, WA',
    distance: '1 mile away',
    interests: ['Climbing', 'Cooking', 'Ramen', 'Gaming'],
  },
  {
    id: 'p4',
    name: 'Sam',
    age: 28,
    bio: 'Musician and creative. I play guitar in a local band and write poetry on rainy days.',
    photos: [pic('sam', 1), pic('sam', 2)],
    gender: 'Man',
    location: 'Seattle, WA',
    distance: '3 miles away',
    interests: ['Music', 'Guitar', 'Poetry', 'Live Music'],
  },
  {
    id: 'p5',
    name: 'Taylor',
    age: 25,
    bio: 'Foodie traveler. I plan my trips around restaurants and markets. Let us explore together.',
    photos: [pic('taylor', 1), pic('taylor', 2), pic('taylor', 3)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '4 miles away',
    interests: ['Food', 'Travel', 'Cooking', 'Wine'],
  },
  {
    id: 'p6',
    name: 'Casey',
    age: 30,
    bio: 'Fitness coach and adventurer. Early riser, ocean swimmer, and sunset chaser.',
    photos: [pic('casey', 1), pic('casey', 2)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '6 miles away',
    interests: ['Fitness', 'Swimming', 'Adventure', 'Yoga'],
  },
  {
    id: 'p7',
    name: 'Riley',
    age: 23,
    bio: 'Art student with a love for street photography and vinyl records. Let us find hidden gems.',
    photos: [pic('riley', 1), pic('riley', 2), pic('riley', 3)],
    gender: 'Non-binary',
    location: 'Seattle, WA',
    distance: '2 miles away',
    interests: ['Art', 'Photography', 'Vinyl', 'Museums'],
  },
  {
    id: 'p8',
    name: 'Quinn',
    age: 29,
    bio: 'Board game nerd and craft beer enthusiast. Looking for a partner in crime for trivia nights.',
    photos: [pic('quinn', 1), pic('quinn', 2)],
    gender: 'Man',
    location: 'Seattle, WA',
    distance: '7 miles away',
    interests: ['Board Games', 'Craft Beer', 'Trivia', 'Puzzles'],
  },
  {
    id: 'p9',
    name: 'Avery',
    age: 26,
    bio: 'Yoga instructor and plant parent. I believe in good vibes, tea, and long walks.',
    photos: [pic('avery', 1), pic('avery', 2), pic('avery', 3)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '3 miles away',
    interests: ['Yoga', 'Plants', 'Tea', 'Walking'],
  },
  {
    id: 'p10',
    name: 'Drew',
    age: 31,
    bio: 'Chef who loves farmers markets and experimenting with new cuisines. Dinner is on me.',
    photos: [pic('drew', 1), pic('drew', 2)],
    gender: 'Man',
    location: 'Seattle, WA',
    distance: '5 miles away',
    interests: ['Cooking', 'Farmers Markets', 'Food', 'Wine'],
  },
  {
    id: 'p11',
    name: 'Skyler',
    age: 22,
    bio: 'College student studying environmental science. Love kayaking, camping, and sustainability.',
    photos: [pic('skyler', 1), pic('skyler', 2), pic('skyler', 3)],
    gender: 'Non-binary',
    location: 'Seattle, WA',
    distance: '4 miles away',
    interests: ['Kayaking', 'Camping', 'Sustainability', 'Nature'],
  },
  {
    id: 'p12',
    name: 'Jamie',
    age: 28,
    bio: 'Bookworm and coffee shop regular. Fantasy novels, pour-over, and rainy windows.',
    photos: [pic('jamie', 1), pic('jamie', 2)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '1 mile away',
    interests: ['Reading', 'Coffee', 'Fantasy', 'Writing'],
  },
  {
    id: 'p13',
    name: 'Cameron',
    age: 27,
    bio: 'Tech founder who runs marathons and codes side projects. Always learning something new.',
    photos: [pic('cameron', 1), pic('cameron', 2), pic('cameron', 3)],
    gender: 'Man',
    location: 'Seattle, WA',
    distance: '8 miles away',
    interests: ['Running', 'Startups', 'Tech', 'Learning'],
  },
  {
    id: 'p14',
    name: 'Peyton',
    age: 24,
    bio: 'Dancer and choreographer. I teach salsa on weekends and love live jazz.',
    photos: [pic('peyton', 1), pic('peyton', 2)],
    gender: 'Woman',
    location: 'Seattle, WA',
    distance: '3 miles away',
    interests: ['Dance', 'Salsa', 'Jazz', 'Performing'],
  },
  {
    id: 'p15',
    name: 'Reese',
    age: 29,
    bio: 'Outdoor photographer with a van. Let us chase sunsets and find the best views.',
    photos: [pic('reese', 1), pic('reese', 2), pic('reese', 3)],
    gender: 'Non-binary',
    location: 'Seattle, WA',
    distance: '10 miles away',
    interests: ['Photography', 'Van Life', 'Sunsets', 'Hiking'],
  },
]

const currentUserId = 'me'

export const mockMatches: MockMatch[] = [
  {
    id: 'm1',
    matchId: 'match1',
    name: 'Maya',
    age: 27,
    avatar: pic('maya', 1),
    lastMessage: 'Would love to check out that new pottery studio!',
    timestamp: '2m ago',
    unread: 2,
    messages: [
      { id: 'msg1', senderId: 'p1', content: 'Hey! I saw you like pottery too?', createdAt: 'Today, 3:00 PM' },
      { id: 'msg2', senderId: currentUserId, content: 'Yeah! I have been wanting to try a class.', createdAt: 'Today, 3:05 PM' },
      { id: 'msg3', senderId: 'p1', content: 'Would love to check out that new pottery studio!', createdAt: 'Today, 3:08 PM' },
    ],
  },
  {
    id: 'm2',
    matchId: 'match2',
    name: 'Alex',
    age: 26,
    avatar: pic('alex', 1),
    lastMessage: 'The new bouldering gym downtown is amazing.',
    timestamp: '1h ago',
    unread: 0,
    messages: [
      { id: 'msg4', senderId: 'p3', content: 'Hey! I saw you are into climbing too.', createdAt: 'Yesterday, 7:00 PM' },
      { id: 'msg5', senderId: currentUserId, content: 'Absolutely! Where do you usually climb?', createdAt: 'Yesterday, 7:15 PM' },
      { id: 'msg6', senderId: 'p3', content: 'The new bouldering gym downtown is amazing.', createdAt: 'Today, 2:00 PM' },
    ],
  },
  {
    id: 'm3',
    matchId: 'match3',
    name: 'Sam',
    age: 28,
    avatar: pic('sam', 1),
    lastMessage: 'We are playing at The Crocodile next Friday!',
    timestamp: '3h ago',
    unread: 1,
    messages: [
      { id: 'msg7', senderId: currentUserId, content: 'Love your music taste!', createdAt: 'Yesterday, 9:00 AM' },
      { id: 'msg8', senderId: 'p4', content: 'Thanks! What bands are you into?', createdAt: 'Yesterday, 9:30 AM' },
      { id: 'msg9', senderId: currentUserId, content: 'Indie rock and folk mostly.', createdAt: 'Yesterday, 10:00 AM' },
      { id: 'msg10', senderId: 'p4', content: 'We are playing at The Crocodile next Friday!', createdAt: 'Today, 12:00 PM' },
    ],
  },
  {
    id: 'm4',
    matchId: 'match4',
    name: 'Taylor',
    age: 25,
    avatar: pic('taylor', 1),
    lastMessage: 'Have you tried the new Thai place on Pike?',
    timestamp: '5h ago',
    unread: 0,
    messages: [
      { id: 'msg11', senderId: 'p5', content: 'Hi there! Big foodie?', createdAt: '2 days ago, 4:00 PM' },
      { id: 'msg12', senderId: currentUserId, content: 'Guilty as charged. You?', createdAt: '2 days ago, 4:30 PM' },
      { id: 'msg13', senderId: 'p5', content: 'Have you tried the new Thai place on Pike?', createdAt: 'Today, 10:00 AM' },
    ],
  },
  {
    id: 'm5',
    matchId: 'match5',
    name: 'Casey',
    age: 30,
    avatar: pic('casey', 1),
    lastMessage: 'Sunrise yoga at Greenlake tomorrow?',
    timestamp: '1d ago',
    unread: 0,
    messages: [
      { id: 'msg14', senderId: currentUserId, content: 'Your fitness routine is inspiring!', createdAt: '3 days ago, 8:00 AM' },
      { id: 'msg15', senderId: 'p6', content: 'Thanks! Join me sometime?', createdAt: '3 days ago, 8:15 AM' },
      { id: 'msg16', senderId: currentUserId, content: 'Would love to!', createdAt: '3 days ago, 8:30 AM' },
      { id: 'msg17', senderId: 'p6', content: 'Sunrise yoga at Greenlake tomorrow?', createdAt: 'Yesterday, 6:00 PM' },
    ],
  },
  {
    id: 'm6',
    matchId: 'match6',
    name: 'Avery',
    age: 26,
    avatar: pic('avery', 1),
    lastMessage: 'I just got a new monstera. It is huge!',
    timestamp: '2d ago',
    unread: 0,
    messages: [
      { id: 'msg18', senderId: 'p9', content: 'Plant parent here too!', createdAt: '4 days ago, 2:00 PM' },
      { id: 'msg19', senderId: currentUserId, content: 'What is your favorite plant?', createdAt: '4 days ago, 2:30 PM' },
      { id: 'msg20', senderId: 'p9', content: 'I just got a new monstera. It is huge!', createdAt: '2 days ago, 11:00 AM' },
    ],
  },
  {
    id: 'm7',
    matchId: 'match7',
    name: 'Jamie',
    age: 28,
    avatar: pic('jamie', 1),
    lastMessage: 'Have you read the new Brandon Sanderson?',
    timestamp: '3d ago',
    unread: 0,
    messages: [
      { id: 'msg21', senderId: currentUserId, content: 'Fantasy reader here!', createdAt: '5 days ago, 7:00 PM' },
      { id: 'msg22', senderId: 'p12', content: 'Same! What is your favorite series?', createdAt: '5 days ago, 7:20 PM' },
      { id: 'msg23', senderId: currentUserId, content: 'Stormlight Archive, hands down.', createdAt: '5 days ago, 7:45 PM' },
      { id: 'msg24', senderId: 'p12', content: 'Have you read the new Brandon Sanderson?', createdAt: '3 days ago, 9:00 AM' },
    ],
  },
  {
    id: 'm8',
    matchId: 'match8',
    name: 'Drew',
    age: 31,
    avatar: pic('drew', 1),
    lastMessage: 'Let me know when you are free for dinner.',
    timestamp: '4d ago',
    unread: 0,
    messages: [
      { id: 'msg25', senderId: 'p10', content: 'Hey! I am a chef at a downtown spot.', createdAt: '6 days ago, 5:00 PM' },
      { id: 'msg26', senderId: currentUserId, content: 'That is so cool. What cuisine?', createdAt: '6 days ago, 5:30 PM' },
      { id: 'msg27', senderId: 'p10', content: 'Modern American with Asian influences.', createdAt: '6 days ago, 6:00 PM' },
      { id: 'msg28', senderId: 'p10', content: 'Let me know when you are free for dinner.', createdAt: '4 days ago, 8:00 PM' },
    ],
  },
]

export const subscriptionTiers = [
  {
    id: 'plus',
    name: 'Plus',
    price: '$9.99',
    period: '/month',
    features: ['Unlimited Likes', 'Rewind Last Swipe', '5 Super Likes per day', '1 Boost per month', 'Passport to any location'],
    color: '#10B981',
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '$14.99',
    period: '/month',
    features: ['See Who Likes You', 'New Top Picks every day', 'Unlimited Likes', 'Rewind Last Swipe', '5 Super Likes per day', '1 Boost per month', 'Passport to any location'],
    color: '#FFD700',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '$19.99',
    period: '/month',
    features: ['Message Before Matching', 'Priority Likes', 'See Who Likes You', 'New Top Picks every day', 'Unlimited Likes', 'Rewind Last Swipe', '5 Super Likes per day', '1 Boost per month', 'Passport to any location'],
    color: '#E5E4E2',
  },
]

export const exploreCategories = [
  { id: '1', name: 'Foodies', icon: 'pizza', count: 85, color: '#10B981' },
  { id: '2', name: 'Bookworms', icon: 'book', count: 32, color: '#4F46E5' },
  { id: '3', name: 'Musicians', icon: 'music', count: 60, color: '#7C3AED' },
  { id: '4', name: 'Travelers', icon: 'plane', count: 120, color: '#059669' },
  { id: '5', name: 'Fitness', icon: 'dumbbell', count: 95, color: '#DC2626' },
  { id: '6', name: 'Creatives', icon: 'palette', count: 48, color: '#D97706' },
]

export const mockLikes = [
  { id: 'l1', name: 'Jordan', age: 24, distance: '5 miles away', photo: pic('jordan', 1), interests: ['Dogs', 'Hiking'] },
  { id: 'l2', name: 'Riley', age: 23, distance: '2 miles away', photo: pic('riley', 1), interests: ['Art', 'Photography'] },
  { id: 'l3', name: 'Peyton', age: 24, distance: '3 miles away', photo: pic('peyton', 1), interests: ['Dance', 'Jazz'] },
  { id: 'l4', name: 'Skyler', age: 22, distance: '4 miles away', photo: pic('skyler', 1), interests: ['Kayaking', 'Camping'] },
]

export const myProfile: MockProfile = {
  id: 'me',
  name: 'You',
  age: 27,
  bio: 'Adventure seeker and coffee lover. I am always planning my next trip or trying a new restaurant. Let us make some memories.',
  photos: [pic('me', 1), pic('me', 2), pic('me', 3), pic('me', 4)],
  gender: 'Woman',
  location: 'Seattle, WA',
  distance: '',
  interests: ['Coffee', 'Travel', 'Hiking', 'Photography', 'Cooking', 'Yoga'],
  job: 'Product Designer at Tech Co',
}

export const mockEvents: MockEvent[] = [
  {
    id: 'e1',
    code: 'ARTWALK',
    name: 'Capitol Hill Art Walk',
    description: 'Monthly gallery crawl through Capitol Hill. Meet local artists and art lovers.',
    location: 'Capitol Hill, Seattle',
    attendeeIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'me'],
    isActive: true,
  },
  {
    id: 'e2',
    code: 'FREMONT',
    name: 'Fremont Friday Night',
    description: 'Weekly social at the Fremont Brewing taproom. Craft beer, good people, great vibes.',
    location: 'Fremont Brewing, Seattle',
    attendeeIds: ['p6', 'p7', 'p8', 'p9', 'p10', 'me'],
    isActive: true,
  },
  {
    id: 'e3',
    code: 'COFFEE',
    name: 'Downtown Coffee Fest',
    description: 'Weekend coffee tasting event featuring Seattle\'s best roasters.',
    location: 'Pike Place Market, Seattle',
    attendeeIds: ['p11', 'p12', 'p13', 'p14', 'p15', 'me'],
    isActive: true,
  },
  {
    id: 'e4',
    code: 'SUMMIT',
    name: 'Tech Summit Afterparty',
    description: 'Networking afterparty for local tech professionals.',
    location: 'South Lake Union, Seattle',
    attendeeIds: ['p3', 'p6', 'p13', 'p15'],
    isActive: true,
  },
  {
    id: 'e5',
    code: 'SUNSETS',
    name: 'Alki Beach Sunset Social',
    description: 'Weekly beach meetup to watch the sunset. Bring a blanket and good vibes.',
    location: 'Alki Beach, Seattle',
    attendeeIds: ['p1', 'p5', 'p8', 'p11'],
    isActive: false,
  },
  {
    id: 'e6',
    code: 'SALSA',
    name: 'Salsa Night at Century Ballroom',
    description: 'Weekly salsa dancing lessons and social dancing for all skill levels.',
    location: 'Capitol Hill, Seattle',
    attendeeIds: ['p4', 'p14', 'p2'],
    isActive: false,
  },
]

export function getProfilesForEvent(eventId: string | null): MockProfile[] {
  if (!eventId) return []
  const event = mockEvents.find((e) => e.id === eventId)
  if (!event) return []
  return mockProfiles.filter((p) => event.attendeeIds.includes(p.id))
}

export function getEventByCode(code: string): MockEvent | undefined {
  return mockEvents.find((e) => e.code === code.toUpperCase())
}

export let activeEventId: string | null = null

export function setActiveEvent(id: string | null) {
  activeEventId = id
}
