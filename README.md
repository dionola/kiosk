# Jollibee Kiosk

Small Next.js kiosk-style ordering demo for a Jollibee-inspired menu.

## Stack

- Next.js
- React
- Prisma
- libSQL / Turso
- OpenAI API for chat + transcription
- Tailwind CSS

## What It Does

- Shows a kiosk menu
- Lets users add items to a cart
- Supports item customization
- Saves cart state by kiosk session
- Includes an AI ordering assistant
- Supports voice transcription for orders

## Run

```bash
pnpm install
pnpm dev
```

## Environment

See [`.env.example`](./.env.example).

Main values:

- `DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `OPENAI_API_KEY`

## Useful Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm db:seed`

## Notes

- Menu data is seeded through [`prisma/seed.ts`](./prisma/seed.ts).
- AI ordering logic lives in [`lib/openai.ts`](./lib/openai.ts).
