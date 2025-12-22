# BabyBot - Baby Feeding Tracker

Track your baby's feeding times, amounts, and patterns with this simple web application.

## Features

- **Feed Tracking**: Record feeding times with start/end times
- **Multiple Feed Types**: Support for breast, bottle, formula, and solid foods
- **Amount Tracking**: Track volume in milliliters for bottles/formula
- **Side Tracking**: Record which side for breastfeeding (Left/Right/Both)
- **Notes**: Add custom notes to each feeding session
- **Multi-baby Support**: Track multiple babies

## Tech Stack

- **Frontend**: Next.js 14 with React
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM v6
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd babybot
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
npx prisma migrate dev
```

4. (Optional) Seed initial data:

```bash
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio   # Open Prisma Studio (visual DB editor)
npx prisma migrate dev # Create/apply new migration
```

## Project Structure

```
babybot/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── feeds/        # Feed-related endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/
│   └── prisma.ts          # Prisma client singleton
├── prisma/
│   ├── schema.prisma      # Database schema (no url here in v7)
│   └── migrations/        # Prisma migrations
├── prisma.config.ts       # Prisma v7 config (datasource.url, paths)
├── data/                  # SQLite database files (gitignored)
├── .env                   # Environment variables
└── package.json           # Dependencies
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./data/babybot.db"
```

## Prisma v7 Setup Notes

- Prisma v7 moves the datasource `url` out of `schema.prisma` into `prisma.config.ts`.
- This project uses the SQLite driver adapter (`@prisma/adapter-better-sqlite3`).
- `lib/prisma.ts` instantiates `PrismaClient` with the adapter and `DATABASE_URL`.
- When running Prisma CLI, pass `--config ./prisma.config.ts` to ensure it reads the connection URL and paths.

## License

MIT
