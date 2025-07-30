#!/bin/bash

echo "🐘 Setting up PostgreSQL for local development using Homebrew..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if PostgreSQL is installed
if ! brew list postgresql@15 &> /dev/null; then
    echo "📦 Installing PostgreSQL 15..."
    brew install postgresql@15
else
    echo "✅ PostgreSQL 15 is already installed"
fi

# Start PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
brew services start postgresql@15

# Wait for PostgreSQL to be ready
sleep 3

# Create database and user
echo "🗄️ Setting up database and user..."
createdb novara_local 2>/dev/null || echo "Database 'novara_local' already exists"
psql -d postgres -c "CREATE USER novara WITH PASSWORD 'novara_local_dev';" 2>/dev/null || echo "User 'novara' already exists"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE novara_local TO novara;"

# Create .env.local file if it doesn't exist
if [ ! -f "backend/.env.local" ]; then
    echo "📝 Creating backend/.env.local file..."
    cat > backend/.env.local << EOF
# Local PostgreSQL configuration
DATABASE_URL=postgresql://novara:novara_local_dev@localhost:5432/novara_local
USE_SCHEMA_V2=true

# Copy other settings from .env
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3002
EOF
    echo "✅ Created backend/.env.local"
else
    echo "ℹ️  backend/.env.local already exists"
fi

# Run database migrations
echo "🔄 Running database migrations..."
if [ -f "backend/database/schema/schema-v2.sql" ]; then
    echo "Applying Schema V2..."
    psql -U novara -d novara_local -f backend/database/schema/schema-v2.sql
    echo "✅ Schema V2 applied"
else
    echo "⚠️  Schema V2 file not found at backend/database/schema/schema-v2.sql"
fi

echo ""
echo "🎉 PostgreSQL setup complete!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: novara_local"
echo "  Username: novara"
echo "  Password: novara_local_dev"
echo ""
echo "To use PostgreSQL locally, run:"
echo "  cd backend && npm run dev:postgres"
echo ""
echo "To stop PostgreSQL:"
echo "  brew services stop postgresql@15"
echo ""
echo "To view PostgreSQL logs:"
echo "  tail -f /usr/local/var/log/postgresql@15.log"