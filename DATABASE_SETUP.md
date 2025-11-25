# Local PostgreSQL Database Setup

This guide will help you set up a local PostgreSQL database for development.

## Quick Setup

### Option 1: Using the Setup Script (macOS/Linux)

```bash
cd backend
./setup-db.sh
```

This script will:
- Check if PostgreSQL is running
- Create the `onboarding_db` database
- Provide you with the connection string

### Option 2: Manual Setup

#### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/) and install.

#### 2. Create the Database

**macOS/Linux:**
```bash
createdb onboarding_db
```

Or with a specific user:
```bash
createdb -U postgres onboarding_db
```

**Windows (using psql):**
```sql
psql -U postgres
CREATE DATABASE onboarding_db;
\q
```

#### 3. Configure Connection String

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public"
```

**Common connection string formats:**

- Default PostgreSQL installation:
  ```
  postgresql://postgres:postgres@localhost:5432/onboarding_db?schema=public
  ```

- Custom user:
  ```
  postgresql://your_username:your_password@localhost:5432/onboarding_db?schema=public
  ```

- Different port:
  ```
  postgresql://postgres:postgres@localhost:5433/onboarding_db?schema=public
  ```

#### 4. Run Migrations

```bash
cd backend
npm run prisma:migrate
```

## Verify Setup

### Check Database Connection

```bash
psql -U postgres -d onboarding_db
```

You should see a PostgreSQL prompt. Type `\q` to exit.

### View Database with Prisma Studio

```bash
cd backend
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your database.

## Troubleshooting

### PostgreSQL not running

**macOS:**
```bash
brew services start postgresql@14
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
Check Services (services.msc) and start PostgreSQL service.

### Connection refused

- Verify PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check the port (default is 5432)
- Verify your username and password in the connection string

### Database already exists

If you get an error that the database already exists, you can either:
1. Use the existing database
2. Drop and recreate: `dropdb onboarding_db && createdb onboarding_db`

### Permission denied

On Linux, you might need to use `sudo`:
```bash
sudo -u postgres createdb onboarding_db
```

Or switch to the postgres user:
```bash
sudo su - postgres
createdb onboarding_db
exit
```

## Reset Database (Development Only)

If you need to reset the database during development:

```bash
cd backend
# Drop all tables and recreate
npx prisma migrate reset
```

**Warning**: This will delete all data!

