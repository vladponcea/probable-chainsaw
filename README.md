# Onboarding Flow MVP

A full-stack SaaS onboarding flow that connects to client tools (Calendly, Close CRM) for future KPI computation.

## Tech Stack

### Backend
- Node.js (LTS)
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM

### Frontend
- Next.js 14 (App Router)
- TypeScript
- React
- TailwindCSS
- Axios

## Project Structure

```
probable-chainsaw/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   └── modules/
│   │       ├── clients/
│   │       └── integrations/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── onboarding/[token]/
│   │   ├── dashboard/[token]/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (local installation)
- npm or yarn

### PostgreSQL Setup

#### macOS (using Homebrew)

1. Install PostgreSQL:
```bash
brew install postgresql@14
brew services start postgresql@14
```

2. Create the database:
```bash
createdb onboarding_db
```

Or use the setup script:
```bash
cd backend
./setup-db.sh
```

#### Linux (Ubuntu/Debian)

1. Install PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. Create the database:
```bash
sudo -u postgres createdb onboarding_db
```

#### Windows

1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Use pgAdmin or psql to create a database named `onboarding_db`

#### Default Connection String

For local development, the default connection string is:
```
postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public
```

**Note**: Adjust the username and password if your PostgreSQL installation uses different credentials.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Important**: Replace `postgres:postgres` with your actual PostgreSQL username and password if different.

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Start the development server:
```bash
npm run start:dev
```

The backend will be running on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## API Endpoints

### Clients

- `POST /api/clients` - Create a new client
  ```json
  {
    "email": "founder@example.com",
    "companyName": "Example Agency"
  }
  ```

- `GET /api/clients/onboarding/:token` - Get client by onboarding token

### Integrations

- `POST /api/onboarding/:token/integrations/calendly` - Connect Calendly
  ```json
  {
    "apiKey": "CALENDLY_API_KEY"
  }
  ```

- `POST /api/onboarding/:token/integrations/close` - Connect Close CRM
  ```json
  {
    "apiKey": "CLOSE_API_KEY"
  }
  ```

## Database Schema

The application uses the following main models:

- **Client**: Stores client information and onboarding status
- **ClientIntegration**: Stores integration credentials (API keys, tokens)
- **BookedCall**: Tracks scheduled calls from Calendly/CRM
- **Lead**: Tracks leads from CRM systems
- **Payment**: Tracks payments (for future Stripe integration)

## Usage Flow

1. **Create a client** via `POST /api/clients` to get an `onboardingToken`
2. **Navigate to** `/onboarding/{token}` in the browser
3. **Complete the 3-step onboarding**:
   - Step 1: Introduction
   - Step 2: Connect Calendly
   - Step 3: Connect Close CRM
4. **View dashboard** at `/dashboard/{token}` (placeholder for now)

## Security Notes

⚠️ **Important**: In this MVP, API keys are stored in plain text in the database. For production:

- Encrypt API keys at rest
- Use environment variables for sensitive data
- Implement proper OAuth flows instead of API keys where possible
- Add authentication and authorization
- Use HTTPS in production

## Development

### Backend Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Next Steps

- Implement actual API validation for Calendly and Close
- Add OAuth flows for integrations
- Build KPI dashboard
- Add data syncing jobs
- Implement authentication
- Add error tracking and logging
