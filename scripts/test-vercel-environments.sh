#!/bin/bash
# Stub wrapper – relocated to scripts/testing/test-vercel-environments.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/testing/test-vercel-environments.sh" "$@"
