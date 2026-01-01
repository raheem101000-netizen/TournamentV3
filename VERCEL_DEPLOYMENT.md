# Vercel Deployment - Simple & Fast

## 🚀 Deploy to Vercel (5 Minutes)

Vercel is the easiest option and handles 500-1000+ users easily.

---

## Step 1: Sign Up (1 minute)

1. Go to: https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

---

## Step 2: Import Your Project (2 minutes)

1. Click "Add New..." → "Project"
2. Find and select: `raheem101000-netizen/TournamentV3`
3. Click "Import"

---

## Step 3: Configure (2 minutes)

### Framework Preset:
- Vercel should auto-detect "Vite"
- Leave it as is

### Build Settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables:

Click "Environment Variables" and add:

```
NODE_ENV=production
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
DATABASE_URL=postgresql://neondb_owner:npg_I1lXc9WpUenQ@ep-sparkling-grass-a8d4g3w8-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Step 4: Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes
3. Done! ✅

---

## ✅ What You Get:

- **URL**: `https://tournamentv3.vercel.app`
- **Capacity**: 500-1000+ concurrent users
- **Cost**: Free to test, ~$20/mo for production
- **Auto-deploy**: Every GitHub push
- **Reliability**: Industry standard

---

## 🧪 After Deployment:

Test with k6:
```bash
BASE_URL=https://tournamentv3.vercel.app npm run test:k6:smoke
BASE_URL=https://tournamentv3.vercel.app npm run test:k6:load
```

---

**That's it! Much simpler than Railway/Render.** 🎉
