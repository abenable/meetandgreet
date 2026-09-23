# meetandgreet

## Code style

**Do not add comments.** Write code that reads without them: clear names, small
functions, obvious control flow. No explanatory comments, no section banners, no
JSDoc on self-evident functions, no "why" narration above a block.

The only exceptions: a comment the language or tooling requires (a directive, a
lint suppression, a license header), or a genuinely non-obvious external
constraint that cannot be expressed in code — and then one short line, not a
paragraph.

This applies to every language in the repo: TypeScript, TSX, CSS, Prisma schema
and SQL migrations.

## Stack

TanStack Start (router + server functions) · React 19 · Prisma 7 with the
`@prisma/adapter-pg` driver adapter · Postgres · better-auth · Tailwind v4 ·
Cloudflare R2 for media.

## Design

`DESIGN.md` is the source of truth for visual decisions. Build screens from the
kit in `src/components/ui/` rather than re-deriving chrome.

Project overrides, which take precedence over `DESIGN.md`:

- **Elevation is shadows, not hairlines.** `DESIGN.md` describes a shadow-free
  system where 1px outlines carry every edge. That reads as undifferentiated
  white-on-white in this app. Cards, sheets, raised buttons and the active
  segment use `shadow-sm` / `shadow-md` / `shadow-lg` (the `--elev-*` tokens).
- **No outline borders on surfaces.** Separate things with a different shade,
  not a border. The page sits on `canvas`, cards on `canvas-raised`, fills and
  tracks on `canvas-soft`, inputs on `field`. Dividers inside a list and dashed
  empty-state frames are fine; a border drawn around a card is not.
- **Everything interactive gets a hover state** — a shade change, or a lift to
  the next shadow step.
- Single-line text fields are `rounded-full`, not the 16px `DESIGN.md`
  specifies. Multi-line textareas are `rounded-card`.

## Local development

Postgres runs on **port 5433** (cluster `17/main`), database `meetandgreet`.
`.env` and `.env.development` both point at it.

```
npm run dev                                   # vite, reads .env.development
npx dotenv -e .env -- npx prisma migrate deploy
npx tsc --noEmit && npx vitest run
```

Migrations are written by hand in `prisma/migrations/` and applied with
`migrate deploy`. Do not run `prisma migrate dev` — it targets whatever
`DATABASE_URL` points at.
