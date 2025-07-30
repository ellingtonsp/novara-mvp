#!/bin/bash

echo "🐘 Setting up PostgreSQL for local development..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Visit: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Stop any existing container
echo "🛑 Stopping any existing PostgreSQL container..."
docker-compose down

# Start PostgreSQL
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
if docker-compose exec -T postgres pg_isready -U novara -d novara_local; then
    echo "✅ PostgreSQL is ready!"
else
    echo "❌ PostgreSQL failed to start. Check docker-compose logs."
    exit 1
fi

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
cd backend
if [ -f "database/schema/schema-v2.sql" ]; then
    echo "Applying Schema V2..."
    docker exec -i novara-postgres-local psql -U novara -d novara_local < database/schema/schema-v2.sql
    echo "✅ Schema V2 applied"
else
    echo "⚠️  Schema V2 file not found. You'll need to create the schema manually."
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
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f postgres"