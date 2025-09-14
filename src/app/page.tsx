import { db } from '@/lib/db';

async function getStats() {
  const [userCount, businessCount] = await Promise.all([
    db.user.count(),
    db.business.count()
  ]);
  
  return { userCount, businessCount };
}

export default async function HomePage() {
  const { userCount, businessCount } = await getStats();
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#333', marginBottom: '1rem' }}>
        Welcome to Community Hub
      </h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>
        Connecting Ugandans in Queensland through community, business, events, and shared experiences.
      </p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>Platform Status</h2>
        <p>✅ Basic Next.js setup complete</p>
        <p>✅ Database connected and seeded</p>
        <p>📊 {userCount} users and {businessCount} businesses in database</p>
        <p>🚧 Additional features coming in staged releases</p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3 style={{ color: '#2d5a2d', marginBottom: '1rem' }}>Database Demo</h3>
        <p style={{ color: '#2d5a2d' }}>✅ Prisma ORM configured with SQLite</p>
        <p style={{ color: '#2d5a2d' }}>✅ User and Business models created</p>
        <p style={{ color: '#2d5a2d' }}>✅ Sample data seeded successfully</p>
        <p style={{ color: '#2d5a2d' }}>✅ Database queries working</p>
      </div>
    </div>
  );
}