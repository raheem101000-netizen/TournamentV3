# k6 Load Testing for Tournament Management App

Comprehensive load testing suite to measure concurrent user capacity and identify performance bottlenecks.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Test Scenarios](#test-scenarios)
- [Running Tests](#running-tests)
- [Understanding Results](#understanding-results)
- [Customization](#customization)
- [Best Practices](#best-practices)

## 🚀 Quick Start

```bash
# 1. Install k6
brew install k6  # macOS
# or download from https://k6.io/docs/get-started/installation/

# 2. Start your application
npm run dev

# 3. Run a smoke test (in a new terminal)
npm run test:k6:smoke

# 4. View results in the console
```

## 📦 Installation

### Install k6

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

### Verify Installation

```bash
k6 version
```

## 🎯 Test Scenarios

### 1. Smoke Test (`smoke-test.js`)
- **Purpose**: Quick validation that all endpoints work
- **Duration**: 1 minute
- **Users**: 1-5 concurrent users
- **Use When**: After code changes, before deploying

```bash
npm run test:k6:smoke
```

### 2. Load Test (`load-test.js`)
- **Purpose**: Test sustained performance under expected load
- **Duration**: 10 minutes
- **Users**: 50-100 concurrent users
- **Use When**: Validating normal operation capacity

```bash
npm run test:k6:load
```

### 3. Stress Test (`stress-test.js`)
- **Purpose**: Find breaking points and test recovery
- **Duration**: 15 minutes
- **Users**: 200-500 concurrent users
- **Use When**: Determining maximum capacity

```bash
npm run test:k6:stress
```

### 4. Spike Test (`spike-test.js`)
- **Purpose**: Test system elasticity with sudden traffic
- **Duration**: 5 minutes
- **Users**: Rapid spike from 10 to 200 users
- **Use When**: Validating auto-scaling and rate limiting

```bash
npm run test:k6:spike
```

## 🏃 Running Tests

### Basic Usage

```bash
# Run specific scenario
k6 run k6-tests/scenarios/smoke-test.js

# Or use npm scripts
npm run test:k6:smoke
npm run test:k6:load
npm run test:k6:stress
npm run test:k6:spike
```

### Custom Configuration

**Test against different URL:**
```bash
BASE_URL=https://your-app.replit.app k6 run k6-tests/scenarios/smoke-test.js
```

**Adjust threshold strictness:**
```bash
THRESHOLD_LEVEL=strict k6 run k6-tests/scenarios/load-test.js
# Options: strict, default, relaxed
```

**Run specific test script:**
```bash
k6 run k6-tests/scripts/auth-flow.js
k6 run k6-tests/scripts/tournament-ops.js
k6 run k6-tests/scripts/match-ops.js
k6 run k6-tests/scripts/websocket-test.js
```

### Advanced Options

**Save results to file:**
```bash
k6 run --out json=results.json k6-tests/scenarios/load-test.js
```

**Custom virtual users:**
```bash
k6 run --vus 50 --duration 5m k6-tests/scripts/auth-flow.js
```

**Disable thresholds:**
```bash
k6 run --no-thresholds k6-tests/scenarios/stress-test.js
```

## 📊 Understanding Results

### Key Metrics

**HTTP Request Duration:**
- `avg`: Average response time
- `min/max`: Fastest/slowest request
- `p(95)`: 95% of requests completed within this time
- `p(99)`: 99% of requests completed within this time

**HTTP Request Failed:**
- Percentage of failed HTTP requests
- Target: < 1% for normal operations

**Checks:**
- Percentage of successful assertions
- Target: > 95%

**Iterations:**
- Number of times the test function completed
- Higher is better (more throughput)

### Example Output

```
✓ Smoke Test Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTTP Requests:
  Total: 245
  Rate: 4.08/s

Response Times:
  Avg: 156.23ms
  Min: 45.12ms
  Max: 523.45ms
  p(95): 312.45ms
  p(99): 445.67ms

Failed Requests: 0.41%

Checks Passed: 98.37%
```

### Interpreting Results

**✅ Good Performance:**
- p(95) < 500ms
- Failed requests < 1%
- Checks passed > 95%

**⚠️ Degraded Performance:**
- p(95) between 500ms - 1000ms
- Failed requests 1-5%
- Checks passed 90-95%

**❌ Poor Performance:**
- p(95) > 1000ms
- Failed requests > 5%
- Checks passed < 90%

## 🔧 Customization

### Modify Test Duration

Edit the `stages` in scenario files:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up
    { duration: '5m', target: 50 },  // Sustain
    { duration: '1m', target: 0 },   // Ramp down
  ],
};
```

### Adjust Thresholds

Edit `k6-tests/config/thresholds.js`:

```javascript
export const customThresholds = {
  http_req_duration: ['p(95)<300'],
  http_req_failed: ['rate<0.005'],
  checks: ['rate>0.98'],
};
```

### Add Custom Test Scripts

Create new test in `k6-tests/scripts/`:

```javascript
import http from 'k6/http';
import { BASE_URL, createAuthHeaders } from '../utils/helpers.js';

export default function () {
  // Your custom test logic
}
```

## 📚 Best Practices

### 1. Start Small
Always begin with smoke tests before running larger tests.

### 2. Use Realistic Data
The tests generate random data, but consider using production-like datasets.

### 3. Monitor Your System
Watch CPU, memory, and database metrics during tests:
```bash
# In another terminal
top
# or
htop
```

### 4. Test Incrementally
Gradually increase load to find the exact breaking point.

### 5. Clean Up Test Data
Tests create real database entries. Consider:
- Using a separate test database
- Running cleanup scripts after tests
- Implementing automatic data expiration

### 6. Test in Isolation
Run tests when no other load is on the system for accurate results.

### 7. Document Baselines
Record your first test results as a baseline for comparison.

## 🎯 Common Use Cases

### Finding Maximum Concurrent Users

```bash
# Run stress test and note when errors spike
npm run test:k6:stress

# Check results for the point where:
# - Failed requests > 5%
# - p(95) > 1000ms
```

### Validating Code Changes

```bash
# Before changes
npm run test:k6:load > before.txt

# Make your changes

# After changes
npm run test:k6:load > after.txt

# Compare results
diff before.txt after.txt
```

### Testing API Endpoints

```bash
# Test specific functionality
k6 run k6-tests/scripts/tournament-ops.js
```

## 🐛 Troubleshooting

### Connection Refused
**Problem**: `connection refused` errors

**Solution**:
- Ensure your app is running (`npm run dev`)
- Check the BASE_URL is correct
- Verify port 5000 is accessible

### High Error Rates
**Problem**: Many failed requests

**Solution**:
- Check server logs for errors
- Verify database connection
- Ensure sufficient system resources
- Review rate limiting settings

### WebSocket Tests Failing
**Problem**: WebSocket connection errors

**Solution**:
- Verify WebSocket endpoint is `/ws`
- Check session authentication
- Ensure WebSocket server is running

## 📈 Next Steps

1. **Run your first smoke test** to establish a baseline
2. **Gradually increase load** with load tests
3. **Find your limits** with stress tests
4. **Document your findings** for future reference
5. **Set up monitoring** for production environments

## 🔗 Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/)

---

**Happy Load Testing! 🚀**
