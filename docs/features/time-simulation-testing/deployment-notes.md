# Time Simulation Testing Framework - Deployment Notes

## 🚀 **CI/CD Integration**

### **GitHub Actions Workflow**

**Complete Workflow Configuration**:
```yaml
# .github/workflows/time-simulation-tests.yml
name: Time Simulation Tests

on:
  push:
    branches: [ development, staging, stable, main ]
  pull_request:
    branches: [ development, staging, stable, main ]
  schedule:
    # Run daily at 2 AM UTC to catch time-dependent regressions
    - cron: '0 2 * * *'

jobs:
  time-simulation-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    strategy:
      matrix:
        node-version: [18, 20]
        test-suite: [questions, streaks, insights, future-scenarios]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          npm run postinstall
      
      - name: Set up test environment
        run: |
          mkdir -p test-results/temporal
          export TIME_SIMULATION_TIMEOUT=30000
          export TIME_SIMULATION_MEMORY_LIMIT=100
          export TIME_SIMULATION_VERBOSE=true
      
      - name: Run time simulation tests
        run: |
          echo "Running ${{ matrix.test-suite }} test suite..."
          node scripts/run-time-simulation-tests.js ${{ matrix.test-suite }} > test-results/temporal/${{ matrix.test-suite }}-${{ matrix.node-version }}.log 2>&1
        env:
          NODE_ENV: test
          CI: true
      
      - name: Run Jest unit tests
        run: |
          npm test -- test/unit/time-simulation.test.js --verbose --coverage
          npm test -- test/unit/question-rotation.test.js --verbose
          npm test -- test/unit/streak-functionality.test.js --verbose
          npm test -- test/unit/weekly-insights.test.js --verbose
      
      - name: Performance benchmarking
        run: |
          echo "Performance benchmarking for ${{ matrix.test-suite }}..."
          /usr/bin/time -v node scripts/run-time-simulation-tests.js ${{ matrix.test-suite }} 2>&1 | tee test-results/temporal/performance-${{ matrix.test-suite }}.log
      
      - name: Memory leak detection
        run: |
          echo "Memory leak detection..."
          node --expose-gc scripts/memory-leak-test.js
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: temporal-test-results-${{ matrix.node-version }}-${{ matrix.test-suite }}
          path: test-results/temporal/
          retention-days: 30
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: matrix.node-version == '18' && matrix.test-suite == 'questions'
        with:
          files: ./coverage/lcov.info
          flags: temporal-tests
          name: time-simulation-coverage

  integration-tests:
    needs: time-simulation-tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run full integration suite
        run: |
          echo "Running complete temporal integration tests..."
          node scripts/run-time-simulation-tests.js all --integration-mode
      
      - name: Validate test results
        run: |
          echo "Validating test result integrity..."
          node scripts/validate-temporal-test-results.js
```

### **Environment-Specific Configuration**

**Development Environment**:
```bash
# .env.test
NODE_ENV=test
TIME_SIMULATION_TIMEOUT=10000
TIME_SIMULATION_MEMORY_LIMIT=50
TIME_SIMULATION_VERBOSE=false
TIME_SIMULATION_CLEANUP_DELAY=100
```

**CI/CD Environment**:
```bash
# CI environment variables
export CI=true
export NODE_ENV=test
export TIME_SIMULATION_TIMEOUT=30000
export TIME_SIMULATION_MEMORY_LIMIT=100
export TIME_SIMULATION_VERBOSE=true
export TIME_SIMULATION_PARALLEL=false
```

**Staging Environment**:
```bash
# Staging-specific test configuration
export TIME_SIMULATION_STAGING=true
export TIME_SIMULATION_REALISTIC_DATA=true
export TIME_SIMULATION_EXTENDED_SCENARIOS=true
```

---

## 📦 **Package.json Scripts Integration**

**Enhanced NPM Scripts**:
```json
{
  "scripts": {
    "test:temporal": "node scripts/run-time-simulation-tests.js all",
    "test:temporal:questions": "node scripts/run-time-simulation-tests.js questions",
    "test:temporal:streaks": "node scripts/run-time-simulation-tests.js streaks",
    "test:temporal:insights": "node scripts/run-time-simulation-tests.js insights",
    "test:temporal:future": "node scripts/run-time-simulation-tests.js future-scenarios",
    "test:temporal:performance": "/usr/bin/time -v npm run test:temporal",
    "test:temporal:memory": "node --expose-gc scripts/memory-leak-test.js",
    "test:temporal:ci": "NODE_ENV=test CI=true npm run test:temporal",
    "test:unit:temporal": "jest test/unit/time-simulation.test.js test/unit/question-rotation.test.js test/unit/streak-functionality.test.js test/unit/weekly-insights.test.js",
    "test:coverage:temporal": "jest --coverage test/unit/time-simulation.test.js",
    "validate:temporal": "node scripts/validate-temporal-test-results.js",
    "benchmark:temporal": "node scripts/benchmark-temporal-performance.js"
  }
}
```

---

## 🔧 **Environment-Specific Considerations**

### **Local Development Environment**

**Setup Requirements**:
```bash
# Prerequisites check
node --version  # Should be 18+ for optimal performance
npm --version   # Should be 9+
git --version   # For CI/CD integration

# Memory configuration for local development
export NODE_OPTIONS="--max-old-space-size=2048"
export TIME_SIMULATION_LOCAL=true
```

**Local Testing Commands**:
```bash
# Quick local validation
npm run test:temporal:questions  # Fast feedback loop

# Full local test suite
npm run test:temporal  # Complete validation

# Performance monitoring
npm run test:temporal:performance  # With timing data

# Memory leak detection
npm run test:temporal:memory  # Memory usage validation
```

### **Staging Environment Deployment**

**Pre-deployment Validation**:
```bash
# Staging preparation
export ENVIRONMENT=staging
export TIME_SIMULATION_STAGING=true

# Run extended test scenarios
node scripts/run-time-simulation-tests.js all --staging-mode

# Validate against staging data patterns
node scripts/validate-staging-temporal-patterns.js
```

**Staging-Specific Tests**:
- Extended journey simulations (6+ months)
- Realistic user behavior patterns
- Performance testing with production-like data volumes
- Cross-browser compatibility validation

### **Production Environment Considerations**

**Production Monitoring**:
```bash
# Production health checks (read-only)
node scripts/production-temporal-health-check.js

# Validate temporal feature behavior
node scripts/validate-production-temporal-patterns.js --read-only

# Performance monitoring
node scripts/monitor-production-temporal-performance.js
```

**Production Safety**:
- ⚠️ **Never run time simulation tests in production**
- ✅ Use read-only monitoring scripts only
- ✅ Validate temporal behavior through synthetic testing
- ✅ Monitor actual user temporal patterns for regression detection

---

## 🐳 **Docker Integration**

**Dockerfile for Temporal Testing**:
```dockerfile
# Dockerfile.temporal-tests
FROM node:18-alpine

WORKDIR /app

# Install dependencies for time simulation
RUN apk add --no-cache \
    bash \
    time \
    procps

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy test framework
COPY test/unit/ ./test/unit/
COPY scripts/run-time-simulation-tests.js ./scripts/
COPY scripts/memory-leak-test.js ./scripts/

# Set environment for containerized testing
ENV NODE_ENV=test
ENV TIME_SIMULATION_CONTAINER=true
ENV TIME_SIMULATION_TIMEOUT=45000
ENV TIME_SIMULATION_MEMORY_LIMIT=150

# Health check for container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/health-check-temporal-framework.js

# Default command
CMD ["npm", "run", "test:temporal:ci"]
```

**Docker Compose for Testing**:
```yaml
# docker-compose.temporal-tests.yml
version: '3.8'

services:
  temporal-tests:
    build:
      context: .
      dockerfile: Dockerfile.temporal-tests
    environment:
      - NODE_ENV=test
      - TIME_SIMULATION_TIMEOUT=45000
      - TIME_SIMULATION_VERBOSE=true
    volumes:
      - ./test-results:/app/test-results
    networks:
      - temporal-testing
    mem_limit: 512m
    cpus: '1.0'

  temporal-performance:
    extends: temporal-tests
    command: ["npm", "run", "test:temporal:performance"]
    mem_limit: 1g
    cpus: '2.0'

networks:
  temporal-testing:
    driver: bridge
```

---

## 📊 **Performance Monitoring**

### **Performance Benchmarking Script**

**Create `scripts/benchmark-temporal-performance.js`**:
```javascript
#!/usr/bin/env node

const { performance } = require('perf_hooks');
const { TimeSimulationTestRunner } = require('./run-time-simulation-tests');

async function benchmarkPerformance() {
  console.log('🏁 Starting Temporal Framework Performance Benchmark');
  
  const runner = new TimeSimulationTestRunner();
  const benchmarks = {
    questions: { iterations: 10, maxTime: 5000 },
    streaks: { iterations: 10, maxTime: 3000 },
    insights: { iterations: 5, maxTime: 8000 },
    futures: { iterations: 3, maxTime: 10000 }
  };

  for (const [testType, config] of Object.entries(benchmarks)) {
    console.log(`\n📊 Benchmarking ${testType} (${config.iterations} iterations)`);
    
    const times = [];
    const memoryUsage = [];
    
    for (let i = 0; i < config.iterations; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      await runner.runSpecificTest(testType);
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const executionTime = endTime - startTime;
      const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB
      
      times.push(executionTime);
      memoryUsage.push(memoryDelta);
      
      if (executionTime > config.maxTime) {
        console.warn(`⚠️  Iteration ${i + 1} exceeded max time: ${executionTime}ms`);
      }
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const avgMemory = memoryUsage.reduce((sum, mem) => sum + mem, 0) / memoryUsage.length;
    
    console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Average memory delta: ${avgMemory.toFixed(2)}MB`);
    console.log(`   Max time: ${Math.max(...times).toFixed(2)}ms`);
    console.log(`   Min time: ${Math.min(...times).toFixed(2)}ms`);
    
    // Performance assertions
    if (avgTime > config.maxTime) {
      throw new Error(`Performance regression: ${testType} average time ${avgTime}ms exceeds limit ${config.maxTime}ms`);
    }
    
    if (avgMemory > 50) {
      throw new Error(`Memory usage regression: ${testType} average memory ${avgMemory}MB exceeds 50MB limit`);
    }
  }
  
  console.log('\n✅ All performance benchmarks passed!');
}

if (require.main === module) {
  benchmarkPerformance().catch(console.error);
}

module.exports = { benchmarkPerformance };
```

### **Memory Leak Detection Script**

**Create `scripts/memory-leak-test.js`**:
```javascript
#!/usr/bin/env node

const { TimeSimulationTestRunner } = require('./run-time-simulation-tests');

async function detectMemoryLeaks() {
  console.log('🔍 Starting Memory Leak Detection');
  
  if (!global.gc) {
    console.warn('⚠️  Garbage collection not available. Run with --expose-gc flag.');
    process.exit(1);
  }

  const runner = new TimeSimulationTestRunner();
  const testCycles = 50;
  const memoryReadings = [];

  console.log(`Running ${testCycles} test cycles...`);

  for (let cycle = 1; cycle <= testCycles; cycle++) {
    // Run test cycle
    await runner.runSpecificTest('questions');
    
    // Force garbage collection
    global.gc();
    
    // Take memory reading
    const memoryUsage = process.memoryUsage();
    memoryReadings.push({
      cycle,
      heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
      heapTotal: memoryUsage.heapTotal / 1024 / 1024, // MB
      rss: memoryUsage.rss / 1024 / 1024 // MB
    });

    if (cycle % 10 === 0) {
      const current = memoryReadings[memoryReadings.length - 1];
      console.log(`   Cycle ${cycle}: Heap ${current.heapUsed.toFixed(2)}MB, RSS ${current.rss.toFixed(2)}MB`);
    }
  }

  // Analyze memory trend
  const firstReading = memoryReadings[9]; // Skip first 10 for warmup
  const lastReading = memoryReadings[memoryReadings.length - 1];
  
  const heapGrowth = lastReading.heapUsed - firstReading.heapUsed;
  const rssGrowth = lastReading.rss - firstReading.rss;
  
  console.log('\n📊 Memory Analysis Results:');
  console.log(`   Heap growth: ${heapGrowth.toFixed(2)}MB`);
  console.log(`   RSS growth: ${rssGrowth.toFixed(2)}MB`);
  console.log(`   Growth per cycle: ${(heapGrowth / (testCycles - 10)).toFixed(3)}MB`);

  // Memory leak thresholds
  const HEAP_GROWTH_LIMIT = 10; // MB
  const RSS_GROWTH_LIMIT = 20; // MB

  if (heapGrowth > HEAP_GROWTH_LIMIT) {
    console.error(`❌ Potential memory leak detected: Heap grew by ${heapGrowth.toFixed(2)}MB`);
    process.exit(1);
  }

  if (rssGrowth > RSS_GROWTH_LIMIT) {
    console.error(`❌ Potential memory leak detected: RSS grew by ${rssGrowth.toFixed(2)}MB`);
    process.exit(1);
  }

  console.log('✅ No memory leaks detected!');
}

if (require.main === module) {
  detectMemoryLeaks().catch(console.error);
}

module.exports = { detectMemoryLeaks };
```

---

## 🚨 **Deployment Safety Checklist**

### **Pre-Deployment Validation**

**Automated Checks**:
- ✅ All temporal tests pass in CI/CD
- ✅ Performance benchmarks within acceptable limits
- ✅ Memory leak detection shows clean results
- ✅ Integration tests validate end-to-end scenarios
- ✅ Cross-platform compatibility verified (Windows/macOS/Linux)

**Manual Verification**:
- ✅ Time simulation framework documentation updated
- ✅ Test scenarios cover new temporal features
- ✅ Error handling and edge cases tested
- ✅ Performance regression testing completed
- ✅ Memory usage profiling shows stable patterns

### **Deployment Dependencies**

**Required Node.js Packages**:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@jest/globals": "^29.0.0",
    "performance-hooks": "latest"
  }
}
```

**System Requirements**:
- Node.js 18+ (for optimal performance)
- 2GB+ available RAM for full test suite
- 500MB+ available disk space for test artifacts
- Git (for CI/CD integration)

### **Rollback Procedures**

**If Temporal Tests Fail in Production**:
1. **Immediate**: Revert to previous known-good version
2. **Investigate**: Analyze temporal test failure logs
3. **Fix**: Address root cause in development environment
4. **Validate**: Run complete temporal test suite
5. **Deploy**: Follow standard deployment process

**Test Artifact Preservation**:
```bash
# Preserve test results for debugging
mkdir -p deployment-artifacts/$(date +%Y%m%d-%H%M%S)
cp -r test-results/ deployment-artifacts/$(date +%Y%m%d-%H%M%S)/
```

---

## 📈 **Monitoring and Alerting**

### **Production Monitoring Scripts**

**Create `scripts/production-temporal-health-check.js`**:
```javascript
#!/usr/bin/env node

// Read-only production health check for temporal features
async function productionHealthCheck() {
  console.log('🏥 Production Temporal Health Check');
  
  // Check temporal feature endpoints (read-only)
  const healthChecks = [
    { name: 'Question Generation API', endpoint: '/api/questions' },
    { name: 'Streak Calculation API', endpoint: '/api/streaks' },
    { name: 'Weekly Insights API', endpoint: '/api/insights/weekly' }
  ];

  for (const check of healthChecks) {
    try {
      // Synthetic read-only test
      const response = await fetch(`${process.env.API_BASE_URL}${check.endpoint}?health=true`);
      const responseTime = response.headers.get('x-response-time');
      
      console.log(`✅ ${check.name}: ${response.status} (${responseTime}ms)`);
    } catch (error) {
      console.error(`❌ ${check.name}: ${error.message}`);
    }
  }
}
```

### **Alert Configuration**

**GitHub Actions Alert**:
```yaml
- name: Notify on temporal test failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: "⚠️ Temporal tests failed in ${{ github.ref }}. Check logs for details."
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

This comprehensive deployment documentation ensures safe and reliable deployment of the Time Simulation Testing Framework across all environments! 🚀 