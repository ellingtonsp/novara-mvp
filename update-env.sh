#!/bin/bash

echo "📝 Updating .env file with new DATABASE_URL"
echo ""
echo "Please copy your new DATABASE_URL from Railway and paste it below:"
echo "(It should start with postgresql://postgres:3YeUmMRM8Z2...)"
echo ""
read -p "New DATABASE_URL: " NEW_DB_URL

if [ -z "$NEW_DB_URL" ]; then
    echo "❌ No URL provided"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating new .env file..."
    touch .env
fi

# Check if DATABASE_URL already exists in .env
if grep -q "^DATABASE_URL=" .env; then
    # Update existing DATABASE_URL
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=$NEW_DB_URL|" .env
    echo "✅ Updated DATABASE_URL in .env"
else
    # Add DATABASE_URL
    echo "DATABASE_URL=$NEW_DB_URL" >> .env
    echo "✅ Added DATABASE_URL to .env"
fi

echo ""
echo "🔍 Verifying update..."
echo ""

# Run verification
node scripts/verify-rotation.js