export default function HomePage() {
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
        <p>🚧 Additional features coming in staged releases</p>
      </div>
    </div>
  );
}