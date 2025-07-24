#!/bin/bash
# Stub wrapper – relocated to scripts/deploy/deploy-staging.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/deploy/deploy-staging.sh" "$@" 