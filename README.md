# Jollibee Kiosk

This is a playful self-service ordering kiosk inspired by Jollibee. It lets someone browse a bright fast-food menu, customize items, build a cart, and use an AI ordering assistant to move through the experience more naturally.

The goal is to feel like a real in-store kiosk demo: quick to understand, touch-friendly, and polished enough to show the full flow from menu discovery to checkout confirmation.

## Demo Video

Add a short walkthrough video here showing the main flow: browsing the menu, customizing an item, adding it to the cart, using the AI assistant, and completing checkout.

<!-- Replace this with a hosted video link, GIF, or GitHub asset once the walkthrough is recorded. -->

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- SQLite for local development
- libSQL / Turso support for hosted data
- OpenAI API for chat and voice transcription
- Zod for structured AI cart updates
- Vitest for unit tests
- ESLint for code quality

## Tech Runthrough

The app is built with Next.js and React using the App Router. The kiosk surface is made from reusable components for the menu, cart, item customization, overlays, chat messages, and voice controls.

Prisma handles the data model for menu items, categories, customizations, carts, and orders. It can run locally with SQLite, and `lib/db.ts` also supports libSQL / Turso when `DATABASE_URL` points at a Turso database.

The AI ordering assistant uses the OpenAI API for chat, plus transcription support for voice ordering. Zod schemas keep the AI cart updates structured before they touch the kiosk state.

Tailwind CSS carries the visual system, with a Jollibee-inspired red-and-yellow palette and large kiosk-friendly controls.

## What It Does

- Shows a kiosk-style menu grouped by category
- Lets users add, edit, customize, and remove cart items
- Saves cart state by local kiosk session
- Includes an AI assistant that can help build or edit the order
- Supports voice transcription for spoken orders
- Walks through a simple checkout confirmation flow

## Run

```bash
pnpm install
pnpm db:seed
pnpm dev
```

## Environment

See [`.env.example`](./.env.example).

Main values:

- `DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `OPENAI_API_KEY`

For local-only development, Prisma falls back to SQLite when `DATABASE_URL` is not a `libsql://` URL.

## Useful Scripts

- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm start`
- `pnpm db:seed`

## Notes

- Menu data is seeded through [`prisma/seed.ts`](./prisma/seed.ts), which expects a `jollibee_kiosk_menu.json` file at the project root.
- AI ordering logic lives in [`lib/openai.ts`](./lib/openai.ts).
