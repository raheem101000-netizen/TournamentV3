# Scaling to 1000 Concurrent Users - Implementation Guide

## Overview

This guide will help you scale your tournament management application from the current **~30 concurrent users** to **1000+ concurrent users**.

---

## Current Limitations

Your app is currently limited by:
1. ✅ **Rate Limiting** (intentional security feature)
2. ⚠️ **Database Connection Pool Size**
3. ⚠️ **Session Store Configuration**
4. ⚠️ **Replit Resource Constraints**

**Good News**: Your code is already fast! We just need to adjust configurations.

---

## Step 1: Adjust Rate Limiting

### Find Rate Limiting Configuration

Your rate limiting is likely configured in [`server/routes.ts`](file:///Users/abdirashiidsammantar/Documents/TournamentV3-main/server/routes.ts).

Look for code like this (around line 30-40):

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Increase Rate Limits

**Current Settings** (estimated):
```javascript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 100,                   // 100 requests per 15 min
```

**For 1000 Concurrent Users**:
```javascript
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute (shorter window)
  max: 1000,                  // 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  
  // Skip rate limiting for certain endpoints if needed
  skip: (req) => {
    // Don't rate limit health checks or static assets
    return req.path.startsWith('/health') || req.path.startsWith('/static');
  },
});
```

### Apply Different Limits for Different Endpoints

```javascript
// Strict limit for authentication (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,  // 50 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
});

// Generous limit for general API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,  // 1000 requests per minute
});

// Very generous for read operations
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5000,  // 5000 reads per minute
});

// Apply to routes
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api', apiLimiter);
```

---

## Step 2: Optimize Database Configuration

### Increase Connection Pool Size

In [`server/db.ts`](file:///Users/abdirashiidsammantar/Documents/TournamentV3-main/server/db.ts), update the pool configuration:

**Current** (default):
```javascript
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});
```

**For 1000 Users**:
```javascript
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 100,              // Maximum pool size (increase from default 10)
  min: 10,               // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### Add Connection Pooling Monitoring

```javascript
pool.on('connect', () => {
  console.log('[DB] New client connected to pool');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

pool.on('remove', () => {
  console.log('[DB] Client removed from pool');
});
```

---

## Step 3: Optimize Session Store

In [`server/index.ts`](file:///Users/abdirashiidsammantar/Documents/TournamentV3-main/server/index.ts), optimize the session configuration:

**Current**:
```javascript
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  },
}));
```

**Optimized for 1000 Users**:
```javascript
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60,  // Clean up old sessions every 60 seconds
    ttl: 30 * 24 * 60 * 60,    // Session TTL in seconds
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,  // Reset session expiry on each request
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
}));
```

---

## Step 4: Add Response Caching

Create a new file: `server/cache-middleware.ts`

```javascript
import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute

export function cacheMiddleware(duration: number = CACHE_DURATION) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`[CACHE] Hit: ${key}`);
      return res.json(cached.data);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = (data: any) => {
      cache.set(key, { data, timestamp: Date.now() });
      console.log(`[CACHE] Set: ${key}`);
      return originalJson(data);
    };

    next();
  };
}

// Clean up old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      cache.delete(key);
    }
  }
}, CACHE_DURATION);
```

### Apply Caching to Routes

In `server/routes.ts`:

```javascript
import { cacheMiddleware } from './cache-middleware';

// Cache tournament lists for 30 seconds
app.get('/api/tournaments', cacheMiddleware(30000), async (req, res) => {
  // ... your existing code
});

// Cache tournament details for 1 minute
app.get('/api/tournaments/:id', cacheMiddleware(60000), async (req, res) => {
  // ... your existing code
});
```

---

## Step 5: Optimize Database Queries

### Add Indexes

Create a migration file or run these SQL commands:

```sql
-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for tournament queries
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);

-- Index for match queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Index for team queries
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round);
```

### Use Connection Pooling Efficiently

```javascript
// BAD: Creates new connection each time
const result = await db.query('SELECT * FROM tournaments');

// GOOD: Uses pool connection
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM tournaments');
  return result.rows;
} finally {
  client.release();
}
```

---

## Step 6: Upgrade Replit Resources

### Option 1: Replit Hacker Plan

**Upgrade to Replit Hacker** ($7/month):
- More CPU power
- More RAM
- Better performance
- Always-on deployments

### Option 2: Replit Deployments

**Use Replit Deployments** (better for production):
- Dedicated resources
- Auto-scaling
- Better performance
- Custom domains

**How to Deploy**:
1. Go to your Replit project
2. Click "Deploy" button
3. Choose deployment tier
4. Configure auto-scaling

---

## Step 7: Enable Compression

In `server/index.ts`, add compression:

```javascript
import compression from 'compression';

// Add near the top, before routes
app.use(compression({
  level: 6,  // Compression level (0-9)
  threshold: 1024,  // Only compress responses > 1KB
}));
```

Install the package:
```bash
npm install compression
npm install --save-dev @types/compression
```

---

## Step 8: Implement Request Queuing

Create `server/queue-middleware.ts`:

```javascript
import { Request, Response, NextFunction } from 'express';

const queue: Array<() => void> = [];
let activeRequests = 0;
const MAX_CONCURRENT = 500;  // Maximum concurrent requests

export function queueMiddleware(req: Request, res: Response, next: NextFunction) {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    next();
    
    res.on('finish', () => {
      activeRequests--;
      processQueue();
    });
  } else {
    // Queue the request
    queue.push(() => {
      activeRequests++;
      next();
      
      res.on('finish', () => {
        activeRequests--;
        processQueue();
      });
    });
  }
}

function processQueue() {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const nextRequest = queue.shift();
    if (nextRequest) nextRequest();
  }
}
```

---

## Step 9: Monitor Performance

Add monitoring to track performance:

```javascript
// server/monitoring.ts
export class PerformanceMonitor {
  private metrics = {
    requests: 0,
    errors: 0,
    activeConnections: 0,
    avgResponseTime: 0,
  };

  recordRequest(duration: number) {
    this.metrics.requests++;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requests - 1) + duration) 
      / this.metrics.requests;
  }

  recordError() {
    this.metrics.errors++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.errors / this.metrics.requests,
      requestsPerSecond: this.metrics.requests / (Date.now() / 1000),
    };
  }
}

export const monitor = new PerformanceMonitor();
```

---

## Complete Implementation Checklist

### Phase 1: Quick Wins (Do First)
- [ ] Increase rate limiting to 1000 req/min
- [ ] Increase database pool size to 100
- [ ] Add compression middleware
- [ ] Optimize session store settings

### Phase 2: Caching (Medium Priority)
- [ ] Implement response caching
- [ ] Cache tournament lists
- [ ] Cache user profiles
- [ ] Add cache invalidation

### Phase 3: Database (Important)
- [ ] Add database indexes
- [ ] Optimize slow queries
- [ ] Implement connection pooling best practices
- [ ] Add query monitoring

### Phase 4: Infrastructure (If Needed)
- [ ] Upgrade Replit plan
- [ ] Use Replit Deployments
- [ ] Configure auto-scaling
- [ ] Set up monitoring

### Phase 5: Advanced (Optional)
- [ ] Implement request queuing
- [ ] Add load balancing
- [ ] Use CDN for static assets
- [ ] Implement Redis caching

---

## Testing Your Changes

After implementing changes, run load tests:

```bash
# Test with 100 users
BASE_URL=https://your-app.replit.app npm run test:k6:load

# Test with 500 users
BASE_URL=https://your-app.replit.app npm run test:k6:stress

# Monitor results
```

### Expected Results After Optimization

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Concurrent Users | 30 | 500+ | 1000 |
| Response Time (p95) | 208ms | 300ms | < 500ms |
| Error Rate | 7% | < 1% | < 1% |
| Requests/Second | 3.4 | 50+ | 100+ |

---

## Replit-Specific Optimizations

### Environment Variables

Add to your Replit Secrets:

```bash
# Performance
NODE_ENV=production
MAX_CONNECTIONS=100
RATE_LIMIT_MAX=1000

# Caching
CACHE_ENABLED=true
CACHE_DURATION=60000

# Monitoring
ENABLE_MONITORING=true
```

### Replit Configuration

Create `.replit` file:

```toml
[deployment]
run = ["npm", "start"]
deploymentTarget = "cloudrun"

[deployment.resources]
cpu = 2
memory = 2048
```

---

## Cost Considerations

### Replit Pricing

| Plan | Cost | Concurrent Users | Recommended For |
|------|------|------------------|-----------------|
| Free | $0 | ~30 | Development |
| Hacker | $7/mo | ~100 | Small tournaments |
| Pro | $20/mo | ~500 | Medium tournaments |
| Deployments | $10-50/mo | 1000+ | Production |

### Database Costs

If using external database (Neon, Supabase):
- Free tier: ~100 concurrent connections
- Paid tier: Unlimited connections ($20-50/mo)

---

## Quick Start: Minimal Changes for 100 Users

If you just want to quickly support 100 users:

1. **Update rate limiting** in `server/routes.ts`:
   ```javascript
   max: 500  // Change from 100 to 500
   ```

2. **Update database pool** in `server/db.ts`:
   ```javascript
   max: 50  // Change from 10 to 50
   ```

3. **Upgrade Replit** to Hacker plan ($7/mo)

4. **Test**:
   ```bash
   npm run test:k6:load
   ```

That's it! These 3 changes should get you to 100 concurrent users.

---

## Support & Monitoring

### Monitor Your App

```bash
# Check active connections
# In Replit console
netstat -an | grep ESTABLISHED | wc -l

# Check memory usage
free -h

# Check CPU usage
top
```

### Troubleshooting

**High Error Rates?**
- Increase rate limits further
- Check database connection pool
- Review error logs

**Slow Response Times?**
- Add caching
- Optimize database queries
- Check database indexes

**Out of Memory?**
- Upgrade Replit plan
- Optimize memory usage
- Implement garbage collection

---

## Summary

To scale to 1000 concurrent users:

1. ✅ **Adjust rate limiting** (easy, do first)
2. ✅ **Increase database pool** (easy, do first)
3. ✅ **Add caching** (medium effort, big impact)
4. ✅ **Optimize database** (medium effort, important)
5. ✅ **Upgrade infrastructure** (costs money, necessary for 1000+)

**Start with steps 1-2**, test, then implement 3-5 as needed!

---

**Questions?** Test after each change and monitor the results!
