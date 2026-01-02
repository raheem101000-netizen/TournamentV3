# 🏆 TournamentV3

A competitive gaming tournament platform for organizing, managing, and participating in esports tournaments.

## ✨ Features

- **Servers** - Create community servers to host tournaments (Discord-style)
- **Tournaments** - Single elimination, round robin, and swiss brackets
- **Live Matches** - Real-time score tracking and result submission
- **User Profiles** - Achievements, stats, and friend system
- **Messaging** - Direct messages between players
- **Admin Panel** - Full tournament and server management

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Shadcn/UI | Components |
| TanStack Query | Data Fetching |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | API Server |
| Drizzle ORM | Database ORM |
| PostgreSQL (Neon) | Database |
| bcrypt | Auth |

### Infrastructure
| Tech | Purpose |
|------|---------|
| Vercel | Hosting |
| Neon | Serverless DB |

## 📁 Structure

```
├── client/          # React frontend
├── server/          # Express API
├── shared/          # Shared types & schema
├── k6-tests/        # Load testing
└── migrations/      # DB migrations
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## 🔐 Environment Variables

```env
DATABASE_URL=postgresql://...      # Neon connection string
SESSION_SECRET=your-secret-key     # Session encryption
SKIP_EMAIL_VERIFICATION=true       # Dev mode: skip email
```

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## 🧪 Load Testing

Uses k6 for performance testing:

```bash
# Run auth flow smoke test
k6 run k6-tests/scripts/auth-flow.js

# Run full load test (500 VUs)
k6 run k6-tests/scenarios/load-test.js
```

## 🌐 Deployment

Deployed on Vercel with Neon PostgreSQL. Push to `main` triggers auto-deploy.

```bash
git push origin main
```

## 📄 License

MIT
