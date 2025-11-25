#!/bin/bash

# Script to set up local PostgreSQL database for onboarding flow
# Make sure PostgreSQL is installed and running

echo "Setting up local PostgreSQL database..."

# Default values (adjust if needed)
DB_NAME="onboarding_db"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Check if PostgreSQL is running
if ! pg_isready -U $DB_USER > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Linux: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database (will fail if it already exists, which is fine)
echo "Creating database '$DB_NAME'..."
createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database '$DB_NAME' already exists or could not be created"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env file in the backend directory with:"
echo "   DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public\""
echo ""
echo "2. Run migrations:"
echo "   npm run prisma:migrate"
echo ""

