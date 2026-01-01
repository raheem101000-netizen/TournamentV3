# Quick Setup Guide for k6 Load Testing

This guide will help you get started with load testing your tournament management application.

## Prerequisites

You need your application running before you can test it. You have two options:

### Option 1: Test on Replit (Easiest)

If your app is deployed on Replit:

1. **Get your Replit URL** (e.g., `https://your-app.replit.app`)

2. **Install k6 locally**:
   ```bash
   # macOS
   brew install k6
   
   # Windows
   choco install k6
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install k6
   ```

3. **Run tests against Replit**:
   ```bash
   BASE_URL=https://your-app.replit.app npm run test:k6:smoke
   ```

### Option 2: Test Locally

To test locally, you need to set up a database first.

#### Step 1: Set Up Database

You need a PostgreSQL database. Easiest option is to use a free tier from:
- **Neon** (https://neon.tech) - Free PostgreSQL
- **Supabase** (https://supabase.com) - Free PostgreSQL
- **ElephantSQL** (https://elephantsql.com) - Free PostgreSQL

#### Step 2: Create `.env` File

Create a file named `.env` in your project root:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database
SESSION_SECRET=your-secret-key-here
```

Replace the DATABASE_URL with your actual database connection string.

#### Step 3: Start Your App

```bash
npm install
npm run dev
```

Your app should now be running on `http://localhost:5000`

#### Step 4: Run Load Tests

In a **new terminal window**:

```bash
# Quick smoke test
npm run test:k6:smoke

# Full load test
npm run test:k6:load

# Stress test
npm run test:k6:stress

# Spike test
npm run test:k6:spike
```

## Understanding the Tests

### Smoke Test (1 minute, 5 users)
- Quick validation that everything works
- Run this first!
- Should complete with < 1% errors

### Load Test (10 minutes, 50-100 users)
- Tests normal expected load
- Simulates realistic usage
- Tells you how many users you can handle comfortably

### Stress Test (15 minutes, 200-500 users)
- Finds your breaking point
- Shows where the system starts to fail
- Helps identify bottlenecks

### Spike Test (5 minutes, sudden spike to 200 users)
- Tests how system handles sudden traffic
- Validates rate limiting
- Shows recovery time

## What to Look For

### ✅ Good Results
- Response time p(95) < 500ms
- Failed requests < 1%
- Checks passed > 95%

### ⚠️ Warning Signs
- Response time p(95) > 1000ms
- Failed requests > 5%
- Checks passed < 90%

### 🔧 If Tests Fail

1. **Check your app is running**: Visit http://localhost:5000 in browser
2. **Check database connection**: Look for database errors in console
3. **Check system resources**: Run `top` or `htop` to see CPU/memory
4. **Start with smoke test**: Don't jump straight to stress testing

## Next Steps

1. ✅ Run smoke test to validate setup
2. ✅ Run load test to find comfortable capacity
3. ✅ Document your baseline results
4. ✅ Run tests after code changes to compare

## Troubleshooting

### "Connection refused"
- Your app isn't running
- Solution: Run `npm run dev` first

### "DATABASE_URL must be set"
- No database configured
- Solution: Create `.env` file with DATABASE_URL

### "k6: command not found"
- k6 not installed
- Solution: Install k6 (see step 2 above)

### High error rates
- App might not be ready
- Wait 10-15 seconds after starting app
- Check server logs for errors

---

**Ready to test?** Start with: `npm run test:k6:smoke`
