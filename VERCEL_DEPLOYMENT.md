# Vercel Deployment - Simple & Fast ✅

## 🚀 Deploy to Vercel (5 Minutes)

Vercel is the easiest option and handles 500-1000+ users easily.

**✅ Configuration file (`vercel.json`) is already included in your repo!**

---

## Step 1: Sign Up & Connect GitHub (1 minute)

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your repositories

---

## Step 2: Import Your Project (1 minute)

1. Click "Add New..." → "Project"
2. Find and select: `raheem101000-netizen/TournamentV3`
3. Click "Import"

---

## Step 3: Configure Environment Variables (2 minutes)

**IMPORTANT:** Click "Environment Variables" and add these **EXACTLY**:

### Variable 1:
```
Name: NODE_ENV
Value: production
```

### Variable 2:
```
Name: SESSION_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Variable 3:
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_I1lXc9WpUenQ@ep-sparkling-grass-a8d4g3w8-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Step 4: Deploy! (1 minute)

1. **Leave all other settings as default** (Vercel auto-detects everything)
2. Click "Deploy"
3. Wait 2-3 minutes for build to complete
4. Done! ✅

---

## ✅ After Deployment:

Your app will be live at: `https://tournamentv3.vercel.app` (or similar)

### Test with k6:
```bash
# Replace with your actual Vercel URL
BASE_URL=https://your-app.vercel.app npm run test:k6:smoke
```

---

## 🎯 What You Get:

- **Capacity**: 500-1000+ concurrent users
- **Cost**: Free to test, ~$20/mo for production
- **Auto-deploy**: Every GitHub push automatically deploys
- **Reliability**: Industry standard (used by millions)
- **Performance**: Global CDN + edge functions

---

## 🐛 Troubleshooting:

### If build fails:
1. Check Vercel build logs for errors
2. Make sure all environment variables are set correctly
3. Verify `vercel.json` is in your repo root

### If API routes return 404:
- This should NOT happen with the included `vercel.json`
- If it does, check that `vercel.json` exists in your repo

---

**That's it! Much simpler than Railway/Render.** 🎉

