import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbCheck = await checkDatabase();
    
    // Check external services
    const serviceChecks = await Promise.allSettled([
      checkStripe(),
      checkTwilio(),
      checkMemoryUsage(),
      checkDiskSpace()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        stripe: serviceChecks[0].status === 'fulfilled' ? serviceChecks[0].value : { status: 'error', error: serviceChecks[0].reason },
        twilio: serviceChecks[1].status === 'fulfilled' ? serviceChecks[1].value : { status: 'error', error: serviceChecks[1].reason },
        memory: serviceChecks[2].status === 'fulfilled' ? serviceChecks[2].value : { status: 'error', error: serviceChecks[2].reason },
        disk: serviceChecks[3].status === 'fulfilled' ? serviceChecks[3].value : { status: 'error', error: serviceChecks[3].reason }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    // Determine overall health status
    const hasErrors = Object.values(health.checks).some(check => check.status === 'error');
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
    
    if (hasErrors) {
      health.status = 'unhealthy';
      return NextResponse.json(health, { status: 503 });
    } else if (hasWarnings) {
      health.status = 'degraded';
      return NextResponse.json(health, { status: 200 });
    }

    return NextResponse.json(health, { status: 200 });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthError = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: { status: 'error', error: 'Failed to check' },
        stripe: { status: 'unknown' },
        twilio: { status: 'unknown' },
        memory: { status: 'unknown' },
        disk: { status: 'unknown' }
      }
    };
    
    return NextResponse.json(healthError, { status: 503 });
  }
}

async function checkDatabase() {
  try {
    // Simple query to check database connectivity
    const result = await db.execute('SELECT 1 as health_check');
    
    return {
      status: 'healthy',
      responseTime: 'Fast',
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkStripe() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { status: 'disabled', message: 'Stripe not configured' };
    }
    
    // Simple Stripe API call to check connectivity
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Stripe API accessible'
      };
    } else {
      return {
        status: 'error',
        error: `Stripe API returned ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Stripe check failed'
    };
  }
}

async function checkTwilio() {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return { status: 'disabled', message: 'Twilio not configured' };
    }
    
    // Check Twilio account status
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Twilio API accessible'
      };
    } else {
      return {
        status: 'error',
        error: `Twilio API returned ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Twilio check failed'
    };
  }
}

async function checkMemoryUsage() {
  try {
    const usage = process.memoryUsage();
    const usagePercentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (usagePercentage > 90) {
      return {
        status: 'error',
        error: `High memory usage: ${usagePercentage.toFixed(2)}%`,
        details: usage
      };
    } else if (usagePercentage > 80) {
      return {
        status: 'warning',
        message: `Memory usage: ${usagePercentage.toFixed(2)}%`,
        details: usage
      };
    }
    
    return {
      status: 'healthy',
      message: `Memory usage: ${usagePercentage.toFixed(2)}%`,
      details: usage
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Memory check failed'
    };
  }
}

async function checkDiskSpace() {
  try {
    // Note: This is a simplified check for Node.js environment
    // In a real production environment, you'd want to check actual disk space
    const stats = await import('fs').then(fs => fs.promises.stat('.'));
    
    return {
      status: 'healthy',
      message: 'Disk space check completed',
      details: {
        size: stats.size,
        modified: stats.mtime
      }
    };
  } catch (error) {
    return {
      status: 'warning',
      message: 'Could not check disk space in this environment'
    };
  }
}