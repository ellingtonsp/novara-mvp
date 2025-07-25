#!/bin/bash

# Automated Deployment Cleanup Script
# Run this script regularly to maintain clean deployment history

set -e

echo "🧹 Starting automated deployment cleanup..."

# Clean up old deployment logs
find . -name "deployment-cleanup-report-*.md" -mtime +7 -delete 2>/dev/null || true

# Clean up old test reports
find . -name "test-report.json" -mtime +3 -delete 2>/dev/null || true

# Clean up old log files
find . -name "*.log" -mtime +1 -delete 2>/dev/null || true

# Clean up node_modules in case of corruption
if [[ -d "node_modules" ]] && [[ ! -f "node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted node_modules..."
    rm -rf node_modules
fi

if [[ -d "frontend/node_modules" ]] && [[ ! -f "frontend/node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted frontend node_modules..."
    rm -rf frontend/node_modules
fi

if [[ -d "backend/node_modules" ]] && [[ ! -f "backend/node_modules/.package-lock.json" ]]; then
    echo "Cleaning up corrupted backend node_modules..."
    rm -rf backend/node_modules
fi

echo "✅ Automated cleanup completed"
