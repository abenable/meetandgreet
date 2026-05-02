import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
  console.error('Missing R2 environment variables. Check .env.local')
  process.exit(1)
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/')
}

function extractBase64(str: string): string {
  return str.split(',')[1] ?? ''
}

async function migrate() {
  console.log('Starting image migration to R2...')

  // Migrate profile photos
  const profiles = await prisma.profile.findMany()
  let profileCount = 0

  for (const profile of profiles) {
    const newPhotos: string[] = []
    let changed = false

    for (const photo of profile.photos) {
      if (isBase64Image(photo)) {
        const base64 = extractBase64(photo)
        if (!base64) {
          newPhotos.push(photo)
          continue
        }

        const buffer = Buffer.from(base64, 'base64')
        const key = `profiles/${profile.userId}/photo-${crypto.randomUUID()}.jpg`

        await r2.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg',
          }),
        )

        newPhotos.push(`${publicUrl}/${key}`)
        changed = true
        profileCount++
        console.log(`[Profile] Migrated photo for ${profile.userId} -> ${key}`)
      } else {
        newPhotos.push(photo)
      }
    }

    if (changed) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { photos: newPhotos },
      })
    }
  }

  // Migrate event photos
  const events = await prisma.event.findMany({
    where: {
      photo: { not: null },
    },
  })
  let eventCount = 0

  for (const event of events) {
    if (!event.photo || !isBase64Image(event.photo)) continue

    const base64 = extractBase64(event.photo)
    if (!base64) continue

    const buffer = Buffer.from(base64, 'base64')
    const key = `events/${event.id}/photo-${crypto.randomUUID()}.jpg`

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      }),
    )

    await prisma.event.update({
      where: { id: event.id },
      data: { photo: `${publicUrl}/${key}` },
    })

    eventCount++
    console.log(`[Event] Migrated photo for ${event.id} -> ${key}`)
  }

  console.log(`\nMigration complete!`)
  console.log(`  Profile photos migrated: ${profileCount}`)
  console.log(`  Event photos migrated: ${eventCount}`)

  await prisma.$disconnect()
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
