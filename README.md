# Jollibee Kiosk

## Folder Structure

```
kiosk/
├── app/
│   ├── api/
│   │   ├── ai/          # AI ordering assistant endpoint
│   │   ├── cart/        # Cart CRUD routes
│   │   ├── categories/  # Category listing route
│   │   ├── menu/        # Menu item routes
│   │   └── orders/      # Order creation and retrieval
│   ├── checkout/        # Checkout page
│   ├── order-confirmation/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── kiosk/           # Kiosk UI components (menu, cart, chat, voice, overlays)
│   └── ui/              # Shared primitives (Button, LoadingImage)
├── lib/
│   ├── ai-cart.ts       # AI cart update logic
│   ├── db.ts            # Prisma client (SQLite / Turso)
│   ├── openai.ts        # OpenAI chat and transcription helpers
│   ├── schemas.ts       # Zod schemas
│   └── types.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts          # Seeds from jollibee_kiosk_menu.json
├── jollibee_kiosk_menu.json
└── .env.local
```

## Environment

Copy `.env.example` to `.env.local` and fill in the values.

```env
# Turso (libSQL) — omit to use local SQLite instead
DATABASE_URL="libsql://YOUR-DATABASE.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# OpenAI — required for the AI ordering assistant and voice transcription
OPENAI_API_KEY="your-openai-api-key"

# Optional transcription model overrides
OPENAI_TRANSCRIPTION_MODEL="gpt-4o-mini-transcribe"
OPENAI_TRANSCRIPTION_FALLBACK_MODEL="whisper-1"
```

## Getting Started

```bash
pnpm install
pnpm db:seed   # seeds menu data from jollibee_kiosk_menu.json
pnpm dev
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm test`
