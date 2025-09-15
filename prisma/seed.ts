import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to generate random coordinates around Brisbane
function geoJitter(baseLat: number, baseLng: number, range: number = 0.05) {
  return {
    lat: baseLat + (Math.random() - 0.5) * range,
    lng: baseLng + (Math.random() - 0.5) * range
  }
}

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const categories = [
  'Plumber', 'Electrician', 'Tutor', 'Catering', 'Cleaning', 'Mechanic',
  'Hair & Beauty', 'Photography', 'Legal Services', 'Accounting',
  'Real Estate', 'Construction', 'IT Services', 'Healthcare',
  'Transportation', 'Event Planning', 'Childcare', 'Pet Services'
]

const competenceTags = [
  'Emergency Services', 'Licensed', 'Insured', 'Mobile Service',
  'Weekend Available', '24/7', 'Certified', 'Experienced',
  'Affordable', 'Quality Guaranteed', 'Free Quotes', 'Same Day Service'
]

const eventCategories = [
  'Cultural', 'Social', 'Business', 'Educational', 'Religious',
  'Sports', 'Community', 'Fundraising', 'Entertainment'
]

const brisbaneCoords = { lat: -27.4705, lng: 153.0260 }

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.message.deleteMany()
  await prisma.thread.deleteMany()
  await prisma.review.deleteMany()
  await prisma.rSVP.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.event.deleteMany()
  await prisma.business.deleteMany()
  await prisma.program.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const hashedPassword = await bcrypt.hash('changeme123', 10)
  
  const users = []
  
  // Admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@uiq.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+61400000001',
      location: 'Brisbane, QLD',
      whatsappLink: 'https://wa.me/61400000001'
    }
  })
  users.push(admin)

  // Business owners
  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Business Owner ${i + 1}`,
        email: `business${i + 1}@example.com`,
        password: hashedPassword,
        role: 'BUSINESS_OWNER',
        phone: `+6140000${String(i + 10).padStart(4, '0')}`,
        location: `Brisbane Area ${i + 1}`,
        whatsappLink: `https://wa.me/6140000${String(i + 10).padStart(4, '0')}`,
        membershipTier: Math.random() > 0.7 ? 'PLUS' : 'FREE'
      }
    })
    users.push(user)
  }

  // Regular members
  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Member ${i + 1}`,
        email: `member${i + 1}@example.com`,
        password: hashedPassword,
        role: 'MEMBER',
        phone: `+6140000${String(i + 100).padStart(4, '0')}`,
        location: `Brisbane Area ${i + 1}`,
        whatsappLink: `https://wa.me/6140000${String(i + 100).padStart(4, '0')}`,
        membershipTier: Math.random() > 0.8 ? 'FAMILY' : 'FREE'
      }
    })
    users.push(user)
  }

  console.log('✅ Created 31 users')

  // Create businesses
  const businessOwners = users.filter(u => u.role === 'BUSINESS_OWNER')
  const businesses = []

  for (let i = 0; i < 25; i++) {
    const owner = businessOwners[i % businessOwners.length]
    const category = categories[i % categories.length]
    const coords = geoJitter(brisbaneCoords.lat, brisbaneCoords.lng)
    const tags = getRandomItems(competenceTags, Math.floor(Math.random() * 4) + 1)
    
    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        name: `${category} Services ${i + 1}`,
        slug: `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-services-${i + 1}`,
        description: `Professional ${category.toLowerCase()} services in Brisbane area. Quality work guaranteed with competitive pricing.`,
        category,
        competenceTags: tags.join(','),
        certifications: Math.random() > 0.5 ? 'Licensed,Insured' : 'Licensed',
        address: `${Math.floor(Math.random() * 999) + 1} Brisbane Street, Brisbane QLD 4000`,
        lat: coords.lat,
        lng: coords.lng,
        serviceRadiusKm: Math.floor(Math.random() * 20) + 10,
        phone: owner.phone,
        email: owner.email,
        website: Math.random() > 0.6 ? `https://${category.toLowerCase()}services${i + 1}.com.au` : null,
        whatsappLink: owner.whatsappLink,
        plan: Math.random() > 0.8 ? 'PREMIUM' : Math.random() > 0.6 ? 'STANDARD' : 'BASIC',
        verified: Math.random() > 0.3,
        ratingAvg: Math.random() * 2 + 3, // 3-5 stars
        ratingCount: Math.floor(Math.random() * 50) + 5
      }
    })
    businesses.push(business)
  }

  console.log('✅ Created 25 businesses')

  // Create reviews
  const members = users.filter(u => u.role === 'MEMBER')
  for (let i = 0; i < 80; i++) {
    const business = businesses[Math.floor(Math.random() * businesses.length)]
    const author = members[Math.floor(Math.random() * members.length)]
    
    await prisma.review.create({
      data: {
        businessId: business.id,
        authorId: author.id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
        text: `Great service from ${business.name}. Professional and reliable. Would recommend to others in the community.`,
        photos: Math.random() > 0.7 ? 'photo1.jpg,photo2.jpg' : ''
      }
    })
  }

  console.log('✅ Created 80 reviews')

  // Create events
  const events = []
  for (let i = 0; i < 12; i++) {
    const organiser = users[Math.floor(Math.random() * users.length)]
    const category = eventCategories[i % eventCategories.length]
    const coords = geoJitter(brisbaneCoords.lat, brisbaneCoords.lng)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90))
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 4) + 2)

    const event = await prisma.event.create({
      data: {
        title: `${category} Event ${i + 1}`,
        category,
        description: `Join us for this amazing ${category.toLowerCase()} event. Great opportunity to connect with the Ugandan community in Queensland.`,
        startAt: startDate,
        endAt: endDate,
        venue: `Community Center ${i + 1}, Brisbane`,
        lat: coords.lat,
        lng: coords.lng,
        priceCents: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) : 0,
        organiserId: organiser.id,
        photos: 'event-photo.jpg'
      }
    })
    events.push(event)
  }

  console.log('✅ Created 12 events')

  // Create RSVPs
  for (let i = 0; i < 30; i++) {
    const event = events[Math.floor(Math.random() * events.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    
    try {
      await prisma.rsvp.create({
        data: {
          eventId: event.id,
          userId: user.id,
          status: Math.random() > 0.3 ? 'GOING' : 'INTERESTED'
        }
      })
    } catch (error) {
      // Skip if duplicate RSVP
    }
  }

  console.log('✅ Created RSVPs')

  // Create bereavement announcements
  for (let i = 0; i < 10; i++) {
    const author = users[Math.floor(Math.random() * users.length)]
    
    await prisma.announcement.create({
      data: {
        type: 'BEREAVEMENT',
        title: `In Memory of John Doe ${i + 1}`,
        body: `It is with heavy hearts that we announce the passing of John Doe ${i + 1}, beloved member of our community. He will be greatly missed by family and friends.`,
        photos: 'memorial-photo.jpg',
        authorId: author.id,
        verified: Math.random() > 0.2,
        featured: Math.random() > 0.7,
        contributionMode: 'LINKOUT',
        contributionLinks: 'https://paypal.me/memorial,https://gofundme.com/memorial',
        ceremonyTimeline: JSON.stringify({
          wake: '2024-01-15T10:00:00Z',
          funeral: '2024-01-16T14:00:00Z',
          burial: '2024-01-16T16:00:00Z'
        })
      }
    })
  }

  console.log('✅ Created 10 bereavement announcements')

  // Create programs
  for (let i = 0; i < 12; i++) {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 60) + 30)
    
    await prisma.program.create({
      data: {
        title: `Community Program ${i + 1}`,
        org: `Queensland Organization ${i + 1}`,
        eligibility: 'Open to all Ugandan community members',
        deadlineAt: Math.random() > 0.3 ? deadline : null,
        applyUrl: `https://apply.org${i + 1}.com.au`,
        description: `This program aims to support the Ugandan community in Queensland through various initiatives and support services.`,
        tags: 'community,support,education,integration'
      }
    })
  }

  console.log('✅ Created 12 programs')

  // Create opportunities
  const opportunityTypes = ['job', 'internship', 'grant', 'training', 'volunteer']
  for (let i = 0; i < 12; i++) {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 45) + 15)
    
    await prisma.opportunity.create({
      data: {
        title: `${opportunityTypes[i % opportunityTypes.length].charAt(0).toUpperCase() + opportunityTypes[i % opportunityTypes.length].slice(1)} Opportunity ${i + 1}`,
        type: opportunityTypes[i % opportunityTypes.length],
        location: 'Brisbane, QLD',
        deadlineAt: Math.random() > 0.2 ? deadline : null,
        applyUrl: `https://apply.opportunity${i + 1}.com.au`,
        description: `Great opportunity for community members to get involved and make a difference.`
      }
    })
  }

  console.log('✅ Created 12 opportunities')

  // Create listings
  const listingTypes = ['sale', 'housing', 'gig']
  for (let i = 0; i < 40; i++) {
    const owner = users[Math.floor(Math.random() * users.length)]
    const type = listingTypes[i % listingTypes.length]
    const coords = geoJitter(brisbaneCoords.lat, brisbaneCoords.lng)
    
    let title, price, condition
    switch (type) {
      case 'sale':
        title = `Item for Sale ${i + 1}`
        price = Math.floor(Math.random() * 50000) + 1000 // $10-$500
        condition = Math.random() > 0.5 ? 'Used' : 'New'
        break
      case 'housing':
        title = `Room/House for Rent ${i + 1}`
        price = Math.floor(Math.random() * 100000) + 20000 // $200-$1200 per week
        condition = 'Available'
        break
      case 'gig':
        title = `Gig Opportunity ${i + 1}`
        price = Math.floor(Math.random() * 10000) + 2000 // $20-$120 per hour
        condition = 'Open'
        break
      default:
        title = `Listing ${i + 1}`
        price = 5000
        condition = 'Available'
    }

    await prisma.listing.create({
      data: {
        type,
        title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i + 1}`,
        priceCents: price,
        currency: 'AUD',
        condition,
        photos: 'listing-photo1.jpg,listing-photo2.jpg',
        description: `${title} - Great opportunity for community members. Contact for more details.`,
        location: `Brisbane Area ${i + 1}`,
        lat: coords.lat,
        lng: coords.lng,
        ownerId: owner.id,
        status: 'active',
        boostedUntil: Math.random() > 0.8 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
      }
    })
  }

  console.log('✅ Created 40 listings')

  // Create some threads and messages
  for (let i = 0; i < 5; i++) {
    const participants = getRandomItems(users, 2)
    
    const thread = await prisma.thread.create({
      data: {
        subject: `Discussion ${i + 1}`,
        participantIds: participants.map(p => p.id).join(','),
        participants: {
          connect: participants.map(p => ({ id: p.id }))
        }
      }
    })

    // Add some messages to the thread
    for (let j = 0; j < Math.floor(Math.random() * 5) + 2; j++) {
      const sender = participants[j % participants.length]
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: sender.id,
          body: `Message ${j + 1} in thread ${i + 1}. This is a sample conversation between community members.`
        }
      })
    }
  }

  console.log('✅ Created threads and messages')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📧 Default login credentials:')
  console.log('Admin: admin@uiq.com / changeme123')
  console.log('Business Owner: business1@example.com / changeme123')
  console.log('Member: member1@example.com / changeme123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

