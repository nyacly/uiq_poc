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
          first_name: 'Amina',
          last_name: 'Nanyonga',
          name: 'Amina Nanyonga',
          slug: 'amina-nanyonga',
          bio: 'Founding administrator helping coordinate community programs and moderating activity.',
          location: 'Brisbane, QLD',
          phone: '+61400000001',
          whatsapp_link: 'https://wa.me/61400000001',
          membership_tier: 'plus',
          is_verified: true,
          badges: ['admin', 'community_leader'],
          privacy_settings: { contact: 'members', profile: 'public' },
          avatar: 'https://images.uiq.community/avatars/admin.png',
        })
        .returning({ id: schema.users.id })

      const [businessOwner] = await tx
        .insert(schema.users)
        .values({
          email: 'owner@uiq.local',
          first_name: 'Brian',
          last_name: 'Kaggwa',
          name: 'Brian Kaggwa',
          slug: 'brian-kaggwa',
          bio: 'Event caterer bringing Ugandan flavours to celebrations across Queensland.',
          location: 'Logan, QLD',
          phone: '+61400000002',
          whatsapp_link: 'https://wa.me/61400000002',
          membership_tier: 'plus',
          is_verified: true,
          badges: ['business_owner'],
          privacy_settings: { contact: 'members', profile: 'public' },
          avatar: 'https://images.uiq.community/avatars/business-owner.png',
        })
        .returning({ id: schema.users.id })

      await tx
        .insert(schema.users)
        .values({
          email: 'member@uiq.local',
          first_name: 'Maria',
          last_name: 'Nambozo',
          name: 'Maria Nambozo',
          slug: 'maria-nambozo',
          bio: 'Community connector who loves helping new arrivals find their feet.',
          location: 'Gold Coast, QLD',
          phone: '+61400000003',
          whatsapp_link: 'https://wa.me/61400000003',
          membership_tier: 'free',
          is_verified: true,
          badges: ['member'],
          privacy_settings: { contact: 'members', profile: 'public' },
          avatar: 'https://images.uiq.community/avatars/member.png',
        })
        .returning({ id: schema.users.id })

      await tx
        .insert(schema.businesses)
        .values({
          owner_id: businessOwner.id,
          name: 'Sunrise Catering Co.',
          slug: 'sunrise-catering-co',
          description:
            'Authentic Ugandan catering for weddings, graduations, and community celebrations across Brisbane.',
          category: 'Catering',
          subscription_tier: 'Premium',
          is_verified: true,
          email: 'orders@sunrisecatering.au',
          phone: '+61400000020',
          website: 'https://sunrisecatering.au',
          address: '12 Queen Street, Brisbane QLD 4000',
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
          images: [
            'https://images.uiq.community/businesses/sunrise-1.jpg',
            'https://images.uiq.community/businesses/sunrise-2.jpg',
          ],
          tags: ['catering', 'ugandan cuisine', 'events'],
          average_rating: '4.8',
          review_count: 18,
          service_radius_km: 30,
          certifications: ['Food Safety Supervisor', 'Fully Licensed'],
          contact_methods: {
            phone: '+61400000020',
            whatsapp: 'https://wa.me/61400000020',
            email: 'orders@sunrisecatering.au',
          },
        })
        .returning({ id: schema.businesses.id })

      await tx.insert(schema.businesses).values({
        owner_id: businessOwner.id,
        name: 'Kampala Crafts & Decor',
        slug: 'kampala-crafts-decor',
        description: 'Handcrafted home decor, jewellery, and gifts sourced from Ugandan artisans.',
        category: 'Retail',
        subscription_tier: 'Standard',
        is_verified: true,
        email: 'hello@kampalacrafts.au',
        phone: '+61400000021',
        website: 'https://kampalacrafts.au',
        address: '28 Boundary Street, South Brisbane QLD 4101',
        latitude: '-27.4821',
        longitude: '153.0154',
        hours: {
          thursday: ['10:00', '18:00'],
          friday: ['10:00', '18:00'],
          saturday: ['09:00', '16:00'],
          sunday: ['10:00', '14:00'],
        },
        images: [
          'https://images.uiq.community/businesses/kampala-1.jpg',
          'https://images.uiq.community/businesses/kampala-2.jpg',
        ],
        tags: ['handmade', 'fair trade', 'home decor'],
        average_rating: '4.6',
        review_count: 9,
        service_radius_km: 50,
        certifications: ['Fair Trade Partner'],
        contact_methods: {
          phone: '+61400000021',
          instagram: 'https://instagram.com/kampalacrafts',
          email: 'hello@kampalacrafts.au',
        },
      })

      const now = new Date()
      const eventStart = new Date(now)
      eventStart.setDate(eventStart.getDate() + 14)
      eventStart.setHours(18, 0, 0, 0)
      const eventEnd = new Date(eventStart)
      eventEnd.setHours(eventEnd.getHours() + 4)

      await tx.insert(schema.events).values({
        organizer_id: businessOwner.id,
        title: 'Ugandan Food & Culture Night',
        slug: 'ugandan-food-culture-night',
        description:
          'An evening celebrating Ugandan cuisine, music, and dance. Includes cooking demos, storytelling, and cultural showcases.',
        category: 'community',
        start_date_time: eventStart,
        end_date_time: eventEnd,
        location: 'South Brisbane Community Hall',
        address: '20 Hope Street, South Brisbane QLD 4101',
        latitude: '-27.4748',
        longitude: '153.0170',
        max_attendees: 120,
        current_attendees: 32,
        is_public: true,
        requires_rsvp: true,
        image_url: 'https://images.uiq.community/events/culture-night.jpg',
        external_url: 'https://uiq.community/events/culture-night',
        tags: ['food', 'culture', 'networking'],
        price_cents: 2500,
        rsvp_limit: 100,
        photos: ['https://images.uiq.community/events/culture-night-1.jpg'],
      })

      await tx.insert(schema.announcements).values({
        type: 'general',
        title: 'Community Welcome Gathering',
        slug: 'community-welcome-gathering',
        body:
          'Join us for a special evening to welcome new Ugandan families settling in Queensland. We will share a potluck dinner, introduce key support services, and highlight upcoming programs.',
        photos: ['https://images.uiq.community/announcements/welcome.jpg'],
        author_id: adminUser.id,
        ceremony_timeline: [
          { time: '18:00', activity: 'Arrival & tea' },
          { time: '18:30', activity: 'Community introductions' },
          { time: '19:00', activity: 'Dinner & networking' },
          { time: '20:00', activity: 'Closing & next steps' },
        ],
        contribution_mode: 'linkout',
        contribution_links: [
          { label: 'RSVP to attend', url: 'https://uiq.community/rsvp/welcome' },
          { label: 'Volunteer to help', url: 'https://uiq.community/volunteer' },
        ],
        status: 'published',
        verified: true,
        featured: true,
      })

      await tx.insert(schema.classifieds).values({
        type: 'housing',
        title: 'Sunny 2-Bedroom Apartment Near South Bank',
        slug: 'sunny-2-bedroom-apartment-south-bank',
        price_cents: 52000,
        currency: 'AUD',
        condition: 'excellent',
        photos: [
          'https://images.uiq.community/classifieds/housing-1.jpg',
          'https://images.uiq.community/classifieds/housing-2.jpg',
        ],
        description:
          'Modern apartment with river views, fully furnished with secure parking. Walking distance to South Bank parklands and cultural precinct. Ideal for new arrivals looking for a central location.',
        location: 'South Brisbane, QLD',
        geo: { lat: -27.4815, lng: 153.0152 },
        owner_id: businessOwner.id,
        status: 'published',
      })

      const membershipStart = new Date()
      const membershipEnd = new Date(membershipStart)
      membershipEnd.setMonth(membershipEnd.getMonth() + 1)

      await tx.insert(schema.memberships).values({
        user_id: businessOwner.id,
        tier: 'plus',
        status: 'active',
        start_date: membershipStart,
        end_date: membershipEnd,
        auto_renew: true,
        stripe_subscription_id: 'sub_seed_plus_owner',
        granted_by: adminUser.id,
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
