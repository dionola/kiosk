# AI enabled ordering kiosk

[![kiosk](https://ejyic7eskr7jje45.public.blob.vercel-storage.com/jollibee-thumbnail.png)](https://kiosk.dionola.com)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-4FF8D2?style=flat&logo=turso&logoColor=black)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)

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
