# DirectBnB — Setup Guide

## Project Structure

```
Saas B&B/
├── backend/     NestJS REST API
└── frontend/    Next.js 14 App Router
```

---

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and set:
#   DATABASE_URL     → your PostgreSQL connection string
#   JWT_SECRET       → random 32+ char string
#   JWT_REFRESH_SECRET
#   RESEND_API_KEY   → from resend.com

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
# → API available at http://localhost:3001/api/v1
# → Swagger docs at  http://localhost:3001/api/docs
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Start development server
npm run dev
# → App available at http://localhost:3000
```

---

## Key URLs

| URL | Description |
|---|---|
| `http://localhost:3000/nl/login` | Login page (Dutch) |
| `http://localhost:3000/en/login` | Login page (English) |
| `http://localhost:3000/nl/register` | Beta registration |
| `http://localhost:3000/nl/dashboard` | Owner dashboard |
| `http://localhost:3000/nl/bnb/{slug}` | Public booking page |
| `http://localhost:3001/api/docs` | Swagger API docs |

---

## Database: Quick Neon Setup (recommended for solo founders)

1. Create free account at neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in backend `.env`
4. Run `npm run prisma:migrate`

---

## Email: Resend Setup

1. Create free account at resend.com
2. Add your domain (or use sandbox for testing)
3. Copy API key to `RESEND_API_KEY` in backend `.env`

---

## Deployment

### Backend → Railway
1. Push backend folder to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add all env variables from `.env.example`
4. Add PostgreSQL plugin or use Neon external DB

### Frontend → Vercel
1. Push frontend folder to GitHub (or monorepo root)
2. Create new Vercel project → Import repository
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Deploy

---

## Public Booking Page URL Format

```
https://yourdomain.com/nl/bnb/canal-house
https://yourdomain.com/en/bnb/canal-house
```

The slug is auto-generated from the property name when created.

---

## Beta Onboarding Flow

1. Owner visits `/nl/register`
2. Creates account (auto-flagged as `isBetaUser: true`)
3. Creates a property → gets a slug
4. Adds rooms with prices
5. Shares their booking page URL with guests
6. Manages requests in `/nl/bookings`
7. Submits feedback via the feedback button
