# Testing Guide

## Quick Start Test Flow

### 1. Set Up Local PostgreSQL Database

First, make sure PostgreSQL is installed and running. See `DATABASE_SETUP.md` for detailed instructions.

Quick setup:
```bash
# macOS/Linux - create database
createdb onboarding_db

# Or use the setup script
cd backend
./setup-db.sh
```

### 2. Start Backend

```bash
cd backend
npm install

# Create .env file with DATABASE_URL
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public"
# PORT=3001
# FRONTEND_URL=http://localhost:3000

npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

### 3. Start Frontend

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

### 4. Create a Client

Using curl or Postman:

```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "companyName": "Test Company"
  }'
```

This will return a response with an `onboardingToken`. Copy this token.

### 5. Test Onboarding Flow

1. Open browser to: `http://localhost:3000/onboarding/{your-token}`
2. You should see Step 1 (Introduction)
3. Click "Continue" to go to Step 2
4. Enter any string as the Calendly API key (validation is stubbed)
5. Click "Connect Calendly" - should show success
6. Click "Continue to Close CRM" to go to Step 3
7. Enter any string as the Close API key
8. Click "Connect Close CRM" - should show success
9. Click "Go to dashboard" to see the placeholder dashboard

### 6. Verify Database

You can use Prisma Studio to verify the data:

```bash
cd backend
npm run prisma:studio
```

This will open a GUI where you can see:
- The Client record with `calendlyConnected` and `closeConnected` flags set to `true`
- The ClientIntegration records with the API keys stored

## Expected Behavior

- ✅ Stepper shows current step and allows navigation to completed steps
- ✅ API keys are stored in `ClientIntegration` table
- ✅ Client flags (`calendlyConnected`, `closeConnected`) are updated
- ✅ Success messages appear after connecting each integration
- ✅ Dashboard page loads and shows connection status

## Troubleshooting

- **PostgreSQL not running**: 
  - macOS: `brew services start postgresql@14`
  - Linux: `sudo systemctl start postgresql`
  - Check with: `pg_isready` or `psql -U postgres`

- **Database connection errors**: 
  - Verify `DATABASE_URL` in backend `.env` is correct
  - Check username/password match your PostgreSQL setup
  - Ensure database `onboarding_db` exists: `createdb onboarding_db`

- **CORS errors**: Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL

- **API not found**: Ensure backend is running on port 3001

- **Frontend can't connect**: Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

- **Migration errors**: Try resetting the database: `cd backend && npx prisma migrate reset` (⚠️ deletes all data)

