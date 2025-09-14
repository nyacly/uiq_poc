import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRISBANE_LAT = -27.4705;
const BRISBANE_LNG = 153.0260;

// Helper function to generate coordinates around Brisbane
function geoJitter(baseLat: number, baseLng: number, radiusKm: number = 5): [number, number] {
  const kmToDeg = 0.009; // Rough conversion
  const lat = baseLat + (Math.random() - 0.5) * (radiusKm * kmToDeg);
  const lng = baseLng + (Math.random() - 0.5) * (radiusKm * kmToDeg);
  return [lat, lng];
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const users = [
    {
      name: 'Admin User',
      email: 'admin@communityhub.com',
      role: 'ADMIN',
      membershipTier: 'PLUS',
      location: 'Brisbane CBD, QLD',
      phone: '+61 7 1234 5678',
    },
    {
      name: 'Samuel Mukasa',
      email: 'samuel@plumbingpro.com.au',
      role: 'BUSINESS_OWNER',
      membershipTier: 'PLUS',
      location: 'Sunnybank, QLD',
      phone: '+61 456 789 012',
    },
    {
      name: 'Grace Namuddu',
      email: 'grace@email.com',
      role: 'MEMBER',
      membershipTier: 'FREE',
      location: 'Logan, QLD',
      phone: '+61 456 789 013',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  // Create sample businesses
  const businessOwners = createdUsers.filter(u => u.role === 'BUSINESS_OWNER');
  
  for (let i = 0; i < businessOwners.length; i++) {
    const owner = businessOwners[i];
    const [lat, lng] = geoJitter(BRISBANE_LAT, BRISBANE_LNG, 15);
    
    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        name: 'Pro Plumbing Solutions',
        slug: 'pro-plumbing-solutions',
        description: 'Professional plumbing services in Brisbane and surrounding areas. We pride ourselves on quality workmanship and customer satisfaction.',
        category: 'Plumbing',
        competenceTags: JSON.stringify(['Emergency Service', '24/7 Available', 'Licensed Professional']),
        certifications: JSON.stringify(['QBCC Licensed', 'Insurance Covered', 'Police Checked']),
        address: `123 Business Street, ${owner.location}`,
        lat: lat,
        lng: lng,
        serviceRadiusKm: 25,
        phone: owner.phone,
        email: owner.email,
        website: 'https://www.proplumbing.com.au',
        whatsappLink: 'https://wa.me/61456789012',
        plan: 'STANDARD',
        verified: true,
        ratingAvg: 4.8,
        ratingCount: 24
      },
    });
    
    console.log(`✅ Created business: ${business.name}`);
  }

  console.log('🌱 Database seeded successfully!');
  console.log('🔑 Demo accounts:');
  console.log('   Admin: admin@communityhub.com');
  console.log('   Business Owner: samuel@plumbingpro.com.au');  
  console.log('   Member: grace@email.com');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });