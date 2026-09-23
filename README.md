# Meet & Greet

A mobile-first social discovery app: find people near you or at an event you have
checked into, add them as friends, and talk. Installable as a PWA.

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) — file-based routing and server functions
- **UI**: React 19, [Tailwind CSS v4](https://tailwindcss.com/), [Lucide](https://lucide.dev/) icons
- **Auth**: [Better Auth](https://www.better-auth.com/), email/password with 6-digit OTP verification
- **Database**: PostgreSQL via [Prisma 7](https://www.prisma.io/) with the `@prisma/adapter-pg` driver adapter
- **Realtime**: WebSockets for chat delivery, typing and presence
- **Media**: Cloudflare R2
- **Push**: Web Push (VAPID)
- **Email**: Mailtrap
- **Runtime**: [Bun](https://bun.sh/) in production, Vite in development

## Local development

Prerequisites: [Bun](https://bun.sh/) and a PostgreSQL instance you are happy to
throw away.

```bash
bun install

cp .env.example .env.development
# Fill in at least DATABASE_URL and BETTER_AUTH_SECRET.
# Never point .env.development at production.

bun run db:migrate     # apply migrations
bun run dev            # http://localhost:3000
```

`bun run dev` reads `.env.development`. So do every `db:*` script, so a stray
`DATABASE_URL` in your shell cannot quietly send a migration somewhere else.

Generate an auth secret with:

```bash
npx -y @better-auth/cli secret
```

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `DATABASE_URL_POOLER` | no | Pooled connection, if your host provides one |
| `BETTER_AUTH_SECRET` | yes | Session signing key |
| `BETTER_AUTH_URL` | yes | Public origin of the app |
| `ADDITIONAL_TRUSTED_ORIGINS` | no | Extra origins allowed to call server functions |
| `MAILTRAP_TOKEN` | yes | Sends OTP emails; without it codes cannot be delivered |
| `R2_*` | yes | Cloudflare R2 bucket for photos and voice notes |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | no | Web push; push is skipped when absent |
| `TRUST_PROXY` | no | Set behind a reverse proxy so client IPs resolve for rate limiting |
| `VITE_SENTRY_DSN`, `SENTRY_*` | no | Error reporting and sampling rates |

## Database

Migrations are **written by hand** in `prisma/migrations/` and applied with
`migrate deploy`. Several carry data backfills that `migrate dev` would not
generate — the friends graph converts existing matches and likes, and the
mystery-mode removal drops columns.

```bash
bun run db:generate    # regenerate the Prisma client after a schema change
bun run db:migrate     # create and apply a migration (development)
bun run db:deploy      # apply pending migrations (what production runs)
bun run db:studio      # browse the data
```

`prisma/seed.ts` expects users to already exist — it creates profiles against
fixed IDs and will fail against an empty database. Register through the app
instead.

## Authentication

Email and password, with a 6-digit OTP confirming the address.

- Sign up → OTP emailed → verify → onboarding wizard → app
- Log in → if the address was never confirmed, a fresh OTP is sent
- Password reset runs email → code → new password, and ends every other session

Unverified sessions are rejected server-side by `requireSession()`, so the
client-side redirects are convenience rather than the control.

## Features

| Area | What it does |
|---|---|
| Discover | Full-screen vertical feed of profiles. Pass, add friend, like, or open a chat. Pool is global or scoped to an event you have checked into |
| Friends | Send, accept, decline and cancel requests; search your friends; find people by name; remove or block |
| Chats | Optimistic send with retry, read receipts, message grouping, day separators, typing indicators, and voice notes with a waveform |
| Events | Create public or private events, join by code, waitlists, attendee management, moderation and announcements |
| Profile | Photos with reordering, bio, birthday, gender, intent, interests, badges and photo verification |
| Settings | Discovery pool and filters, notification preferences per type, activity visibility, profile pause, blocked accounts |
| Admin | Report queue, verification review, user moderation |
| PWA | Installable, with push notifications and an offline asset cache |

Friendships and likes are **separate graphs**. A friend request and a romantic
like are different statements, and the app carries both.

## Design system

`DESIGN.md` is the source of truth for visual decisions, with project-specific
overrides recorded in `CLAUDE.md` — the app uses shadows and shades rather than
outline borders, filled ink buttons, and pill-shaped text fields.

Build screens from the kit in `src/components/ui/` rather than re-deriving
chrome. `/design` renders every primitive in one place and only mounts in
development.

## Project structure

```
src/
  components/
    ui/             # design-system kit: Button, Card, Sheet, Input, Select, Switch…
    auth/           # AuthLayout, OtpInput, PasswordField
    chat/           # MessageBubble, Composer, VoiceMessage
  hooks/            # theme, websocket, PWA install, OTP resend timer
  integrations/     # TanStack Query and WebSocket providers
  lib/              # auth client, uploads, sanitising, rate limiting, cn()
  routes/           # file-based routes
  server/           # server functions: auth, profiles, friends, events, chats
  db/               # Prisma client with the pg driver adapter
  styles.css        # design tokens, theme, base layer
prisma/
  schema.prisma
  migrations/       # hand-written, some with data backfills
server.prod.ts      # Bun production server, including the WebSocket upgrade
dev-ws-plugin.ts    # dev-only WebSocket bridge for Vite
```

## Build and deploy

### Docker

```bash
docker compose up --build -d     # http://localhost:6060
```

The container applies migrations on start. Set `RUN_MIGRATIONS=0` to skip that
and run them as a separate step instead:

```bash
docker compose run --rm web ./entrypoint.sh migrate
```

`migrate deploy` takes a Postgres advisory lock, so multiple replicas serialise
rather than collide.

### Manual

```bash
bun run build
bun run start
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Development server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Production server |
| `bun run test` | Vitest |
| `bun run db:generate` | Regenerate the Prisma client |
| `bun run db:migrate` | Create and apply a migration |
| `bun run db:deploy` | Apply pending migrations |
| `bun run db:push` | Push schema without a migration |
| `bun run db:studio` | Prisma Studio |

Type-check with `npx tsc --noEmit`.
