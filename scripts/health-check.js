#!/usr/bin/env node

const http = require('http');
const https = require('https');

const config = {
  url: process.env.HEALTH_CHECK_URL || 'http://localhost:5000/api/health',
  timeout: 5000,
  retries: 3,
  interval: 30000 // 30 seconds
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, { timeout: config.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          responseTime,
          data: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function healthCheck() {
  console.log(`🔍 Health check starting for ${config.url}`);
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const result = await makeRequest(config.url);
      
      if (result.status === 200) {
        console.log(`✅ Health check passed (attempt ${attempt})`);
        console.log(`📊 Response time: ${result.responseTime}ms`);
        console.log(`📦 Response:`, result.data);
        
        if (result.responseTime > 2000) {
          console.warn(`⚠️  Slow response time: ${result.responseTime}ms`);
        }
        
        return { success: true, ...result };
      } else {
        console.error(`❌ Health check failed with status ${result.status}`);
      }
    } catch (error) {
      console.error(`❌ Health check failed (attempt ${attempt}):`, error.message);
      
      if (attempt < config.retries) {
        console.log(`🔄 Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  throw new Error('Health check failed after all retries');
}

async function continuousMonitoring() {
  console.log(`🚀 Starting continuous health monitoring every ${config.interval/1000}s`);
  
  while (true) {
    try {
      await healthCheck();
      await new Promise(resolve => setTimeout(resolve, config.interval));
    } catch (error) {
      console.error('🚨 ALERT: Application health check failed!');
      console.error(error.message);
      
      // Send alert (webhook, email, etc.)
      if (process.env.WEBHOOK_URL) {
        try {
          await makeRequest(process.env.WEBHOOK_URL + '?status=down&message=' + encodeURIComponent(error.message));
        } catch (webhookError) {
          console.error('Failed to send webhook alert:', webhookError.message);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, config.interval));
    }
  }
}

// CLI usage
if (require.main === module) {
  const mode = process.argv[2] || 'once';
  
  if (mode === 'continuous') {
    continuousMonitoring().catch(console.error);
  } else {
    healthCheck()
      .then(() => {
        console.log('✅ Health check completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { healthCheck, continuousMonitoring };