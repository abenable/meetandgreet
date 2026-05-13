# Meet & Greet

A social discovery app built with TanStack Start, React, and Tailwind CSS.

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (full-stack React)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Auth**: [Better Auth](https://www.better-auth.com/) with email/password + OTP verification
- **Database**: PostgreSQL via [Prisma](https://www.prisma.io/)
- **Runtime**: [Bun](https://bun.sh/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Local Development

Prerequisites: [Bun](https://bun.sh/) installed.

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.development
# Edit .env.development with your local DATABASE_URL and BETTER_AUTH_SECRET
# NEVER use production database in .env.development!

# Run migrations
bun run db:migrate

# Start dev server
bun run dev
```

The app runs at `http://localhost:3000`.

## Database

Uses Prisma ORM with PostgreSQL.

```bash
# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Open Prisma Studio
bun run db:studio
```

## Authentication

Email/password authentication with 6-digit OTP email verification.

- Sign up → receive OTP → verify email → access app
- Login → if unverified, resend OTP → verify → access app
- Forgot password via OTP verification

Generate a Better Auth secret:

```bash
npx -y @better-auth/cli secret
```

## Build & Deploy

### Docker

Build and run with docker compose:

```bash
docker compose up --build -d
```

Available at `http://localhost:6060`.

### Manual

```bash
bun run build
bun run start
```

## Project Structure

```
src/
  components/       # UI components (Header, Footer, BottomNav)
  integrations/     # TanStack Query provider
  lib/              # Auth client, email sender
  routes/           # TanStack Router file-based routes
  server/           # Server functions (auth, profiles, events, swipes)
  styles.css        # Global styles + Tailwind
prisma/
  schema.prisma     # Database schema
  migrations/       # Prisma migrations
docker-compose.yml  # Docker Compose config
Dockerfile          # Multi-stage Bun build
entrypoint.sh       # Container startup script
server.prod.ts      # Bun production server
```

## Features

| Feature | Description |
|---------|-------------|
| Auth | Email/password signup, OTP verification, login, password reset |
| Discover | Browse profiles, swipe-like interactions |
| Profile | Edit bio, job, location, photos, interests |
| Events | Create and join events with codes |
| Matches | View mutual matches |
| Settings | Account, privacy, discovery preferences |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Run production server |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:push` | Push schema changes (dev) |
| `bun run db:studio` | Open Prisma Studio |
| `bun run test` | Run tests |

---

Built with [TanStack](https://tanstack.com).
