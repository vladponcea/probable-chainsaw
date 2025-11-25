# Backend Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up local PostgreSQL database:**
   ```bash
   # Create database
   createdb onboarding_db
   
   # Or use the setup script
   ./setup-db.sh
   ```

3. **Create `.env` file:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public"
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Note**: Adjust the username (`postgres`) and password (`postgres`) to match your local PostgreSQL setup.

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

5. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

6. **Start development server:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001`

## Database Management

- **View database in browser:** `npm run prisma:studio`
- **Reset database (⚠️ deletes all data):** `npx prisma migrate reset`
- **Create new migration:** `npx prisma migrate dev --name migration_name`

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]?schema=public
```

Example:
```
postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public
```

For more details, see `../DATABASE_SETUP.md`

