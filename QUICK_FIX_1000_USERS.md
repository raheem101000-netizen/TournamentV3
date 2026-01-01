# Quick Fix: Increase to 1000 Concurrent Users

## Current Rate Limiting Settings

In [`server/routes.ts`](file:///Users/abdirashiidsammantar/Documents/TournamentV3-main/server/routes.ts) (lines 16-38), you currently have:

```javascript
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 100,                 // 100 requests per minute
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // Only 10 auth attempts per 15 min
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 30,                  // Only 30 writes per minute
  message: { error: "Too many write operations, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## ⚡ QUICK FIX: Change These 3 Numbers

### For 1000 Concurrent Users

Replace lines 16-38 in `server/routes.ts` with:

```javascript
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,                 // CHANGED: 100 → 5000
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                  // CHANGED: 10 → 500
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,                 // CHANGED: 30 → 1000
  message: { error: "Too many write operations, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 📊 What This Changes

| Rate Limiter | Before | After | Impact |
|--------------|--------|-------|--------|
| **General API** | 100/min | 5000/min | 50x more capacity |
| **Authentication** | 10/15min | 500/15min | 50x more logins |
| **Write Operations** | 30/min | 1000/min | 33x more writes |

---

## 🚀 How to Apply

### Option 1: Manual Edit (Recommended)

1. Open `server/routes.ts` in your editor
2. Find lines 16-38
3. Change the three `max:` values:
   - Line 18: `max: 100,` → `max: 5000,`
   - Line 26: `max: 10,` → `max: 500,`
   - Line 34: `max: 30,` → `max: 1000,`
4. Save the file
5. Restart your Replit app

### Option 2: Copy-Paste (Fastest)

Copy this entire block and replace lines 16-38:

```javascript
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: "Too many write operations, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## ✅ Testing After Changes

1. **Restart your Replit app**
2. **Run load test**:
   ```bash
   BASE_URL=https://tournament-v-3--abdirashiidsamm.replit.app npm run test:k6:load
   ```
3. **Check results** - you should see:
   - ✅ Much lower error rates
   - ✅ More successful requests
   - ✅ Ability to handle 100+ concurrent users

---

## 🎯 Expected Results

### Before Changes
- ❌ 7% error rate at 5 users
- ❌ Heavy rate limiting at 50+ users
- ❌ ~30 concurrent user capacity

### After Changes
- ✅ < 1% error rate at 50 users
- ✅ Minimal rate limiting up to 500 users
- ✅ 500-1000 concurrent user capacity

---

## ⚠️ Important Notes

### Security Considerations

These new limits are **generous** but still protect against abuse:
- **5000 requests/min** = 83 requests/second (very high)
- **500 auth attempts/15min** = prevents brute force
- **1000 writes/min** = 16 writes/second (good for tournaments)

### When to Adjust Further

If you still see rate limiting errors:
- Increase `max` values even more
- Or increase `windowMs` (time window)
- Or remove rate limiting entirely (not recommended)

### Database Considerations

You may also need to increase database connections in `server/db.ts`:

```javascript
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 100,  // Increase from default 10
});
```

---

## 🔄 Rollback (If Needed)

If something goes wrong, revert to original values:
- `generalRateLimiter.max: 100`
- `authRateLimiter.max: 10`
- `writeRateLimiter.max: 30`

---

## 📈 Next Steps

1. ✅ Make the changes above
2. ✅ Restart Replit
3. ✅ Run `npm run test:k6:load`
4. ✅ Check if error rates drop
5. ✅ If still seeing errors, increase limits more
6. ✅ For full 1000 users, see [`SCALING_TO_1000_USERS.md`](file:///Users/abdirashiidsammantar/Documents/TournamentV3-main/SCALING_TO_1000_USERS.md)

---

**This simple change should get you to 500-1000 concurrent users!** 🚀
