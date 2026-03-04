# SyntaxKeno — Provably Fair Keno Betting Game

Full-stack Keno-style betting game with real-time 60-second rounds, provably fair draws, and an admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) via `jose` |
| Client State | Zustand |
| Server State | React Query |
| Real-time | Socket.io |
| Validation | Zod |
| Architecture | Clean Architecture (feature-based modules) |

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 15+ (local or Docker)
- **npm** 9+

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/keno
```

### 3. Start PostgreSQL (Docker)

```bash
docker run --name keno-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=keno \
  -p 5432:5432 \
  -d postgres:16
```

### 4. Run Database Migration

```bash
npm run db:migrate
```

### 5. Seed the Database

```bash
npm run db:seed
```

This creates:
- **Payout multiplier table** (1–10 picks × all match combos)
- **Admin user**: phone `+1234567890`, password `admin123`
- **Test player**: phone `+9876543210`, password `player123`

### 6. Start the App

```bash
npm run dev
```

This starts:
- Next.js on `http://localhost:3000`
- Socket.io on `http://localhost:3001`

## Architecture

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # register, login, refresh, me
│   │   ├── game/           # bet, round, history, payout-table, leaderboard, stats
│   │   └── admin/          # users, stats, multipliers
│   ├── login/
│   ├── register/
│   └── admin/
├── components/
│   ├── game/               # KenoGrid, BetControls, CountdownTimer, ResultReveal, etc.
│   └── layout/             # Header
├── hooks/                  # useGame (React Query), useSocket (Socket.io)
├── lib/
│   ├── api/                # Fetch client with JWT auto-refresh
│   ├── auth/               # JWT utils, middleware
│   ├── crypto/             # Provably fair system
│   ├── db/                 # Prisma singleton
│   └── utils/              # Rate limiter
├── modules/
│   ├── auth/               # schema, repository, service
│   ├── game/               # schema, repository, service
│   └── admin/              # service
└── stores/                 # Zustand (auth, game)
```

## Game Rules

- Numbers from **1 to 80**
- System draws **20 numbers** per round
- Player selects **1–10 numbers**
- Multiplier depends on picks × matches
- Rounds every **60 seconds**

## Provably Fair

1. Server generates a `serverSeed` and publishes its SHA-256 hash **before** the round
2. Draw is deterministic from `HMAC(serverSeed, clientSeed)` + Fisher-Yates shuffle
3. After the round, `serverSeed` is revealed — anyone can verify `hash(serverSeed)` matches

## Payout Table (Default)

| Picks | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|---|----|
| 1 | 0 | 3x | | | | | | | | | |
| 2 | 0 | 1x | 9x | | | | | | | | |
| 3 | 0 | 0 | 2x | 26x | | | | | | | |
| 4 | 0 | 0 | 1x | 5x | 72x | | | | | | |
| 5 | 0 | 0 | 0 | 3x | 15x | 200x | | | | | |
| 10 | 0 | 0 | 0 | 0 | 1x | 3x | 15x | 50x | 300x | 2000x | 10000x |

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Register with phone + password |
| POST | `/api/auth/login` | No | Login, returns JWT tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| POST | `/api/game/bet` | Yes | Place a bet |
| GET | `/api/game/round` | No | Get current active round |
| GET | `/api/game/history` | Yes | Get bet history |
| GET | `/api/game/payout-table` | No | Get payout multipliers |
| GET | `/api/game/leaderboard` | No | Get top wins |
| GET | `/api/game/stats` | No | Get daily statistics |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/stats` | Admin | Get bet statistics |
| GET/PUT | `/api/admin/multipliers` | Admin | View/edit payout multipliers |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js + Socket.io) |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |
