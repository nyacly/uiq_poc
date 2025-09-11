#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const config = {
  baseUrl: process.env.PERFORMANCE_TEST_URL || 'http://localhost:5000',
  outputDir: './performance-reports',
  pages: [
    { name: 'homepage', path: '/' },
    { name: 'businesses', path: '/businesses' },
    { name: 'events', path: '/events' },
    { name: 'classifieds', path: '/classifieds' }
  ],
  thresholds: {
    fcp: 2000,      // First Contentful Paint
    lcp: 2500,      // Largest Contentful Paint
    cls: 0.1,       // Cumulative Layout Shift
    fid: 100,       // First Input Delay
    ttfb: 800       // Time to First Byte
  }
};

class PerformanceMonitor {
  constructor() {
    this.browser = null;
    this.results = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  async measurePage(pageConfig) {
    const page = await this.browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const url = `${config.baseUrl}${pageConfig.path}`;
    console.log(`📊 Measuring performance for ${pageConfig.name}: ${url}`);
    
    try {
      // Enable metrics collection
      await page.setCacheEnabled(false);
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      const startTime = Date.now();
      
      // Navigate and wait for load
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Collect Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                if (!vitals.cls) vitals.cls = 0;
                vitals.cls += entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      // Get additional metrics
      const performanceTiming = await page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          ttfb: timing.responseStart - timing.navigationStart,
          domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
          windowLoad: timing.loadEventEnd - timing.navigationStart,
          fcp: navigation ? navigation.fetchStart : null
        };
      });
      
      // Get resource metrics
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          totalRequests: resources.length,
          totalSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
          slowestResource: Math.max(...resources.map(r => r.duration))
        };
      });
      
      // Get coverage data
      const jsCoverage = await page.coverage.stopJSCoverage();
      const cssCoverage = await page.coverage.stopCSSCoverage();
      
      const totalJSBytes = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);
      const usedJSBytes = jsCoverage.reduce((total, entry) => {
        return total + entry.ranges.reduce((used, range) => used + (range.end - range.start), 0);
      }, 0);
      
      const jsUsagePercent = totalJSBytes ? (usedJSBytes / totalJSBytes) * 100 : 0;
      
      const result = {
        page: pageConfig.name,
        url,
        timestamp: new Date().toISOString(),
        loadTime,
        status: response.status(),
        metrics: {
          ...metrics,
          ...performanceTiming,
          ...resourceMetrics,
          jsUsagePercent: Math.round(jsUsagePercent)
        },
        passed: this.checkThresholds({...metrics, ...performanceTiming})
      };
      
      this.results.push(result);
      console.log(`✅ Completed ${pageConfig.name} - Load time: ${loadTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to measure ${pageConfig.name}:`, error.message);
      return {
        page: pageConfig.name,
        url,
        error: error.message,
        passed: false
      };
    } finally {
      await page.close();
    }
  }
  
  checkThresholds(metrics) {
    const checks = {
      fcp: (metrics.fcp || 0) <= config.thresholds.fcp,
      lcp: (metrics.lcp || 0) <= config.thresholds.lcp,
      cls: (metrics.cls || 0) <= config.thresholds.cls,
      ttfb: (metrics.ttfb || 0) <= config.thresholds.ttfb
    };
    
    return Object.values(checks).every(Boolean);
  }
  
  async generateReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: this.results.length,
        passedPages: this.results.filter(r => r.passed).length,
        averageLoadTime: Math.round(
          this.results.reduce((sum, r) => sum + (r.loadTime || 0), 0) / this.results.length
        )
      },
      results: this.results,
      thresholds: config.thresholds
    };
    
    // Ensure output directory exists
    await fs.mkdir(config.outputDir, { recursive: true });
    
    // Write JSON report
    const jsonPath = path.join(config.outputDir, `performance-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlPath = path.join(config.outputDir, `performance-${Date.now()}.html`);
    await fs.writeFile(htmlPath, htmlReport);
    
    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    
    return reportData;
  }
  
  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${data.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 4px; }
        .passed { border-left: 4px solid #4CAF50; }
        .failed { border-left: 4px solid #f44336; }
        .metric { display: inline-block; margin: 5px 10px; padding: 5px; background: #eee; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Performance Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Generated:</strong> ${data.timestamp}</p>
        <p><strong>Pages Tested:</strong> ${data.summary.totalPages}</p>
        <p><strong>Pages Passed:</strong> ${data.summary.passedPages}</p>
        <p><strong>Average Load Time:</strong> ${data.summary.averageLoadTime}ms</p>
    </div>
    
    <h2>Results</h2>
    ${data.results.map(result => `
        <div class="result ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.page} ${result.passed ? '✅' : '❌'}</h3>
            <p><strong>URL:</strong> ${result.url}</p>
            <p><strong>Load Time:</strong> ${result.loadTime || 'N/A'}ms</p>
            ${result.metrics ? `
                <div class="metrics">
                    <span class="metric">FCP: ${Math.round(result.metrics.fcp || 0)}ms</span>
                    <span class="metric">LCP: ${Math.round(result.metrics.lcp || 0)}ms</span>
                    <span class="metric">CLS: ${(result.metrics.cls || 0).toFixed(3)}</span>
                    <span class="metric">TTFB: ${Math.round(result.metrics.ttfb || 0)}ms</span>
                    <span class="metric">JS Usage: ${result.metrics.jsUsagePercent || 0}%</span>
                </div>
            ` : ''}
            ${result.error ? `<p style="color: red;"><strong>Error:</strong> ${result.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
  
  async run() {
    try {
      await this.init();
      
      for (const pageConfig of config.pages) {
        await this.measurePage(pageConfig);
      }
      
      const report = await this.generateReport();
      
      console.log('\n📊 Performance Summary:');
      console.log(`   Pages tested: ${report.summary.totalPages}`);
      console.log(`   Pages passed: ${report.summary.passedPages}`);
      console.log(`   Average load time: ${report.summary.averageLoadTime}ms`);
      
      if (report.summary.passedPages < report.summary.totalPages) {
        console.log('\n⚠️  Some pages failed performance thresholds');
        process.exit(1);
      }
      
    } finally {
      await this.close();
    }
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

module.exports = PerformanceMonitor;