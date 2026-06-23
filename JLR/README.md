# JLR -- World Cup 2026 Predictions League

An internal site for JLR staff to compete on World Cup 2026 predictions.

## Features
- Sign in with company email + employee ID + password (real accounts in a database)
- **Admin panel** (`/admin`, visible to accounts with the ADMIN role): manage employees (including bulk import from an Excel file), manage departments, create matches and enter official results by hand, and browse every prediction submitted
- Bilingual: English and Arabic, with a toggle in the header (each language is shown on its own, never mixed)
- Predict the score of every match (group stage + knockout rounds) before it locks
- Scoring: 6 points for an exact score, 3 for the correct winner, 0 for a miss
- Ranking tiebreakers: total points, then most exact-score predictions, then earliest submission
- "Pick the champion" challenge (+30 points)
- Overall and by-department leaderboards, with a podium for the top 3
- Achievement badges (Sharp Shooter, Legend, Prediction Champion...)
- News & announcements page + a general discussion feed for staff
- Automatic score syncing from a free public World Cup 2026 data source (no API key needed) -- and it won't overwrite a result an admin entered by hand

## Running locally

### 1. Requirements
- Node.js 18.18 or later
- A free Postgres database (easiest: Neon or Vercel Postgres)

### 2. Install
```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` -- your database connection string (from Neon/Vercel after creating a database)
- `NEXTAUTH_SECRET` -- a random string, generate one with: `openssl rand -base64 32`
- `NEXTAUTH_URL` -- leave as `http://localhost:3000` for local development

### 3. Set up the database
```bash
npm run db:push    # creates the tables
npm run db:seed    # adds departments, achievements, and a demo user
```

Demo login after seeding:
- Employee: demo@jlr.com / Employee ID 1002 / password 1234
- Admin: admin@jlr.com / Employee ID 1001 / password admin123

### 4. Run the project
```bash
npm run dev
```
Open http://localhost:3000

## Departments

The seeded departments in `prisma/seed.js` are JLR's real departments: Product & Pricing, Ordering, HR, Sales, Marketing, Finance, CRM, Aftersales, and APO. Each has an English and Arabic name. Edit the `DEPARTMENTS` list there if anything needs adjusting, then run `npm run db:seed` again (existing departments won't be duplicated, only new ones get added).

## Adding real employees

Easiest way: sign in as an admin and go to **Profile → Admin → Employees**. From there you can:
- **Import from Excel**: upload an `.xlsx` file with columns `Email`, `Full Name`, `Department` (any column order, case-insensitive). Each row becomes an account with a randomly generated password; the page shows you the generated password for every imported employee so you can pass them along.
- **Add one manually**: fill in name, email, employee ID, and department; a password is generated the same way.
- **Reset a password** or **delete** an employee from the same table.

You can also use `prisma studio` (a visual database browser) for direct database access:
```bash
npm run db:studio
```

Note: the `passwordHash` field must be a hashed password (this project uses Node's built-in `crypto.scrypt`, see `lib/password.js`), never plain text.

## Admin panel

Sign in with an account whose role is `ADMIN` (the seeded `admin@jlr.com` account, or anyone you promote via the Employees page) and open **Profile → Admin**, or go directly to `/admin`. It has four sections:

- **Employees** -- list, add, edit, delete, reset passwords, and bulk-import from Excel
- **Departments** -- add, edit, delete; each has an English name, an Arabic name, a short code, and a color used throughout the league's UI
- **Matches** -- create matches (round, group, teams, kickoff time, venue) and enter the official result once a match finishes. Entering a result immediately recalculates every prediction's points, totals, streaks, achievements, and the champion-pick bonus for that match.
- **Predictions** -- a read-only table of every prediction submitted, filterable by match

Matches whose result was entered by hand are marked `admin-entered result` and the automatic score sync (`/api/sync-scores`) will never overwrite them -- it only fills in the team/venue/kickoff details for those matches and otherwise leaves the score alone. This matters most for matches decided by penalty shootouts, where the public data feed may only report the 90/120-minute score.

## Deploying to Vercel

1. Push the project to GitHub (or use the `vercel` CLI directly from your machine without GitHub)
2. Go to vercel.com/new and import the project
3. From the Storage tab, create a free Postgres database -- Vercel adds `DATABASE_URL` automatically
4. Add the remaining environment variables (`NEXTAUTH_SECRET`, `CRON_SECRET`) under Settings -> Environment Variables
5. Set `NEXTAUTH_URL` to your deployed site URL
6. After the first deploy, run once from your machine (with the same `DATABASE_URL` connected):
   ```bash
   npx prisma db push
   npm run db:seed
   ```

Automatic score syncing is already enabled via `vercel.json` (every 15 minutes).

## How automatic score syncing works

The `/api/sync-scores` route fetches World Cup 2026 match data (teams, results, schedule) from a free public data source (openfootball/worldcup.json) and updates finished match results, points, streaks, achievements, and the champion-pick bonus. Vercel calls this route automatically every 15 minutes per `vercel.json`.

## How the bilingual system works

All UI text lives in `lib/i18n/dictionary.js`, with one block for English and one for Arabic. `lib/i18n/LocaleContext.js` provides a `t(key)` function and the current locale/direction, and remembers the person's choice in their browser. Team names and department names carry a `nameAr` field in the database so they display correctly in both languages.

## Project structure
```
app/              Site pages (Next.js App Router)
  api/            All data endpoints
    admin/        Admin-only endpoints (employees, departments, matches, predictions, stats)
  admin/          Admin panel pages (dashboard, employees, departments, matches, predictions)
  predictions/    Home page
  leaderboard/    Leaderboard
  news/           News & discussion feed
  rewards/        Rewards
  profile/        User profile
  login/          Sign-in page
components/       Reusable React components
lib/
  i18n/           Bilingual dictionary + language context
  auth.js         NextAuth config (email + employee ID + password)
  scoring.js      Points calculation rules
  recompute.js    Shared scoring/streak/achievement recalculation (used by both auto-sync and admin result entry)
  password.js     Password hashing + random password generator for new accounts
prisma/           Database schema + seed script
```

## Quick customization
- Logo & trophy art: `public/jlr-logo-tan.png`, `public/jlr-logo-black.png`, `public/jlr-logo-white.png`, `public/trophy-hero.png`, `public/icon.png`
- Colors & fonts: `tailwind.config.js` and `app/globals.css`
- Translations: `lib/i18n/dictionary.js`
- Scoring rules: `lib/scoring.js`
- Achievements: `prisma/seed.js` + `app/api/sync-scores/route.js` + `lib/i18n/dictionary.js`
- Grand prize: `app/rewards/page.js`
