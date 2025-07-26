#!/bin/bash

# Update PostHog API Key Script
# This script helps update the PostHog API key in development environment

echo "🔧 PostHog API Key Update Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "frontend/.env.development" ]; then
    echo "❌ Error: frontend/.env.development not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📝 Current PostHog API Key:"
current_key=$(grep VITE_POSTHOG_API_KEY frontend/.env.development | cut -d'=' -f2)
echo "   $current_key"

echo ""
echo "🔍 Issue identified:"
echo "   - You're using a Personal API Key (phx_) for frontend tracking"
echo "   - Personal API Keys are for server-side operations only"
echo "   - Frontend needs a Project API Key (phc_)"
echo ""

echo "🛠️  To fix this:"
echo ""
echo "1. Go to https://app.posthog.com"
echo "2. Navigate to your project"
echo "3. Go to Project Settings → API Keys"
echo "4. Copy the PROJECT API Key (starts with 'phc_')"
echo "5. Run this command with the PROJECT key:"
echo ""
echo "   ./scripts/update-posthog-key.sh phc_your_project_api_key"
echo ""

echo "📋 API Key Types:"
echo "   🔑 Project API Key (phc_): For frontend/client-side tracking"
echo "   🔐 Personal API Key (phx_): For server-side/admin operations"
echo ""

# If a new key is provided as argument
if [ ! -z "$1" ]; then
    new_key=$1
    
    # Validate key format (PostHog project API keys start with phc_)
    if [[ $new_key =~ ^phc_[a-zA-Z0-9]{20,}$ ]]; then
        echo "✅ Valid Project API Key format detected"
        
        # Update the key
        sed -i '' "s/VITE_POSTHOG_API_KEY=.*/VITE_POSTHOG_API_KEY=$new_key/" frontend/.env.development
        
        echo "✅ Project API Key updated successfully"
        echo "🔄 Please restart your development server"
        echo ""
        echo "🧪 To test:"
        echo "1. Restart dev server: npm run dev"
        echo "2. Sign up a new user"
        echo "3. Check PostHog Live Events"
        echo "4. Look for events with environment='development'"
    elif [[ $new_key =~ ^phx_[a-zA-Z0-9]{20,}$ ]]; then
        echo "❌ This is a Personal API Key (phx_)"
        echo "   Personal API Keys are for server-side operations only"
        echo "   Frontend tracking requires a Project API Key (phc_)"
        echo ""
        echo "💡 To get the correct key:"
        echo "   1. Go to Project Settings → API Keys"
        echo "   2. Copy the PROJECT API Key (starts with phc_)"
        echo "   3. Not the Personal API Key (starts with phx_)"
    else
        echo "❌ Invalid API key format"
        echo "   Expected: phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        echo "   Got: $new_key"
        echo ""
        echo "💡 Make sure you're copying the PROJECT API Key (phc_), not Personal API Key (phx_)"
    fi
else
    echo "💡 To update the key automatically, run:"
    echo "   ./scripts/update-posthog-key.sh phc_your_project_api_key"
fi

echo ""
echo "📊 PostHog Setup Guide:"
echo "- Project Name: Any name you want!"
echo "- Host: https://app.posthog.com"
echo "- Events: signup, checkin_submitted, insight_viewed, share_action"
echo "- Environment: development (for testing)"
echo ""
echo "🎯 Key Requirements:"
echo "- Use PROJECT API Key (phc_) for frontend"
echo "- Use PERSONAL API Key (phx_) for server-side scripts"
echo "- Never expose Personal API Keys in frontend code" 