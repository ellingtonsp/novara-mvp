#!/bin/bash
# Stub wrapper – relocated to scripts/deploy/deploy-production.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/deploy/deploy-production.sh" "$@" 