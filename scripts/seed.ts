import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import * as schema from '../shared/schema'

async function main() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_CONNECTION_STRING ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'No PostgreSQL connection string found. Set POSTGRES_URL or DATABASE_URL to run the seed script.'
    )
  }

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    console.log('🌱 Starting database seed...')

    await db.transaction(async (tx) => {
      await tx.execute(sql`TRUNCATE TABLE
        stripe_payments,
        stripe_webhook_events,
        stripe_subscriptions,
        stripe_customers,
        stripe_prices,
        stripe_products,
        business_subscriptions,
        memberships,
        event_rsvps,
        events,
        announcements,
        classifieds,
        businesses,
        users
      RESTART IDENTITY CASCADE`)

      console.log('🧹 Cleared existing data')

      const [adminUser] = await tx
        .insert(schema.users)
        .values({
          email: 'admin@uiq.local',
          role: 'admin',
          membershipTier: 'PLUS',
        })
        .returning({ id: schema.users.id })

      const [businessOwner] = await tx
        .insert(schema.users)
        .values({
          email: 'owner@uiq.local',
          role: 'business_owner',
          membershipTier: 'PLUS',
        })
        .returning({ id: schema.users.id })

      await tx
        .insert(schema.users)
        .values({
          email: 'member@uiq.local',
          role: 'member',
          membershipTier: 'FREE',
        })
        .returning({ id: schema.users.id })

      await tx
        .insert(schema.businesses)
        .values({
          ownerId: businessOwner.id,
          name: 'Sunrise Catering Co.',
          slug: 'sunrise-catering-co',
          description:
            'Authentic Ugandan catering for weddings, graduations, and community celebrations across Brisbane.',
          category: 'Catering',
          plan: 'premium',
          email: 'orders@sunrisecatering.au',
          phone: '+61400000020',
          website: 'https://sunrisecatering.au',
          addressLine1: '12 Queen Street',
          city: 'Brisbane',
          state: 'QLD',
          postalCode: '4000',
          latitude: '-27.4698',
          longitude: '153.0251',
          hours: {
            monday: ['09:00', '17:00'],
            tuesday: ['09:00', '17:00'],
            wednesday: ['09:00', '17:00'],
            thursday: ['09:00', '19:00'],
            friday: ['09:00', '19:00'],
            saturday: ['10:00', '15:00'],
          },
          tags: ['catering', 'ugandan cuisine', 'events'],
        })
        .returning({ id: schema.businesses.id })

      await tx.insert(schema.businesses).values({
        ownerId: businessOwner.id,
        name: 'Kampala Crafts & Decor',
        slug: 'kampala-crafts-decor',
        description: 'Handcrafted home decor, jewellery, and gifts sourced from Ugandan artisans.',
        category: 'Retail',
        plan: 'standard',
        email: 'hello@kampalacrafts.au',
        phone: '+61400000021',
        website: 'https://kampalacrafts.au',
        addressLine1: '28 Boundary Street',
        city: 'South Brisbane',
        state: 'QLD',
        postalCode: '4101',
        latitude: '-27.4821',
        longitude: '153.0154',
        hours: {
          thursday: ['10:00', '18:00'],
          friday: ['10:00', '18:00'],
          saturday: ['09:00', '16:00'],
          sunday: ['10:00', '14:00'],
        },
        tags: ['handmade', 'fair trade', 'home decor'],
      })

      const now = new Date()
      const eventStart = new Date(now)
      eventStart.setDate(eventStart.getDate() + 14)
      eventStart.setHours(18, 0, 0, 0)
      const eventEnd = new Date(eventStart)
      eventEnd.setHours(eventEnd.getHours() + 4)

      await tx.insert(schema.events).values({
        organizerId: businessOwner.id,
        title: 'Ugandan Food & Culture Night',
        description:
          'An evening celebrating Ugandan cuisine, music, and dance. Includes cooking demos, storytelling, and cultural showcases.',
        category: 'Community',
        startAt: eventStart,
        endAt: eventEnd,
        locationName: 'South Brisbane Community Hall',
        address: '20 Hope Street, South Brisbane QLD 4101',
        latitude: '-27.4748',
        longitude: '153.0170',
        capacity: 120,
        visibility: 'public',
        tags: ['food', 'culture', 'networking'],
      })

      await tx.insert(schema.announcements).values({
        type: 'general',
        title: 'Community Welcome Gathering',
        body:
          'Join us for a special evening to welcome new Ugandan families settling in Queensland. We will share a potluck dinner, introduce key support services, and highlight upcoming programs.',
        authorId: adminUser.id,
        isApproved: true,
      })

      await tx.insert(schema.classifieds).values({
        type: 'offer',
        title: 'Sunny 2-Bedroom Apartment Near South Bank',
        price: '520.00',
        description:
          'Modern apartment with river views, fully furnished with secure parking. Walking distance to South Bank parklands and cultural precinct. Ideal for new arrivals looking for a central location.',
        location: 'South Brisbane, QLD',
        ownerId: businessOwner.id,
        status: 'published',
      })

      const membershipStart = new Date()
      const membershipEnd = new Date(membershipStart)
      membershipEnd.setMonth(membershipEnd.getMonth() + 1)

      await tx.insert(schema.memberships).values({
        userId: businessOwner.id,
        tier: 'PLUS',
        status: 'active',
        startDate: membershipStart,
        endDate: membershipEnd,
        autoRenew: true,
        stripeSubscriptionId: 'sub_seed_plus_owner',
        grantedBy: adminUser.id,
        metadata: {
          source: 'seed-script',
          benefits: ['priority_support', 'event_discounts'],
        },
      })

      console.log('✅ Seed data inserted successfully')
    })
  } finally {
    await client.end({ timeout: 5 })
  }
}

main()
  .then(() => {
    console.log('🎉 Database seed completed')
  })
  .catch((error) => {
    console.error('❌ Database seed failed', error)
    process.exitCode = 1
  })
