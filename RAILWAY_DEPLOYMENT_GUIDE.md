# Railway Deployment Guide - Step by Step

## 🚀 Deploy Your Tournament App to Railway

Follow these steps exactly to deploy your app to Railway and test with 1000 users.

---

## Step 1: Sign Up for Railway (2 minutes)

1. **Open Railway**: https://railway.app
2. **Click "Login"** in the top right
3. **Choose "Login with GitHub"**
4. **Authorize Railway** to access your GitHub account
5. **You're in!** You'll see the Railway dashboard

✅ **You now have $5 free credit** to use every month!

---

## Step 2: Create a New Project (1 minute)

1. **Click "New Project"** (big purple button)
2. **Select "Deploy from GitHub repo"**
3. **Find and select**: `raheem101000-netizen/TournamentV3`
4. **Click the repo** to select it

Railway will now analyze your repository...

---

## Step 3: Railway Auto-Configuration (30 seconds)

Railway will automatically detect:
- ✅ Node.js project
- ✅ package.json
- ✅ Build and start commands

You'll see a screen showing:
- **Service Name**: TournamentV3 (or similar)
- **Build Command**: Detected automatically
- **Start Command**: Detected automatically

**Click "Deploy"** or "Add variables first" (we'll add variables next)

---

## Step 4: Add Database (1 minute)

Your app needs a PostgreSQL database.

### Option A: Use Railway's PostgreSQL (Recommended)

1. **In your project**, click **"New"** button
2. **Select "Database"**
3. **Choose "Add PostgreSQL"**
4. Railway creates the database instantly
5. **DATABASE_URL is automatically set** for your app!

### Option B: Use Your Existing Neon Database

1. **Click on your service** (TournamentV3)
2. **Go to "Variables" tab**
3. **Click "New Variable"**
4. **Add**:
   - Name: `DATABASE_URL`
   - Value: Your Neon connection string

---

## Step 5: Add Environment Variables (2 minutes)

1. **Click on your service** (TournamentV3)
2. **Click "Variables" tab**
3. **Add these variables**:

```
NODE_ENV=production
SESSION_SECRET=your-random-secret-key-here-change-this
```

**To generate a secure SESSION_SECRET**, run this locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your SESSION_SECRET.

### Optional Variables (if needed):
```
SKIP_EMAIL_VERIFICATION=true
```

4. **Click "Add"** for each variable

---

## Step 6: Configure Build Settings (1 minute)

1. **Click "Settings" tab**
2. **Scroll to "Build"**
3. **Verify these settings**:

```
Build Command: npm install && npm run build
Start Command: npm start
Root Directory: /
```

If they're not set, add them.

4. **Click "Deploy"** at the top

---

## Step 7: Wait for Deployment (2-3 minutes)

You'll see the deployment logs in real-time:

```
Installing dependencies...
Building application...
Starting server...
✓ Deployment successful!
```

**Watch for**:
- ✅ "npm install" completes
- ✅ "npm run build" completes
- ✅ "npm start" runs
- ✅ Server starts on port (Railway auto-assigns)

---

## Step 8: Get Your App URL (30 seconds)

1. **Click "Settings" tab**
2. **Scroll to "Networking"**
3. **Click "Generate Domain"**
4. Railway gives you a URL like: `tournamentv3-production.up.railway.app`

**Copy this URL!** You'll use it for k6 testing.

---

## Step 9: Test Your Deployment (1 minute)

1. **Open the URL** in your browser
2. **You should see your app!**
3. **Try to register/login** to verify it works

If you see errors, check the logs:
- Click "Deployments" tab
- Click the latest deployment
- View logs for errors

---

## Step 10: Run k6 Tests! (5 minutes)

Now test your Railway deployment with k6:

```bash
# Smoke test (5 users)
BASE_URL=https://your-railway-url.up.railway.app npm run test:k6:smoke

# Load test (100 users)
BASE_URL=https://your-railway-url.up.railway.app npm run test:k6:load

# Stress test (500 users) - optional
BASE_URL=https://your-railway-url.up.railway.app npm run test:k6:stress
```

Replace `your-railway-url.up.railway.app` with your actual Railway URL.

---

## ✅ Checklist

Before running k6 tests, verify:

- [ ] Railway project created
- [ ] Database added (PostgreSQL)
- [ ] Environment variables set (NODE_ENV, SESSION_SECRET, DATABASE_URL)
- [ ] Build settings configured
- [ ] Deployment successful
- [ ] Domain generated
- [ ] App loads in browser
- [ ] Can register/login

---

## 🎯 Expected Results

After deploying to Railway, you should see:

**Smoke Test (5 users):**
- ✅ < 1% error rate
- ✅ Fast response times
- ✅ All checks pass

**Load Test (100 users):**
- ✅ Much better than Replit
- ✅ Lower error rates
- ✅ Handles more concurrent users

**Stress Test (500 users):**
- ✅ Should handle 200-500 users
- ✅ Better than Replit's ~100 user limit

---

## 💰 Cost Tracking

Railway shows your usage in real-time:

1. **Click "Usage" tab** in your project
2. **See current month's usage**
3. **$5 free credit** is applied automatically

**Estimated costs:**
- Testing: ~$1-2 (covered by free credit)
- Production (1000 users): ~$20-30/mo

---

## 🔧 Troubleshooting

### "Build failed"
- Check build logs
- Verify `npm run build` works locally
- Ensure all dependencies in package.json

### "Application error"
- Check deployment logs
- Verify DATABASE_URL is set
- Check SESSION_SECRET is set
- Ensure PORT is not hardcoded (Railway sets it)

### "Database connection failed"
- Verify DATABASE_URL format
- Check database is running
- Test connection string locally

### "502 Bad Gateway"
- App might be starting up (wait 30 seconds)
- Check logs for startup errors
- Verify start command is correct

---

## 🎉 Success!

Once deployed and tested, you'll have:

✅ App running on Railway  
✅ Better performance than Replit  
✅ Handles 200-500+ concurrent users  
✅ Auto-deploys from GitHub  
✅ $5 free credit for testing  

---

## 📊 Next Steps After Testing

1. **Compare results** with Replit
2. **Check Railway usage/costs**
3. **Decide** if you want to keep it
4. **If yes**: Keep using Railway
5. **If no**: Try Render or another platform

---

**Ready? Let's deploy!** 🚀

Open https://railway.app and follow the steps above. I'll be here to help if you get stuck!
