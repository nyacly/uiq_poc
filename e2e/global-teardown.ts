import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test database or other global resources
  // await cleanupTestDatabase();
  
  console.log('✅ Global test teardown completed');
}

export default globalTeardown;